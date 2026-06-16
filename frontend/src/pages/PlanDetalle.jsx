import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as planesApi from '../api/planes'
import * as actApi    from '../api/actividades'
import * as dashApi   from '../api/dashboard'
import BadgeEstado from '../components/BadgeEstado'
import ProgressBar from '../components/ProgressBar'
import Modal       from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function PlanDetalle() {
  const { id }            = useParams()
  const { user }          = useAuth()
  const [plan,      setPlan]      = useState(null)
  const [acts,      setActs]      = useState([])
  const [indicadores, setInd]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showNewAct, setShowNewAct] = useState(false)
  const [newAct,    setNewAct]    = useState({ nombre: '', responsable: '', fecha_inicio: '', fecha_fin: '' })
  const [savingAct, setSavingAct] = useState(false)
  const [actErr,    setActErr]    = useState('')
  const fileRef = useRef()

  const canEdit = user?.rol === 'admin' || user?.rol === 'editor'

  const loadAll = () =>
    Promise.all([
      planesApi.obtener(id),
      planesApi.actividades(id),
      dashApi.getPorPlan(id).catch(() => ({ data: null })),
    ]).then(([p, a, ind]) => {
      setPlan(p.data)
      setActs(a.data)
      setInd(ind.data)
    }).catch(console.error).finally(() => setLoading(false))

  useEffect(() => { loadAll() }, [id])

  const handleUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await planesApi.subirPdf(id, file)
      setPlan(data)
      const { data: a } = await planesApi.actividades(id)
      setActs(a)
    } catch (err) {
      const detail = err.response?.data?.detail
      alert(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ') : 'Error al subir PDF'))
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const handleCreateAct = async e => {
    e.preventDefault()
    setActErr('')
    setSavingAct(true)
    try {
      const { data } = await actApi.crear({
        plan_id:      +id,
        nombre:        newAct.nombre,
        responsable:   newAct.responsable || undefined,
        fecha_inicio:  newAct.fecha_inicio || undefined,
        fecha_fin:     newAct.fecha_fin    || undefined,
        origen:       'manual',
      })
      setActs(prev => [...prev, data])
      setShowNewAct(false)
      setNewAct({ nombre: '', responsable: '', fecha_inicio: '', fecha_fin: '' })
    } catch (err) {
      const detail = err.response?.data?.detail
      setActErr(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ') : 'Error al crear actividad'))
    } finally {
      setSavingAct(false)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /> Cargando plan…</div>
  if (!plan)   return (
    <div className="empty-state">
      <div className="empty-state__icon">⚠️</div>
      <div className="empty-state__title">Plan no encontrado</div>
      <Link to="/planes" className="btn btn-secondary" style={{ marginTop: 12 }}>← Volver a Planes</Link>
    </div>
  )

  return (
    <div className="animate-fade">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
              <Link to="/planes" className="table-link">← Planes de Trabajo</Link>
            </div>
            <h1 style={{ fontSize: 20 }}>{plan.nombre || `Plan de Trabajo #${plan.id}`}</h1>
            <p>Año {plan.anio} · Semestre {plan.semestre}</p>
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {canEdit && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                />
                <button
                  id="btn-subir-pdf"
                  className="btn btn-secondary"
                  onClick={() => fileRef.current.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Subiendo…</>
                    : '📤 Subir PDF'}
                </button>
              </>
            )}
            <a
              id="btn-reporte"
              href={`/api/reportes/plan/${id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              📥 Reporte PDF
            </a>
          </div>
        </div>
      </div>

      {/* ── Indicadores ──────────────────────────────────── */}
      <div className="grid-4 mb-6">
        <div className="card">
          <div className="detail-item__label">Estado PDF</div>
          <div style={{ marginTop: 8 }}><BadgeEstado estado={plan.estado_carga} /></div>
        </div>
        <div className="card">
          <div className="detail-item__label">Total Actividades</div>
          <div className="stat-card__value" style={{ marginTop: 6 }}>
            {indicadores?.total_actividades ?? acts.length}
          </div>
        </div>
        <div className="card">
          <div className="detail-item__label">Cumplimiento</div>
          <div className="stat-card__value text-emerald" style={{ marginTop: 6 }}>
            {indicadores?.pct_cumplimiento ?? 0}%
          </div>
        </div>
        <div className="card">
          <div className="detail-item__label">Avance promedio</div>
          <div className="stat-card__value text-violet" style={{ marginTop: 6 }}>
            {indicadores?.avance_promedio ?? 0}%
          </div>
        </div>
      </div>

      {/* ── Distribución de estados ──────────────────────── */}
      {indicadores?.por_estado && Object.keys(indicadores.por_estado).length > 0 && (
        <div className="card mb-6">
          <div className="section__title mb-4">Distribución de estados</div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(indicadores.por_estado).map(([k, v]) => (
              <div key={k}>
                <div className="detail-item__label">{k.replace('_', ' ')}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <ProgressBar value={indicadores.pct_cumplimiento} color="emerald" />
        </div>
      )}

      {/* ── Actividades ──────────────────────────────────── */}
      <div className="section">
        <div className="section__header">
          <h3 className="section__title">Actividades ({acts.length})</h3>
          {canEdit && (
            <button id="btn-nueva-actividad" className="btn btn-primary btn-sm" onClick={() => setShowNewAct(true)}>
              + Agregar manual
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Actividad</th>
                <th>Responsable</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Origen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {acts.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state__icon">📋</div>
                    <div className="empty-state__title">Sin actividades</div>
                    <div className="empty-state__desc">
                      {plan.estado_carga === 'pendiente'
                        ? '📤 Sube el PDF del plan para extraer actividades automáticamente'
                        : 'Agrega actividades manualmente con el botón "+ Agregar manual"'}
                    </div>
                  </div>
                </td></tr>
              ) : acts.map((act, i) => (
                <tr key={act.id}>
                  <td className="text-dim" style={{ fontSize: 12 }}>{act.orden ?? i + 1}</td>
                  <td style={{ maxWidth: 320 }}>
                    <Link to={`/actividades/${act.id}`} className="table-link">
                      {act.nombre}
                    </Link>
                  </td>
                  <td className="text-muted">{act.responsable || '—'}</td>
                  <td className="text-muted" style={{ fontSize: 12 }}>
                    {act.fecha_inicio?.slice(0, 10) || '—'}
                  </td>
                  <td className="text-muted" style={{ fontSize: 12 }}>
                    {act.fecha_fin?.slice(0, 10) || '—'}
                  </td>
                  <td><BadgeEstado estado={act.estado} /></td>
                  <td><BadgeEstado estado={act.origen} /></td>
                  <td>
                    <Link to={`/actividades/${act.id}`} className="btn btn-ghost btn-sm">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal nueva actividad ────────────────────────── */}
      <Modal
        open={showNewAct}
        onClose={() => { setShowNewAct(false); setActErr('') }}
        title="Agregar Actividad Manual"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowNewAct(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleCreateAct}
              disabled={savingAct || !newAct.nombre.trim()}
            >
              {savingAct ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : 'Guardar actividad'}
            </button>
          </>
        }
      >
        {actErr && <div className="login-error" style={{ marginBottom: 12 }}>⚠️ {actErr}</div>}
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input
            className="form-input"
            value={newAct.nombre}
            onChange={e => setNewAct(a => ({ ...a, nombre: e.target.value }))}
            placeholder="Descripción de la actividad"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Responsable</label>
          <input
            className="form-input"
            value={newAct.responsable}
            onChange={e => setNewAct(a => ({ ...a, responsable: e.target.value }))}
            placeholder="Nombre del responsable"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fecha inicio</label>
            <input
              className="form-input"
              type="date"
              value={newAct.fecha_inicio}
              onChange={e => setNewAct(a => ({ ...a, fecha_inicio: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha fin</label>
            <input
              className="form-input"
              type="date"
              value={newAct.fecha_fin}
              onChange={e => setNewAct(a => ({ ...a, fecha_fin: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
