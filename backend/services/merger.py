import asyncio
import os
import subprocess
import tempfile
from functools import partial
from pathlib import Path

import imageio_ffmpeg

_FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def _merge_videos_sync(video_paths: list[str], output_path: str) -> None:
    list_fd, list_file = tempfile.mkstemp(suffix=".txt")
    try:
        with os.fdopen(list_fd, "w", encoding="utf-8") as f:
            for path in video_paths:
                # 必须用绝对路径，否则 ffmpeg 会相对于列表文件所在目录解析
                abs_path = str(Path(path).resolve()).replace("\\", "/")
                f.write(f"file '{abs_path}'\n")

        result = subprocess.run(
            [_FFMPEG, "-y", "-f", "concat", "-safe", "0",
             "-i", list_file, "-c", "copy", output_path],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg 合并失败: {result.stderr}")
    finally:
        if os.path.exists(list_file):
            os.unlink(list_file)


async def merge_videos(video_paths: list[str], output_path: str) -> None:
    """合并多段视频（线程池运行，兼容 Windows SelectorEventLoop）。"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_merge_videos_sync, video_paths, output_path))
