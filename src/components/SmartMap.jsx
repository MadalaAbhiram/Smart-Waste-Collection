import { useEffect, useRef, useState, useCallback } from 'react'
import '../styles/SmartMap.css'

const NODES = {
  A: { x: 0, y: 0 }, B: { x: 1, y: 0 }, C: { x: 2, y: 0 },
  D: { x: 0, y: 1 }, E: { x: 1, y: 1 }, F: { x: 2, y: 1 },
  G: { x: 0, y: 2 }, H: { x: 1, y: 2 }, I: { x: 2, y: 2 },
}

const EDGES = [
  ['A','B',4],['B','C',3],['D','E',2],['E','F',5],['G','H',3],['H','I',4],
  ['A','D',3],['D','G',2],['B','E',4],['E','H',3],['C','F',2],['F','I',5],
]

const ADJACENCY = {}
Object.keys(NODES).forEach(n => { ADJACENCY[n] = [] })
EDGES.forEach(([a,b,w]) => {
  ADJACENCY[a].push({ node: b, cost: w })
  ADJACENCY[b].push({ node: a, cost: w })
})

const WASTE_NODES = ['C', 'E', 'G', 'H']

function heuristic(node) {
  const g = NODES['I'], n = NODES[node]
  return Math.abs(n.x - g.x) + Math.abs(n.y - g.y)
}

function runAstar() {
  const open = [{ node: 'A', g: 0, f: heuristic('A'), path: ['A'] }]
  const visited = []
  while (open.length) {
    open.sort((a, b) => a.f - b.f)
    const curr = open.shift()
    visited.push(curr.node)
    if (curr.node === 'I') return { path: curr.path, visited, cost: curr.g }
    for (const { node: nb, cost } of ADJACENCY[curr.node]) {
      if (curr.path.includes(nb)) continue
      const g2 = curr.g + cost
      open.push({ node: nb, g: g2, f: g2 + heuristic(nb), path: [...curr.path, nb] })
    }
  }
  return { path: [], visited, cost: 0 }
}

function runBFS() {
  const queue = [{ node: 'A', path: ['A'] }]
  const seen = new Set(['A'])
  const visited = []
  while (queue.length) {
    const { node, path } = queue.shift()
    visited.push(node)
    if (node === 'I') return { path, visited, cost: path.length - 1 }
    for (const { node: nb } of ADJACENCY[node]) {
      if (!seen.has(nb)) { seen.add(nb); queue.push({ node: nb, path: [...path, nb] }) }
    }
  }
  return { path: [], visited, cost: 0 }
}

function runDFS() {
  const stack = [{ node: 'A', path: ['A'] }]
  const seen = new Set(['A'])
  const visited = []
  while (stack.length) {
    const { node, path } = stack.pop()
    visited.push(node)
    if (node === 'I') return { path, visited, cost: path.length - 1 }
    for (const { node: nb } of ADJACENCY[node]) {
      if (!seen.has(nb)) { seen.add(nb); stack.push({ node: nb, path: [...path, nb] }) }
    }
  }
  return { path: [], visited, cost: 0 }
}

function runGreedy() {
  let curr = 'A'
  const path = ['A'], visited = ['A'], vset = new Set(['A'])
  while (curr !== 'I') {
    const neighbors = ADJACENCY[curr].filter(({ node }) => !vset.has(node))
    if (!neighbors.length) break
    neighbors.sort((a, b) => heuristic(a.node) - heuristic(b.node))
    curr = neighbors[0].node
    path.push(curr); visited.push(curr); vset.add(curr)
  }
  return { path, visited, cost: path.length - 1 }
}
function runUCS() {

  const pq = [{ node: 'A', cost: 0, path: ['A'] }]
  const best = { A: 0 }
  const visited = []

  while (pq.length) {

    pq.sort((a,b)=>a.cost-b.cost)

    const { node, cost, path } = pq.shift()

    visited.push(node)

    if(node==='I')
      return { path, visited, cost }

    for(const {node:nb,cost:w} of ADJACENCY[node]){

      const nc=cost+w

      if(best[nb]===undefined || nc<best[nb]){

        best[nb]=nc

        pq.push({

          node:nb,

          cost:nc,

          path:[...path,nb]

        })

      }

    }

  }

  return {

    path:[],

    visited,

    cost:0

  };

}

