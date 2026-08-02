import React from 'react'
import { Link, NavLink } from '../../lib/router.jsx'

const NAV = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/upload', label: 'Upload' },
  { to: '/app/practice', label: 'Practice' },
  { to: '/app/dna', label: 'Mistake DNA' },
  { to: '/app/plan', label: 'Study plan' },
  { to: '/app/lessons', label: 'Visual lessons' },
  { to: '/app/tutor', label: 'Tutor' },
  { to: '/app/journal', label: 'Journal' },
]

export default function Sidebar({ stats }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-logo">
          SATcram
        </Link>
        <p className="sidebar-tagline">Learn from every mistake</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {stats && stats.total > 0 && (
        <div className="sidebar-stats panel panel-pad">
          <div className="eyebrow">Progress</div>
          <div className="sidebar-stat-row">
            <span>Questions</span>
            <span className="stat">{stats.total}</span>
          </div>
          <div className="sidebar-stat-row">
            <span>Accuracy</span>
            <span className="stat">{stats.accuracy}%</span>
          </div>
          {stats.needsReviewCount > 0 && (
            <div className="sidebar-stat-row">
              <span>Needs review</span>
              <span className="stat review">{stats.needsReviewCount}</span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
