export default function ProgressBar({ value = 0, color, showLabel = true, height = 6 }) {
  const clamped = Math.min(100, Math.max(0, value))

  // Auto-color based on value if no color specified
  const autoColor = color
    ? color
    : clamped >= 70 ? 'emerald' : clamped >= 40 ? 'amber' : 'red'

  const barClass = {
    violet:  'progress__bar--violet',
    emerald: 'progress__bar--emerald',
    amber:   'progress__bar--amber',
    red:     'progress__bar--red',
  }[autoColor] || 'progress__bar--violet'

  return (
    <div className="progress-labeled">
      <div className="progress" style={{ height }}>
        <div className={`progress__bar ${barClass}`} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && (
        <span className="progress-labeled__pct">{clamped.toFixed(1)}%</span>
      )}
    </div>
  )
}
