import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const PAGE_MAP = {
  '/dashboard':   { title: 'Dashboard',           subtitle: 'Resumen general del sistema' },
  '/planes':      { title: 'Planes de Trabajo',   subtitle: 'Gestión de planes institucionales' },
  '/actividades': { title: 'Actividades',          subtitle: 'Seguimiento de actividades' },
  '/direcciones': { title: 'Direcciones',          subtitle: 'Oficinas y comisiones de la FINESI' },
}

const ROLE_BADGE = {
  admin:        'badge-admin',
  editor:       'badge-editor',
  lector:       'badge-lector',
  acreditacion: 'badge-acreditacion',
  responsable:  'badge-responsable',
}

const ROLE_LABELS = {
  admin:        'Administrador',
  editor:       'Editor / Acreditación',
  lector:       'Lector / Consulta',
}

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Match by prefix for nested routes (e.g. /planes/5)
  const key = Object.keys(PAGE_MAP).find(k => pathname === k || pathname.startsWith(k + '/'))
  const page = PAGE_MAP[key] ?? { title: 'Sistema PTI', subtitle: '' }

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          className="navbar__menu-btn"
          title="Abrir menú"
        >
          <i className="ti ti-menu-2" />
        </button>
        <div>
          <div className="navbar__title">{page.title}</div>
          {page.subtitle && <div className="navbar__subtitle">{page.subtitle}</div>}
        </div>
      </div>
      <div className="navbar__right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleTheme}
          className="btn-theme-toggle"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all var(--t)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          }}
        >
          <i className={theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'} />
        </button>

        {user?.rol && (
          <span className={`badge ${ROLE_BADGE[user.rol] ?? 'badge-pendiente'}`} style={{ textTransform: 'none' }}>
            🛡️ {ROLE_LABELS[user.rol] || user.rol}
          </span>
        )}
      </div>
    </header>
  )
}
