from pydantic import BaseModel


class ContainerStats(BaseModel):
    container_id: str    # "proj_8f92a_frontend"
    cpu_percent: float | None = None  # 100% = one logical CPU
    memory_mb: float | None = None
    status: str          # "RUNNING" | "STOPPED" | "CRASHED"
    sampled_at: str | None = None
    memory_limit_mb: float | None = None
    memory_percent: float | None = None
    restart_count: int | None = None
    uptime_seconds: float | None = None
    exit_code: int | None = None
    oom_killed: bool | None = None
    health: str = "UNKNOWN"
    health_checked_at: str | None = None
    health_check_ms: float | None = None
    network_rx_bytes: int | None = None
    network_tx_bytes: int | None = None
    started_at: str | None = None
    stats_error: str | None = None


class LogEvent(BaseModel):
    container_id: str
    timestamp: str       # ISO 8601
    stream: str          # "stdout" | "stderr"
    message: str         # log line text
