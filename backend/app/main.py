from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

from app.db.database import engine, Base
from app.models import Direccion, PlanTrabajo, Actividad, Evidencia, Usuario  # noqa: F401
from app.routers import auth, direcciones, planes, actividades, evidencias, dashboard, reportes
from app.config import BASE_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema Seguimiento PTI",
    version="1.0",
    lifespan=lifespan
)

# Servir archivos subidos como estáticos → GET /uploads/planes/archivo.pdf
uploads_dir = os.path.join(BASE_DIR, "uploads")
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router)
app.include_router(direcciones.router)
app.include_router(planes.router)
app.include_router(actividades.router)
app.include_router(evidencias.router)
app.include_router(dashboard.router)
app.include_router(reportes.router)


@app.get("/")
def inicio():
    return {"mensaje": "Sistema PTI funcionando correctamente"}
