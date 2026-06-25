import '../styles/Sidebar.css'

const ALGORITHMS = [
  { id: 'astar',   icon: '⭐', label: 'A* Search',              complexity: 'O(b^d)' },
  { id: 'bfs',     icon: '🌐', label: 'BFS',                    complexity: 'O(V+E)' },
  { id: 'dfs',     icon: '🌳', label: 'DFS',                    complexity: 'O(V+E)' },
  { id: 'greedy',  icon: '🚛', label: 'Greedy Best First',      complexity: 'O(b^m)' },
  { id: 'ucs',     icon: '🛣️', label: 'Uniform Cost Search',    complexity: 'O(b^(C*/ε))' },
  { id: 'csp', icon: '🧩', label: 'Constraint Satisfaction Problem', complexity: 'NP-Complete' },
]

const PREDICTIONS = [
  { id: 'waste',   icon: '🗑️', label: 'Waste Prediction',      complexity: 'AI Model' },
  { id: 'traffic', icon: '🚦', label: 'Traffic Prediction',     complexity: 'AI Model' },
]

export default function Sidebar({ activeAlgo, onAlgoChange }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section-label">Pathfinding</div>
      {ALGORITHMS.map(a => (
        <button
          key={a.id}
          className={`sidebar-btn ${activeAlgo === a.id ? 'active' : ''}`}
          onClick={() => onAlgoChange(a.id)}
        >
          <span className="sidebar-btn-icon">{a.icon}</span>
          <span className="sidebar-btn-label">
            {a.label}
            <br />
            <span className="sidebar-btn-complexity">{a.complexity}</span>
          </span>
        </button>
      ))}

      <div className="sidebar-divider" />
      <div className="sidebar-section-label">AI Predictions</div>
      {PREDICTIONS.map(p => (
        <button
          key={p.id}
          className={`sidebar-btn ${activeAlgo === p.id ? 'active' : ''}`}
          onClick={() => onAlgoChange(p.id)}
        >
          <span className="sidebar-btn-icon">{p.icon}</span>
          <span className="sidebar-btn-label">
            {p.label}
            <br />
            <span className="sidebar-btn-complexity">{p.complexity}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
