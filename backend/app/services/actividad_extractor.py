"""
Extracción automática de actividades desde el texto y tablas de un PDF de Plan de Trabajo.

Estrategia híbrida:
  1. Intenta extraer actividades estructuradas directamente desde tablas PDF usando PyMuPDF (fitz.find_tables).
  2. Si no se encuentran tablas o actividades estructuradas, recurre a la extracción basada en expresiones regulares sobre el texto plano.
"""
import re
import fitz
from dataclasses import dataclass
from typing import List, Optional
from datetime import date

@dataclass
class ActividadExtraida:
    nombre:       str
    responsable:  Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin:    Optional[date] = None
    meta:         Optional[str] = None


# ── patrones regex para fallback ──────────────────────────────────────────────

RE_ITEM       = re.compile(r"^\s*(\d{1,2}[\.\)]\s+)(.+)$", re.MULTILINE)
RE_FECHA      = re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b")
RE_RESPONSABLE = re.compile(r"responsable[:\s]+([A-Za-záéíóúÁÉÍÓÚñÑ\s\.\-,]+)", re.IGNORECASE)
RE_META       = re.compile(r"meta[:\s]+(.+)", re.IGNORECASE)


def _parsear_fecha(texto: str) -> Optional[date]:
    if not texto:
        return None
    m = RE_FECHA.search(texto)
    if m:
        try:
            dia = int(m.group(1))
            mes = int(m.group(2))
            anio = int(m.group(3))
            # Ajustar año de 2 dígitos a 4 dígitos
            if anio < 100:
                anio += 2000
            return date(anio, mes, dia)
        except ValueError:
            return None
    return None


def extraer_de_tablas(page: fitz.Page) -> List[ActividadExtraida]:
    """
    Intenta extraer celdas estructuradas si la página contiene tablas.
    """
    actividades = []
    try:
        tables = page.find_tables()
    except Exception:
        return []

    if not tables:
        return []

    for table in tables:
        rows = table.extract()
        if not rows or len(rows) < 2:
            continue

        # Normalizar encabezados para buscar mapeo de columnas
        headers = [str(cell).lower().strip() if cell else "" for cell in rows[0]]
        
        col_nombre = -1
        col_responsable = -1
        col_fecha_inicio = -1
        col_fecha_fin = -1
        col_meta = -1

        for idx, h in enumerate(headers):
            if any(kw in h for kw in ["actividad", "nombre", "descripcion", "tarea", "denominación"]):
                col_nombre = idx
            elif any(kw in h for kw in ["responsable", "encargado", "oficina", "comisión", "quién"]):
                col_responsable = idx
            elif any(kw in h for kw in ["meta", "indicador", "objetivo", "producto", "resultado"]):
                col_meta = idx
            elif any(kw in h for kw in ["inicio", "desde", "fecha i", "fecha_i"]):
                col_fecha_inicio = idx
            elif any(kw in h for kw in ["fin", "hasta", "fecha f", "fecha_f", "término"]):
                col_fecha_fin = idx
            elif "fecha" in h or "cronograma" in h or "plazo" in h:
                if col_fecha_inicio == -1:
                    col_fecha_inicio = idx

        # Si no se encuentra columna de nombre, adivinamos basándonos en la estructura
        if col_nombre == -1:
            if len(headers) >= 3:
                # Comúnmente el ítem es col 0, la actividad es col 1
                col_nombre = 1
            else:
                continue

        # Procesar filas
        for row in rows[1:]:
            cells = [str(cell).strip() if cell else "" for cell in row]
            if not cells or col_nombre >= len(cells) or not cells[col_nombre]:
                continue

            nombre = cells[col_nombre]
            # Limpiar saltos de línea molestos en el nombre
            nombre = re.sub(r"\s+", " ", nombre).strip()

            # Descartar filas vacías o repetidas del encabezado
            if len(nombre) < 5 or nombre.lower() in ["actividad", "nombre", "descripcion", "tarea"]:
                continue

            responsable = cells[col_responsable] if (col_responsable != -1 and col_responsable < len(cells)) else None
            if responsable:
                responsable = re.sub(r"\s+", " ", responsable).strip()[:200]

            meta = cells[col_meta] if (col_meta != -1 and col_meta < len(cells)) else None
            if meta:
                meta = re.sub(r"\s+", " ", meta).strip()[:300]

            fecha_in = None
            fecha_fi = None

            if col_fecha_inicio != -1 and col_fecha_inicio < len(cells):
                fecha_in = _parsear_fecha(cells[col_fecha_inicio])
            if col_fecha_fin != -1 and col_fecha_fin < len(cells):
                fecha_fi = _parsear_fecha(cells[col_fecha_fin])

            # Si no se detectaron fechas en columnas específicas, buscamos en toda la fila
            if not fecha_in or not fecha_fi:
                row_text = " ".join(cells)
                fechas = RE_FECHA.findall(row_text)
                if len(fechas) >= 1 and not fecha_in:
                    try:
                        d, m, a = int(fechas[0][0]), int(fechas[0][1]), int(fechas[0][2])
                        if a < 100: a += 2000
                        fecha_in = date(a, m, d)
                    except ValueError:
                        pass
                if len(fechas) >= 2 and not fecha_fi:
                    try:
                        d, m, a = int(fechas[1][0]), int(fechas[1][1]), int(fechas[1][2])
                        if a < 100: a += 2000
                        fecha_fi = date(a, m, d)
                    except ValueError:
                        pass

            act = ActividadExtraida(
                nombre=nombre,
                responsable=responsable,
                fecha_inicio=fecha_in,
                fecha_fin=fecha_fi,
                meta=meta
            )
            actividades.append(act)

    return actividades


