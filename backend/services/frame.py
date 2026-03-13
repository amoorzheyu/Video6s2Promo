import asyncio
import subprocess
from functools import partial

import imageio_ffmpeg

_FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def _extract_last_frame_sync(video_path: str, output_path: str) -> None:
    result = subprocess.run(
        [_FFMPEG, "-y", "-sseof", "-0.5", "-i", video_path,
         "-vframes", "1", "-update", "1", output_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg 帧提取失败: {result.stderr}")


async def extract_last_frame(video_path: str, output_path: str) -> None:
    """提取视频最后一帧，保存为 JPEG（线程池运行，兼容 Windows SelectorEventLoop）。"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_extract_last_frame_sync, video_path, output_path))
