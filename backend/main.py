from dotenv import load_dotenv
load_dotenv()  # loads backend/.env into os.environ before any skill reads it

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.specs import router as specs_router
from app.api.runs import router as runs_router
from app.api.projects import router as projects_router
from app.api.secrets import router as secrets_router
from app.api.scaffold import router as scaffold_router
from app.api.containers import router as containers_router
from app.api.hub import router as hub_router

app = FastAPI(
    title="FlashMVP API",
    description="IBM Bob 2.0 Middleware Proxy — Zero-Learning IBM Cloud Deployment Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(specs_router)
app.include_router(runs_router)
app.include_router(projects_router)
app.include_router(secrets_router)
app.include_router(scaffold_router)
app.include_router(containers_router)
app.include_router(hub_router)


@app.get("/")
async def root():
    return {"service": "FlashMVP API", "powered_by": "IBM Bob 2.0", "status": "ok"}