def extraer_actividades(ruta_pdf: str, texto_fallback: str) -> List[ActividadExtraida]:
    """
    Intenta extraer actividades desde las tablas del PDF. 
    Si no encuentra ninguna, recurre al método de texto plano/regex en el texto_fallback.
    """
    actividades: List[ActividadExtraida] = []

    # ── Método 1: Extracción de Tablas ──────────────────────────────────────
    try:
        doc = fitz.open(ruta_pdf)
        for page in doc:
            acts_pagina = extraer_de_tablas(page)
            actividades.extend(acts_pagina)
        doc.close()
    except Exception as e:
        print(f"Error al extraer de tablas del PDF: {e}")

    # Si se extrajeron actividades exitosamente de las tablas, las retornamos
    if actividades:
        print(f"Se extrajeron {len(actividades)} actividades mediante análisis de tablas PDF.")
        return actividades

    # ── Método 2: Fallback Expresiones Regulares ─────────────────────────────
    print("No se detectaron tablas. Usando fallback de expresiones regulares en texto plano.")
    
    # Dividir en bloques por líneas en blanco
    bloques = re.split(r"\n{2,}", texto_fallback)

    for bloque in bloques:
        lineas = bloque.strip().splitlines()
        if not lineas:
            continue

        for linea in lineas:
            match = RE_ITEM.match(linea)
            if not match:
                continue

            nombre = match.group(2).strip()
            if len(nombre) < 8:
                continue

            actividad = ActividadExtraida(nombre=nombre)

            resp = RE_RESPONSABLE.search(bloque)
            if resp:
                actividad.responsable = resp.group(1).strip()[:200]

            meta = RE_META.search(bloque)
            if meta:
                actividad.meta = meta.group(1).strip()[:300]

            fechas = RE_FECHA.findall(bloque)
            if len(fechas) >= 1:
                try:
                    d, m, a = int(fechas[0][0]), int(fechas[0][1]), int(fechas[0][2])
                    if a < 100: a += 2000
                    actividad.fecha_inicio = date(a, m, d)
                except ValueError:
                    pass
            if len(fechas) >= 2:
                try:
                    d, m, a = int(fechas[1][0]), int(fechas[1][1]), int(fechas[1][2])
                    if a < 100: a += 2000
                    actividad.fecha_fin = date(a, m, d)
                except ValueError:
                    pass

            actividades.append(actividad)

    return actividades
