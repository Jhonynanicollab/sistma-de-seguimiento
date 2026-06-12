from pydantic import BaseModel


class DireccionCreate(BaseModel):
    nombre: str
    descripcion: str | None = None


class DireccionUpdate(BaseModel):
    # Todos opcionales para soportar actualizaciones parciales (PATCH-style en PUT)
    nombre: str | None = None
    descripcion: str | None = None


class DireccionResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None

    class Config:
        from_attributes = True
