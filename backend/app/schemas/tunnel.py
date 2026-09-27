from pydantic import BaseModel


class TunnelResponse(BaseModel):
    project_id: str
    public_url: str       # "https://app-8f92a.trycloudflare.com"
    local_port: int       # 3001
    status: str           # "ACTIVE" | "FAILED"
    stored_in_vault: bool # True once saved to IBM Secrets vault
