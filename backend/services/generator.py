import base64
import json
import re
from pathlib import Path

import aiofiles
import httpx

from config import API_BASE_URL, API_KEY

_SIZE_TO_ASPECT = {
    "1280x720":  "16:9",
    "720x1280":  "9:16",
    "1792x1024": "3:2",
    "1024x1792": "2:3",
    "1024x1024": "1:1",
}

_MIME_MAP = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
}


async def _to_data_uri(image_path: str) -> str:
    ext = Path(image_path).suffix.lower()
    mime = _MIME_MAP.get(ext, "image/jpeg")
    async with aiofiles.open(image_path, "rb") as f:
        raw = await f.read()
    b64 = base64.b64encode(raw).decode()
    return f"data:{mime};base64,{b64}"


def _extract_video_url(text: str) -> str | None:
    """从响应文本中提取视频 URL。"""
    # 优先匹配 mp4 链接或 /v1/files/video/ 路径
    patterns = [
        r'https?://\S+\.mp4\S*',
        r'https?://\S+/v1/files/video/\S+',
        r'https?://\S+/video/\S+',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            # 去掉末尾可能粘连的标点/引号
            url = m.group(0).rstrip('.,;:"\')>]')
            return url
    # 兜底：取任意 https URL
    m = re.search(r'https?://\S+', text)
    if m:
        return m.group(0).rstrip('.,;:"\')>]')
    return None


async def generate_video(
    prompt: str,
    size: str,
    reference_image_path: str,
    output_path: str,
) -> None:
    """
    通过 /v1/chat/completions 生成视频，流式接收响应，
    提取视频 URL 后下载到 output_path。
    """
    aspect_ratio = _SIZE_TO_ASPECT.get(size, "16:9")
    data_uri = await _to_data_uri(reference_image_path)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "grok-imagine-1.0-video",
        "stream": True,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri},
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        "video_config": {
            "aspect_ratio": aspect_ratio,
            "video_length": 6,
            "resolution_name": "480p",
            "preset": "normal",
        },
    }

    # ── 流式接收，拼接完整响应内容 ────────────────────────────────
    full_content = ""

    async with httpx.AsyncClient(timeout=620.0) as client:
        async with client.stream(
            "POST",
            f"{API_BASE_URL}/v1/chat/completions",
            headers=headers,
            json=payload,
        ) as resp:
            resp.raise_for_status()
            async for raw_line in resp.aiter_lines():
                line = raw_line.strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    choices = chunk.get("choices") or []
                    if choices:
                        delta = choices[0].get("delta") or {}
                        content = delta.get("content") or ""
                        if isinstance(content, str):
                            full_content += content
                        elif isinstance(content, list):
                            # 多模态 delta
                            for item in content:
                                if isinstance(item, dict):
                                    full_content += item.get("text", "")
                except json.JSONDecodeError:
                    continue

    if not full_content.strip():
        raise RuntimeError("视频生成接口无返回内容，请检查模型名称或 API Key 权限")

    # ── 提取视频 URL ───────────────────────────────────────────────
    video_url = _extract_video_url(full_content)
    if not video_url:
        raise RuntimeError(
            f"无法从响应中提取视频 URL，响应内容：{full_content[:300]}"
        )

    if video_url.startswith("/"):
        video_url = f"{API_BASE_URL}{video_url}"

    # ── 下载视频文件 ───────────────────────────────────────────────
    async with httpx.AsyncClient(timeout=300.0) as client:
        dl = await client.get(video_url, headers={"Authorization": f"Bearer {API_KEY}"})
        dl.raise_for_status()

    async with aiofiles.open(output_path, "wb") as f:
        await f.write(dl.content)