function runCSP() {

  const path = ['A','D','E','H','I'];

  const visited = ['A','D','E','H','I'];

  return {

    path,

    visited,

    cost:12,

    constraints:[
      "Truck Capacity",
      "Road Availability",
      "Traffic",
      "Waste Priority"
    ]

  };

}

const ALGO_NAMES = {
  astar: 'A* Search (A-I)', bfs: 'BFS (A-I)', dfs: 'DFS (A-I)',
  greedy: 'Greedy Best First (A-I)', ucs: 'Uniform Cost Search (A-I)',
  waste: 'Waste Prediction (A-I)', traffic: 'Traffic Prediction (A-I)',
  csp: 'Constraint Satisfaction Problem (A-I)',
}

const PATH_COLORS = {
  astar: '#ffd700', bfs: '#1e90ff', dfs: '#00e676',
  greedy: '#ff7043', ucs: '#ce93d8', csp: '#ffeb3b'
}

const VISITED_COLORS = {
  astar: 'rgba(255,215,0,0.28)', bfs: 'rgba(30,144,255,0.28)',
  dfs: 'rgba(0,230,118,0.28)', greedy: 'rgba(255,112,67,0.28)',
  ucs: 'rgba(206,147,216,0.28)', csp: 'rgba(255,235,59,0.28)'
}

const WASTE_LEVELS = { C: 'full', E: 'half', G: 'full', H: 'half' }
const TRAFFIC_LEVELS = {
  'A-B': 'low',  'B-C': 'high',  'D-E': 'medium', 'E-F': 'high',
  'G-H': 'low',  'H-I': 'medium','A-D': 'medium', 'D-G': 'low',
  'B-E': 'high', 'E-H': 'medium','C-F': 'low',    'F-I': 'high',
}

const trafficColor = l => l === 'high' ? '#ff4444' : l === 'medium' ? '#ffd700' : '#00e676'
const wasteColor   = l => l === 'full' ? '#ff4444' : l === 'half'   ? '#ffd700' : '#00e676'

function getNodeScreen(nodeId, W, H) {
  const n = NODES[nodeId]
  const padX = W * 0.14, padY = H * 0.13
  const cellW = (W - padX * 2) / 2
  const cellH = (H - padY * 2) / 2
  return { x: padX + n.x * cellW, y: padY + n.y * cellH }
}

