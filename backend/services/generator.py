import asyncio
import base64
import json
import logging
import re
from pathlib import Path

import aiofiles
import httpx

from config import API_BASE_URL, API_KEY

logger = logging.getLogger(__name__)

# API 偶尔返回空 content 时，最多重试次数（不含首次）
MAX_VIDEO_RETRIES = 2
RETRY_DELAY_SECONDS = 5

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

# 禁用连接复用，避免长耗时生成后代理连接失效导致下一请求断线
_LIMITS = httpx.Limits(max_keepalive_connections=0, max_connections=10)


async def _to_data_uri(image_path: str) -> str:
    ext = Path(image_path).suffix.lower()
    mime = _MIME_MAP.get(ext, "image/jpeg")
    async with aiofiles.open(image_path, "rb") as f:
        raw = await f.read()
    b64 = base64.b64encode(raw).decode()
    return f"data:{mime};base64,{b64}"


def _extract_url_from_text(text: str) -> str | None:
    """从纯文本中用正则提取视频 URL。"""
    patterns = [
        r'https?://\S+\.mp4\S*',
        r'https?://\S+/v1/files/video/\S+',
        r'https?://\S+/video/\S+',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return m.group(0).rstrip('.,;:"\')>]')
    # 兜底取任意 https URL
    m = re.search(r'https?://\S+', text)
    if m:
        return m.group(0).rstrip('.,;:"\')>]')
    return None


def _find_video_url(result: dict) -> str | None:
    """
    在非流式 /v1/chat/completions 响应中查找视频 URL。
    覆盖多种可能的响应格式：多模态内容块、纯文本、顶层 data 字段。
    """
    choices = result.get("choices") or []
    if choices:
        msg = choices[0].get("message") or {}
        content = msg.get("content")

        # ── 多模态内容块（列表）──
        if isinstance(content, list):
            for item in content:
                if not isinstance(item, dict):
                    continue
                t = item.get("type", "")
                # video_url 类型
                if t == "video_url":
                    vurl = item.get("video_url")
                    url = vurl.get("url") if isinstance(vurl, dict) else vurl
                    if url:
                        return url
                # image_url 类型里有时也存放视频链接
                if t == "image_url":
                    iurl = item.get("image_url")
                    url = iurl.get("url") if isinstance(iurl, dict) else iurl
                    if url and (".mp4" in url or "/video/" in url):
                        return url
                # 直接的 url / video_url 字段
                for key in ("url", "video_url"):
                    url = item.get(key)
                    if url and isinstance(url, str):
                        return url

        # ── 纯文本内容（字符串）──
        if isinstance(content, str) and content.strip():
            url = _extract_url_from_text(content)
            if url:
                return url

        # ── message 上的自定义顶层字段 ──
        for key in ("video_url", "url", "video"):
            url = msg.get(key)
            if url and isinstance(url, str):
                return url

    # ── 兼容 OpenAI images 格式：顶层 data 列表 ──
    data = result.get("data")
    if isinstance(data, list) and data:
        for key in ("url", "video_url", "b64_json"):
            url = data[0].get(key)
            if url and isinstance(url, str) and url.startswith("http"):
                return url

    # ── 顶层直接有 url / video_url ──
    for key in ("video_url", "url"):
        url = result.get(key)
        if url and isinstance(url, str):
            return url

    return None


async def generate_video(
    prompt: str,
    size: str,
    reference_image_path: str,
    output_path: str,
) -> None:
    """
    非流式调用 /v1/chat/completions 生成视频，
    从结构化响应中提取 URL 后下载到 output_path。
    """
    aspect_ratio = _SIZE_TO_ASPECT.get(size, "16:9")
    data_uri = await _to_data_uri(reference_image_path)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "grok-imagine-1.0-video",
        "stream": False,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": data_uri}},
                    {"type": "text", "text": prompt},
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

    # ── 调用生成接口（空 content 时自动重试）────────────────────────
    video_url = None
    last_result = None
    for attempt in range(1 + MAX_VIDEO_RETRIES):
        async with httpx.AsyncClient(
            timeout=620.0,
            trust_env=False,
            limits=_LIMITS,
        ) as client:
            resp = await client.post(
                f"{API_BASE_URL}/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            result = resp.json()

        last_result = result
        logger.debug("生成响应（前 2000 字）: %s", json.dumps(result, ensure_ascii=False)[:2000])
        video_url = _find_video_url(result)

        if video_url:
            break
        if attempt < MAX_VIDEO_RETRIES:
            logger.warning(
                "第 %d 次请求返回空视频 URL，%ds 后重试（剩余 %d 次）",
                attempt + 1,
                RETRY_DELAY_SECONDS,
                MAX_VIDEO_RETRIES - attempt,
            )
            await asyncio.sleep(RETRY_DELAY_SECONDS)
        else:
            logger.error(
                "无法提取视频 URL（已重试 %d 次），完整响应：\n%s",
                1 + MAX_VIDEO_RETRIES,
                json.dumps(last_result, ensure_ascii=False, indent=2)[:3000],
            )
            raise RuntimeError(
                "视频生成接口多次返回空内容，请稍后重试或检查 API 状态。"
                f" 响应摘要：{json.dumps(last_result, ensure_ascii=False)[:500]}"
            )

    if video_url.startswith("/"):
        video_url = f"{API_BASE_URL}{video_url}"

    logger.info("视频生成完成，开始下载：%s", video_url)

    # ── 下载视频 ───────────────────────────────────────────────────
    async with httpx.AsyncClient(
        timeout=300.0,
        trust_env=False,
        limits=_LIMITS,
    ) as client:
        dl = await client.get(
            video_url,
            headers={"Authorization": f"Bearer {API_KEY}"},
        )
        dl.raise_for_status()

    async with aiofiles.open(output_path, "wb") as f:
        await f.write(dl.content)
