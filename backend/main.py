from fastapi import FastAPI

app = FastAPI(
    title="FlashMVP API",
    description="IBM Bob 2.0 Middleware Proxy — Zero-Learning IBM Cloud Deployment Platform",
    version="1.0.0",
)


@app.get("/")
async def root():
    return {"service": "FlashMVP API", "powered_by": "IBM Bob 2.0", "status": "ok"}
