import '../styles/Legend.css'

const ITEMS = [
  { color: '#00d4ff', label: '🚛 Truck' },
  { color: '#ff4444', label: '🗑️ Full Bin' },
  { color: '#ffd700', label: '🟡 Half Bin' },
  { color: '#00e676', label: '🟢 Empty Bin' },
  { color: 'rgba(255,255,255,0.2)', label: '🏢 Building' },
  { color: 'rgba(255,255,255,0.18)', label: '— Road' },
  { color: '#ffd700', label: '⭐ A* Path' },
  { color: '#1e90ff', label: '🌐 BFS Path' },
  { color: '#00e676', label: '🌳 DFS Path' },
  { color: '#ff7043', label: '🚛 Greedy' },
  { color: '#ce93d8', label: '🛣️ UCS Path' },
]

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map(({ color, label }) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  )
}
