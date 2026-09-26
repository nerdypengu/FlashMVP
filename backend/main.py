from fastapi import FastAPI

from app.api.specs import router as specs_router
from app.api.runs import router as runs_router
from app.api.projects import router as projects_router

app = FastAPI(
    title="FlashMVP API",
    description="IBM Bob 2.0 Middleware Proxy — Zero-Learning IBM Cloud Deployment Platform",
    version="1.0.0",
)

app.include_router(specs_router)
app.include_router(runs_router)
app.include_router(projects_router)


@app.get("/")
async def root():
    return {"service": "FlashMVP API", "powered_by": "IBM Bob 2.0", "status": "ok"}
