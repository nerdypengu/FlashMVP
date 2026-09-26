from pydantic import BaseModel


class ContainerStats(BaseModel):
    container_id: str    # "proj_8f92a_frontend"
    cpu_percent: float   # 12.4
    memory_mb: float     # 128.6
    status: str          # "RUNNING" | "STOPPED" | "CRASHED"


class LogEvent(BaseModel):
    container_id: str
    timestamp: str       # ISO 8601
    stream: str          # "stdout" | "stderr"
    message: str         # log line text
