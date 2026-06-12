from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.direccion import Direccion
from app.models.usuario import Usuario
from app.schemas.direccion import DireccionCreate, DireccionUpdate, DireccionResponse
from app.routers.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/direcciones",
    tags=["Direcciones"]
)


@router.post("/", response_model=DireccionResponse, status_code=status.HTTP_201_CREATED)
def crear_direccion(
    direccion: DireccionCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)          # solo admin puede crear
):
    nueva = Direccion(nombre=direccion.nombre, descripcion=direccion.descripcion)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=List[DireccionResponse])
def listar_direcciones(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)       # cualquier usuario autenticado
):
    return db.query(Direccion).all()


@router.get("/{direccion_id}", response_model=DireccionResponse)
def obtener_direccion(
    direccion_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    direccion = db.query(Direccion).filter(Direccion.id == direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Dirección con id {direccion_id} no encontrada")
    return direccion


@router.put("/{direccion_id}", response_model=DireccionResponse)
def actualizar_direccion(
    direccion_id: int,
    datos: DireccionUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)          # solo admin puede modificar
):
    direccion = db.query(Direccion).filter(Direccion.id == direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Dirección con id {direccion_id} no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(direccion, campo, valor)
    db.commit()
    db.refresh(direccion)
    return direccion


@router.delete("/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_direccion(
    direccion_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)          # solo admin puede eliminar
):
    direccion = db.query(Direccion).filter(Direccion.id == direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Dirección con id {direccion_id} no encontrada")
    db.delete(direccion)
    db.commit()
