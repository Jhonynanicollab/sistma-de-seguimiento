import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import PrivateRoute        from './components/PrivateRoute'
import Layout              from './components/Layout'
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
      <BrowserRouter>
        <Routes>
          {/* Página pública */}
          <Route path="/login" element={<Login />} />

          {/* Páginas privadas con layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"         element={<Dashboard />} />
            <Route path="planes"            element={<Planes />} />
            <Route path="planes/:id"        element={<PlanDetalle />} />
            <Route path="actividades"       element={<Actividades />} />
            <Route path="actividades/:id"   element={<ActividadDetalle />} />
            <Route path="direcciones"       element={<Direcciones />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
