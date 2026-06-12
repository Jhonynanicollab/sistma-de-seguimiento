from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from app.models.actividad import EstadoActividad


class ActividadCreate(BaseModel):
    plan_id:      int
    nombre:       str
    descripcion:  Optional[str]  = None
    responsable:  Optional[str]  = None
    fecha_inicio: Optional[date] = None
    fecha_fin:    Optional[date] = None
    estado:       EstadoActividad = EstadoActividad.pendiente
    meta:         Optional[str]  = None
    avance:       int            = Field(default=0, ge=0, le=100)


class ActividadUpdate(BaseModel):
    nombre:       Optional[str]            = None
    descripcion:  Optional[str]            = None
    responsable:  Optional[str]            = None
    fecha_inicio: Optional[date]           = None
    fecha_fin:    Optional[date]           = None
    estado:       Optional[EstadoActividad] = None
    meta:         Optional[str]            = None
    avance:       Optional[int]            = Field(default=None, ge=0, le=100)


class ActividadResponse(BaseModel):
    id:           int
    plan_id:      int
    nombre:       str
    descripcion:  Optional[str]  = None
    responsable:  Optional[str]  = None
    fecha_inicio: Optional[date] = None
    fecha_fin:    Optional[date] = None
    estado:       EstadoActividad
    meta:         Optional[str]  = None
    avance:       int

    class Config:
        from_attributes = True
