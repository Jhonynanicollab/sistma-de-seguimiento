from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.evidencia import Evidencia
from app.models.actividad import Actividad
from app.models.usuario import Usuario, RolUsuario
from app.schemas.evidencia import EvidenciaCreate, EvidenciaUpdate, EvidenciaResponse
from app.routers.auth import get_current_user, require_admin
from app.services import pdf_processor

router = APIRouter(
    prefix="/evidencias",
    tags=["Evidencias"]
)


def _get_evidencia_or_404(evidencia_id: int, db: Session) -> Evidencia:
    evidencia = db.query(Evidencia).filter(Evidencia.id == evidencia_id).first()
    if not evidencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidencia con id {evidencia_id} no encontrada")
    return evidencia


@router.post("/", response_model=EvidenciaResponse, status_code=status.HTTP_201_CREATED)
def crear_evidencia(
    evidencia: EvidenciaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para cargar evidencias")
    if not db.query(Actividad).filter(Actividad.id == evidencia.actividad_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Actividad con id {evidencia.actividad_id} no encontrada")
    nueva = Evidencia(**evidencia.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=List[EvidenciaResponse])
def listar_evidencias(
    actividad_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    query = db.query(Evidencia)
    if actividad_id:
        query = query.filter(Evidencia.actividad_id == actividad_id)
    return query.all()


@router.get("/{evidencia_id}", response_model=EvidenciaResponse)
def obtener_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    return _get_evidencia_or_404(evidencia_id, db)


@router.put("/{evidencia_id}", response_model=EvidenciaResponse)
def actualizar_evidencia(
    evidencia_id: int,
    datos: EvidenciaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para editar evidencias")
    evidencia = _get_evidencia_or_404(evidencia_id, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(evidencia, campo, valor)
    db.commit()
    db.refresh(evidencia)
    return evidencia


@router.delete("/{evidencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    evidencia = _get_evidencia_or_404(evidencia_id, db)
    db.delete(evidencia)
    db.commit()


# ── subida de archivo ─────────────────────────────────────────────────────────

@router.post(
    "/{evidencia_id}/upload",
    response_model=EvidenciaResponse
)
async def subir_archivo_evidencia(
    evidencia_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Adjunta un archivo (PDF o imagen) a una evidencia existente."""
    if current_user.rol == RolUsuario.lector:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sin permisos para subir archivos")

    evidencia = _get_evidencia_or_404(evidencia_id, db)

    # Eliminar archivo anterior si existe
    if evidencia.archivo:
        pdf_processor.eliminar_archivo(evidencia.archivo)

    ruta = await pdf_processor.guardar_pdf_evidencia(archivo, evidencia.actividad_id)
    evidencia.archivo = ruta
    db.commit()
    db.refresh(evidencia)
    return evidencia
