from typing import Literal, Optional
from pydantic import BaseModel, Field


class TaskState(BaseModel):
    task_id: str
    status: Literal["pending", "generating", "merging", "done", "error"] = "pending"
    current_step: int = 0
    total_steps: int = 5
    video_paths: list[str] = Field(default_factory=list)
    merged_path: Optional[str] = None
    error: Optional[str] = None
    segment_titles: list[str] = Field(default_factory=list)
