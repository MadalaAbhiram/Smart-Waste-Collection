import '../styles/Legend.css'

const ITEMS = [
  { color: '#4dd8ff', label: 'Truck' },
  { color: '#ff6b6b', label: 'Full Bin' },
  { color: '#ffd166', label: 'Half Bin' },
  { color: '#38f2ad', label: 'Empty Bin' },
  { color: 'rgba(238,247,255,0.3)', label: 'Building' },
  { color: 'rgba(238,247,255,0.24)', label: 'Road' },
  { color: '#ffd166', label: 'A* Path' },
  { color: '#4dd8ff', label: 'BFS Path' },
  { color: '#38f2ad', label: 'DFS Path' },
  { color: '#ff8a5c', label: 'Greedy' },
  { color: '#a78bfa', label: 'UCS Path' },
]

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map(({ color, label }) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{ background: color, color }} />
          {label}
        </div>
      ))}
    </div>
  )
}
