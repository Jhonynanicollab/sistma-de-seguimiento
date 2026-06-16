import { useState, useEffect } from 'react'
import * as dirsApi from '../api/direcciones'
import Modal        from '../components/Modal'
import { useAuth }  from '../context/AuthContext'

export default function Direcciones() {
  const { user }              = useAuth()
  const [dirs,     setDirs]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDir, setEditingDir] = useState(null) // null para creación, objeto para edición
  const [form,     setForm]   = useState({ nombre: '', descripcion: '' })
  const [saving,   setSaving] = useState(false)
  const [saveErr,  setSaveErr] = useState('')

  const isAdmin = user?.rol === 'admin'

  const fetchDirs = () => {
    setLoading(true)
    dirsApi.listar()
      .then(r => setDirs(r.data))
      .catch(err => console.error("Error al cargar direcciones:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDirs()
  }, [])

  const handleOpenCreate = () => {
    setEditingDir(null)
    setForm({ nombre: '', descripcion: '' })
    setSaveErr('')
    setShowModal(true)
  }

  const handleOpenEdit = (dir) => {
    setEditingDir(dir)
    setForm({ nombre: dir.nombre, descripcion: dir.descripcion || '' })
    setSaveErr('')
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaveErr('')
    setSaving(true)
    try {
      if (editingDir) {
        // Actualizar existente
        const { data } = await dirsApi.actualizar(editingDir.id, {
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
        })
        setDirs(prev => prev.map(d => d.id === editingDir.id ? data : d))
      } else {
        // Crear nuevo
        const { data } = await dirsApi.crear({
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
        })
        setDirs(prev => [...prev, data])
      }
      setShowModal(false)
      setForm({ nombre: '', descripcion: '' })
    } catch (err) {
      setSaveErr(err.response?.data?.detail || 'Error al guardar dirección')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta dirección? Se borrará permanentemente.')) {
      return
    }
    try {
      await dirsApi.eliminar(id)
      setDirs(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar la dirección')
    }
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Direcciones y Oficinas</h1>
        <p>Estructura organizacional de la Facultad de Ingeniería Estadística e Informática</p>
        <div className="page-header__actions">
          <span className="text-dim" style={{ fontSize: 12 }}>
            {dirs.length} unidades registradas
          </span>
          {isAdmin && (
            <button id="btn-nueva-dir" className="btn btn-primary" onClick={handleOpenCreate}>
              + Nueva Dirección
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /> Cargando…</div>
      ) : dirs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🏛️</div>
          <div className="empty-state__title">Sin direcciones</div>
          <div className="empty-state__desc">No hay direcciones registradas en el sistema</div>
        </div>
      ) : (
        <div className="section">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  {isAdmin && <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {dirs.map(d => (
                  <tr key={d.id}>
                    <td><span className="badge badge-automatico">#{d.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{d.nombre}</td>
                    <td className="text-muted">{d.descripcion || '—'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(d)}
                            title="Editar dirección"
                            style={{ padding: '4px 8px' }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => handleDelete(d.id)}
                            title="Eliminar dirección"
                            style={{ padding: '4px 8px', backgroundColor: 'var(--danger)', color: 'white' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal crear/editar dirección ─────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSaveErr('') }}
        title={editingDir ? "Editar Dirección / Oficina" : "Nueva Dirección / Oficina"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving || !form.nombre.trim()}
            >
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : (editingDir ? 'Guardar Cambios' : 'Crear')}
            </button>
          </>
        }
      >
        {saveErr && <div className="login-error" style={{ marginBottom: 12 }}>⚠️ {saveErr}</div>}
        <div className="form-group">
          <label className="form-label">Nombre de la Unidad *</label>
          <input
            className="form-input"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Oficina de Acreditación y Calidad Académica"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-textarea"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción breve de la oficina o comisión (opcional)"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  )
}

