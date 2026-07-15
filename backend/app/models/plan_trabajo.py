from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class PlanTrabajo(Base):

    __tablename__ = "planes_trabajo"

    id = Column(Integer, primary_key=True, index=True)

    direccion_id = Column(
        Integer,
        ForeignKey("direcciones.id"),
        nullable=False
    )

    nombre = Column(String(255), nullable=False)

    anio = Column(Integer, nullable=False)

    semestre = Column(String(10), nullable=False, default="I")  # "I" o "II"

    archivo_pdf = Column(String(255), nullable=True)

    fecha_registro = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Relaciones
    direccion   = relationship("Direccion", back_populates="planes")
    actividades = relationship("Actividad", back_populates="plan", cascade="all, delete-orphan")
