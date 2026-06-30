import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import * as authApi from '../api/auth'
import finesiLogo from '../assets/finesi_logo.png'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }               = useAuth()
  const navigate                = useNavigate()
  const { theme, toggleTheme }  = useTheme()
  const [coverError, setCoverError] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingrese su correo y contraseña.')
      return
    }

    setLoading(true)
    try {
      const { data: tokenData } = await authApi.login(email, password)
      const { data: userData }  = await authApi.getMe(tokenData.access_token)
      login(tokenData.access_token, userData)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        const msg = detail.map(d => {
          const field = d.loc ? d.loc[d.loc.length - 1] : ''
          return `${field}: ${d.msg}`
        }).join(', ')
        setError(msg || 'Error de validación en los datos.')
      } else {
        setError('Error de conexión. Verifique sus credenciales.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split-page">
      {/* Lado Izquierdo: Portada de la Facultad */}
      <div 
        className="login-split__left"
        style={{
          backgroundImage: coverError ? 'none' : 'url("/finesi_facultad.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Elemento oculto para verificar si falla la carga del cover */}
        <img 
          src="/finesi_facultad.jpg" 
          alt="facultad cover test" 
          style={{ display: 'none' }} 
          onError={() => setCoverError(true)}
        />
        
        <div className="login-split__cover-overlay" />
        <div className="login-split__left-decor">
          <div className="decor-orb decor-orb-1" />
          <div className="decor-orb decor-orb-2" />
        </div>
        
        <div className="login-split__cover-content">
          <span className="cover-tag">Facultad de Ingeniería Estadística e Informática</span>
          <h1 className="cover-title">FINESI</h1>
          <p className="cover-desc">
            Monitoreo y evaluación en tiempo real de actividades y cumplimiento del Plan de Trabajo Institucional.
          </p>
          <div className="cover-footer">
            <span>UNAP · Puno</span>
            <span className="bullet">•</span>
            <span>Gestión Académica</span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Login */}
      <div className="login-split__right">
        {/* Toggle de Tema en la esquina superior derecha */}
        <button
          onClick={toggleTheme}
          className="login-theme-toggle"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <i className={theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'} />
        </button>

        <div className="login-form-container">
          <div className="login-card__header" style={{ textAlign: 'center' }}>
            <img 
              src={finesiLogo} 
              alt="FINESI Logo" 
              className="login-logo-img"
            />
            <h1 className="login-card__title">Sistema PTI</h1>
            <p className="login-card__subtitle">Monitoreo del Plan de Trabajo Institucional</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo electrónico</label>
              <div className="input-wrapper">
                <span className="input-wrapper__icon">✉</span>
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@finesi.unap.edu.pe"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <span className="input-wrapper__icon">🔑</span>
                <input
                  id="password"
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Iniciando sesión…
                </span>
              ) : (
                'Iniciar Sesión →'
              )}
            </button>
          </form>

          <p className="login-footer-text">
            Facultad de Ingeniería Estadística e Informática © 2026
          </p>
        </div>
      </div>
    </div>
  )
}
