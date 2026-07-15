from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.plan_trabajo import PlanTrabajo
from app.models.actividad import Actividad
from app.models.direccion import Direccion
from app.models.usuario import Usuario, RolUsuario
from app.schemas.plan_trabajo import PlanTrabajoCreate, PlanTrabajoUpdate, PlanTrabajoResponse
from app.schemas.actividad import ActividadResponse
from app.routers.auth import get_current_user, require_admin
from app.services import pdf_processor, actividad_extractor
from app.utils.ocr import extraer_texto_pdf, extraer_datos_pdf
from app.config import UPLOAD_PLANES
import os

router = APIRouter(
    prefix="/planes",
    tags=["Planes de Trabajo"]
)


def _get_plan_or_404(plan_id: int, db: Session) -> PlanTrabajo:
    plan = db.query(PlanTrabajo).filter(PlanTrabajo.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Plan de trabajo con id {plan_id} no encontrado")
    return plan


@router.post("/", response_model=PlanTrabajoResponse, status_code=status.HTTP_201_CREATED)
def crear_plan(
    plan: PlanTrabajoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)   # admin o editor
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para crear planes")
    direccion = db.query(Direccion).filter(Direccion.id == plan.direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Dirección con id {plan.direccion_id} no encontrada")
    nuevo = PlanTrabajo(**plan.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[PlanTrabajoResponse])
def listar_planes(
    direccion_id: Optional[int] = None,
    anio: Optional[int] = None,
    semestre: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    query = db.query(PlanTrabajo)
    if direccion_id:
        query = query.filter(PlanTrabajo.direccion_id == direccion_id)
    if anio:
        query = query.filter(PlanTrabajo.anio == anio)
    if semestre:
        query = query.filter(PlanTrabajo.semestre == semestre)
    return query.all()


@router.get("/{plan_id}", response_model=PlanTrabajoResponse)
def obtener_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    return _get_plan_or_404(plan_id, db)


@router.put("/{plan_id}", response_model=PlanTrabajoResponse)
def actualizar_plan(
    plan_id: int,
    datos: PlanTrabajoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para editar planes")
    plan = _get_plan_or_404(plan_id, db)
    if datos.direccion_id is not None:
        if not db.query(Direccion).filter(Direccion.id == datos.direccion_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Dirección con id {datos.direccion_id} no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(plan, campo, valor)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    plan = _get_plan_or_404(plan_id, db)
    db.delete(plan)
    db.commit()


# ── subida de PDF ─────────────────────────────────────────────────────────────

@router.post(
    "/{plan_id}/upload-pdf",
    response_model=PlanTrabajoResponse
)
async def subir_pdf_plan(
    plan_id: int,
    archivo: UploadFile = File(...),
    extraer: bool = True,          # ?extraer=false para no crear actividades automáticas
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Sube el PDF del plan de trabajo.
    Si extraer=true (por defecto), detecta actividades automáticamente y las crea en BD.
    """
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para subir archivos")

    plan = _get_plan_or_404(plan_id, db)

    # Eliminar PDF anterior si existe
    if plan.archivo_pdf:
        pdf_processor.eliminar_archivo(plan.archivo_pdf)

    # Guardar nuevo PDF
    ruta = await pdf_processor.guardar_pdf_plan(archivo, plan_id)
    plan.archivo_pdf = ruta
    db.commit()
    db.refresh(plan)

    # Extracción automática de actividades
    if extraer:
        ruta_completa = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "..", ruta
        )
        ruta_completa = os.path.normpath(ruta_completa)
        try:
            texto, paginas_detalles = extraer_datos_pdf(ruta_completa)
            actividades_detectadas = actividad_extractor.extraer_actividades(ruta_completa, texto)

            for act in actividades_detectadas:
                nueva = Actividad(
                    plan_id      = plan_id,
                    nombre       = act.nombre[:300],  # Truncar a la capacidad de la columna (300)
                    responsable  = act.responsable[:200] if act.responsable else None,  # Truncar a 200
                    fecha_inicio = act.fecha_inicio,
                    fecha_fin    = act.fecha_fin,
                    meta         = act.meta[:300] if act.meta else None,  # Truncar a 300
                )
                db.add(nueva)

            db.commit()

            # Guardar toda la extracción (raspado) en formato JSON al costado del PDF
            import json
            plan_json_data = {
                "plan_id": plan_id,
                "nombre_plan": plan.nombre,
                "anio": plan.anio,
                "archivo_pdf": ruta,
                "total_paginas": len(paginas_detalles),
                "paginas": paginas_detalles,
                "actividades_extraidas": [
                    {
                        "nombre": act.nombre,
                        "responsable": act.responsable,
                        "fecha_inicio": act.fecha_inicio.isoformat() if act.fecha_inicio else None,
                        "fecha_fin": act.fecha_fin.isoformat() if act.fecha_fin else None,
                        "meta": act.meta
                    }
                    for act in actividades_detectadas
                ]
            }

            json_filename = f"plan_{plan_id}_extracted.json"
            ruta_json = os.path.join(os.path.dirname(ruta_completa), json_filename)
            with open(ruta_json, "w", encoding="utf-8") as jf:
                json.dump(plan_json_data, jf, ensure_ascii=False, indent=2)

        except Exception as e:
            db.rollback()  # Liberar la sesión del estado de error y revertir transacciones pendientes
            print(f"Error en extraccion/guardado JSON: {e}")
            pass

    return plan


@router.get(
    "/{plan_id}/actividades",
    response_model=List[ActividadResponse]
)
def actividades_del_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Retorna todas las actividades de un plan específico."""
    _get_plan_or_404(plan_id, db)
    return db.query(Actividad).filter(Actividad.plan_id == plan_id).all()
