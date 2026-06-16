from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from typing import Optional

from app.db.database import Base


class EstadoActividad(str, enum.Enum):
    pendiente   = "pendiente"
    en_proceso  = "en_proceso"
    completada  = "completada"
    cancelada   = "cancelada"


class Actividad(Base):
    __tablename__ = "actividades"

    id            = Column(Integer, primary_key=True, index=True)
    plan_id       = Column(Integer, ForeignKey("planes_trabajo.id"), nullable=False)
    nombre        = Column(String(300), nullable=False)
    descripcion   = Column(Text, nullable=True)
    responsable   = Column(String(200), nullable=True)
    fecha_inicio  = Column(Date, nullable=True)
    fecha_fin     = Column(Date, nullable=True)
    estado        = Column(
                        Enum(EstadoActividad),
                        default=EstadoActividad.pendiente,
                        nullable=False
                    )
    meta          = Column(String(300), nullable=True)   # indicador / meta cuantitativa
    avance        = Column(Integer, default=0)           # porcentaje 0-100

    # Relaciones
    plan       = relationship("PlanTrabajo", back_populates="actividades")
    evidencias = relationship("Evidencia", back_populates="actividad", cascade="all, delete-orphan")

    @property
    def plan_nombre(self) -> Optional[str]:
        return self.plan.nombre if self.plan else None

    @property
    def direccion_nombre(self) -> Optional[str]:
        return self.plan.direccion.nombre if self.plan and self.plan.direccion else None
