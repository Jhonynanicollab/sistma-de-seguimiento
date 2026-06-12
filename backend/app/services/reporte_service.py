"""
Generación de reportes PDF de cumplimiento usando PyMuPDF (fitz).
Produce un PDF con:
  - Encabezado institucional
  - Datos del plan y dirección
  - Indicadores de cumplimiento
  - Tabla de actividades con estado y avance
"""
import io
import fitz
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.plan_trabajo import PlanTrabajo
from app.models.actividad import Actividad, EstadoActividad
from app.models.direccion import Direccion


# ── colores (RGB 0-1) ─────────────────────────────────────────────────────────
AZUL_HEADER  = (0.12, 0.29, 0.49)   # azul institucional
GRIS_FILA    = (0.93, 0.93, 0.93)
BLANCO       = (1.0, 1.0, 1.0)
NEGRO        = (0.0, 0.0, 0.0)
VERDE        = (0.13, 0.55, 0.13)
AMARILLO     = (0.80, 0.65, 0.0)
ROJO         = (0.75, 0.12, 0.12)
AZUL_CLARO   = (0.20, 0.44, 0.69)

COLOR_ESTADO = {
    "completada":  VERDE,
    "en_proceso":  AZUL_CLARO,
    "pendiente":   AMARILLO,
    "cancelada":   ROJO,
}


def _color_estado(estado: str):
    return COLOR_ESTADO.get(estado, NEGRO)


