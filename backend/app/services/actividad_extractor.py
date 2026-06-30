"""
Extracción automática de actividades desde el texto y tablas de un PDF de Plan de Trabajo.

Estrategia híbrida:
  1. Intenta extraer actividades estructuradas directamente desde tablas PDF usando PyMuPDF (fitz.find_tables).
  2. Si no se encuentran tablas nativas, busca usar la API de Google Gemini (si está configurada la API Key en el entorno).
  3. Si no hay API Key o hay problemas de red, recurre al parser local inteligente basado en delimitación de secciones.
"""
import re
import fitz
import os
import json
from dataclasses import dataclass
from typing import List, Optional
from datetime import date, datetime

# Intento de importación opcional del SDK de Google Generative AI
try:
    import google.generativeai as genai
    from pydantic import BaseModel, Field
    
    # Esquemas Pydantic para salida estructurada de Gemini
    class ActividadAI(BaseModel):
        nombre: str = Field(description="Nombre o descripción detallada de la actividad de gestión académica")
        responsable: Optional[str] = Field(None, description="Persona, oficina, comisión o dirección encargada de ejecutar la actividad")
        fecha_inicio: Optional[str] = Field(None, description="Fecha de inicio en formato AAAA-MM-DD (ej: 2026-03-15) o nulo")
        fecha_fin: Optional[str] = Field(None, description="Fecha de fin o límite en formato AAAA-MM-DD (ej: 2026-10-30) o nulo")
        meta: Optional[str] = Field(None, description="Meta, indicador cuantitativo o resultado esperado de la actividad")

    class ListaActividadesAI(BaseModel):
        actividades: List[ActividadAI]

    HAS_GEMINI_SDK = True
except ImportError:
    HAS_GEMINI_SDK = False


@dataclass
class ActividadExtraida:
    nombre:       str
    responsable:  Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin:    Optional[date] = None
    meta:         Optional[str] = None


# ── patrones regex para fallback local ────────────────────────────────────────

