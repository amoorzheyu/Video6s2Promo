from typing import Literal, Optional
from pydantic import BaseModel, Field


class TaskState(BaseModel):
    task_id: str
    status: Literal["pending", "generating", "merging", "done", "error"] = "pending"
    current_step: int = 0
    total_steps: int = 5
    video_paths: list[str | None] = Field(default_factory=list)
    merged_path: Optional[str] = None
    error: Optional[str] = None
    segment_titles: list[str] = Field(default_factory=list)
    image_path: Optional[str] = None
    size: str = "1280x720"
    segment_prompts: list[str] = Field(default_factory=list)
    regenerating_segments: list[int] = Field(default_factory=list)  # 正在重新生成的片段索引列表（1-5）
