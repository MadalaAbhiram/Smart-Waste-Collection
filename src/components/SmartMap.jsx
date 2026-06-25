import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/SmartMap.css'
import Legend from './Legend'

const MAP_IMAGE_SRC = '/satellite-colony.jpg'

const NODES = {
  A: { x: 0.10, y: 0.86, type: 'depot' },
  B: { x: 0.24, y: 0.64, type: 'bin' },
  C: { x: 0.17, y: 0.34, type: 'bin' },
  D: { x: 0.39, y: 0.78, type: 'hub' },
  E: { x: 0.49, y: 0.47, type: 'bin' },
  F: { x: 0.61, y: 0.21, type: 'hub' },
  G: { x: 0.72, y: 0.60, type: 'bin' },
  H: { x: 0.83, y: 0.36, type: 'hub' },
  I: { x: 0.93, y: 0.13, type: 'destination' },
}

const EDGES = [
  ['A', 'B', 4], ['B', 'C', 5], ['C', 'E', 4], ['E', 'F', 3], ['F', 'H', 4], ['H', 'I', 3],
  ['A', 'D', 3], ['D', 'E', 4], ['E', 'G', 3], ['G', 'H', 3], ['B', 'D', 2], ['C', 'F', 4],
]

const EDGE_BENDS = {
  'A-B': { x: -0.055, y: -0.02 },
  'B-C': { x: -0.08, y: -0.025 },
  'C-E': { x: 0.02, y: -0.075 },
  'E-F': { x: 0.025, y: -0.075 },
  'F-H': { x: 0.075, y: -0.035 },
  'H-I': { x: 0.035, y: -0.03 },
  'A-D': { x: 0.035, y: 0.035 },
  'D-E': { x: -0.03, y: 0.045 },
  'E-G': { x: 0.08, y: 0.055 },
  'G-H': { x: 0.06, y: -0.04 },
  'B-D': { x: 0.035, y: 0.06 },
  'C-F': { x: 0.07, y: -0.04 },
}

const ADJACENCY = {}
Object.keys(NODES).forEach(n => { ADJACENCY[n] = [] })
EDGES.forEach(([a, b, w]) => {
  ADJACENCY[a].push({ node: b, cost: w })
  ADJACENCY[b].push({ node: a, cost: w })
})

const WASTE_NODES = ['B', 'C', 'E', 'G']
const WASTE_LEVELS = { B: 'half', C: 'full', E: 'half', G: 'full' }
const TRAFFIC_LEVELS = {
  'A-B': 'low', 'B-C': 'medium', 'C-E': 'high', 'E-F': 'medium',
  'F-H': 'low', 'G-H': 'medium', 'H-I': 'low', 'A-D': 'high',
  'D-E': 'medium', 'B-D': 'low', 'C-F': 'high', 'E-G': 'medium',
}

const ALGO_NAMES = {
  astar: 'A* Search (A-I)',
  bfs: 'BFS (A-I)',
  dfs: 'DFS (A-I)',
  greedy: 'Greedy Best First (A-I)',
  ucs: 'Uniform Cost Search (A-I)',
  csp: 'Constraint Satisfaction Problem (A-I)',
  waste: 'Waste Prediction',
  traffic: 'Traffic Prediction',
}

const PATH_COLORS = {
  astar: '#ffd166',
  bfs: '#4dd8ff',
  dfs: '#38f2ad',
  greedy: '#ff8a5c',
  ucs: '#a78bfa',
  csp: '#f7e85f',
}

const VISITED_COLORS = {
  astar: 'rgba(255, 209, 102, 0.24)',
  bfs: 'rgba(77, 216, 255, 0.22)',
  dfs: 'rgba(56, 242, 173, 0.2)',
  greedy: 'rgba(255, 138, 92, 0.22)',
  ucs: 'rgba(167, 139, 250, 0.22)',
  csp: 'rgba(247, 232, 95, 0.22)',
}

// ── Traffic-aware edge cost ───────────────────────────────────────────────────
// High traffic roads cost 2× more, medium 1.4×, low stays normal.
// This makes routing algorithms naturally avoid congested roads.
const TRAFFIC_MULTIPLIER = { high: 2.0, medium: 1.4, low: 1.0 }

function trafficCost(a, b, baseCost) {
  const level = TRAFFIC_LEVELS[`${a}-${b}`] || TRAFFIC_LEVELS[`${b}-${a}`] || 'low'
  return baseCost * TRAFFIC_MULTIPLIER[level]
}

