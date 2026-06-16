import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Match by prefix for nested routes (e.g. /planes/5)
  const key = Object.keys(PAGE_MAP).find(k => pathname === k || pathname.startsWith(k + '/'))
  const page = PAGE_MAP[key] ?? { title: 'Sistema PTI', subtitle: '' }

  return (
    <header className="navbar">
      <div>
        <div className="navbar__title">{page.title}</div>
        {page.subtitle && <div className="navbar__subtitle">{page.subtitle}</div>}
      </div>
      <div className="navbar__right">
        {user?.rol && (
          <span className={`badge ${ROLE_BADGE[user.rol] ?? 'badge-pendiente'}`} style={{ textTransform: 'none' }}>
            🛡️ {ROLE_LABELS[user.rol] || user.rol}
          </span>
        )}
      </div>
    </header>
  )
}
