import '../styles/Sidebar.css'

const ALGORITHMS = [
  { id: 'astar', icon: 'A*', label: 'A* Search', complexity: 'O(b^d)' },
  { id: 'bfs', icon: 'BF', label: 'BFS', complexity: 'O(V+E)' },
  { id: 'dfs', icon: 'DF', label: 'DFS', complexity: 'O(V+E)' },
  { id: 'greedy', icon: 'GB', label: 'Greedy Best First', complexity: 'O(b^m)' },
  { id: 'ucs', icon: 'UC', label: 'Uniform Cost Search', complexity: 'O(b^(C*/e))' },
  { id: 'csp', icon: 'CS', label: 'Constraint Satisfaction Problem', complexity: 'NP-Complete' },
]

const PREDICTIONS = [
  { id: 'waste', icon: 'WP', label: 'Waste Prediction', complexity: 'AI Model' },
  { id: 'traffic', icon: 'TP', label: 'Traffic Prediction', complexity: 'AI Model' },
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
