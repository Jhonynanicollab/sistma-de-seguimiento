"""
Manejo de archivos PDF subidos al servidor.
"""
import os
import uuid
from fastapi import UploadFile, HTTPException, status

from app.config import UPLOAD_PLANES, UPLOAD_EVIDENCIAS

ALLOWED_TYPES = {"application/pdf"}
MAX_SIZE_MB   = 20
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


async def guardar_pdf_plan(archivo: UploadFile, plan_id: int) -> str:
    """
    Valida y guarda el PDF de un plan de trabajo.
    Retorna la ruta relativa almacenada en BD.
    """
    _validar_pdf(archivo)

    contenido = await archivo.read()
    _validar_tamano(contenido)

    nombre_archivo = f"plan_{plan_id}_{uuid.uuid4().hex}.pdf"
    ruta_completa  = os.path.join(UPLOAD_PLANES, nombre_archivo)

    with open(ruta_completa, "wb") as f:
        f.write(contenido)

    # Retorna ruta relativa para guardar en BD
    return os.path.join("uploads", "planes", nombre_archivo)


async def guardar_pdf_evidencia(archivo: UploadFile, actividad_id: int) -> str:
    """
    Valida y guarda el archivo de evidencia.
    Acepta PDF e imágenes.
    """
    contenido = await archivo.read()
    _validar_tamano(contenido)

    extension     = os.path.splitext(archivo.filename or "")[-1].lower()
    nombre_archivo = f"evidencia_{actividad_id}_{uuid.uuid4().hex}{extension}"
    ruta_completa  = os.path.join(UPLOAD_EVIDENCIAS, nombre_archivo)

    with open(ruta_completa, "wb") as f:
        f.write(contenido)

    return os.path.join("uploads", "evidencias", nombre_archivo)


def eliminar_archivo(ruta_relativa: str) -> None:
    """Elimina un archivo del disco dado su ruta relativa."""
    from app.config import BASE_DIR
    ruta = os.path.join(BASE_DIR, ruta_relativa)
    if os.path.exists(ruta):
        os.remove(ruta)


# ── validaciones internas ─────────────────────────────────────────────────────

def _validar_pdf(archivo: UploadFile) -> None:
    if archivo.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos PDF"
        )


def _validar_tamano(contenido: bytes) -> None:
    if len(contenido) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo supera el límite de {MAX_SIZE_MB} MB"
        )
