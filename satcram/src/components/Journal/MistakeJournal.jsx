import React, { useMemo, useState } from 'react'
import { useStore } from '../../App.jsx'

const STATUS_MARK = {
  Fixed: 'mark-correct',
  'Needs review': 'mark-review',
  Recurring: 'mark-mistake',
}

function monthKey(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function MistakeJournal() {
  const { mistakes, setStatus } = useStore()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mistakes
    return mistakes.filter(
      (m) =>
        m.topic.toLowerCase().includes(q) ||
        m.questionText.toLowerCase().includes(q) ||
        (m.pattern || '').toLowerCase().includes(q)
    )
  }, [mistakes, query])

  const groups = useMemo(() => {
    const map = {}
    for (const m of filtered) {
      const key = monthKey(m.timestamp)
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [filtered])

  function cycleStatus(m) {
    const order = ['Needs review', 'Fixed', 'Recurring']
    const next = order[(order.indexOf(m.status) + 1) % order.length]
    setStatus(m.id, next)
  }

  return (
    <div>
      <div className="eyebrow">searchable history</div>
      <h2 style={{ fontSize: 26, marginTop: 4 }}>Mistake journal</h2>
      <p style={{ color: 'var(--ink-soft)', maxWidth: 560, marginTop: 8 }}>
        Every mistake, kept — not just the score. Click a status badge to update it.
      </p>

      <input
        type="text"
        placeholder="Search by topic, pattern, or question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginTop: 16, maxWidth: 420 }}
      />

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {Object.entries(groups).map(([month, items]) => (
          <div key={month}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {month}
            </div>
            <div className="panel">
              {items.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 120px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderBottom: i < items.length - 1 ? '1px solid var(--paper-dim)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{m.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {m.pattern || m.reason}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.source}</div>
                  <button
                    onClick={() => cycleStatus(m)}
                    className={STATUS_MARK[m.status]}
                    style={{ border: 'none', cursor: 'pointer', justifySelf: 'start' }}
                  >
                    {m.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && <p style={{ color: 'var(--muted)' }}>No mistakes match that search.</p>}
      </div>
    </div>
  )
}
