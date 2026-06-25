import { useState, useCallback } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SmartMap from './components/SmartMap'
import InfoPanel from './components/InfoPanel'
import Statistics from './components/Statistics'

export default function App() {
  const [activeAlgo, setActiveAlgo] = useState('astar')
  const [stats, setStats] = useState({
    algorithm: 'A* Search',
    truckPos: 'A',
    destination: 'I',
    visitedNodes: [],
    distance: 0,
    time: 0,
    fuelSaved: 0,
    wasteCollected: 0,
  })

  const handleAlgoChange = useCallback((algo) => {
    setActiveAlgo(algo)
  }, [])

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(prev => ({ ...prev, ...newStats }))
  }, [])

  return (
    <div className="app">
      <div className="app-navbar">
        <Navbar />
      </div>
      <div className="app-sidebar">
        <Sidebar activeAlgo={activeAlgo} onAlgoChange={handleAlgoChange} />
      </div>
      <div className="app-main">
        <div className="app-map-area">
          <SmartMap activeAlgo={activeAlgo} onStatsUpdate={handleStatsUpdate} />
        </div>
        <div className="app-bottom">
          <InfoPanel activeAlgo={activeAlgo} />
          <Statistics stats={stats} />
        </div>
      </div>
    </div>
  )
}
