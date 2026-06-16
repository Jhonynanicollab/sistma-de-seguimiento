export default function StatCard({ icon, value, label, sub, color = 'violet' }) {
  const styles = {
    violet:  { '--accent-color': 'var(--violet)',  '--icon-bg': 'var(--violet-dim)' },
    emerald: { '--accent-color': 'var(--emerald)', '--icon-bg': 'var(--emerald-dim)' },
    amber:   { '--accent-color': 'var(--amber)',   '--icon-bg': 'var(--amber-dim)' },
    red:     { '--accent-color': 'var(--red)',     '--icon-bg': 'var(--red-dim)' },
    blue:    { '--accent-color': 'var(--blue)',    '--icon-bg': 'var(--blue-dim)' },
  }

  return (
    <div className="stat-card" style={styles[color] || styles.violet}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}