// ── CSP constraints ───────────────────────────────────────────────────────────
// Truck capacity: max 4 bins per trip
// Time limit: route must complete within MAX_ROUTE_TIME minutes (at 20 km/h + 3 min/bin stop)
// Priority: full bins must be collected before half bins
// Blocked roads: C-F and A-B are restricted (heavy-vehicle no-entry)
const TRUCK_CAPACITY = 4
const MAX_ROUTE_TIME = 90   // minutes
const BLOCKED_ROADS = new Set(['C-F', 'F-C', 'A-B', 'B-A'])
const BIN_PRIORITY = { full: 2, half: 1, empty: 0 }

function edgeAllowed(a, b) {
  return !BLOCKED_ROADS.has(`${a}-${b}`)
}

function calcRouteTime(path, edgeCosts) {
  const bins = WASTE_NODES.filter(n => path.includes(n)).length
  return calcTime(edgeCosts, bins)
}

function runCSP() {
  // Variables: each node on potential path A→I
  // Domains: which nodes are reachable without blocked roads
  // Constraints: capacity ≤ 4, time ≤ 90 min, no blocked edges, collect full bins first
  const visited = []
  let bestPath = null
  let bestCost = Infinity
  const steps = []

  function backtrack(node, path, costSoFar, binsCollected) {
    visited.push(node)
    steps.push(`Try ${path.join('→')} | cost=${costSoFar}km, bins=${binsCollected}`)
    if (node === 'I') {
      const totalTime = calcRouteTime(path, costSoFar)
      if (totalTime <= MAX_ROUTE_TIME && binsCollected <= TRUCK_CAPACITY) {
        if (costSoFar < bestCost) {
          bestCost = costSoFar
          bestPath = [...path]
          steps.push(`  ✓ Valid path! time=${totalTime}min ≤ 90, bins=${binsCollected} ≤ 4`)
        }
      } else {
        steps.push(`  ✗ Pruned: time=${totalTime}min or bins=${binsCollected} exceeds limit`)
      }
      return
    }
    const neighbors = ADJACENCY[node]
      .filter(({ node: nb }) => !path.includes(nb) && edgeAllowed(node, nb))
      .sort((a, b) => (BIN_PRIORITY[WASTE_LEVELS[b.node]] || 0) - (BIN_PRIORITY[WASTE_LEVELS[a.node]] || 0))

    for (const { node: nb, cost: w } of neighbors) {
      const newBins = binsCollected + (WASTE_NODES.includes(nb) && WASTE_LEVELS[nb] !== 'empty' ? 1 : 0)
      if (newBins > TRUCK_CAPACITY) { steps.push(`  ✗ Skip ${nb}: capacity exceeded`); continue }
      const projectedTime = calcTime(costSoFar + w, newBins)
      if (projectedTime > MAX_ROUTE_TIME) { steps.push(`  ✗ Skip ${nb}: time ${projectedTime}min > 90`); continue }
      backtrack(nb, [...path, nb], costSoFar + w, newBins)
    }
  }

  backtrack('A', ['A'], 0, 0)
  return {
    path: bestPath || ['A', 'D', 'E', 'G', 'H', 'I'],
    visited,
    cost: bestCost === Infinity ? 16 : bestCost,
    steps,
  }
}

const trafficColor = level => level === 'high' ? '#ff6b6b' : level === 'medium' ? '#ffd166' : '#38f2ad'
const wasteColor = level => level === 'full' ? '#ff6b6b' : level === 'half' ? '#ffd166' : '#38f2ad'

function heuristic(node) {
  const goal = NODES.I
  const current = NODES[node]
  return Math.abs(current.x - goal.x) + Math.abs(current.y - goal.y)
}

