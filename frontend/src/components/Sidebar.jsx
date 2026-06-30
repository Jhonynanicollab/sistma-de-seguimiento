import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import finesiLogo from '../assets/finesi_logo.png'
import Modal from './Modal'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/planes',      icon: '📄', label: 'Planes de Trabajo' },
  { to: '/actividades', icon: '✅', label: 'Actividades' },
]

const CATEGORIES = [
  {
    id: 's1',
    title: 'Decanato',
    tablerIcon: 'ti ti-building',
    color: '#3b82f6',
    items: [
      { name: 'Decanato', code: 'DEC' }
    ]
  },
  {
    id: 's2',
    title: 'Dirección académica',
    tablerIcon: 'ti ti-home',
    color: '#3b82f6',
    items: [
      { name: 'Dirección de Escuela Profesional', code: 'DEP' },
      { name: 'Dirección de Investigación', code: 'DI' },
      { name: 'Dirección de Posgrado', code: 'DPG' },
      { name: 'Dirección de Proyección Social y Extensión Cultural', code: 'DPSEC' }
    ]
  },
  {
    id: 's3',
    title: 'Oficinas administrativas',
    tablerIcon: 'ti ti-settings',
    color: '#8b5cf6',
    items: [
      { name: 'Oficina de Acreditación y Calidad Educativa', code: 'OACE' },
      { name: 'Oficina de Tutoría y Orientación al Estudiante', code: 'OTOE' },
      { name: 'Oficina de Prácticas Pre-Profesionales', code: 'OPPP' },
      { name: 'Oficina de Grados y Títulos', code: 'OGT' },
      { name: 'Secretaría Académica', code: 'SA' }
    ]
  },
  {
    id: 's4',
    title: 'Comisiones permanentes',
    tablerIcon: 'ti ti-users',
    color: '#10b981',
    items: [
      { name: 'Comisión de Currículo y Plan de Estudios', code: 'COM-CURR' },
      { name: 'Comisión de Investigación y Proyectos', code: 'COM-INV' },
      { name: 'Comisión de Bienestar Universitario', code: 'COM-BU' },
      { name: 'Comisión de Autoevaluación y Acreditación', code: 'COM-ACRED' },
      { name: 'Comisión de Bolsa de Trabajo y Egresados', code: 'COM-EGR' }
    ]
  },
  {
    id: 's5',
    title: 'Comisiones especiales',
    tablerIcon: 'ti ti-calendar-event',
    color: '#f59e0b',
    items: [
      { name: 'Comisión de Admisión', code: 'COM-ADM' },
      { name: 'Comisión de Grados y Títulos', code: 'COM-GT' },
      { name: 'Comisión de Evaluación Docente', code: 'COM-EVAL' },
      { name: 'Comisión de Responsabilidad Social Universitaria', code: 'COM-RSU' }
    ]
  }
]

const ROLE_LABELS = {
  admin:        'Administrador',
  editor:       'Editor / Acreditación',
  lector:       'Lector / Consulta',
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const selectedUnitCode = searchParams.get('unit')
  const [isDirsExpanded, setIsDirsExpanded] = useState(false)
  const [openSubSections, setOpenSubSections] = useState({
    s1: false,
    s2: false,
    s3: false,
    s4: false,
    s5: false,
  })

  // Auto-expand paths if a unit is selected in URL
  useEffect(() => {
    if (selectedUnitCode) {
      setIsDirsExpanded(true)
      const cat = CATEGORIES.find(c => c.items.some(i => i.code === selectedUnitCode))
      if (cat) {
        setOpenSubSections(prev => ({ ...prev, [cat.id]: true }))
      }
    }
  }, [selectedUnitCode])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSubSection = (id) => {
    setOpenSubSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const initials = user
    ? ((user.nombre?.[0] ?? '') + (user.apellidos?.[0] ?? '')).toUpperCase() || 'U'
    : 'U'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={finesiLogo} alt="FINESI Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div className="sidebar__brand-text">
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>Sistema PTI</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FINESI · UNAP · Puno</span>
            </div>
          </div>
          <button className="sidebar__close-btn" onClick={onClose} title="Cerrar menú">
            <i className="ti ti-x" />
          </button>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-title">Menú Principal</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar__link${isActive && !selectedUnitCode ? ' active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* ── SECCIÓN COLAPSABLE DE DIRECCIONES ── */}
        <div className="sidebar__nav-group">
          <div
            className={`sidebar__link ${isDirsExpanded ? 'expanded' : ''} ${selectedUnitCode ? 'active-parent' : ''}`}
            onClick={() => setIsDirsExpanded(!isDirsExpanded)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="sidebar__link-icon">🏛️</span>
              <span>Direcciones</span>
            </div>
            <span style={{
              fontSize: '10px',
              transform: isDirsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--t)',
              color: 'var(--text-dim)'
            }}>
              ▼
            </span>
          </div>

          {isDirsExpanded && (
            <div className="sidebar__submenu animate-slide-down">
              {/* Botón de acceso a listado general */}
              <NavLink
                to="/direcciones"
                className={({ isActive }) => `sidebar-accordion-item ${isActive ? 'active' : ''}`}
                style={{ margin: '4px 12px 10px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', display: 'block' }}
                onClick={onClose}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 600 }}>
                  <span>📁</span>
                  <span>Listado y Gestión</span>
                </div>
              </NavLink>

              {/* Acordeones de Categorías */}
              <div style={{ padding: '0 8px' }}>
                {CATEGORIES.map(sec => {
                  const isSubOpen = openSubSections[sec.id]
                  return (
                    <div key={sec.id} className="sidebar-accordion-section">
                      <div
                        className={`sidebar-accordion-header ${isSubOpen ? 'open' : ''}`}
                        onClick={() => toggleSubSection(sec.id)}
                      >
                        <div className="sidebar-accordion-title">
                          <i className={`${sec.tablerIcon}`} style={{ fontSize: '13px', color: sec.color }} />
                          <span>{sec.title}</span>
                        </div>
                        <span className={`sidebar-accordion-chevron ${isSubOpen ? 'open' : ''}`}>▼</span>
                      </div>

                      {isSubOpen && (
                        <div className="sidebar-accordion-body">
                          {sec.items.map(item => {
                            const isItemActive = selectedUnitCode === item.code
                            return (
                              <div
                                key={item.code}
                                className={`sidebar-accordion-item ${isItemActive ? 'active' : ''}`}
                                onClick={() => {
                                  navigate(`/dashboard?unit=${item.code}`)
                                  onClose()
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', maxWidth: '80%' }}>
                                  <span className="item-dot" style={{ backgroundColor: sec.color }} />
                                  <span className="item-name" title={item.name}>
                                    {item.name}
                                  </span>
                                </div>
                                <span className="item-code">{item.code}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
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
