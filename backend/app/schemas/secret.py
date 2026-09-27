from typing import Literal
from pydantic import BaseModel


class SecretCreateRequest(BaseModel):
    key: str                                          # "OPENAI_API_KEY"
    value: str                                        # "sk-..."
    scope: Literal["ALL", "FRONTEND", "BACKEND"] = "ALL"


class SecretResponse(BaseModel):
    project_id: str
    key: str
    scope: str
    masked_value: str   # "sk-****"
    status: str         # "STORED"


class SecretDeleteResponse(BaseModel):
    project_id: str
    key: str
    deleted: bool
