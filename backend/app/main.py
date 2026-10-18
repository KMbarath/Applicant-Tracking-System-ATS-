from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.db.session import Base,engine
from app.api.v1 import auth,candidates,jobs,applications,dashboard,notes
Base.metadata.create_all(bind=engine) # local zero-config bootstrap; deployments use `alembic upgrade head`
app=FastAPI(title="Mini ATS API",version="1.0.0",openapi_url="/api/v1/openapi.json",docs_url="/docs")
app.add_middleware(CORSMiddleware,allow_origins=get_settings().origins,allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
for router in (auth.router,candidates.router,jobs.router,applications.router,dashboard.router,notes.router):app.include_router(router,prefix="/api/v1")
@app.get("/health")
def health():return {"status":"ok"}
