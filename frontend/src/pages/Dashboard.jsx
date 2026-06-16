import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import StatCard    from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import * as dashApi from '../api/dashboard'

/* ── Colores por estado de actividad ─────────────────────── */
const STATE_COLOR = {
  pendiente:   '#f59e0b',
  completada:  '#10b981',
  cumplida:    '#10b981',
  en_proceso:  '#3b82f6',
  no_cumplida: '#ef4444',
  cancelada:   '#ef4444',
}

const STATE_LABEL = {
  pendiente:   'Pendiente',
  completada:  'Completada',
  cumplida:    'Cumplida',
  en_proceso:  'En proceso',
  no_cumplida: 'No cumplida',
  cancelada:   'Cancelada',
}

/* ── Tooltip personalizado para el BarChart ──────────────── */
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px'
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        {d.payload.fullName}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald)' }}>
        {d.value}%
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
        {d.payload.actividades} actividades
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [global,  setGlobal]  = useState(null)
  const [porDir,  setPorDir]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    Promise.all([dashApi.getGlobal(), dashApi.getPorDireccion()])
      .then(([g, d]) => {
        setGlobal(g.data)
        setPorDir(d.data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      Cargando indicadores…
    </div>
  )

  if (error) return (
    <div className="empty-state">
      <div className="empty-state__icon">⚠️</div>
      <div className="empty-state__title">Error al cargar datos</div>
      <div className="empty-state__desc">{error}</div>
    </div>
  )

  /* ── Datos para gráficas ─────────────────────────────────── */
  const pieData = global?.por_estado
    ? Object.entries(global.por_estado)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({
          name:  STATE_LABEL[k] ?? k,
          value: v,
          color: STATE_COLOR[k] ?? '#64748b'
        }))
    : []

  const barData = porDir.map(d => ({
    name:        d.direccion.length > 20 ? d.direccion.slice(0, 20) + '…' : d.direccion,
    fullName:    d.direccion,
    cumplimiento: d.pct_cumplimiento,
    actividades:  d.total_actividades,
  }))

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Dashboard General</h1>
        <p>Indicadores de cumplimiento del Plan de Trabajo Institucional — FINESI · UNAP</p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid-4 mb-6">
        <StatCard
          icon="🏛️"
          value={global?.total_direcciones ?? '—'}
          label="Direcciones"
          sub="Oficinas y comisiones"
          color="violet"
        />
        <StatCard
          icon="📄"
          value={global?.total_planes ?? '—'}
          label="Planes de Trabajo"
          sub="Registrados en el sistema"
          color="blue"
        />
        <StatCard
          icon="📋"
          value={global?.total_actividades ?? '—'}
          label="Actividades"
          sub="En todos los planes"
          color="amber"
        />
        <StatCard
          icon="✅"
          value={global ? `${global.pct_cumplimiento}%` : '—'}
          label="Cumplimiento Global"
          sub={`Avance promedio: ${global?.avance_promedio ?? 0}%`}
          color="emerald"
        />
      </div>

      {/* ── Gráficas ─────────────────────────────────────────── */}
      <div className="grid-2-1 mb-6">
        {/* Bar chart */}
        <div className="card">
          <div className="section__header" style={{ marginBottom: 20 }}>
            <h3 className="section__title">Cumplimiento por Dirección</h3>
          </div>
          {barData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📊</div>
              <div className="empty-state__title">Sin datos</div>
              <div className="empty-state__desc">No hay planes registrados aún</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="cumplimiento" name="Cumplimiento" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart */}
        <div className="card">
          <div className="section__header" style={{ marginBottom: 20 }}>
            <h3 className="section__title">Estado de Actividades</h3>
          </div>
          {pieData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🥧</div>
              <div className="empty-state__title">Sin actividades</div>
              <div className="empty-state__desc">Carga un plan PDF para comenzar</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="43%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={val => (
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{val}</span>
                  )}
                />
                <Tooltip
                  formatter={(val, name) => [`${val} actividades`, name]}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                  }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Tabla por dirección ──────────────────────────────── */}
      <div className="section">
        <div className="section__header">
          <h3 className="section__title">Detalle por Dirección / Oficina</h3>
          <span className="text-dim" style={{ fontSize: 12 }}>
            {porDir.length} unidades
          </span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Dirección / Oficina</th>
                <th>Planes</th>
                <th>Actividades</th>
                <th style={{ color: 'var(--emerald)' }}>Completadas</th>
                <th style={{ minWidth: 220 }}>Cumplimiento</th>
                <th>Avance</th>
              </tr>
            </thead>
            <tbody>
              {porDir.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                    No hay datos disponibles
                  </td>
                </tr>
              ) : porDir.map(d => (
                <tr key={d.direccion_id}>
                  <td style={{ fontWeight: 500 }}>{d.direccion}</td>
                  <td className="text-muted">{d.total_planes}</td>
                  <td className="text-muted">{d.total_actividades}</td>
                  <td className="text-emerald font-semibold">{d.completadas}</td>
                  <td>
                    <ProgressBar value={d.pct_cumplimiento} />
                  </td>
                  <td className="text-violet font-semibold">{d.avance_promedio}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
