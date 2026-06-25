import '../styles/Statistics.css'

export default function Statistics({ stats }) {
  const {
    algorithm, truckPos, destination,
    visitedNodes, distance, time, fuelSaved, wasteCollected
  } = stats

  return (
    <div className="statistics">
      <div className="statistics-title">Live Statistics</div>
      <div className="statistics-grid">
        <div className="stat-item">
          <div className="stat-label">Algorithm</div>
          <div className="stat-value highlight" style={{ fontSize: '11px' }}>{algorithm}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Truck Position</div>
          <div className="stat-value highlight">{truckPos}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Destination</div>
          <div className="stat-value">{destination}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Distance</div>
          <div className="stat-value">{distance} <span style={{ fontSize: '10px', opacity: 0.5 }}>units</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Est. Time</div>
          <div className="stat-value">{time} <span style={{ fontSize: '10px', opacity: 0.5 }}>min</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Fuel Saved</div>
          <div className="stat-value green">{fuelSaved} <span style={{ fontSize: '10px', opacity: 0.5 }}>L</span></div>
        </div>
        <div className="stat-item" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-label">Waste Collected</div>
          <p>Constraints : 4 / 4</p>
          <div className="stat-value green">{wasteCollected} <span style={{ fontSize: '10px', opacity: 0.5 }}>bins</span></div>
        </div>
      </div>
      {visitedNodes && visitedNodes.length > 0 && (
        <div className="stat-item" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-label">Visited Nodes</div>
          <div className="stat-visited">
            {visitedNodes.map(n => (
              <span key={n} className="stat-node-tag">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