RE_ITEM       = re.compile(r"^\s*([\-\*•]|\d{1,2}[\.\),\-\s]+|[a-z][\.\)]\s+)\s*(.+)$", re.MULTILINE)
RE_FECHA      = re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b")
RE_TIME_RANGE = re.compile(r"\b(\d{2}[:\.]\d{2})\s*[-—–~]\s*(\d{2}[:\.]\d{2})\b")
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
    Si no encuentra ninguna (como en un PDF escaneado), recurre al método de fallback.
    """
    actividades: List[ActividadExtraida] = []

    # ── Método 1: Extracción de Tablas Nativa ─────────────────────────────────
    try:
        doc = fitz.open(ruta_pdf)
        for page in doc:
            acts_pagina = extraer_de_tablas(page)
            actividades.extend(acts_pagina)
        doc.close()
    except Exception as e:
        print(f"Error al extraer de tablas del PDF: {e}")

    # Si se extrajeron actividades exitosamente de las tablas nativas, las retornamos
    if actividades:
        print(f"Se extrajeron {len(actividades)} actividades mediante análisis de tablas PDF.")
        return actividades

    # ── Método 2: Extracción con Inteligencia Artificial (Google Gemini API) ─
    gemini_key = os.getenv("GEMINI_API_KEY")
    if HAS_GEMINI_SDK and gemini_key:
        print("[AI] Detectado GEMINI_API_KEY en el entorno. Intentando extracción inteligente con Gemini...")
        try:
            # Configurar API
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = f"""
            Analiza el siguiente texto extraído mediante OCR de un documento de Plan de Trabajo de una facultad.
            Tu tarea es identificar y estructurar la lista completa de las actividades y tareas programadas en el plan.
            Normalmente están organizadas en secciones como "Actividades Previas", "Actividades del Evento" o "Actividades Posteriores".
            
            Reglas críticas:
            1. Extrae SOLAMENTE las actividades académicas o tareas del plan.
            2. IGNORA textos de la carátula, resoluciones de decanato, antecedentes, base legal, responsables generales y la sección del presupuesto/dinero.
            3. Si el OCR rompió o separó las líneas de una misma actividad, únelas de forma coherente para reconstruir el nombre completo.
            4. Trata de extraer el responsable de cada actividad (ej: Comité de Calidad, Director de Escuela, Decano, etc.).
            5. Si hay fechas en formato de día-mes-año, conviértelas al formato AAAA-MM-DD.
            
            Texto del Plan de Trabajo:
            \"\"\"
            {texto_fallback}
            \"\"\"
            """
            
            # Ejecutar llamada con salida estructurada en JSON
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=ListaActividadesAI,
                )
            )
            
            # Cargar respuesta JSON
            res_data = json.loads(response.text)
            for act_data in res_data.get("actividades", []):
                nombre = act_data.get("nombre", "").strip()
                if len(nombre) < 5:
                    continue
                    
                # Formatear fechas
                f_ini = None
                f_fin = None
                
                try:
                    str_ini = act_data.get("fecha_inicio")
                    if str_ini:
                        f_ini = datetime.strptime(str_ini, "%Y-%m-%d").date()
                except Exception:
                    pass
                    
                try:
                    str_fin = act_data.get("fecha_fin")
                    if str_fin:
                        f_fin = datetime.strptime(str_fin, "%Y-%m-%d").date()
                except Exception:
                    pass
                    
                actividades.append(ActividadExtraida(
                    nombre=nombre,
                    responsable=act_data.get("responsable"),
                    fecha_inicio=f_ini,
                    fecha_fin=f_fin,
                    meta=act_data.get("meta")
                ))
                
            if actividades:
                print(f"[AI] Extracción exitosa. Se detectaron {len(actividades)} actividades usando Gemini AI.")
                return actividades
                
        except Exception as ai_err:
            print(f"[AI ERROR] Falló la extracción con Gemini: {ai_err}. Usando fallback local offline...")

    # ── Método 3: Fallback Local Basado en Secciones y OCR (Offline) ──────────
    print("Usando fallback local offline basado en delimitación de secciones.")
    
    lines = texto_fallback.split("\n")
    section_lines = []
    current_section = "general"
    
    RESPONSABLES_KEYWORDS = [
        "director de escuela", "comité de calidad", "decano", "asesora", "asesor", 
        "secretaría", "secretaria", "director de departamento", "departamento", 
        "comisión", "coordinación", "proyección", "dirección de escuela", "comite de calidad"
    ]
    
    for line in lines:
        clean_line = line.strip()
        if not clean_line:
            continue
            
        if clean_line.startswith("--- Página") or clean_line.endswith("---"):
            continue
            
        lower_line = clean_line.lower()
        
        if any(kw in lower_line for kw in ["facultad de", "escuela profesional", "plan de trabajo", "resolucion de", "aprobado:"]):
            current_section = "general"
            continue
            
        if "actividades previas" in lower_line or "actividades preparatorias" in lower_line:
            current_section = "previas"
            continue
        elif "actividades del evento" in lower_line or "desarrollo de actividades" in lower_line or "programa de actividades" in lower_line:
            current_section = "evento"
            continue
        elif "actividades posteriores" in lower_line or "actividades de cierre" in lower_line:
            current_section = "posteriores"
            continue
        elif ("responsables" in lower_line or "presupuesto" in lower_line) and len(clean_line) < 25:
            current_section = "general"
            continue
            
        if current_section in ["previas", "evento", "posteriores"]:
            section_lines.append((current_section, clean_line))

    pending_text = []
    
    for section, line in section_lines:
        if any(hdr in line.lower() for hdr in ["actividad responsable", "hora actividad", "fecha límite", "cronograma"]):
            continue
            
        has_date = RE_FECHA.search(line)
        has_time = RE_TIME_RANGE.search(line)
        
        found_resp = None
        for r_word in RESPONSABLES_KEYWORDS:
            match = re.search(r"\b" + re.escape(r_word) + r"\b", line.lower())
            if match:
                start, end = match.span()
                found_resp = line[start:].split("|")[0].split(",")[0].strip()
                break
                
        if has_date or has_time or found_resp:
            name_part = line
            if has_date:
                name_part = name_part.replace(has_date.group(0), "")
            if has_time:
                name_part = name_part.replace(has_time.group(0), "")
            if found_resp:
                name_part = name_part.replace(found_resp, "")
                
            name_part = re.sub(r"[\|\"“”'\-\_]+", " ", name_part).strip()
            
            full_name = " ".join(pending_text + [name_part])
            full_name = re.sub(r"\s+", " ", full_name).strip()
            full_name = re.sub(r"^\s*[\-\*•\d\.\,\;\:\s]+", "", full_name)
            
            if len(full_name) > 5:
                fecha_ini = _parsear_fecha(line)
                fecha_fi = None
                all_dates = RE_FECHA.findall(line)
                if len(all_dates) >= 2:
                    try:
                        d, m, a = int(all_dates[1][0]), int(all_dates[1][1]), int(all_dates[1][2])
                        if a < 100: a += 2000
                        fecha_fi = date(a, m, d)
                    except ValueError:
                        pass
                        
                actividades.append(ActividadExtraida(
                    nombre=full_name,
                    responsable=found_resp[:200] if found_resp else None,
                    fecha_inicio=fecha_ini,
                    fecha_fin=fecha_fi,
                    meta=None
                ))
            pending_text = []
        else:
            clean_part = re.sub(r"[\|\"“”'\-\_]+", " ", line).strip()
            if clean_part:
                pending_text.append(clean_part)
                
    if not actividades:
        print("No se identificaron las secciones específicas. Usando mapeo lineal por viñetas.")
        bloques = re.split(r"\n{2,}", texto_fallback)
        for bloque in bloques:
            bloque_text = bloque.strip()
            if not bloque_text:
                continue
            matches = list(RE_ITEM.finditer(bloque_text))
            if not matches:
                continue
            for idx, match in enumerate(matches):
                start_pos = match.start()
                end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(bloque_text)
                segmento = bloque_text[start_pos:end_pos]
                
                if segmento.strip().startswith("--- Página"):
                    continue
                    
                nombre = match.group(2).strip()
                if len(nombre) < 8 or any(kw in nombre.lower() for kw in ["facultad de", "escuela profesional", "plan de trabajo"]):
                    continue
                    
                actividad = ActividadExtraida(nombre=nombre)
                resp = RE_RESPONSABLE.search(segmento)
                if resp:
                    actividad.responsable = resp.group(1).strip()[:200]
                meta = RE_META.search(segmento)
                if meta:
                    actividad.meta = meta.group(1).strip()[:300]
                fechas = RE_FECHA.findall(segmento)
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