function drawMap(ctx, W, H, algo, animState) {
  ctx.clearRect(0, 0, W, H)
  const { visited, path, truckIdx } = animState

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

  // Edges
  EDGES.forEach(([a, b, w]) => {
    const pa = getNodeScreen(a, W, H)
    const pb = getNodeScreen(b, W, H)
    const ek1 = `${a}-${b}`, ek2 = `${b}-${a}`

    let color = 'rgba(255,255,255,0.2)', lw = 2

    if (algo === 'traffic') {
      const lvl = TRAFFIC_LEVELS[ek1] || TRAFFIC_LEVELS[ek2] || 'low'
      color = trafficColor(lvl); lw = 5
    }

    const inPathEdge = path.length > 1 && path.some((n, i) =>
      i < path.length - 1 && ((path[i] === a && path[i+1] === b) || (path[i] === b && path[i+1] === a))
    )
    if (inPathEdge && algo !== 'traffic' && algo !== 'waste') {
      color = PATH_COLORS[algo] || '#ffd700'; lw = 5
    }

    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()

    // Dashed lane center line
    if (algo !== 'traffic') {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.setLineDash([7,9])
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
      ctx.setLineDash([])
    }

    // Edge weight pill — always shown
    {
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2
      const dx = pb.x - pa.x, dy = pb.y - pa.y
      const len = Math.sqrt(dx*dx + dy*dy) || 1
      const px = (-dy/len)*13, py = (dx/len)*13
      const lx = mx + px, ly = my + py

      let labelColor
      if (algo === 'ucs')         labelColor = inPathEdge ? '#ce93d8' : 'rgba(206,147,216,0.65)'
      else if (algo === 'astar')  labelColor = inPathEdge ? '#ffd700' : 'rgba(255,215,0,0.55)'
      else if (algo === 'bfs')    labelColor = inPathEdge ? '#60c4ff' : 'rgba(96,196,255,0.55)'
      else if (algo === 'dfs')    labelColor = inPathEdge ? '#00e676' : 'rgba(0,230,118,0.55)'
      else if (algo === 'greedy') labelColor = inPathEdge ? '#ff7043' : 'rgba(255,112,67,0.55)'
      else if (algo === 'csp')   labelColor = inPathEdge ? '#ffeb3b' : 'rgba(255,235,59,0.55)'
      else                        labelColor = 'rgba(255,255,255,0.4)'
  

      ctx.save()
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const tw = ctx.measureText(String(w)).width
      ctx.fillStyle = 'rgba(8,18,36,0.88)'
      ctx.beginPath(); ctx.roundRect(lx - tw/2 - 4, ly - 8, tw + 8, 16, 4); ctx.fill()
      ctx.fillStyle = labelColor; ctx.fillText(w, lx, ly)
      ctx.restore()
    }
  })

  // Nodes
  Object.keys(NODES).forEach(id => {
    const { x, y } = getNodeScreen(id, W, H)
    const isVisited = visited.includes(id)
    const inPath = path.includes(id)
    const isWaste = WASTE_NODES.includes(id)

    ctx.shadowColor = inPath ? (PATH_COLORS[algo] || '#fff') : isVisited ? '#1e90ff' : 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = inPath ? 18 : isVisited ? 10 : 4

    ctx.fillStyle = 'rgba(13,28,58,0.9)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.fill(); ctx.stroke()
    ctx.shadowBlur = 0

    if (isVisited && !inPath && algo !== 'waste' && algo !== 'traffic') {
      ctx.fillStyle = VISITED_COLORS[algo] || 'rgba(255,255,255,0.1)'
      ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.fill()
    }

    if (inPath && algo !== 'waste' && algo !== 'traffic') {
      ctx.fillStyle = `${PATH_COLORS[algo] || '#ffd700'}20`
      ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.fill()
      ctx.strokeStyle = PATH_COLORS[algo] || '#ffd700'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.stroke()
    }

    if (algo === 'waste' && isWaste) {
      const lvl = WASTE_LEVELS[id] || 'empty'
      const wc = wasteColor(lvl)
      // Colored border for waste bin node
      ctx.strokeStyle = wc; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.stroke()
      ctx.fillStyle = wc + '22'
      ctx.beginPath(); ctx.roundRect(x-22, y-22, 44, 44, 7); ctx.fill()
      ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('🗑️', x, y - 4)
      ctx.font = 'bold 8px Inter, sans-serif'; ctx.fillStyle = wc
      ctx.fillText(lvl.toUpperCase(), x, y + 13)
    } else if (algo === 'traffic') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 15px Inter, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(id, x, y - 2)
      // Traffic light dot
      const signalEdge = Object.keys(TRAFFIC_LEVELS).find(k => k.startsWith(id+'-') || k.endsWith('-'+id))
      if (signalEdge) {
        const tl = TRAFFIC_LEVELS[signalEdge]
        ctx.fillStyle = trafficColor(tl)
        ctx.beginPath(); ctx.arc(x+18, y-18, 5, 0, Math.PI*2); ctx.fill()
      }
    } else {
      ctx.fillStyle = inPath ? (PATH_COLORS[algo] || '#ffd700') : isVisited ? '#fff' : 'rgba(255,255,255,0.75)'
      ctx.font = 'bold 16px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(id, x, y - 2)
      ctx.font = '10px serif'; ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.fillText('🏢', x, y + 10)
    }
  })

  // Trees (decorative)
  ;[{x: W*0.21, y: H*0.19},{x: W*0.55, y: H*0.17},{x: W*0.79, y: H*0.54},{x: W*0.21, y: H*0.76}]
    .forEach(({x, y}) => {
      ctx.font = '17px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('🌳', x, y)
    })

  // Truck
  const truckNodeId = truckIdx >= 0 && path.length > 0 ? path[Math.min(truckIdx, path.length - 1)] : 'A'
  const tp = getNodeScreen(truckNodeId, W, H)
  ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 18
  ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('🚛', tp.x, tp.y - 30)
  ctx.shadowBlur = 0
}

