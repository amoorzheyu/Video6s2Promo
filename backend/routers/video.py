import asyncio
import json
import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

from models import TaskState
from services.generator import generate_video
from services.merger import merge_videos
from services.prompts import PROMPTS
from task_manager import create_task, get_task, save_task

router = APIRouter()

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

VALID_SIZES = {"1280x720", "720x1280", "1792x1024", "1024x1792", "1024x1024"}


# ── 启动生成任务 ───────────────────────────────────────────────────────────────

def _parse_segments(segments_json: str | None) -> tuple[list[str], list[str]]:
    """解析 segments JSON，返回 (titles, prompts)。无效或为空则返回 ([], [])。"""
    if not segments_json or not segments_json.strip():
        return [], []
    try:
        raw = json.loads(segments_json)
        if not isinstance(raw, list) or len(raw) != 5:
            return [], []
        titles: list[str] = []
        prompts: list[str] = []
        for i, item in enumerate(raw):
            if not isinstance(item, dict):
                return [], []
            title = item.get("title") or f"片段 {i + 1}"
            content = item.get("content") or ""
            titles.append(str(title).strip() or f"片段 {i + 1}")
            prompts.append(str(content).strip())
        if not all(prompts):
            return [], []
        return titles, prompts
    except (json.JSONDecodeError, TypeError):
        return [], []


@router.post("/generate")
async def start_generate(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    size: str = Form(...),
    segments: str | None = Form(None),
):
    if size not in VALID_SIZES:
        raise HTTPException(status_code=400, detail=f"无效尺寸，可用：{VALID_SIZES}")

    titles, custom_prompts = _parse_segments(segments)
    prompts_to_use = custom_prompts if custom_prompts else list(PROMPTS)

    task_id = str(uuid.uuid4())
    task_dir = TEMP_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(image.filename or "ref.jpg").suffix or ".jpg"
    image_path = str(task_dir / f"reference{suffix}")
    async with aiofiles.open(image_path, "wb") as f:
        await f.write(await image.read())

    create_task(task_id)
    task = get_task(task_id)
    assert task is not None
    if titles:
        task.segment_titles = titles
    else:
        task.segment_titles = [f"片段 {i + 1}" for i in range(5)]
    save_task(task)
    background_tasks.add_task(_run_generation, task_id, image_path, size, prompts_to_use)
    return {"task_id": task_id}


# ── 后台生成流程（5 段并行，全部完成后再一次性合并）────────────────────────────

async def _run_generation(
    task_id: str, image_path: str, size: str, prompts: list[str] | None = None
) -> None:
    task = get_task(task_id)
    assert task is not None
    prompt_list = prompts if prompts else PROMPTS

    task.status = "generating"
    task.video_paths = [None] * 5
    task.current_step = 0
    save_task(task)

    task_dir = TEMP_DIR / task_id

    async def run_one(segment_index: int) -> None:
        path = str(task_dir / f"video_{segment_index}.mp4")
        await generate_video(
            prompt_list[segment_index - 1], size, image_path, path
        )
        t = get_task(task_id)
        if t is None:
            return
        t.video_paths[segment_index - 1] = path
        save_task(t)

    try:
        await asyncio.gather(*[run_one(i) for i in range(1, 6)])

        task = get_task(task_id)
        assert task is not None
        paths = [p for p in task.video_paths if p]
        if len(paths) != 5:
            raise RuntimeError("并行生成后片段数量不足 5")
        merged_path = str(task_dir / "merged.mp4")
        await merge_videos(paths, merged_path)
        task.merged_path = merged_path
        task.status = "done"
        save_task(task)

    except Exception as exc:  # noqa: BLE001
        logger.error("任务 %s 失败: %s", task_id, exc, exc_info=True)
        task = get_task(task_id)
        if task is not None:
            task.status = "error"
            task.error = str(exc)
            save_task(task)


# ── 查询进度 ───────────────────────────────────────────────────────────────────

def _completed_count(video_paths: list[str | None]) -> int:
    return sum(1 for p in video_paths if p)


@router.get("/status/{task_id}")
async def get_status(task_id: str):
    task = _require_task(task_id)
    return {
        "task_id": task.task_id,
        "status": task.status,
        "current_step": task.current_step,
        "total_steps": task.total_steps,
        "completed_videos": _completed_count(task.video_paths),
        "has_merged": task.merged_path is not None,
        "error": task.error,
        "segment_titles": task.segment_titles,
    }


# ── 获取视频文件 ───────────────────────────────────────────────────────────────

@router.get("/video/{task_id}/{index}")
async def get_video(task_id: str, index: str):
    task = _require_task(task_id)

    if index == "merged":
        if not task.merged_path or not Path(task.merged_path).exists():
            raise HTTPException(status_code=404, detail="合并视频尚未就绪")
        return FileResponse(task.merged_path, media_type="video/mp4")

    try:
        idx = int(index)
    except ValueError:
        raise HTTPException(status_code=400, detail="index 须为整数或 'merged'")

    if idx < 1 or idx > 5:
        raise HTTPException(status_code=404, detail="片段序号须为 1–5")
    if idx > len(task.video_paths) or task.video_paths[idx - 1] is None:
        raise HTTPException(status_code=404, detail="该片段尚未生成")

    video_path = task.video_paths[idx - 1]
    if not video_path or not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="视频文件不存在")

    return FileResponse(video_path, media_type="video/mp4")


# ── 工具函数 ───────────────────────────────────────────────────────────────────

def _require_task(task_id: str) -> TaskState:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task
