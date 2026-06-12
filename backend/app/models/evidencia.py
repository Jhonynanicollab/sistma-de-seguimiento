from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Evidencia(Base):
    __tablename__ = "evidencias"

    id            = Column(Integer, primary_key=True, index=True)
    actividad_id  = Column(Integer, ForeignKey("actividades.id"), nullable=False)
    descripcion   = Column(Text, nullable=True)
    archivo       = Column(String(255), nullable=True)   # ruta al archivo subido
    fecha_carga   = Column(DateTime, default=datetime.utcnow)

    # Relación
    actividad = relationship("Actividad", back_populates="evidencias")
