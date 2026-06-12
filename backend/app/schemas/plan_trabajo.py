from pydantic import BaseModel
from datetime import datetime


class PlanTrabajoCreate(BaseModel):
    direccion_id: int
    nombre: str
    anio: int


class PlanTrabajoUpdate(BaseModel):
    nombre: str | None = None
    anio: int | None = None
    direccion_id: int | None = None


class PlanTrabajoResponse(BaseModel):
    id: int
    direccion_id: int
    nombre: str
    anio: int
    archivo_pdf: str | None = None
    fecha_registro: datetime

    class Config:
        from_attributes = True
