"""
Extracción automática de actividades desde el texto de un PDF de Plan de Trabajo.

Estrategia:
  - Busca líneas que contengan patrones comunes en documentos PTI institucionales:
    números de ítem, palabras clave como "Actividad", "Meta", "Responsable" y fechas.
  - Crea objetos ActividadExtraida que luego el router convierte en registros en BD.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import date


@dataclass
class ActividadExtraida:
    nombre:       str
    responsable:  Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin:    Optional[date] = None
    meta:         Optional[str] = None


# ── patrones regex ────────────────────────────────────────────────────────────

# Línea que empieza con un número de ítem seguido de texto (ej: "1. Capacitar al personal")
RE_ITEM       = re.compile(r"^\s*(\d{1,2}[\.\)]\s+)(.+)$", re.MULTILINE)

# Fecha en formato dd/mm/yyyy o dd-mm-yyyy
RE_FECHA      = re.compile(r"\b(\d{2})[/\-](\d{2})[/\-](\d{4})\b")

# Responsable: línea que contiene "responsable:" seguido de texto
RE_RESPONSABLE = re.compile(r"responsable[:\s]+([A-Za-záéíóúÁÉÍÓÚñÑ\s]+)", re.IGNORECASE)

# Meta: línea que contiene "meta:" seguido de texto
RE_META       = re.compile(r"meta[:\s]+(.+)", re.IGNORECASE)


def _parsear_fecha(texto: str) -> Optional[date]:
    m = RE_FECHA.search(texto)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            return None
    return None


def extraer_actividades(texto: str) -> List[ActividadExtraida]:
    """
    Recibe el texto completo del PDF y retorna una lista de actividades detectadas.
    """
    actividades: List[ActividadExtraida] = []

    # Dividir en bloques por página o por líneas en blanco dobles
    bloques = re.split(r"\n{2,}", texto)

    for bloque in bloques:
        lineas = bloque.strip().splitlines()
        if not lineas:
            continue

        # Buscar ítems numerados como posibles nombres de actividad
        for linea in lineas:
            match = RE_ITEM.match(linea)
            if not match:
                continue

            nombre = match.group(2).strip()
            if len(nombre) < 8:      # descartar ítems muy cortos (números de tabla, etc.)
                continue

            actividad = ActividadExtraida(nombre=nombre)

            # Buscar responsable, meta y fechas en el bloque completo
            resp = RE_RESPONSABLE.search(bloque)
            if resp:
                actividad.responsable = resp.group(1).strip()[:200]

            meta = RE_META.search(bloque)
            if meta:
                actividad.meta = meta.group(1).strip()[:300]

            fechas = RE_FECHA.findall(bloque)
            if len(fechas) >= 1:
                try:
                    actividad.fecha_inicio = date(int(fechas[0][2]), int(fechas[0][1]), int(fechas[0][0]))
                except ValueError:
                    pass
            if len(fechas) >= 2:
                try:
                    actividad.fecha_fin = date(int(fechas[1][2]), int(fechas[1][1]), int(fechas[1][0]))
                except ValueError:
                    pass

            actividades.append(actividad)

    return actividades
