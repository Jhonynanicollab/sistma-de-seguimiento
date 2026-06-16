import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as actApi  from '../api/actividades'
import * as evidApi from '../api/evidencias'
import BadgeEstado from '../components/BadgeEstado'
import Modal       from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const ESTADOS = ['pendiente', 'en_proceso', 'completada', 'cancelada']

const ESTADO_INFO = {
  pendiente:   { label: '⏳ Pendiente',   color: 'var(--amber)',   desc: 'Sin evaluar' },
  en_proceso:  { label: '⚙️ En proceso',   color: 'var(--violet)',  desc: 'En ejecución' },
  completada:  { label: '✅ Completada',  color: 'var(--emerald)', desc: 'Ejecutada' },
  cancelada:   { label: '🚫 Cancelada',   color: 'var(--red)',     desc: 'Cancelada' },
}

export default function ActividadDetalle() {
  const { id }              = useParams()
  const { user }            = useAuth()
  const [actividad, setActividad]     = useState(null)
  const [evidencias, setEvidencias]   = useState([])
  const [loading,   setLoading]       = useState(true)
  const [cambiando, setCambiando]     = useState(false)
  const [showEvModal, setShowEvModal] = useState(false)
  const [evDesc,    setEvDesc]        = useState('')
  const [evFile,    setEvFile]        = useState(null)
  const [savingEv,  setSavingEv]      = useState(false)
  const [evErr,     setEvErr]         = useState('')
  const fileRef = useRef()

  const canEdit = user?.rol === 'admin' || user?.rol === 'editor'

  const loadEvidencias = () =>
    evidApi.listar({ actividad_id: id }).then(r => setEvidencias(r.data))

  useEffect(() => {
    Promise.all([
      actApi.obtener(id),
      evidApi.listar({ actividad_id: id }),
    ]).then(([a, e]) => {
      setActividad(a.data)
      setEvidencias(e.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleCambiarEstado = async est => {
    if (actividad.estado === est) return
    setCambiando(true)
    try {
      const { data } = await actApi.actualizar(id, { estado: est })
      setActividad(data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cambiar estado')
    } finally {
      setCambiando(false)
    }
  }

  const handleCrearEvidencia = async e => {
    e.preventDefault()
    if (!evFile) return setEvErr('Selecciona un archivo PDF')
    setEvErr('')
    setSavingEv(true)
    try {
      // 1. Crear registro de evidencia
      const { data: ev } = await evidApi.crear({
        actividad_id:  +id,
        descripcion:    evDesc || undefined,
      })
      // 2. Subir archivo
      await evidApi.subirArchivo(ev.id, evFile)
      // 3. Recargar lista
      await loadEvidencias()
      setShowEvModal(false)
      setEvDesc('')
      setEvFile(null)
    } catch (err) {
      const detail = err.response?.data?.detail
      setEvErr(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ') : 'Error al cargar evidencia'))
    } finally {
      setSavingEv(false)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /> Cargando actividad…</div>
  if (!actividad) return (
    <div className="empty-state">
      <div className="empty-state__icon">⚠️</div>
      <div className="empty-state__title">Actividad no encontrada</div>
      <Link to="/actividades" className="btn btn-secondary" style={{ marginTop: 12 }}>
        ← Volver a Actividades
      </Link>
    </div>
  )

  return (
    <div className="animate-fade">
      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header">
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
          <Link to="/actividades" className="table-link">← Actividades</Link>
        </div>
        <h1 style={{ fontSize: 17, lineHeight: 1.4 }}>{actividad.nombre}</h1>
      </div>

      <div className="grid-2 mb-6">
        {/* ── Info de actividad ──────────────────────── */}
        <div className="card">
          <h3 className="section__title mb-4">Información de la actividad</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item__label">Estado actual</div>
              <div style={{ marginTop: 8 }}><BadgeEstado estado={actividad.estado} /></div>
            </div>
            <div className="detail-item">
              <div className="detail-item__label">Avance</div>
              <div className="detail-item__value" style={{ fontWeight: 700, color: 'var(--violet)' }}>
                {actividad.avance ?? 0}%
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item__label">Responsable</div>
              <div className="detail-item__value">{actividad.responsable || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item__label">Fecha inicio</div>
              <div className="detail-item__value">{actividad.fecha_inicio?.slice(0, 10) || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item__label">Fecha fin</div>
              <div className="detail-item__value">{actividad.fecha_fin?.slice(0, 10) || '—'}</div>
            </div>
            {actividad.meta && (
              <div className="detail-item">
                <div className="detail-item__label">Meta</div>
                <div className="detail-item__value">{actividad.meta}</div>
              </div>
            )}
            {actividad.descripcion && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <div className="detail-item__label">Descripción</div>
                <div className="detail-item__value">{actividad.descripcion}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Cambiar estado ─────────────────────────── */}
        <div className="card">
          <h3 className="section__title mb-4">Cambiar Estado</h3>
          {canEdit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ESTADOS.map(est => {
                const info    = ESTADO_INFO[est]
                const activo  = actividad.estado === est
                return (
                  <button
                    key={est}
                    className={`btn ${activo ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleCambiarEstado(est)}
                    disabled={cambiando || activo}
                    style={{
                      justifyContent: 'flex-start',
                      borderColor: activo ? info.color : undefined,
                    }}
                  >
                    {info.label}
                    {activo && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                        Estado actual
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="empty-state__icon">🔒</div>
              <div className="empty-state__title">Sin permisos</div>
              <div className="empty-state__desc">Solo responsables y admins pueden cambiar el estado</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Evidencias ───────────────────────────────── */}
      <div className="section">
        <div className="section__header">
          <h3 className="section__title">Evidencias ({evidencias.length})</h3>
          {canEdit && (
            <button
              id="btn-nueva-evidencia"
              className="btn btn-primary btn-sm"
              onClick={() => setShowEvModal(true)}
            >
              + Agregar evidencia
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Descripción</th>
                <th>Fecha carga</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evidencias.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state__icon">📎</div>
                    <div className="empty-state__title">Sin evidencias</div>
                    <div className="empty-state__desc">
                      Agrega archivos PDF como respaldo del cumplimiento de esta actividad
                    </div>
                  </div>
                </td></tr>
              ) : evidencias.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      📎 {ev.archivo ? ev.archivo.split(/[/\\]/).pop() : 'Evidencia'}
                    </span>
                  </td>
                  <td className="text-muted">{ev.descripcion || '—'}</td>
                  <td className="text-muted" style={{ fontSize: 12 }}>
                    {ev.fecha_carga
                      ? new Date(ev.fecha_carga).toLocaleDateString('es-PE')
                      : '—'}
                  </td>
                  <td>
                    {ev.archivo && (
                      <a
                        href={`/api/${ev.archivo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        📥 Descargar
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal evidencia ──────────────────────────── */}
      <Modal
        open={showEvModal}
        onClose={() => { setShowEvModal(false); setEvErr(''); setEvFile(null); setEvDesc('') }}
        title="Agregar Evidencia"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEvModal(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleCrearEvidencia}
              disabled={savingEv || !evFile}
            >
              {savingEv
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Cargando…</>
                : 'Cargar evidencia'}
            </button>
          </>
        }
      >
        {evErr && <div className="login-error" style={{ marginBottom: 12 }}>⚠️ {evErr}</div>}
        <div className="form-group">
          <label className="form-label">Archivo PDF *</label>
          <div
            className={`upload-zone${evFile ? '' : ''}`}
            onClick={() => fileRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <div className="upload-zone__icon">{evFile ? '📄' : '📤'}</div>
            <div className="upload-zone__text">
              {evFile ? evFile.name : 'Haz clic para seleccionar un archivo'}
            </div>
            <div className="upload-zone__sub">Solo archivos PDF</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => setEvFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-textarea"
            value={evDesc}
            onChange={e => setEvDesc(e.target.value)}
            placeholder="Describe brevemente esta evidencia…"
          />
        </div>
      </Modal>
    </div>
  )
}
