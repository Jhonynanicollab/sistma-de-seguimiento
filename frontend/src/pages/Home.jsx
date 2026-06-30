import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import finesiLogo from '../assets/finesi_logo.png'

export default function Home() {
  const { token } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <div className="landing">
      {/* ── HEADER DE NAVEGACIÓN ── */}
      <header className="landing__header">
        <div className="landing__logo-container">
          <img src={finesiLogo} alt="FINESI Logo" className="landing__logo-img" />
          <div className="landing__logo-text">
            <h1>FINESI</h1>
            <span>UNAP · PUNO</span>
          </div>
        </div>

        <nav className="landing__nav">
          <a href="#caracteristicas" className="landing__nav-link">Características</a>
          <a href="#estadisticas" className="landing__nav-link">Estadísticas</a>
          <a href="#nosotros" className="landing__nav-link">Acerca de</a>
        </nav>

        <div className="landing__actions">
          {/* Botón de cambio de tema */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              marginRight: '12px',
              transition: 'background 0.3s'
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              <span>Ir al Dashboard</span>
              <span style={{ marginLeft: '6px' }}>➔</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <span>Acceso al Sistema</span>
              <span style={{ marginLeft: '6px' }}>➔</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="landing__hero">
        <div className="landing__hero-content">
          <span className="landing__badge">
            <span className="pulse-dot"></span>
            Plataforma de Acreditación y Gestión de Calidad
          </span>
          <h2 className="landing__hero-title">
            Monitoreo y Seguimiento del <span className="text-gradient">Plan de Trabajo Institucional</span>
          </h2>
          <p className="landing__hero-desc">
            Optimiza, gestiona y visualiza en tiempo real el avance de actividades de las direcciones, oficinas administrativas y comisiones académicas de la Facultad de Ingeniería Estadística e Informática de la Universidad Nacional del Altiplano.
          </p>

          <div className="landing__hero-buttons">
            {token ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg">
                <span>Ingresar al Panel General</span>
                <i className="ti ti-arrow-right" style={{ marginLeft: '8px' }}></i>
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">
                  <span>Iniciar Sesión</span>
                  <i className="ti ti-login" style={{ marginLeft: '8px' }}></i>
                </button>
                <a href="#caracteristicas" className="btn btn-outline btn-lg">
                  <span>Saber Más</span>
                </a>
              </>
            )}
          </div>
        </div>

        <div className="landing__hero-visual">
          {!imgError ? (
            <img 
              src="/finesi_facultad.jpg" 
              alt="Facultad de Ingeniería Estadística e Informática" 
              className="landing__hero-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="landing__fallback-visual">
              <div className="fallback-gradient-sphere"></div>
              <div className="fallback-card">
                <div className="fallback-card-header">
                  <div className="fallback-dot bg-red"></div>
                  <div className="fallback-dot bg-amber"></div>
                  <div className="fallback-dot bg-emerald"></div>
                  <span className="fallback-title">finesi_monitoreo_dashboard.exe</span>
                </div>
                <div className="fallback-card-body">
                  <div className="fallback-line font-bold">FINESI - UNA Puno</div>
                  <div className="fallback-line code-comment">// Sistema de Gestión de Planes de Trabajo</div>
                  <div className="fallback-line">
                    <span className="text-cyan">const</span> units = <span className="text-orange">19</span>;
                  </div>
                  <div className="fallback-line">
                    <span className="text-cyan">const</span> status = <span className="text-green">"Acreditación en curso"</span>;
                  </div>
                  <div className="fallback-progress-bar">
                    <div className="fallback-progress-fill" style={{ width: '78%' }}></div>
                  </div>
                  <div className="fallback-stats">
                    <span>Avance General: 78%</span>
                    <span>2026</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN DE ESTADÍSTICAS RÁPIDAS ── */}
      <section id="estadisticas" className="landing__stats">
        <div className="landing__stats-grid">
          <div className="landing__stat-card">
            <h3>19</h3>
            <p>Unidades Organizacionales</p>
            <span>Direcciones, Oficinas y Comisiones</span>
          </div>
          <div className="landing__stat-card">
            <h3>100%</h3>
            <p>Monitoreo Digital</p>
            <span>Eliminación de papeles y carpetas físicas</span>
          </div>
          <div className="landing__stat-card">
            <h3>OCR</h3>
            <p>Lectura Inteligente</p>
            <span>Extracción de actividades desde planes en PDF</span>
          </div>
          <div className="landing__stat-card">
            <h3>Realtime</h3>
            <p>Semáforo de Avance</p>
            <span>Estados automáticos y gráficos dinámicos</span>
          </div>
        </div>
      </section>

      {/* ── CARACTERÍSTICAS PRINCIPALES ── */}
      <section id="caracteristicas" className="landing__features">
        <div className="landing__section-header">
          <span className="landing__section-badge">Módulos del Sistema</span>
          <h2 className="landing__section-title">Diseñado para la Excelencia Académica</h2>
          <p className="landing__section-subtitle">
            Herramientas integradas creadas a medida para satisfacer las exigencias de autoevaluación, acreditación institucional y mejora continua de la facultad.
          </p>
        </div>

        <div className="landing__features-grid">
          <div className="landing__feature-card">
            <div className="feature-icon-wrapper color-blue">
              <i className="ti ti-file-text"></i>
            </div>
            <h4>Estructuración de Planes</h4>
            <p>
              Carga y registro simplificado de Planes de Trabajo Institucionales, asignándolos a directores, oficinas o comisiones correspondientes de forma centralizada.
            </p>
          </div>

          <div className="landing__feature-card">
            <div className="feature-icon-wrapper color-violet">
              <i className="ti ti-scan"></i>
            </div>
            <h4>Procesamiento OCR</h4>
            <p>
              Tecnología de reconocimiento óptico de caracteres que escanea los archivos PDF cargados, identificando, numerando y extrayendo de forma autónoma el listado de actividades de trabajo.
            </p>
          </div>

          <div className="landing__feature-card">
            <div className="feature-icon-wrapper color-emerald">
              <i className="ti ti-certificate"></i>
            </div>
            <h4>Carga de Evidencias</h4>
            <p>
              Permite a los encargados adjuntar informes, actas, fotos y constancias digitales en formato PDF como sustento directo de cada actividad realizada, simplificando las auditorías.
            </p>
          </div>

          <div className="landing__feature-card">
            <div className="feature-icon-wrapper color-amber">
              <i className="ti ti-chart-pie"></i>
            </div>
            <h4>Estadísticas y Reportes</h4>
            <p>
              Gráficos de barras y circulares interactivos que desglosan el porcentaje de cumplimiento por oficina, permitiendo identificar retrasos mediante alertas y semáforos visuales.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN NOSOTROS / CONTEXTO ── */}
      <section id="nosotros" className="landing__about">
        <div className="landing__about-card">
          <div className="landing__about-info">
            <h3>Facultad de Ingeniería Estadística e Informática</h3>
            <p>
              La escuela profesional de estadisitica e Informática FINESI de la Universidad Nacional del Altiplano - Puno se caracteriza por su constante búsqueda de la calidad educativa y la excelencia académica. 
            </p>
            <p>
              Este sistema nace bajo la iniciativa de la  Oficina de Acreditación y Calidad  con el fin de simplificar el seguimiento de los planes operativos anuales de las diversas áreas, ayudando a sustentar los estándares necesarios ante los comités de acreditación nacional e internacional (SINEACE / ICACIT).
            </p>
            <div className="landing__about-meta">
              <div className="meta-item">
                <strong>Ubicación:</strong>
                <span>Ciudad Universitaria, UNA Puno</span>
              </div>
              <div className="meta-item">
                <strong>Contacto:</strong>
                <span>acreditacion@finesi.unap.edu.pe</span>
              </div>
            </div>
          </div>
          <div className="landing__about-visual">
            <div className="finesi-badge-glow">
              <img src={finesiLogo} alt="FINESI Logo Grande" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="landing__footer">
        <div className="landing__footer-top">
          <div>
            <h3>Sistema de Monitoreo de Planes de Trabajo</h3>
            <p>Facultad de Ingeniería Estadística e Informática · UNA Puno</p>
          </div>
          <div className="landing__footer-links">
            <a href="https://unap.edu.pe" target="_blank" rel="noopener noreferrer">Mesa de Partes UNA</a>
            <span className="dot-separator">·</span>
            <a href="mailto:acreditacion@finesi.unap.edu.pe">Soporte Técnico</a>
          </div>
        </div>
        <div className="landing__footer-bottom">
          <p>&copy; {new Date().getFullYear()} FINESI. Todos los derechos reservados.</p>
          <p>Desarrollado para las Prácticas Pre Profesionales de Acreditación y Calidad Educativa.</p>
        </div>
      </footer>
    </div>
  )
}
