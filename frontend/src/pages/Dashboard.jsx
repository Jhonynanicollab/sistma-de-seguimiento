import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import StatCard    from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import BadgeEstado from '../components/BadgeEstado'
import Modal       from '../components/Modal'
import * as dashApi from '../api/dashboard'
import * as planesApi from '../api/planes'
import * as actApi from '../api/actividades'
import { useAuth } from '../context/AuthContext'

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

/* ── Estructura de Categorías de Oficinas ─────────────────── */
const CATEGORIES = [
  {
    id: 's1',
    title: 'Decanato',
    icon: '🏛️',
    color: '#3b82f6',
    items: [
      { name: 'DECANO', code: 'DEC' }
    ]
  },
  {
    id: 's2',
    title: 'Direcciones Académicas',
    icon: '🏫',
    color: '#3b82f6',
    items: [
      { name: 'DIRECTOR DE ESCUELA', code: 'DEP' },
      { name: 'DIRECTOR DE DEPARTAMENTO ACADEMICO', code: 'DDA' },
      { name: 'DIRECTOR DE LA UNIDAD DE POSGRADO', code: 'DUP' },
      { name: 'DIRECTOR DE LA UNIDAD DE INVESTIGACION', code: 'DUI' }
    ]
  },
  {
    id: 's3',
    title: 'Oficinas y Responsables',
    icon: '⚙️',
    color: '#8b5cf6',
    items: [
      { name: 'SECRETARIA TECNICA', code: 'ST' },
      { name: 'RESPONSABLE DE INFRAESTRUCTURA', code: 'INFRA' },
      { name: 'RESPONSABLE DE PAGINA WEB DEL PROGRAMA', code: 'WEB' },
      { name: 'RESPONSABLE DE POLITICAS AMBIENTALES', code: 'AMB' }
    ]
  },
  {
    id: 's4',
    title: 'Comités y Acreditación',
    icon: '👥',
    color: '#10b981',
    items: [
      { name: 'PRESIDENTE DE COMITÉ DE CALIDAD Y ACREDITACION', code: 'CCA' }
    ]
  },
  {
    id: 's5',
    title: 'Coordinaciones de Apoyo',
    icon: '📅',
    color: '#f59e0b',
    items: [
      { name: 'COORDINADOR DE TUTORIA', code: 'TUT' },
      { name: 'COORDINADOR DE CONVENIOS', code: 'CONV' },
      { name: 'COORDINADOR DE LABORATORIO Y GABINETE', code: 'LAB' },
      { name: 'COORDINADOR DE SEGUIMIENTO DE EGRESADO', code: 'EGR' },
      { name: 'COORDINADOR DE RESPONSABILIDAD SOCIAL', code: 'RSU' },
      { name: 'COORDINADOR DE BIBLIOTECA ESPECIAL', code: 'BIB' },
      { name: 'COORDINADOR DE PRACTICAS PRE PROFESIONALES', code: 'PPP' }
    ]
  }
]

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
  const { user } = useAuth()
  const [global,  setGlobal]  = useState(null)
  const [porDir,  setPorDir]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtros de semestre y año
  const [anioFilter, setAnioFilter] = useState('2026')
  const [semestreFilter, setSemestreFilter] = useState('')

  // Estados para desglose por oficina seleccionada
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [unitPlans, setUnitPlans] = useState([])
  const [unitActivities, setUnitActivities] = useState([])
  const [loadingUnit, setLoadingUnit] = useState(false)

  const urlUnitCode = searchParams.get('unit')

  // Declarar handleSelectUnit antes de su uso para evitar warnings de hoisting
  const handleSelectUnit = async (unitName, code, categoryColor) => {
    setError(null)
    const matched = porDir.find(d => d.direccion.toLowerCase().trim() === unitName.toLowerCase().trim())
    
    if (!matched) {
      setSelectedUnit({
        direccion_id: null,
        direccion: unitName,
        code,
        color: categoryColor,
        total_planes: 0,
        total_actividades: 0,
        completadas: 0,
        pct_cumplimiento: 0,
        avance_promedio: 0
      })
      setUnitPlans([])
      setUnitActivities([])
      return
    }

    setSelectedUnit({ ...matched, code, color: categoryColor })
    setLoadingUnit(true)
    try {
      const params = { direccion_id: matched.direccion_id }
      if (anioFilter) params.anio = parseInt(anioFilter, 10)
      if (semestreFilter) params.semestre = semestreFilter
      const { data: plans } = await planesApi.listar(params)
      setUnitPlans(plans)
      
      const allActs = []
      for (const p of plans) {
        const { data: acts } = await actApi.listar({ plan_id: p.id })
        allActs.push(...acts)
      }
      setUnitActivities(allActs)
    } catch (err) {
      console.error("Error al cargar detalles de la unidad:", err)
    } finally {
      setLoadingUnit(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (anioFilter) params.anio = parseInt(anioFilter, 10)
    if (semestreFilter) params.semestre = semestreFilter

    Promise.all([
      dashApi.getGlobal(params),
      dashApi.getPorDireccion(params)
    ])
      .then(([g, d]) => {
        setGlobal(g.data)
        setPorDir(d.data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [anioFilter, semestreFilter])

  // Sincronizar la unidad seleccionada con la URL (?unit=CODIGO) o el usuario logueado
  useEffect(() => {
    if (!porDir || porDir.length === 0) return

    if (urlUnitCode) {
      let foundItem = null
      let foundCat = null
      for (const cat of CATEGORIES) {
        const item = cat.items.find(i => i.code === urlUnitCode)
        if (item) {
          foundItem = item
          foundCat = cat
          break
        }
      }

      if (foundItem && foundCat) {
        handleSelectUnit(foundItem.name, foundItem.code, foundCat.color)
      } else {
        setSelectedUnit(null)
      }
    } else {
      // Si el usuario pertenece a una oficina y NO es admin, auto-seleccionamos su oficina por defecto
      if (user && user.direccion_id && user.rol !== 'admin') {
        const matched = porDir.find(d => d.direccion_id === user.direccion_id)
        if (matched) {
          let code = "DIR"
          let color = "#3b82f6"
          for (const cat of CATEGORIES) {
            const item = cat.items.find(i => i.name.toLowerCase().trim() === matched.direccion.toLowerCase().trim())
            if (item) {
              code = item.code
              color = cat.color
              break
            }
          }
          handleSelectUnit(matched.direccion, code, color)
        } else {
          setSelectedUnit(null)
        }
      } else {
        setSelectedUnit(null)
      }
    }
  }, [urlUnitCode, porDir, user])

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

  /* ── Datos para gráficas globales ────────────────────────── */
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
    name:        d.direccion.length > 18 ? d.direccion.slice(0, 18) + '…' : d.direccion,
    fullName:    d.direccion,
    cumplimiento: d.pct_cumplimiento,
    actividades:  d.total_actividades,
  }))

  // Distribución de estados para la oficina seleccionada
  const unitPieData = Object.entries(
    unitActivities.reduce((acc, a) => {
      const key = a.estado.value || a.estado
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, { pendiente: 0, completada: 0, en_proceso: 0, cancelada: 0 })
  ).map(([k, v]) => ({
    name: STATE_LABEL[k] ?? k,
    value: v,
    color: STATE_COLOR[k] ?? '#64748b'
  })).filter(entry => entry.value > 0)

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1>Dashboard General</h1>
          <p>Indicadores de cumplimiento del Plan de Trabajo Institucional — FINESI · UNAP</p>
        </div>
        
        <div className="page-header__actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={anioFilter}
            onChange={e => setAnioFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">Todos los años</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          
          <select
            className="form-select"
            value={semestreFilter}
            onChange={e => setSemestreFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">Todos los semestres</option>
            <option value="I">Semestre I</option>
            <option value="II">Semestre II</option>
          </select>
        </div>
      </div>

      <div className="dashboard-main-panel" style={{ width: '100%' }}>
          
          {/* OPCIÓN 1: DETALLE DE OFICINA SELECCIONADA */}
          {selectedUnit ? (
            <div className="animate-fade">
              {/* Encabezado de la Oficina */}
              <div className="card mb-6" style={{ borderLeft: `4px solid ${selectedUnit.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🏛️</span>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                        {selectedUnit.direccion}
                      </h2>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                        Facultad de Ingeniería Estadística e Informática
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUnit(null)}>
                    ← Volver a Vista General
                  </button>
                </div>
              </div>

              {/* Tarjetas de Estadísticas de la Oficina */}
              <div className="grid-3 mb-6">
                <StatCard
                  icon="📄"
                  value={selectedUnit.total_planes}
                  label="Planes Registrados"
                  sub="Planes de trabajo cargados"
                  color="blue"
                />
                <StatCard
                  icon="📋"
                  value={selectedUnit.total_actividades}
                  label="Total Actividades"
                  sub={`${selectedUnit.completadas} completadas`}
                  color="amber"
                />
                <StatCard
                  icon="✅"
                  value={`${selectedUnit.pct_cumplimiento}%`}
                  label="Cumplimiento"
                  sub={`Avance promedio: ${selectedUnit.avance_promedio}%`}
                  color="emerald"
                />
              </div>

              {loadingUnit ? (
                <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <div className="spinner" /> <span style={{ marginLeft: '12px', color: 'var(--text-dim)' }}>Cargando datos detallados…</span>
                </div>
              ) : (
                <div className="grid-2-1 mb-6">
                  {/* Columna Izquierda: Planes y Actividades */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Listado de Planes */}
                    <div className="card">
                      <h3 className="section__title mb-4">Planes de Trabajo cargados</h3>
                      {unitPlans.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 12px' }}>
                          <div className="empty-state__icon">📄</div>
                          <div className="empty-state__title">Sin planes cargados</div>
                          <div className="empty-state__desc">Esta oficina aún no ha presentado planes de trabajo en el sistema.</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {unitPlans.map(p => (
                            <div
                              key={p.id}
                              style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                padding: '14px 16px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              <div>
                                <h4 style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text)' }}>
                                  📄 {p.nombre}
                                </h4>
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                                  Año: {p.anio} | Registrado: {new Date(p.fecha_registro).toLocaleDateString('es-PE')}
                                </span>
                              </div>
                              <Link to={`/planes/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                                Ver actividades →
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tabla de Actividades de la Oficina */}
                    <div className="card">
                      <h3 className="section__title mb-4">Actividades de la Oficina ({unitActivities.length})</h3>
                      {unitActivities.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 12px' }}>
                          <div className="empty-state__icon">📋</div>
                          <div className="empty-state__title">Sin actividades</div>
                          <div className="empty-state__desc">No hay actividades de plan para mostrar.</div>
                        </div>
                      ) : (
                        <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Estado</th>
                                <th>Avance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unitActivities.map(act => (
                                <tr key={act.id}>
                                  <td style={{ fontSize: '12.5px', maxWidth: '240px', fontWeight: 500 }}>
                                    <Link to={`/actividades/${act.id}`} className="table-link">
                                      {act.nombre.length > 75 ? act.nombre.slice(0, 75) + '…' : act.nombre}
                                    </Link>
                                  </td>
                                  <td className="text-muted" style={{ fontSize: '12px' }}>{act.responsable || '—'}</td>
                                  <td><BadgeEstado estado={act.estado} /></td>
                                  <td className="text-violet font-semibold" style={{ fontSize: '12px' }}>{act.avance}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Gráfico de la Oficina */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className="section__title mb-4">Estado de Actividades</h3>
                    {unitActivities.length === 0 ? (
                      <div className="empty-state" style={{ padding: '60px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="empty-state__icon">🥧</div>
                        <div className="empty-state__title">Sin actividades</div>
                        <div className="empty-state__desc">No hay actividades para graficar.</div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={unitPieData}
                              cx="50%"
                              cy="43%"
                              innerRadius={60}
                              outerRadius={88}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {unitPieData.map((entry, i) => (
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
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            
            /* OPCIÓN 2: DASHBOARD GLOBAL (POR DEFECTO) */
            <div className="animate-fade">
              {/* Tarjetas de Estadísticas Globales */}
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

              {/* Gráficos en Paralelo */}
              <div className="grid-2-1 mb-6">
                {/* Gráfico de barras */}
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

                {/* Gráfico circular */}
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

              {/* Tabla de Detalle General */}
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
                          <td style={{ fontWeight: 500 }}>
                            <button
                              onClick={() => {
                                // Encontrar código y color correspondiente
                                let code = "DIR"
                                let color = "#7c3aed"
                                for (const sec of CATEGORIES) {
                                  const item = sec.items.find(i => i.name.toLowerCase().trim() === d.direccion.toLowerCase().trim())
                                  if (item) {
                                    code = item.code
                                    color = sec.color
                                    break
                                  }
                                }
                                handleSelectUnit(d.direccion, code, color)
                              }}
                              className="table-link"
                              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'left', fontWeight: 'bold' }}
                            >
                              🏛️ {d.direccion}
                            </button>
                          </td>
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
          )}
        </div>
      </div>
    )
  }
