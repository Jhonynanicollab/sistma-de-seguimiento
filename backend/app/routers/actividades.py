from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.db.database import get_db
from app.models.actividad import Actividad, EstadoActividad
from app.models.plan_trabajo import PlanTrabajo
from app.models.usuario import Usuario, RolUsuario
from app.schemas.actividad import ActividadCreate, ActividadUpdate, ActividadResponse
from app.routers.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/actividades",
    tags=["Actividades"]
)


def _get_actividad_or_404(actividad_id: int, db: Session) -> Actividad:
    actividad = db.query(Actividad).filter(Actividad.id == actividad_id).first()
    if not actividad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Actividad con id {actividad_id} no encontrada")
    return actividad


@router.post("/", response_model=ActividadResponse, status_code=status.HTTP_201_CREATED)
def crear_actividad(
    actividad: ActividadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para crear actividades")
    if not db.query(PlanTrabajo).filter(PlanTrabajo.id == actividad.plan_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Plan con id {actividad.plan_id} no encontrado")
    nueva = Actividad(**actividad.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=List[ActividadResponse])
def listar_actividades(
    plan_id: Optional[int] = None,
    estado: Optional[EstadoActividad] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    query = db.query(Actividad).options(
        joinedload(Actividad.plan).joinedload(PlanTrabajo.direccion)
    )
    if plan_id:
        query = query.filter(Actividad.plan_id == plan_id)
    if estado:
        query = query.filter(Actividad.estado == estado)
    return query.all()


@router.get("/{actividad_id}", response_model=ActividadResponse)
def obtener_actividad(
    actividad_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    return _get_actividad_or_404(actividad_id, db)


@router.put("/{actividad_id}", response_model=ActividadResponse)
def actualizar_actividad(
    actividad_id: int,
    datos: ActividadUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para editar actividades")
    actividad = _get_actividad_or_404(actividad_id, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(actividad, campo, valor)
    db.commit()
    db.refresh(actividad)
    return actividad


@router.delete("/{actividad_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_actividad(
    actividad_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para eliminar actividades")
    actividad = _get_actividad_or_404(actividad_id, db)
    db.delete(actividad)
    db.commit()
