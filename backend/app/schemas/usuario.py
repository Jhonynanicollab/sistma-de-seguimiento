from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.usuario import RolUsuario


class UsuarioCreate(BaseModel):
    nombre:   str
    email:    EmailStr
    password: str
    rol:      RolUsuario = RolUsuario.lector


class UsuarioResponse(BaseModel):
    id:     int
    nombre: str
    email:  str
    rol:    RolUsuario
    activo: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
