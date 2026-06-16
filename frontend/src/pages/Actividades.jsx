import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as actApi from '../api/actividades'
import BadgeEstado from '../components/BadgeEstado'

const ESTADOS = [
  { value: '',            label: 'Todos los estados' },
  { value: 'pendiente',   label: 'Pendiente' },
  { value: 'en_proceso',  label: 'En proceso' },
  { value: 'completada',  label: 'Completada' },
  { value: 'cancelada',   label: 'Cancelada' },
]

export default function Actividades() {
  const [actividades, setActividades] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [estado,      setEstado]      = useState('')
  const [busqueda,    setBusqueda]    = useState('')

  useEffect(() => {
    setLoading(true)
    const params = estado ? { estado } : {}
    actApi.listar(params)
      .then(r => setActividades(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [estado])

  const filtered = actividades.filter(a =>
    !busqueda ||
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.responsable ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.direccion_nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.plan_nombre ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Actividades</h1>
        <p>Todas las actividades registradas en los planes de trabajo</p>
      </div>

      {/* ── Filtros ───────────────────────────────────── */}
      <div className="filter-bar">
        <input
          id="busqueda-actividad"
          className="form-input"
          placeholder="🔍 Buscar por nombre, responsable, oficina o plan…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ minWidth: 320 }}
        />
        <select
          id="filtro-estado-act"
          className="form-select"
          value={estado}
          onChange={e => setEstado(e.target.value)}
        >
          {ESTADOS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="filter-bar__spacer" />
        <span className="text-dim" style={{ fontSize: 12 }}>
          {filtered.length} actividad{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* ── Tabla ─────────────────────────────────────── */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /> Cargando actividades…</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Oficina / Plan</th>
                <th>Responsable</th>
                <th>Cronograma</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state__icon">📋</div>
                    <div className="empty-state__title">Sin actividades</div>
                    <div className="empty-state__desc">
                      {busqueda
                        ? `No se encontraron resultados para "${busqueda}"`
                        : 'No hay actividades con el filtro seleccionado'}
                    </div>
                  </div>
                </td></tr>
              ) : filtered.map(act => (
                <tr key={act.id}>
                  <td style={{ maxWidth: 350 }}>
                    <Link to={`/actividades/${act.id}`} className="table-link" style={{ fontWeight: 600 }}>
                      {act.nombre.length > 90 ? act.nombre.slice(0, 90) + '…' : act.nombre}
                    </Link>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      🏛️ {act.direccion_nombre || '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      📄 {act.plan_nombre || '—'}
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: '13px', minWidth: 140 }}>
                    👤 {act.responsable || '—'}
                  </td>
                  <td style={{ minWidth: 110 }}>
                    {act.fecha_inicio ? (
                      <div style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        📅 {act.fecha_inicio.slice(0, 10)}
                      </div>
                    ) : '—'}
                    {act.fecha_fin && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        🏁 {act.fecha_fin.slice(0, 10)}
                      </div>
                    )}
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
      )}
    </div>
  )
}
