const LABELS = {
  pendiente:    '⏳ Pendiente',
  procesando:   '⚙️ Procesando',
  procesado:    '✅ Procesado',
  error:        '❌ Error',
  cumplida:     '✅ Cumplida',
  no_cumplida:  '❌ No cumplida',
  completada:   '✅ Completada',
  en_proceso:   '⚙️ En proceso',
  cancelada:    '🚫 Cancelada',
  automatico:   '🤖 Auto',
  manual:       '✏️ Manual',
  digital:      '📄 Digital',
  escaneado:    '🖨 Escaneado',
  mixto:        '📑 Mixto',
  admin:        '👑 Admin',
  acreditacion: '🎓 Acreditación',
  responsable:  '👤 Responsable',
}

export default function BadgeEstado({ estado }) {
  if (!estado) return null
  return (
    <span className={`badge badge-${estado}`}>
      {LABELS[estado] ?? estado}
    </span>
  )
}
