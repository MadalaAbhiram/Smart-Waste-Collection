import '../styles/InfoPanel.css'

const ALGO_INFO = {
  astar: {
    icon: '⭐',
    name: 'A* Search',
    desc: 'A* combines the actual path cost g(n) with a heuristic estimate h(n) to find the optimal path efficiently. It guarantees the shortest path when using an admissible heuristic.',
    time: 'O(b^d)',
    space: 'O(b^d)',
    apps: 'GPS navigation, game pathfinding, robot motion planning, network routing.',
  },
  bfs: {
    icon: '🌐',
    name: 'Breadth-First Search',
    desc: 'BFS explores nodes level by level outward from the source. It guarantees the shortest path in unweighted graphs and visits all nodes at each depth before going deeper.',
    time: 'O(V + E)',
    space: 'O(V)',
    apps: 'Shortest path in unweighted graphs, social network analysis, web crawling, peer-to-peer networks.',
  },
  dfs: {
    icon: '🌳',
    name: 'Depth-First Search',
    desc: 'DFS explores as far as possible along each branch before backtracking. Memory efficient, though it does not guarantee shortest paths. Follows a stack-based traversal.',
    time: 'O(V + E)',
    space: 'O(V)',
    apps: 'Topological sorting, cycle detection, maze generation, solving puzzles with backtracking.',
  },
  greedy: {
    icon: '🚛',
    name: 'Greedy Best-First Search',
    desc: 'Always expands the node that appears closest to the goal according to the heuristic h(n). Fast but does not guarantee an optimal path since it ignores actual path cost.',
    time: 'O(b^m)',
    space: 'O(b^m)',
    apps: 'Approximate route planning, nearest bin assignment, quick delivery scheduling.',
  },
  ucs: {
    icon: '🛣️',
    name: 'Uniform Cost Search',
    desc: 'UCS expands nodes in order of increasing path cost g(n). It guarantees the optimal (least-cost) path but may explore more nodes than A* since it ignores the heuristic.',
    time: 'O(b^(C*/ε))',
    space: 'O(b^(C*/ε))',
    apps: 'Optimal route planning, weighted graph traversal, minimum-cost task scheduling.',
  },
  csp: {
  icon: '🧩',
  name: 'Constraint Satisfaction Problem (CSP)',
  desc: 'CSP selects the best feasible waste collection route by satisfying multiple constraints such as truck capacity, road availability, traffic conditions, collection time and bin priority.',
  time: 'Exponential (Worst Case)',
  space: 'O(n)',
  apps: 'Vehicle Routing, Timetable Scheduling, Resource Allocation, Smart Waste Collection.',
  },
  waste: {
    icon: '🗑️',
    name: 'AI Waste Prediction',
    desc: 'Machine learning models analyze fill rate patterns and historical data to predict bin states — Empty, Half-Full, or Full — before physical collection, enabling proactive routing.',
    time: 'O(n × f)',
    space: 'O(n)',
    apps: 'Smart city bin monitoring, dynamic collection scheduling, sensor-based waste management.',
  },
  traffic: {
    icon: '🚦',
    name: 'AI Traffic Prediction',
    desc: 'Real-time traffic state prediction using LSTM-based deep learning models. Road segments are classified as Low, Medium, or High congestion to dynamically reroute the garbage truck.',
    time: 'O(t × s)',
    space: 'O(t)',
    apps: 'Smart traffic management, adaptive route optimization, emergency vehicle routing, urban planning.',
  },
}

export default function InfoPanel({ activeAlgo }) {
  const info = ALGO_INFO[activeAlgo] || ALGO_INFO['astar']
  return (
    <div className="infopanel">
      <div className="infopanel-title">
        <div className="infopanel-title-icon">{info.icon}</div>
        {info.name}
      </div>
      <p className="infopanel-desc">{info.desc}</p>
      <div className="infopanel-meta">
        <div className="infopanel-chip">⏱ Time <strong>{info.time}</strong></div>
        <div className="infopanel-chip">💾 Space <strong>{info.space}</strong></div>
      </div>
      <div className="infopanel-app-label">Applications</div>
      <div className="infopanel-app">{info.apps}</div>
    </div>
  )
}
