import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

from models import TaskState
from services.frame import extract_last_frame
from services.generator import generate_video
from services.merger import merge_videos
from services.prompts import PROMPTS
from task_manager import create_task, get_task, save_task

router = APIRouter()

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

VALID_SIZES = {"1280x720", "720x1280", "1792x1024", "1024x1792", "1024x1024"}


# ── 启动生成任务 ───────────────────────────────────────────────────────────────

@router.post("/generate")
async def start_generate(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    size: str = Form(...),
):
    if size not in VALID_SIZES:
        raise HTTPException(status_code=400, detail=f"无效尺寸，可用：{VALID_SIZES}")

    task_id = str(uuid.uuid4())
    task_dir = TEMP_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(image.filename or "ref.jpg").suffix or ".jpg"
    image_path = str(task_dir / f"reference{suffix}")
    async with aiofiles.open(image_path, "wb") as f:
        await f.write(await image.read())

    create_task(task_id)
    background_tasks.add_task(_run_generation, task_id, image_path, size)
    return {"task_id": task_id}


# ── 后台生成流程 ───────────────────────────────────────────────────────────────

async def _run_generation(task_id: str, image_path: str, size: str) -> None:
    task = get_task(task_id)
    assert task is not None

    task.status = "generating"
    save_task(task)

    task_dir = TEMP_DIR / task_id
    current_reference = image_path

    try:
        for i, prompt in enumerate(PROMPTS, start=1):
            task.current_step = i
            save_task(task)

            video_path = str(task_dir / f"video_{i}.mp4")
            await generate_video(prompt, size, current_reference, video_path)

            task.video_paths.append(video_path)

            # 每段生成后立即合并，让前端实时看到进展
            if len(task.video_paths) == 1:
                task.merged_path = video_path          # 第一段直接引用，无需合并
            else:
                merged_path = str(task_dir / "merged.mp4")
                await merge_videos(task.video_paths, merged_path)
                task.merged_path = merged_path

            save_task(task)

            if i < len(PROMPTS):
                frame_path = str(task_dir / f"frame_{i}.jpg")
                await extract_last_frame(video_path, frame_path)
                current_reference = frame_path

        task.status = "done"
        save_task(task)

    except Exception as exc:  # noqa: BLE001
        logger.error("任务 %s 在第 %d 步失败: %s", task_id, task.current_step, exc, exc_info=True)
        task.status = "error"
        task.error = str(exc)
        save_task(task)


# ── 查询进度 ───────────────────────────────────────────────────────────────────

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    task = _require_task(task_id)
    return {
        "task_id": task.task_id,
        "status": task.status,
        "current_step": task.current_step,
        "total_steps": task.total_steps,
        "completed_videos": len(task.video_paths),
        "has_merged": task.merged_path is not None,
        "error": task.error,
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

    if idx < 1 or idx > len(task.video_paths):
        raise HTTPException(status_code=404, detail="该片段尚未生成")

    video_path = task.video_paths[idx - 1]
    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="视频文件不存在")

    return FileResponse(video_path, media_type="video/mp4")


# ── 工具函数 ───────────────────────────────────────────────────────────────────

def _require_task(task_id: str) -> TaskState:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task
