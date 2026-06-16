import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'
import finesiLogo from '../assets/finesi_logo.png'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }               = useAuth()
  const navigate                = useNavigate()

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
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        <div className="login-card__header">
          <img src={finesiLogo} alt="FINESI Logo" style={{ width: '80px', height: '80px', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} />
          <h1 className="login-card__title">Sistema PTI</h1>
          <p className="login-card__subtitle">Plan de Trabajo Institucional</p>
          <p className="login-card__institution">FINESI · Universidad Nacional del Altiplano</p>
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
            style={{ marginTop: 8 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Iniciando sesión…</>
              : 'Iniciar Sesión →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-dim)' }}>
          Sistema de Seguimiento y Monitoreo · FINESI © 2026
        </p>
      </div>
    </div>
  )
}