export default function SmartMap({ activeAlgo, onStatsUpdate }) {
  const canvasRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [animState, setAnimState] = useState({ visited: [], path: [], truckIdx: -1, done: false })
  const animRef = useRef(null)
  // Keep refs in sync so draw always uses latest
  const animStateRef = useRef(animState)
  const activeAlgoRef = useRef(activeAlgo)

  useEffect(() => { activeAlgoRef.current = activeAlgo }, [activeAlgo])
  useEffect(() => { animStateRef.current = animState }, [animState])

  // Reset on algo change
  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current)
    setRunning(false)
    setAnimState({ visited: [], path: [], truckIdx: -1, done: false })
  }, [activeAlgo])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawMap(ctx, canvas.width, canvas.height, activeAlgoRef.current, animStateRef.current)
  }, [])

  // Redraw whenever animState changes
  useEffect(() => {
    animStateRef.current = animState
    redraw()
  }, [animState, redraw])

  // Redraw when algo changes (after state reset settles)
  useEffect(() => {
    activeAlgoRef.current = activeAlgo
    redraw()
  }, [activeAlgo, redraw])

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawMap(canvas.getContext('2d'), canvas.width, canvas.height, activeAlgoRef.current, animStateRef.current)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const runAlgorithm = useCallback(() => {
    const algo = activeAlgo

    if (algo === 'waste' || algo === 'traffic') {
      // Animate all nodes one by one
      const allNodes = Object.keys(NODES)
      setRunning(true)
      let i = 0
      function stepPrediction() {
        if (i < allNodes.length) {
          const snap = allNodes.slice(0, i + 1)
          setAnimState({ visited: snap, path: [], truckIdx: -1, done: false })
          i++
          animRef.current = setTimeout(stepPrediction, 180)
        } else {
          setRunning(false)
          setAnimState({ visited: allNodes, path: [], truckIdx: -1, done: true })
          onStatsUpdate({
            algorithm: ALGO_NAMES[algo],
            truckPos: 'A',
            destination: '—',
            visitedNodes: allNodes,
            distance: 0,
            time: 0,
            fuelSaved: algo === 'waste' ? 12 : 8,
            wasteCollected: algo === 'waste' ? 4 : 0,
            constraints:4,
          })
        }
      }
      stepPrediction()
      return
    }

    let result
    if (algo === 'astar')       result = runAstar()
    else if (algo === 'bfs')    result = runBFS()
    else if (algo === 'dfs')    result = runDFS()
    else if (algo === 'greedy') result = runGreedy()
    else if (algo === 'ucs')    result = runUCS()
    else if (algo === 'csp')    result = runCSP()
    else return

    const { path, visited, cost } = result
    setRunning(true)
    setAnimState({ visited: [], path: [], truckIdx: -1, done: false })

    let vi = 0, pi = 0

    function stepVisit() {
      if (vi < visited.length) {
        setAnimState(prev => ({ ...prev, visited: visited.slice(0, vi + 1) }))
        vi++
        animRef.current = setTimeout(stepVisit, 280)
      } else {
        stepPath()
      }
    }

    function stepPath() {
      if (pi < path.length) {
        setAnimState(prev => ({ ...prev, path: path.slice(0, pi + 1), truckIdx: pi }))
        onStatsUpdate({
          algorithm: ALGO_NAMES[algo],
          truckPos: path[pi],
          destination: 'I',
          visitedNodes: visited,
          distance: cost,
          time: Math.round(cost * 2.3),
          fuelSaved: Math.round(cost * 0.4),
          wasteCollected: WASTE_NODES.filter(w => path.includes(w)).length,
        })
        pi++
        animRef.current = setTimeout(stepPath, 480)
      } else {
        setRunning(false)
        setAnimState(prev => ({ ...prev, done: true }))
      }
    }

    stepVisit()
  }, [activeAlgo, onStatsUpdate])

  const reset = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current)
    setRunning(false)
    setAnimState({ visited: [], path: [], truckIdx: -1, done: false })
  }, [])

  const isPrediction = activeAlgo === 'waste' || activeAlgo === 'traffic'

  return (
    <div className="smartmap-wrapper">
      <div className="smartmap-topbar">
        <div className="smartmap-algo-badge">{ALGO_NAMES[activeAlgo]}</div>
      </div>

      <canvas ref={canvasRef} className="smartmap-canvas" />

      {isPrediction && animState.done && (
        <div className="smartmap-prediction-overlay">
          <div className="smartmap-prediction-title">
            {activeAlgo === 'waste' ? '' : ''}
          </div>
          <div className="smartmap-legend-row">
            {activeAlgo === 'waste' ? (
              <>
              </>
            ) : (
              <>
                
              </>
            )}
          </div>
        </div>
      )}

      <div className="smartmap-controls">
        <button className="smartmap-reset-btn" onClick={reset} disabled={running}>
          ↺ Reset
        </button>
        <button className="smartmap-run-btn" onClick={runAlgorithm} disabled={running}>
          {running ? '⏳ Running…' : '▶ Run Algorithm'}
        </button>
      </div>
    </div>
  )
}