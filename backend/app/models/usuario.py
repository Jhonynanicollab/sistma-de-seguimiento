from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class RolUsuario(str, enum.Enum):
    admin   = "admin"    # acceso total
    editor  = "editor"   # puede crear/editar planes y actividades
    lector  = "lector"   # solo lectura


class Usuario(Base):
    __tablename__ = "usuarios"

    id               = Column(Integer, primary_key=True, index=True)
    nombre           = Column(String(200), nullable=False)
    email            = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    rol              = Column(Enum(RolUsuario), default=RolUsuario.lector, nullable=False)
    activo           = Column(Boolean, default=True)
    
    # Relación con la Dirección / Oficina
    direccion_id     = Column(Integer, ForeignKey("direcciones.id", ondelete="SET NULL"), nullable=True)
    direccion        = relationship("Direccion")
