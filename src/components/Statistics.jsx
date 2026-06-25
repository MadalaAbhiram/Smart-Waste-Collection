import { useCallback } from 'react'
import { jsPDF } from 'jspdf'
import '../styles/Statistics.css'

export default function Statistics({ stats }) {
  const {
    algorithm, truckPos, destination,
    visitedNodes, distance, time, fuelUsed, fuelSaved,
    wasteCollected, constraintsMet, steps = []
  } = stats

  const downloadReport = useCallback(() => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 16
    const contentW = pageW - margin * 2
    let y = 0

    const sectionHeader = (title) => {
      doc.setFillColor(10, 28, 48)
      doc.rect(margin, y, contentW, 8, 'F')
      doc.setFillColor(56, 242, 173)
      doc.rect(margin, y, 3, 8, 'F')
      doc.setTextColor(56, 242, 173)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 6, y + 5.4)
      y += 12
    }

    const dataRow = (label, value, valueColor = [238, 247, 255], isLast = false) => {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(130, 160, 190)
      doc.text(label, margin + 3, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...valueColor)
      doc.text(String(value), pageW - margin - 3, y, { align: 'right' })
      if (!isLast) {
        doc.setDrawColor(22, 45, 68)
        doc.setLineWidth(0.3)
        doc.line(margin + 3, y + 2.5, pageW - margin - 3, y + 2.5)
      }
      y += 9
    }

    // ── Header ────────────────────────────────────────────────────
    doc.setFillColor(4, 14, 26)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor(56, 242, 173)
    doc.rect(0, 0, 4, 30, 'F')
    doc.setTextColor(56, 242, 173)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Smart Waste Collection', 12, 12)
    doc.setTextColor(77, 216, 255)
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Route Optimization Report', 12, 21)
    const now = new Date()
    doc.setTextColor(100, 140, 175)
    doc.setFontSize(7.5)
    doc.text(`${now.toLocaleDateString()}  ${now.toLocaleTimeString()}`, pageW - margin, 21, { align: 'right' })
    y = 38

    // ── Algorithm Summary ─────────────────────────────────────────
    sectionHeader('ALGORITHM SUMMARY')
    dataRow('Algorithm Used', algorithm || '—', [77, 216, 255])
    dataRow('Truck Start Position', truckPos || '—', [238, 247, 255])
    dataRow('Destination Node', destination || '—', [238, 247, 255], true)
    y += 4

    // ── Performance Metrics ───────────────────────────────────────
    sectionHeader('PERFORMANCE METRICS')
    dataRow('Total Distance Travelled', `${distance} km`, [238, 247, 255])
    dataRow('Estimated Travel Time', `${time} min`, [238, 247, 255])
    dataRow('Fuel Consumed', `${fuelUsed} L`, [238, 247, 255])
    dataRow('Fuel Saved vs Worst Path', `${fuelSaved} L`, [56, 242, 173])
    dataRow('Waste Bins Collected', `${wasteCollected} bins`, [56, 242, 173])
    dataRow('Collection Constraints Met', `${constraintsMet} / 4`, [56, 242, 173], true)
    y += 4

    // ── Visited Nodes ─────────────────────────────────────────────
    if (visitedNodes && visitedNodes.length > 0) {
      sectionHeader('VISITED NODES')
      const tagW = 10
      const tagH = 6
      const tagGap = 3
      const tagsPerRow = Math.floor(contentW / (tagW + tagGap))
      let col = margin + 3
      let rowStart = y
      visitedNodes.forEach((node, i) => {
        if (i > 0 && i % tagsPerRow === 0) { col = margin + 3; rowStart += tagH + tagGap }
        doc.setFillColor(15, 42, 68)
        doc.setDrawColor(77, 216, 255)
        doc.setLineWidth(0.3)
        doc.roundedRect(col, rowStart, tagW, tagH, 1, 1, 'FD')
        doc.setTextColor(77, 216, 255)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'bold')
        doc.text(node, col + tagW / 2, rowStart + tagH - 1.5, { align: 'center' })
        col += tagW + tagGap
      })
      const totalTagRows = Math.ceil(visitedNodes.length / tagsPerRow)
      y = rowStart + totalTagRows * (tagH + tagGap) + 4
    }

    // ── Path Calculation Steps ────────────────────────────────────
    if (steps && steps.length > 0) {
      // check if we need a new page
      if (y > pageH - 60) {
        doc.addPage()
        y = 16
      }
      sectionHeader('HOW THE PATH WAS CALCULATED')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      // Show max 30 steps to avoid overflow
      const displaySteps = steps.slice(0, 30)
      displaySteps.forEach((step) => {
        if (y > pageH - 20) { doc.addPage(); y = 16 }
        const isIndented = step.startsWith('  ')
        const isValid = step.includes('✓')
        const isPruned = step.includes('✗')
        if (isValid) doc.setTextColor(56, 242, 173)
        else if (isPruned) doc.setTextColor(255, 107, 107)
        else if (isIndented) doc.setTextColor(100, 150, 190)
        else doc.setTextColor(200, 220, 240)
        const lines = doc.splitTextToSize(step.trim(), contentW - (isIndented ? 8 : 4))
        lines.forEach(line => {
          doc.text(line, margin + (isIndented ? 7 : 3), y)
          y += 5
        })
      })
      if (steps.length > 30) {
        doc.setTextColor(100, 130, 160)
        doc.text(`... and ${steps.length - 30} more steps`, margin + 3, y)
        y += 5
      }
    }

    // ── Footer ────────────────────────────────────────────────────
    doc.setFillColor(4, 14, 26)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setFillColor(56, 242, 173)
    doc.rect(0, pageH - 12, pageW, 1, 'F')
    doc.setTextColor(70, 100, 130)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Smart Waste Collection System  •  AI-Powered Route Optimization', pageW / 2, pageH - 5, { align: 'center' })

    const safeName = (algorithm || 'report').replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`smart_waste_report_${safeName}.pdf`)
  }, [algorithm, truckPos, destination, visitedNodes, distance, time, fuelUsed, fuelSaved, wasteCollected, constraintsMet, steps])

  return (
    <div className="statistics">
      <div className="statistics-header">
        <div className="statistics-title">Live Statistics</div>
        <button className="stat-download-btn" onClick={downloadReport} title="Download PDF Report">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PDF
        </button>
      </div>

      <div className="statistics-grid">
        <div className="stat-item">
          <div className="stat-label">Algorithm</div>
          <div className="stat-value stat-value-compact highlight">{algorithm}</div>
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
          <div className="stat-value">{distance} <span className="stat-unit">km</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Est. Time</div>
          <div className="stat-value">{time} <span className="stat-unit">min</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Fuel Used</div>
          <div className="stat-value">{fuelUsed} <span className="stat-unit">L</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Fuel Saved</div>
          <div className="stat-value green">{fuelSaved} <span className="stat-unit">L</span></div>
        </div>
        <div className="stat-item stat-item-wide">
          <div className="stat-label">Waste Collected</div>
          <p>Constraints Met: {constraintsMet} / 4</p>
          <div className="stat-value green">{wasteCollected} <span className="stat-unit">bins</span></div>
        </div>
        {visitedNodes && visitedNodes.length > 0 && (
          <div className="stat-item stat-item-wide stat-item-nodes">
            <div className="stat-label">Visited Nodes</div>
            <div className="stat-visited">
              {visitedNodes.map(n => (
                <span key={n} className="stat-node-tag">{n}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {steps && steps.length > 0 && (
        <div className="stat-steps-section">
          <div className="stat-steps-title">How Path Was Calculated</div>
          <div className="stat-steps-list">
            {steps.map((step, i) => {
              const isIndented = step.startsWith('  ')
              const isValid = step.includes('✓')
              const isPruned = step.includes('✗')
              return (
                <div
                  key={i}
                  className={`stat-step ${isIndented ? 'stat-step-indent' : ''} ${isValid ? 'stat-step-valid' : ''} ${isPruned ? 'stat-step-pruned' : ''}`}
                >
                  {step.trim()}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
