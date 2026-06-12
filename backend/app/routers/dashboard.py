from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.routers.auth import get_current_user
from app.services import indicadores as svc

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard_global(
    db: Session = Depends(get_db),
    _: Usuario  = Depends(get_current_user)
):
    """
    Resumen general del sistema:
    - Total de direcciones, planes y actividades
    - Actividades por estado
    - % de cumplimiento global
    - Avance promedio
    """
    return svc.resumen_global(db)


@router.get("/por-direccion")
def dashboard_por_direccion(
    db: Session = Depends(get_db),
    _: Usuario  = Depends(get_current_user)
):
    """
    Indicadores desglosados por cada dirección institucional.
    Útil para las tarjetas y la tabla resumen del frontend.
    """
    return svc.resumen_por_direccion(db)


@router.get("/plan/{plan_id}")
def dashboard_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Usuario  = Depends(get_current_user)
):
    """
    Detalle de cumplimiento de un plan específico.
    """
    resultado = svc.resumen_por_plan(plan_id, db)
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan con id {plan_id} no encontrado"
        )
    return resultado