// A* with traffic-aware costs
function runAstar() {
  const open = [{ node: 'A', g: 0, f: heuristic('A'), path: ['A'] }]
  const visited = []
  const steps = []
  while (open.length) {
    open.sort((a, b) => a.f - b.f)
    const curr = open.shift()
    visited.push(curr.node)
    steps.push(`Expand ${curr.node}: g=${curr.g.toFixed(1)}, h=${heuristic(curr.node).toFixed(2)}, f=${curr.f.toFixed(1)}`)
    if (curr.node === 'I') return { path: curr.path, visited, cost: curr.g, steps }
    for (const { node: nb, cost } of ADJACENCY[curr.node]) {
      if (curr.path.includes(nb)) continue
      const tc = trafficCost(curr.node, nb, cost)
      const g2 = curr.g + tc
      const traffic = TRAFFIC_LEVELS[`${curr.node}-${nb}`] || TRAFFIC_LEVELS[`${nb}-${curr.node}`] || 'low'
      steps.push(`  → ${nb}: base=${cost}km × traffic(${traffic})=${tc.toFixed(1)}, g=${g2.toFixed(1)}, f=${(g2+heuristic(nb)).toFixed(1)}`)
      open.push({ node: nb, g: g2, f: g2 + heuristic(nb), path: [...curr.path, nb] })
    }
  }
  return { path: [], visited, cost: 0, steps }
}

// BFS — finds shortest path by hop count, but reports actual edge-weight distance
function runBFS() {
  const queue = [{ node: 'A', path: ['A'], cost: 0, depth: 0 }]
  const seen = new Set(['A'])
  const visited = []
  const steps = []
  while (queue.length) {
    const { node, path, cost, depth } = queue.shift()
    visited.push(node)
    steps.push(`Level ${depth} — visit ${node} (cumulative dist: ${cost}km)`)
    if (node === 'I') return { path, visited, cost, steps }
    for (const { node: nb, cost: w } of ADJACENCY[node]) {
      if (!seen.has(nb)) {
        seen.add(nb)
        steps.push(`  → enqueue ${nb} (edge weight: ${w}km, total: ${cost+w}km)`)
        queue.push({ node: nb, path: [...path, nb], cost: cost + w, depth: depth + 1 })
      }
    }
  }
  return { path: [], visited, cost: 0, steps }
}

// DFS — depth-first, reports actual edge-weight distance
function runDFS() {
  const stack = [{ node: 'A', path: ['A'], cost: 0, depth: 0 }]
  const seen = new Set(['A'])
  const visited = []
  const steps = []
  while (stack.length) {
    const { node, path, cost, depth } = stack.pop()
    if (!visited.includes(node)) visited.push(node)
    steps.push(`Depth ${depth} — explore ${node} (dist so far: ${cost}km)`)
    if (node === 'I') return { path, visited, cost, steps }
    for (const { node: nb, cost: w } of ADJACENCY[node]) {
      if (!seen.has(nb)) {
        seen.add(nb)
        steps.push(`  → push ${nb} onto stack (edge: ${w}km)`)
        stack.push({ node: nb, path: [...path, nb], cost: cost + w, depth: depth + 1 })
      }
    }
  }
  return { path: [], visited, cost: 0, steps }
}

// Greedy Best-First with traffic awareness and fallback to A* if stuck
function runGreedy() {
  let curr = 'A'
  const path = ['A']
  const visited = ['A']
  const seen = new Set(['A'])
  let totalCost = 0
  const steps = []
  while (curr !== 'I') {
    const neighbors = ADJACENCY[curr].filter(({ node }) => !seen.has(node))
    if (!neighbors.length) {
      steps.push(`Stuck at ${curr} — switching to A* fallback`)
      const fallback = runAstar()
      const fallIdx = fallback.path.indexOf(curr)
      if (fallIdx !== -1) {
        const rest = fallback.path.slice(fallIdx + 1)
        rest.forEach(n => { path.push(n); seen.add(n) })
        totalCost += fallback.cost
      }
      break
    }
    neighbors.sort((a, b) => {
      const hDiff = heuristic(a.node) - heuristic(b.node)
      if (hDiff !== 0) return hDiff
      return trafficCost(curr, a.node, a.cost) - trafficCost(curr, b.node, b.cost)
    })
    steps.push(`At ${curr} — neighbors by h(n): ${neighbors.map(n => `${n.node}(h=${heuristic(n.node).toFixed(2)})`).join(', ')}`)
    const next = neighbors[0]
    const tc = trafficCost(curr, next.node, next.cost)
    totalCost += tc
    steps.push(`  → pick ${next.node} (lowest h, edge cost=${tc.toFixed(1)}km)`)
    curr = next.node
    path.push(curr)
    visited.push(curr)
    seen.add(curr)
  }
  return { path, visited, cost: totalCost, steps }
}

