from pydantic import BaseModel
from datetime import datetime


class PlanTrabajoCreate(BaseModel):
    direccion_id: int
    nombre: str
    anio: int
    semestre: str = "I"


class PlanTrabajoUpdate(BaseModel):
    nombre: str | None = None
    anio: int | None = None
    direccion_id: int | None = None
    semestre: str | None = None


class PlanTrabajoResponse(BaseModel):
    id: int
    direccion_id: int
    nombre: str
    anio: int
    semestre: str
    archivo_pdf: str | None = None
    fecha_registro: datetime

    class Config:
        from_attributes = True
