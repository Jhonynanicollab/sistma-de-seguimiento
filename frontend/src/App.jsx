import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import { ThemeProvider }   from './context/ThemeContext'
import PrivateRoute        from './components/PrivateRoute'
import Layout              from './components/Layout'
import Home                from './pages/Home'
import Login               from './pages/Login'
import Dashboard           from './pages/Dashboard'
import Planes              from './pages/Planes'
import PlanDetalle         from './pages/PlanDetalle'
import Actividades         from './pages/Actividades'
import ActividadDetalle    from './pages/ActividadDetalle'
import Direcciones         from './pages/Direcciones'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Páginas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Páginas privadas con layout */}
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="dashboard"         element={<Dashboard />} />
              <Route path="planes"            element={<Planes />} />
              <Route path="planes/:id"        element={<PlanDetalle />} />
              <Route path="actividades"       element={<Actividades />} />
              <Route path="actividades/:id"   element={<ActividadDetalle />} />
              <Route path="direcciones"       element={<Direcciones />} />
            </Route>

            {/* Fallback a inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