// UCS with traffic-aware costs
function runUCS() {
  const queue = [{ node: 'A', cost: 0, path: ['A'] }]
  const best = { A: 0 }
  const visited = []
  const steps = []
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost)
    const { node, cost, path } = queue.shift()
    if (visited.includes(node)) continue
    visited.push(node)
    steps.push(`Dequeue ${node} with cumulative cost=${cost.toFixed(1)}km`)
    if (node === 'I') return { path, visited, cost, steps }
    for (const { node: nb, cost: w } of ADJACENCY[node]) {
      const traffic = TRAFFIC_LEVELS[`${node}-${nb}`] || TRAFFIC_LEVELS[`${nb}-${node}`] || 'low'
      const nextCost = cost + trafficCost(node, nb, w)
      if (best[nb] === undefined || nextCost < best[nb]) {
        best[nb] = nextCost
        steps.push(`  → ${nb}: ${cost.toFixed(1)} + ${w}km×traffic(${traffic}) = ${nextCost.toFixed(1)}km ✓`)
        queue.push({ node: nb, cost: nextCost, path: [...path, nb] })
      } else {
        steps.push(`  → ${nb}: ${nextCost.toFixed(1)}km — skipped (worse than known ${best[nb].toFixed(1)}km)`)
      }
    }
  }
  return { path: [], visited, cost: 0, steps }
}

function getNodeScreen(nodeId, width, height) {
  const node = NODES[nodeId]
  const padX = Math.max(38, width * 0.045)
  const padY = Math.max(34, height * 0.055)
  return {
    x: padX + node.x * (width - padX * 2),
    y: padY + node.y * (height - padY * 2),
  }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function getEdgeKey(a, b) {
  return EDGE_BENDS[`${a}-${b}`] ? `${a}-${b}` : `${b}-${a}`
}

function getEdgeControl(a, b, from, to, width, height) {
  const bend = EDGE_BENDS[getEdgeKey(a, b)] || { x: 0, y: 0 }
  return {
    x: (from.x + to.x) / 2 + bend.x * width,
    y: (from.y + to.y) / 2 + bend.y * height,
  }
}

function drawSoftCurve(ctx, from, to, control, color, width) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = width * 4
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
  ctx.stroke()
  ctx.restore()
}

function getCurvePoint(from, control, to, t) {
  const u = 1 - t
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  }
}

function getCurveAngle(from, control, to, t) {
  const u = 1 - t
  const dx = 2 * u * (control.x - from.x) + 2 * t * (to.x - control.x)
  const dy = 2 * u * (control.y - from.y) + 2 * t * (to.y - control.y)
  return Math.atan2(dy, dx)
}

