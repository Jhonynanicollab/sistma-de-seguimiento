from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.routers.auth import get_current_user
from app.services.reporte_service import generar_reporte_plan

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)


@router.get("/plan/{plan_id}")
def descargar_reporte_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Usuario  = Depends(get_current_user)
):
    """
    Genera y descarga el reporte PDF de cumplimiento de un plan de trabajo.
    El navegador lo descarga directamente como archivo.
    """
    try:
        pdf_bytes = generar_reporte_plan(plan_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_plan_{plan_id}.pdf"
        }
    )