def generar_reporte_plan(plan_id: int, db: Session) -> bytes:
    """
    Genera el PDF de reporte para un plan de trabajo.
    Retorna los bytes del PDF listo para descarga.
    """
    # ── datos ──────────────────────────────────────────────────────────────────
    plan = db.query(PlanTrabajo).filter(PlanTrabajo.id == plan_id).first()
    if not plan:
        raise ValueError(f"Plan {plan_id} no encontrado")

    direccion   = db.query(Direccion).filter(Direccion.id == plan.direccion_id).first()
    actividades = db.query(Actividad).filter(Actividad.plan_id == plan_id).all()

    total = len(actividades)
    por_estado = {e.value: 0 for e in EstadoActividad}
    avance_sum = 0
    for act in actividades:
        por_estado[act.estado.value] += 1
        avance_sum += act.avance

    completadas  = por_estado.get("completada", 0)
    pct          = round((completadas / total * 100), 1) if total else 0
    avance_prom  = round(avance_sum / total, 1) if total else 0

    # ── documento ─────────────────────────────────────────────────────────────
    doc  = fitz.open()
    page = doc.new_page(width=595, height=842)   # A4

    y = 40   # cursor vertical

    # ── encabezado ────────────────────────────────────────────────────────────
    page.draw_rect(fitz.Rect(30, y, 565, y + 50), color=AZUL_HEADER, fill=AZUL_HEADER)
    page.insert_text(
        (40, y + 18),
        "REPORTE DE CUMPLIMIENTO — PLAN DE TRABAJO INSTITUCIONAL",
        fontsize=11, color=BLANCO, fontname="helv"
    )
    page.insert_text(
        (40, y + 36),
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        fontsize=8, color=BLANCO, fontname="helv"
    )
    y += 65

    # ── info del plan ─────────────────────────────────────────────────────────
    def fila_info(label: str, valor: str, yy: float) -> float:
        page.insert_text((40,  yy), f"{label}:", fontsize=9,
                         color=AZUL_HEADER, fontname="helv")
        page.insert_text((160, yy), valor, fontsize=9,
                         color=NEGRO, fontname="helv")
        return yy + 16

    y = fila_info("Dirección",   direccion.nombre if direccion else "—", y)
    y = fila_info("Plan",        plan.nombre, y)
    y = fila_info("Año",         str(plan.anio), y)
    y = fila_info("Registro",    plan.fecha_registro.strftime("%d/%m/%Y") if plan.fecha_registro else "—", y)
    y += 10

    # ── indicadores ───────────────────────────────────────────────────────────
    page.draw_rect(fitz.Rect(30, y, 565, y + 1), color=AZUL_HEADER, fill=AZUL_HEADER)
    y += 10

    page.insert_text((40, y + 12), "INDICADORES DE CUMPLIMIENTO",
                     fontsize=10, color=AZUL_HEADER, fontname="helv")
    y += 24

    # Tarjetas de indicadores
    tarjetas = [
        ("Total actividades", str(total)),
        ("Completadas",       str(completadas)),
        ("% Cumplimiento",    f"{pct}%"),
        ("Avance promedio",   f"{avance_prom}%"),
    ]
    tx, card_w, card_h = 40, 118, 45
    for label, valor in tarjetas:
        page.draw_rect(fitz.Rect(tx, y, tx + card_w, y + card_h),
                       color=AZUL_HEADER, fill=AZUL_HEADER, radius=3)
        page.insert_text((tx + 8, y + 16), valor,
                         fontsize=16, color=BLANCO, fontname="helv")
        page.insert_text((tx + 8, y + 34), label,
                         fontsize=7,  color=BLANCO, fontname="helv")
        tx += card_w + 10
    y += card_h + 16

    # Barra de progreso
    bar_x, bar_y, bar_w, bar_h = 40, y, 525, 14
    page.draw_rect(fitz.Rect(bar_x, bar_y, bar_x + bar_w, bar_y + bar_h),
                   color=GRIS_FILA, fill=GRIS_FILA, radius=4)
    fill_w = bar_w * (pct / 100)
    if fill_w > 0:
        page.draw_rect(fitz.Rect(bar_x, bar_y, bar_x + fill_w, bar_y + bar_h),
                       color=VERDE, fill=VERDE, radius=4)
    page.insert_text((bar_x + bar_w + 6, bar_y + 11),
                     f"{pct}%", fontsize=8, color=NEGRO, fontname="helv")
    y += bar_h + 6

    # Estados en texto
    estados_txt = "  |  ".join(
        f"{k.replace('_',' ').capitalize()}: {v}" for k, v in por_estado.items()
    )
    page.insert_text((40, y + 10), estados_txt, fontsize=8,
                     color=GRIS_FILA[0:3] if False else (0.4, 0.4, 0.4), fontname="helv")
    y += 24

    # ── tabla de actividades ──────────────────────────────────────────────────
    page.draw_rect(fitz.Rect(30, y, 565, y + 1), color=AZUL_HEADER, fill=AZUL_HEADER)
    y += 10
    page.insert_text((40, y + 12), "DETALLE DE ACTIVIDADES",
                     fontsize=10, color=AZUL_HEADER, fontname="helv")
    y += 24

    # Cabecera tabla
    cols = [("#", 30, 30), ("Actividad", 60, 210), ("Responsable", 275, 120),
            ("Estado", 400, 80), ("Avance", 485, 50)]

    page.draw_rect(fitz.Rect(30, y, 565, y + 18),
                   color=AZUL_HEADER, fill=AZUL_HEADER)
    for label, cx, _ in cols:
        page.insert_text((30 + cx, y + 13), label,
                         fontsize=8, color=BLANCO, fontname="helv")
    y += 20

    # Filas
    for i, act in enumerate(actividades, start=1):
        # Nueva página si no hay espacio
        if y > 780:
            page = doc.new_page(width=595, height=842)
            y = 40

        fondo = GRIS_FILA if i % 2 == 0 else BLANCO
        page.draw_rect(fitz.Rect(30, y, 565, y + 16),
                       color=fondo, fill=fondo)

        nombre_corto = act.nombre[:45] + "…" if len(act.nombre) > 45 else act.nombre
        resp_corto   = (act.responsable or "—")[:22]
        estado_txt   = act.estado.value.replace("_", " ").capitalize()

        page.insert_text((30 + 30,  y + 12), str(i),
                         fontsize=7, color=NEGRO, fontname="helv")
        page.insert_text((30 + 60,  y + 12), nombre_corto,
                         fontsize=7, color=NEGRO, fontname="helv")
        page.insert_text((30 + 275, y + 12), resp_corto,
                         fontsize=7, color=NEGRO, fontname="helv")
        page.insert_text((30 + 400, y + 12), estado_txt,
                         fontsize=7, color=_color_estado(act.estado.value), fontname="helv")
        page.insert_text((30 + 485, y + 12), f"{act.avance}%",
                         fontsize=7, color=NEGRO, fontname="helv")
        y += 16

    # ── pie de página ─────────────────────────────────────────────────────────
    for pnum in range(doc.page_count):
        pg = doc[pnum]
        pg.insert_text(
            (40, 828),
            f"Sistema de Seguimiento PTI  —  Página {pnum + 1} de {doc.page_count}",
            fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv"
        )

    # ── serializar a bytes ────────────────────────────────────────────────────
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()
