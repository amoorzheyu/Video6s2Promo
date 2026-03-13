from models import TaskState

_tasks: dict[str, TaskState] = {}


def create_task(task_id: str) -> TaskState:
    task = TaskState(task_id=task_id)
    _tasks[task_id] = task
    return task


def get_task(task_id: str) -> TaskState | None:
    return _tasks.get(task_id)


def save_task(task: TaskState) -> None:
    _tasks[task.task_id] = task
