import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as planesApi from '../api/planes'
import * as dirsApi   from '../api/direcciones'
import BadgeEstado from '../components/BadgeEstado'
import Modal       from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const YEARS = [2024, 2025, 2026, 2027]

export default function Planes() {
  const { user }          = useAuth()
  const [planes,  setPlanes]  = useState([])
  const [dirs,    setDirs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ anio: '', direccion_id: '' })
  const [showModal, setShowModal] = useState(false)
  const [form,    setForm]    = useState({ direccion_id: '', anio: 2026, semestre: 1, titulo: '' })
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const canEdit = user?.rol === 'admin' || user?.rol === 'editor'

  const load = () => {
    Promise.all([planesApi.listar({}), dirsApi.listar()])
      .then(([p, d]) => { setPlanes(p.data); setDirs(d.data) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = planes.filter(p => {
    if (filters.anio && p.anio !== +filters.anio) return false
    if (filters.direccion_id && p.direccion_id !== +filters.direccion_id) return false
    return true
  })

  const handleCreate = async e => {
    e.preventDefault()
    setSaveErr('')
    setSaving(true)
    try {
      const { data } = await planesApi.crear({
        direccion_id: +form.direccion_id,
        anio:         +form.anio,
        nombre:       form.titulo || `Plan de Trabajo ${form.anio}`,
      })
      setPlanes(prev => [data, ...prev])
      setShowModal(false)
      setForm({ direccion_id: '', anio: 2026, semestre: 1, titulo: '' })
    } catch (err) {
      const detail = err.response?.data?.detail
      setSaveErr(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ') : 'Error al crear plan'))
    } finally {
      setSaving(false)
    }
  }

  const getDirNombre = id => dirs.find(d => d.id === id)?.nombre ?? '—'

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Planes de Trabajo</h1>
        <p>Registro y seguimiento de planes por dirección y período académico</p>
        <div className="page-header__actions">
          <select
            id="filtro-anio"
            className="form-select"
            value={filters.anio}
            onChange={e => setFilters(f => ({ ...f, anio: e.target.value }))}
          >
            <option value="">Todos los años</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            id="filtro-direccion"
            className="form-select"
            value={filters.direccion_id}
            onChange={e => setFilters(f => ({ ...f, direccion_id: e.target.value }))}
          >
            <option value="">Todas las direcciones</option>
            {dirs.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <span className="text-dim" style={{ fontSize: 12 }}>
            {filtered.length} plan{filtered.length !== 1 ? 'es' : ''}
          </span>
          {canEdit && (
            <button id="btn-nuevo-plan" className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Nuevo Plan
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /> Cargando planes…</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Dirección</th>
                <th>Año</th>
                <th>Semestre</th>
                <th>Estado PDF</th>
                <th>Tipo PDF</th>
                <th>Fecha carga</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state__icon">📄</div>
                    <div className="empty-state__title">Sin planes</div>
                    <div className="empty-state__desc">
                      {canEdit ? 'Crea el primer plan con el botón "+ Nuevo Plan"' : 'No hay planes disponibles'}
                    </div>
                  </div>
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/planes/${p.id}`} className="table-link">
                      {p.nombre || `Plan #${p.id}`}
                    </Link>
                  </td>
                  <td className="text-muted" style={{ fontSize: 13 }}>
                    {getDirNombre(p.direccion_id)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.anio}</td>
                  <td>
                    <span className="badge badge-automatico">Semestre {p.semestre}</span>
                  </td>
                  <td><BadgeEstado estado={p.estado_carga} /></td>
                  <td>
                    {p.tipo_pdf
                      ? <BadgeEstado estado={p.tipo_pdf} />
                      : <span className="text-dim">—</span>
                    }
                  </td>
                  <td className="text-muted" style={{ fontSize: 12 }}>
                    {p.fecha_carga ? new Date(p.fecha_carga).toLocaleDateString('es-PE') : '—'}
                  </td>
                  <td>
                    <Link to={`/planes/${p.id}`} className="btn btn-ghost btn-sm">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo plan */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSaveErr('') }}
        title="Nuevo Plan de Trabajo"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={saving || !form.direccion_id}
            >
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creando…</> : 'Crear Plan'}
            </button>
          </>
        }
      >
        {saveErr && <div className="login-error" style={{ marginBottom: 16 }}>⚠️ {saveErr}</div>}
        <div className="form-group">
          <label className="form-label">Dirección *</label>
          <select
            className="form-select"
            value={form.direccion_id}
            onChange={e => setForm(f => ({ ...f, direccion_id: e.target.value }))}
            required
          >
            <option value="">Selecciona una dirección</option>
            {dirs.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Año *</label>
            <select className="form-select" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Semestre *</label>
            <select className="form-select" value={form.semestre} onChange={e => setForm(f => ({ ...f, semestre: e.target.value }))}>
              <option value={1}>Semestre I</option>
              <option value={2}>Semestre II</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Título (opcional)</label>
          <input
            className="form-input"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Ej: Plan de Trabajo 2026-I"
          />
        </div>
      </Modal>
    </div>
  )
}
