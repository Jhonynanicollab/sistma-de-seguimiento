from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.direccion import Direccion
from app.models.plan_trabajo import PlanTrabajo
from app.models.actividad import Actividad, EstadoActividad


def resumen_global(db: Session) -> dict:
    """Indicadores generales de todo el sistema."""
    total_direcciones = db.query(func.count(Direccion.id)).scalar()
    total_planes      = db.query(func.count(PlanTrabajo.id)).scalar()
    total_actividades = db.query(func.count(Actividad.id)).scalar()

    # Conteo por estado
    estados = db.query(
        Actividad.estado,
        func.count(Actividad.id)
    ).group_by(Actividad.estado).all()
    por_estado = {e.value: 0 for e in EstadoActividad}
    for estado, conteo in estados:
        por_estado[estado.value] = conteo

    completadas = por_estado.get("completada", 0)
    pct_cumplimiento = round((completadas / total_actividades * 100), 1) if total_actividades else 0

    # Avance promedio global
    avance_promedio = db.query(func.avg(Actividad.avance)).scalar()
    avance_promedio = round(float(avance_promedio), 1) if avance_promedio else 0.0

    return {
        "total_direcciones":  total_direcciones,
        "total_planes":       total_planes,
        "total_actividades":  total_actividades,
        "por_estado":         por_estado,
        "pct_cumplimiento":   pct_cumplimiento,
        "avance_promedio":    avance_promedio,
    }


def resumen_por_direccion(db: Session) -> list:
    """Indicadores agrupados por dirección."""
    direcciones = db.query(Direccion).all()
    resultado = []

    for dir_ in direcciones:
        planes = db.query(PlanTrabajo).filter(PlanTrabajo.direccion_id == dir_.id).all()
        plan_ids = [p.id for p in planes]

        total_act = 0
        completadas = 0
        avance_sum = 0

        if plan_ids:
            total_act = db.query(func.count(Actividad.id))\
                          .filter(Actividad.plan_id.in_(plan_ids)).scalar() or 0
            completadas = db.query(func.count(Actividad.id))\
                            .filter(Actividad.plan_id.in_(plan_ids),
                                    Actividad.estado == EstadoActividad.completada).scalar() or 0
            avg = db.query(func.avg(Actividad.avance))\
                    .filter(Actividad.plan_id.in_(plan_ids)).scalar()
            avance_sum = round(float(avg), 1) if avg else 0.0

        pct = round((completadas / total_act * 100), 1) if total_act else 0

        resultado.append({
            "direccion_id":    dir_.id,
            "direccion":       dir_.nombre,
            "total_planes":    len(planes),
            "total_actividades": total_act,
            "completadas":     completadas,
            "pct_cumplimiento": pct,
            "avance_promedio": avance_sum,
        })

    return resultado


def resumen_por_plan(plan_id: int, db: Session) -> dict:
    """Indicadores detallados de un plan específico."""
    plan = db.query(PlanTrabajo).filter(PlanTrabajo.id == plan_id).first()
    if not plan:
        return {}

    actividades = db.query(Actividad).filter(Actividad.plan_id == plan_id).all()
    total = len(actividades)

    por_estado = {e.value: 0 for e in EstadoActividad}
    avance_total = 0
    for act in actividades:
        por_estado[act.estado.value] += 1
        avance_total += act.avance

    completadas = por_estado.get("completada", 0)
    pct = round((completadas / total * 100), 1) if total else 0
    avance_prom = round(avance_total / total, 1) if total else 0

    return {
        "plan_id":           plan.id,
        "plan_nombre":       plan.nombre,
        "anio":              plan.anio,
        "total_actividades": total,
        "por_estado":        por_estado,
        "pct_cumplimiento":  pct,
        "avance_promedio":   avance_prom,
    }