function drawTruck(ctx, x, y, angle = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.shadowColor = '#38f2ad'
  ctx.shadowBlur = 20

  ctx.fillStyle = 'rgba(6, 17, 31, 0.86)'
  drawRoundedRect(ctx, -26, -17, 52, 34, 10)
  ctx.fill()

  ctx.fillStyle = '#38f2ad'
  drawRoundedRect(ctx, -20, -11, 25, 22, 6)
  ctx.fill()

  ctx.fillStyle = '#4dd8ff'
  drawRoundedRect(ctx, 4, -13, 18, 26, 7)
  ctx.fill()

  ctx.fillStyle = 'rgba(238, 247, 255, 0.92)'
  drawRoundedRect(ctx, 9, -8, 8, 16, 4)
  ctx.fill()

  ctx.fillStyle = '#06111f'
  drawRoundedRect(ctx, -17, -17, 10, 5, 2)
  ctx.fill()
  drawRoundedRect(ctx, -17, 12, 10, 5, 2)
  ctx.fill()
  drawRoundedRect(ctx, 11, -17, 10, 5, 2)
  ctx.fill()
  drawRoundedRect(ctx, 11, 12, 10, 5, 2)
  ctx.fill()

  ctx.fillStyle = '#bdf66f'
  ctx.beginPath()
  ctx.moveTo(27, 0)
  ctx.lineTo(17, -6)
  ctx.lineTo(17, 6)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawCoverImage(ctx, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const x = (width - drawWidth) / 2
  const y = (height - drawHeight) / 2
  ctx.drawImage(image, x, y, drawWidth, drawHeight)
}

function drawSatelliteBackdrop(ctx, width, height, tick, mapImage) {
  if (mapImage?.complete && mapImage.naturalWidth > 0) {
    drawCoverImage(ctx, mapImage, width, height)
    ctx.save()
    ctx.fillStyle = 'rgba(3, 16, 28, 0.28)'
    ctx.fillRect(0, 0, width, height)
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.46, width * 0.12, width * 0.5, height * 0.5, Math.max(width, height) * 0.72)
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0)')
    vignette.addColorStop(1, 'rgba(2, 8, 16, 0.54)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  } else {
  const base = ctx.createLinearGradient(0, 0, width, height)
  base.addColorStop(0, '#10251f')
  base.addColorStop(0.34, '#152e2c')
  base.addColorStop(0.68, '#102238')
  base.addColorStop(1, '#06111f')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.42
  ctx.fillStyle = '#1f4c36'
  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 173) % Math.max(width, 1)) - 50
    const y = ((i * 97) % Math.max(height, 1)) - 40
    drawRoundedRect(ctx, x, y, 120 + (i % 4) * 26, 62 + (i % 5) * 16, 18)
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.36
  const water = ctx.createLinearGradient(width * 0.62, 0, width, height)
  water.addColorStop(0, 'rgba(58, 183, 210, 0.22)')
  water.addColorStop(1, 'rgba(25, 92, 128, 0.08)')
  ctx.fillStyle = water
  ctx.beginPath()
  ctx.moveTo(width * 0.72, -20)
  ctx.bezierCurveTo(width * 0.9, height * 0.16, width * 0.66, height * 0.44, width * 0.86, height * 0.68)
  ctx.bezierCurveTo(width * 1.04, height * 0.9, width * 0.86, height * 1.1, width * 1.06, height * 1.18)
  ctx.lineTo(width + 40, -20)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.22
  for (let x = -80; x < width + 100; x += 86) {
    for (let y = -60; y < height + 80; y += 74) {
      const skew = ((x + y) % 5) * 5
      ctx.fillStyle = (x + y) % 3 === 0 ? 'rgba(197, 215, 186, 0.22)' : 'rgba(209, 224, 211, 0.13)'
      drawRoundedRect(ctx, x + skew, y, 46 + ((x + y) % 4) * 12, 28 + ((x + y) % 3) * 10, 4)
      ctx.fill()
    }
  }
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(238, 247, 255, 0.09)'
  ctx.lineWidth = 18
  ctx.lineCap = 'round'
  const roadLines = [
    [[-40, height * 0.18], [width * 0.28, height * 0.28], [width * 0.58, height * 0.18], [width + 40, height * 0.28]],
    [[width * 0.08, -30], [width * 0.22, height * 0.35], [width * 0.16, height + 40]],
    [[-30, height * 0.7], [width * 0.42, height * 0.58], [width + 50, height * 0.82]],
    [[width * 0.48, -30], [width * 0.5, height * 0.42], [width * 0.58, height + 40]],
  ]
  roadLines.forEach(points => {
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  })
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(56, 242, 173, 0.08)'
  ctx.lineWidth = 1
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y + Math.sin(tick + y * 0.02) * 3)
    ctx.lineTo(width, y + Math.cos(tick + y * 0.02) * 3)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMap(ctx, width, height, algo, animState, mapImage) {
  const { visited, path, truckIdx } = animState
  const isPrediction = algo === 'waste' || algo === 'traffic'
  const tick = performance.now() / 1000

  ctx.clearRect(0, 0, width, height)
  drawSatelliteBackdrop(ctx, width, height, tick, mapImage)

  EDGES.forEach(([a, b, w]) => {
    const pa = getNodeScreen(a, width, height)
    const pb = getNodeScreen(b, width, height)
    const pc = getEdgeControl(a, b, pa, pb, width, height)
    const ek1 = `${a}-${b}`
    const ek2 = `${b}-${a}`
    const inPathEdge = path.some((n, i) =>
      i < path.length - 1 && ((path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a))
    )

    let lineColor = 'rgba(238, 247, 255, 0.16)'
    let lineWidth = 3
    if (algo === 'traffic') {
      lineColor = trafficColor(TRAFFIC_LEVELS[ek1] || TRAFFIC_LEVELS[ek2] || 'low')
      lineWidth = 6
    } else if (inPathEdge && !isPrediction) {
      lineColor = PATH_COLORS[algo] || '#ffd166'
      lineWidth = 7
    }

    drawSoftCurve(ctx, pa, pb, pc, lineColor, lineWidth)
    if (algo !== 'traffic') {
      ctx.save()
      ctx.strokeStyle = 'rgba(238, 247, 255, 0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 11])
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.quadraticCurveTo(pc.x, pc.y, pb.x, pb.y)
      ctx.stroke()
      ctx.restore()
    }

    // ── Edge weight label ──────────────────────────────────────────
    // Draw at midpoint of the quadratic curve (t=0.5)
    const midX = 0.25 * pa.x + 0.5 * pc.x + 0.25 * pb.x
    const midY = 0.25 * pa.y + 0.5 * pc.y + 0.25 * pb.y
    const label = `${w}km`
    const labelPad = 5
    const labelW = label.length * 5.2 + labelPad * 2
    const labelH = 14

    ctx.save()
    // pill background
    ctx.fillStyle = inPathEdge && !isPrediction
      ? 'rgba(6, 17, 31, 0.92)'
      : 'rgba(6, 17, 31, 0.78)'
    ctx.strokeStyle = inPathEdge && !isPrediction
      ? (PATH_COLORS[algo] || '#ffd166')
      : 'rgba(238, 247, 255, 0.18)'
    ctx.lineWidth = inPathEdge && !isPrediction ? 1.5 : 0.8
    ctx.beginPath()
    ctx.roundRect(midX - labelW / 2, midY - labelH / 2, labelW, labelH, 4)
    ctx.fill()
    ctx.stroke()

    // label text
    ctx.fillStyle = inPathEdge && !isPrediction
      ? (PATH_COLORS[algo] || '#ffd166')
      : 'rgba(238, 247, 255, 0.55)'
    ctx.font = `${inPathEdge && !isPrediction ? '700' : '600'} 9px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, midX, midY)
    ctx.restore()

  })

  Object.keys(NODES).forEach(id => {
    const { x, y } = getNodeScreen(id, width, height)
    const isVisited = visited.includes(id)
    const inPath = path.includes(id)
    const pulse = 1 + Math.sin(tick * 3 + x * 0.01) * 0.025
    const nodeColor = inPath ? (PATH_COLORS[algo] || '#ffd166') : isVisited ? '#4dd8ff' : 'rgba(238, 247, 255, 0.22)'

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(pulse, pulse)
    ctx.shadowColor = nodeColor
    ctx.shadowBlur = inPath || isVisited ? 22 : 8
    ctx.fillStyle = 'rgba(8, 22, 36, 0.94)'
    drawRoundedRect(ctx, -25, -25, 50, 50, 8)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = nodeColor
    ctx.lineWidth = inPath || isVisited ? 2.5 : 1
    drawRoundedRect(ctx, -25, -25, 50, 50, 8)
    ctx.stroke()

    if (isVisited && !inPath && !isPrediction) {
      ctx.fillStyle = VISITED_COLORS[algo] || 'rgba(77, 216, 255, 0.2)'
      drawRoundedRect(ctx, -25, -25, 50, 50, 8)
      ctx.fill()
    }

    if (algo === 'waste' && WASTE_NODES.includes(id)) {
      const level = WASTE_LEVELS[id] || 'empty'
      const color = wasteColor(level)
      ctx.fillStyle = `${color}26`
      drawRoundedRect(ctx, -25, -25, 50, 50, 8)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      drawRoundedRect(ctx, -25, -25, 50, 50, 8)
      ctx.stroke()
      ctx.fillStyle = color
      ctx.font = '900 9px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(level.toUpperCase(), 0, 14)
    }

    if (algo === 'traffic') {
      const signalEdge = Object.keys(TRAFFIC_LEVELS).find(k => k.startsWith(`${id}-`) || k.endsWith(`-${id}`))
      const color = trafficColor(TRAFFIC_LEVELS[signalEdge] || 'low')
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(18, -18, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = inPath ? '#06111f' : '#eef7ff'
    ctx.font = '900 16px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(id, 0, -3)
    ctx.fillStyle = 'rgba(238, 247, 255, 0.38)'
    ctx.font = '800 8px Inter, sans-serif'
    ctx.fillText(NODES[id].type === 'destination' ? 'END' : WASTE_NODES.includes(id) ? 'BIN' : 'HUB', 0, 13)
    ctx.restore()
  })

  let truckPoint = getNodeScreen('A', width, height)
  let truckAngle = -Math.PI / 4
  if (path.length > 1 && truckIdx >= 0) {
    const fromId = path[Math.min(truckIdx, path.length - 2)]
    const toId = path[Math.min(truckIdx + 1, path.length - 1)]
    const from = getNodeScreen(fromId, width, height)
    const to = getNodeScreen(toId, width, height)
    const control = getEdgeControl(fromId, toId, from, to, width, height)
    const progress = animState.truckProgress ?? 1
    truckPoint = getCurvePoint(from, control, to, progress)
    truckAngle = getCurveAngle(from, control, to, progress)
  }
  drawTruck(ctx, truckPoint.x, truckPoint.y - 8, truckAngle)
}

// ── Realistic stat calculations ───────────────────────────────────────────────
// 1 edge weight unit = 1 km  |  truck avg speed in colony = 20 km/h
// fuel consumption = 0.35 L/km (urban waste truck, heavy load)
// bin stop time = 3 min per bin collected
// "fuel saved" = (worst-case path distance − actual distance) × 0.35 L/km
const TRUCK_SPEED_KMH = 20          // km/h
const FUEL_RATE = 0.35              // L / km
const BIN_STOP_MIN = 3              // minutes per bin collected
const WORST_CASE_DISTANCE = 22      // longest realistic path through all edges (A→B→C→E→G→H→I = 22 units)

function calcTime(distanceKm, binsCollected) {
  const driveMin = (distanceKm / TRUCK_SPEED_KMH) * 60
  const stopMin = binsCollected * BIN_STOP_MIN
  return Math.round(driveMin + stopMin)
}

function calcFuelUsed(distanceKm) {
  return Math.round(distanceKm * FUEL_RATE * 10) / 10   // 1 decimal
}

function calcFuelSaved(distanceKm) {
  const saved = (WORST_CASE_DISTANCE - distanceKm) * FUEL_RATE
  return Math.max(0, Math.round(saved * 10) / 10)
}

// Dynamically check which of 4 constraints the chosen path satisfies
// C1: Within truck capacity (≤4 bins)
// C2: Within time limit (≤90 min)
// C3: No blocked roads used
// C4: Reached destination (path ends at I)
function calcConstraintsMet(algo, path, cost) {
  const bins = WASTE_NODES.filter(n => path.includes(n)).length
  const time = calcTime(cost, bins)
  const c1 = bins <= TRUCK_CAPACITY
  const c2 = time <= MAX_ROUTE_TIME
  const c3 = !path.some((n, i) => i < path.length - 1 && !edgeAllowed(n, path[i + 1]))
  const c4 = path[path.length - 1] === 'I'
  return [c1, c2, c3, c4].filter(Boolean).length
}

function runSelectedAlgorithm(algo) {
  if (algo === 'astar') return runAstar()
  if (algo === 'bfs') return runBFS()
  if (algo === 'dfs') return runDFS()
  if (algo === 'greedy') return runGreedy()
  if (algo === 'ucs') return runUCS()
  if (algo === 'csp') return runCSP()
  return null
}

export default function SmartMap({ activeAlgo, onStatsUpdate }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const frameRef = useRef(null)
  const mapImageRef = useRef(null)
  const animStateRef = useRef({ visited: [], path: [], truckIdx: -1, truckProgress: 0, done: false })
  const activeAlgoRef = useRef(activeAlgo)
  const [running, setRunning] = useState(false)
  const [animState, setAnimState] = useState(animStateRef.current)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawMap(
      canvas.getContext('2d'),
      canvas.offsetWidth,
      canvas.offsetHeight,
      activeAlgoRef.current,
      animStateRef.current,
      mapImageRef.current,
    )
  }, [])

  useEffect(() => { activeAlgoRef.current = activeAlgo }, [activeAlgo])

  useEffect(() => {
    const image = new Image()
    image.src = MAP_IMAGE_SRC
    image.onload = () => {
      mapImageRef.current = image
      redraw()
    }
    image.onerror = () => {
      mapImageRef.current = null
      redraw()
    }
  }, [redraw])

  useEffect(() => {
    animStateRef.current = animState
    redraw()
  }, [animState, redraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const { offsetWidth, offsetHeight } = canvas
      canvas.width = Math.max(1, Math.floor(offsetWidth * dpr))
      canvas.height = Math.max(1, Math.floor(offsetHeight * dpr))
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawMap(ctx, offsetWidth, offsetHeight, activeAlgoRef.current, animStateRef.current, mapImageRef.current)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const loop = () => {
      const ctx = canvas.getContext('2d')
      drawMap(ctx, canvas.offsetWidth, canvas.offsetHeight, activeAlgoRef.current, animStateRef.current, mapImageRef.current)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current)
    setRunning(false)
    setAnimState({ visited: [], path: [], truckIdx: -1, truckProgress: 0, done: false })
  }, [activeAlgo])

  const runAlgorithm = useCallback(() => {
    const algo = activeAlgo

    if (algo === 'waste' || algo === 'traffic') {
      const allNodes = Object.keys(NODES)
      setRunning(true)
      let i = 0

      function stepPrediction() {
        if (i < allNodes.length) {
          setAnimState({ visited: allNodes.slice(0, i + 1), path: [], truckIdx: -1, truckProgress: 0, done: false })
          i += 1
          animRef.current = setTimeout(stepPrediction, 160)
          return
        }

        setRunning(false)
        setAnimState({ visited: allNodes, path: [], truckIdx: -1, truckProgress: 0, done: true })
        onStatsUpdate({
          algorithm: ALGO_NAMES[algo],
          truckPos: 'A',
          destination: '-',
          visitedNodes: allNodes,
          distance: 0,
          time: 0,
          fuelUsed: 0,
          fuelSaved: algo === 'waste' ? 3.5 : 2.8,
          wasteCollected: algo === 'waste' ? 4 : 0,
        })
      }

      stepPrediction()
      return
    }

    const result = runSelectedAlgorithm(algo)
    if (!result) return

    const { path, visited, cost, steps = [] } = result
    setRunning(true)
    setAnimState({ visited: [], path: [], truckIdx: -1, truckProgress: 0, done: false })

    let vi = 0
    let pi = 1

    function stepVisit() {
      if (vi < visited.length) {
        setAnimState(prev => ({ ...prev, visited: visited.slice(0, vi + 1) }))
        vi += 1
        animRef.current = setTimeout(stepVisit, 220)
        return
      }
      stepPath()
    }

    function stepPath() {
      if (pi < path.length) {
        let frame = 0
        const totalFrames = 18
        const segmentIndex = pi - 1

        function moveTruck() {
          const progress = frame / totalFrames
          setAnimState(prev => ({
            ...prev,
            path: path.slice(0, pi + 1),
            truckIdx: segmentIndex,
            truckProgress: progress,
          }))

          if (frame < totalFrames) {
            frame += 1
            animRef.current = setTimeout(moveTruck, 22)
            return
          }

          onStatsUpdate({
            algorithm: ALGO_NAMES[algo],
            truckPos: path[pi],
            destination: 'I',
            visitedNodes: visited,
            distance: cost,
            time: calcTime(cost, WASTE_NODES.filter(w => path.includes(w)).length),
            fuelUsed: calcFuelUsed(cost),
            fuelSaved: calcFuelSaved(cost),
            wasteCollected: WASTE_NODES.filter(w => path.includes(w)).length,
            constraintsMet: calcConstraintsMet(algo, path, cost),
            steps,
          })
          pi += 1
          animRef.current = setTimeout(stepPath, 80)
        }

        moveTruck()
        return
      }
      setRunning(false)
      setAnimState(prev => ({ ...prev, done: true, truckProgress: 1 }))
    }

    stepVisit()
  }, [activeAlgo, onStatsUpdate])

  const reset = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current)
    setRunning(false)
    setAnimState({ visited: [], path: [], truckIdx: -1, truckProgress: 0, done: false })
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
            {activeAlgo === 'waste' ? 'Waste Fill Forecast Complete' : 'Traffic Congestion Scan Complete'}
          </div>
          <div className="smartmap-legend-row">
            {activeAlgo === 'waste' ? (
              <>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#ff6b6b' }} />Full</div>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#ffd166' }} />Half</div>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#38f2ad' }} />Empty</div>
              </>
            ) : (
              <>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#ff6b6b' }} />High</div>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#ffd166' }} />Medium</div>
                <div className="smartmap-legend-item"><span className="smartmap-legend-dot" style={{ background: '#38f2ad' }} />Low</div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="smartmap-footer">
        <Legend />
        <div className="smartmap-controls">
          <button className="smartmap-reset-btn" onClick={reset} disabled={running}>
            Reset
          </button>
          <button className="smartmap-run-btn" onClick={runAlgorithm} disabled={running}>
            {running ? 'Running...' : 'Run Algorithm'}
          </button>
        </div>
      </div>
    </div>
  )
}
