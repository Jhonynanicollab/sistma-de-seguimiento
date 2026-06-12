from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EvidenciaCreate(BaseModel):
    actividad_id: int
    descripcion:  Optional[str] = None


class EvidenciaUpdate(BaseModel):
    descripcion: Optional[str] = None


class EvidenciaResponse(BaseModel):
    id:           int
    actividad_id: int
    descripcion:  Optional[str]  = None
    archivo:      Optional[str]  = None
    fecha_carga:  datetime

    class Config:
        from_attributes = True
