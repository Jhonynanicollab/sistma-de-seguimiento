import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import finesiLogo from '../assets/finesi_logo.png'
import Modal from './Modal'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/planes',      icon: '📄', label: 'Planes de Trabajo' },
  { to: '/actividades', icon: '✅', label: 'Actividades' },
  { to: '/direcciones', icon: '🏛️', label: 'Direcciones' },
]

const ROLE_LABELS = {
  admin:        'Administrador',
  editor:       'Editor / Acreditación',
  lector:       'Lector / Consulta',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user
    ? ((user.nombre?.[0] ?? '') + (user.apellidos?.[0] ?? '')).toUpperCase() || 'U'
    : 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={finesiLogo} alt="FINESI Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          <div className="sidebar__brand-text">
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>Sistema PTI</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FINESI · UNAP · Puno</span>
          </div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-title">Menú Principal</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div
          className="sidebar__user"
          onClick={() => setIsProfileOpen(true)}
          style={{ cursor: 'pointer', transition: 'all var(--t)' }}
          title="Ver mi perfil"
        >
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info" style={{ pointerEvents: 'none' }}>
            <div className="sidebar__user-name">
              {user?.nombre} {user?.apellidos}
            </div>
            <div className="sidebar__user-role">
              {ROLE_LABELS[user?.rol] || user?.rol}
            </div>
          </div>
          <button
            className="sidebar__logout-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleLogout()
            }}
            title="Cerrar sesión"
          >
            ⏻
          </button>
        </div>
      </div>

      {/* Modal de Perfil de Usuario */}
      <Modal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Mi Perfil"
      >
        <div className="profile-modal-content" style={{ padding: '20px 10px', textAlign: 'center' }}>
          <div className="profile-modal-avatar" style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
          }}>
            {initials}
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
            {user?.nombre} {user?.apellidos || ''}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>
            {user?.email}
          </p>
          
          <div style={{ display: 'inline-block', marginBottom: '24px' }}>
            <span className={`badge badge-${user?.rol}`} style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px', textTransform: 'none' }}>
              🛡️ {ROLE_LABELS[user?.rol] || user?.rol}
            </span>
          </div>
          
          <div className="profile-permissions" style={{
            background: 'var(--background)',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'left',
            fontSize: '13px',
            border: '1px solid var(--border)',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
              Permisos de tu cuenta:
            </strong>
            {user?.rol === 'admin' && (
              <span style={{ color: 'var(--text-dim)' }}>
                Acceso completo a todas las funciones administrativas. Puedes gestionar oficinas, usuarios, cargar y modificar planes de trabajo, así como actualizar actividades y subir evidencias.
              </span>
            )}
            {user?.rol === 'editor' && (
              <span style={{ color: 'var(--text-dim)' }}>
                Acceso de editor (Acreditación). Tienes permitido crear planes de trabajo, subir PDFs de planes, registrar/editar actividades, y cargar evidencias de cumplimiento.
              </span>
            )}
            {user?.rol === 'lector' && (
              <span style={{ color: 'var(--text-dim)' }}>
                Acceso de solo lectura (Responsable/Consulta). Puedes ver el dashboard, visualizar planes de trabajo y el listado de actividades, pero no tienes permisos para crear o modificar registros.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🚪 Cerrar Sesión
            </button>
            <button
              onClick={() => setIsProfileOpen(false)}
              className="btn"
              style={{
                background: 'var(--border)',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--text)'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
