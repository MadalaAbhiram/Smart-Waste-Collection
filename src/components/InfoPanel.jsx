import '../styles/InfoPanel.css'

const ALGO_INFO = {
  astar: {
    icon: 'A*',
    name: 'A* Search',
    desc: 'A* combines actual path cost g(n) with a heuristic h(n) = Manhattan distance to destination. Edge costs are weighted by real-time traffic (high ×2, medium ×1.4) so the truck automatically avoids congested roads and finds the true optimal route.',
    time: 'O(b^d)',
    space: 'O(b^d)',
    apps: 'GPS navigation, robot motion planning, network routing, smart waste collection.',
  },
  bfs: {
    icon: 'BF',
    name: 'Breadth-First Search',
    desc: 'BFS explores nodes level by level from the depot. It finds the path with the fewest road segments. Reports actual edge-weight distance for fuel and time calculations, though it does not account for traffic conditions.',
    time: 'O(V + E)',
    space: 'O(V)',
    apps: 'Shortest-hop routing, social network analysis, web crawling.',
  },
  dfs: {
    icon: 'DF',
    name: 'Depth-First Search',
    desc: 'DFS dives as deep as possible along each branch before backtracking. It explores more nodes than necessary but uses low memory. Reports actual edge-weight distance — not optimal, but shows contrast with other algorithms.',
    time: 'O(V + E)',
    space: 'O(V)',
    apps: 'Topological sorting, cycle detection, maze solving, exploring all possible routes.',
  },
  greedy: {
    icon: 'GB',
    name: 'Greedy Best-First Search',
    desc: 'Greedy always moves toward the node that looks closest to the destination by heuristic. Traffic is used to break ties. If the truck gets stuck, A* takes over to complete the route — ensuring a valid path is always returned.',
    time: 'O(b^m)',
    space: 'O(b^m)',
    apps: 'Approximate route planning, nearest bin assignment, quick scheduling under uncertainty.',
  },
  ucs: {
    icon: 'UC',
    name: 'Uniform Cost Search',
    desc: 'UCS expands nodes in order of cumulative edge cost including traffic multipliers (high ×2, medium ×1.4). It guarantees the minimum-cost route, ignoring the heuristic entirely — optimal but explores more nodes than A*.',
    time: 'O(b^(C*/e))',
    space: 'O(b^(C*/e))',
    apps: 'Minimum-cost route planning, weighted graph traversal, task scheduling.',
  },
  csp: {
    icon: 'CS',
    name: 'Constraint Satisfaction Problem',
    desc: 'CSP uses backtracking search with real constraint checking: truck capacity ≤ 4 bins, route time ≤ 90 min, blocked roads (C↔F, A↔B) avoided. Full bins are prioritized over half-full ones. Only feasible paths are returned.',
    time: 'Exponential',
    space: 'O(n)',
    apps: 'Vehicle routing with capacity limits, timetable scheduling, resource allocation.',
  },
  waste: {
    icon: 'WP',
    name: 'AI Waste Prediction',
    desc: 'Scans all bins using fill-level sensors. B and E are half-full, C and G are full — these are flagged for priority collection. The prediction output informs which bins the routing algorithm should target first.',
    time: 'O(n × f)',
    space: 'O(n)',
    apps: 'Smart city bin monitoring, dynamic collection scheduling, sensor-based waste management.',
  },
  traffic: {
    icon: 'TP',
    name: 'AI Traffic Prediction',
    desc: 'Scans all road segments and classifies them as low, medium, or high congestion. High-traffic roads (C↔E, A↔D, C↔F) incur 2× cost penalty in routing. Medium roads cost 1.4×. This makes A*, UCS, and Greedy dynamically reroute around congestion.',
    time: 'O(t × s)',
    space: 'O(t)',
    apps: 'Adaptive route optimization, emergency vehicle routing, urban traffic management.',
  },
}

export default function InfoPanel({ activeAlgo }) {
  const info = ALGO_INFO[activeAlgo] || ALGO_INFO.astar
  return (
    <div className="infopanel">
      <div className="infopanel-title">
        <div className="infopanel-title-icon">{info.icon}</div>
        {info.name}
      </div>
      <p className="infopanel-desc">{info.desc}</p>
      <div className="infopanel-meta">
        <div className="infopanel-chip">Time <strong>{info.time}</strong></div>
        <div className="infopanel-chip">Space <strong>{info.space}</strong></div>
      </div>
      <div className="infopanel-app-label">Applications</div>
      <div className="infopanel-app">{info.apps}</div>
    </div>
  )
}
