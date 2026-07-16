import React from 'react'

const CONFIDENCE_COLOR = {
  High: 'var(--correct)',
  Medium: 'var(--review)',
  Low: 'var(--mistake)',
}

export default function DiagnosticReport({ report }) {
  const isCorrect = report.correctness === 'Correct'

  return (
    <div className="panel panel-pad" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">diagnostic report</div>
          <h3 style={{ fontSize: 19, marginTop: 4 }}>{report.questionType}</h3>
        </div>
        <span className={isCorrect ? 'mark-correct' : 'mark-mistake'}>
          {isCorrect ? '\u2713 correct' : '\u2717 incorrect'}
        </span>
      </div>

      <hr className="divider" />

      <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, margin: 0 }}>
        <dt style={{ color: 'var(--muted)', fontSize: 13 }}>Reason</dt>
        <dd style={{ margin: 0, fontSize: 14 }} className={isCorrect ? '' : 'redpen'}>
          {report.reason}
        </dd>

        <dt style={{ color: 'var(--muted)', fontSize: 13 }}>Confidence</dt>
        <dd style={{ margin: 0, fontSize: 14, fontWeight: 600, color: CONFIDENCE_COLOR[report.confidence] }}>
          {report.confidence}
        </dd>

        <dt style={{ color: 'var(--muted)', fontSize: 13 }}>Estimated skill</dt>
        <dd style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: 'var(--paper-dim)',
                overflow: 'hidden',
                maxWidth: 160,
              }}
            >
              <div
                style={{
                  width: `${report.estimatedSkill}%`,
                  height: '100%',
                  background: 'var(--ink)',
                }}
              />
            </div>
            <span className="stat" style={{ fontSize: 13 }}>
              {report.estimatedSkill}%
            </span>
          </div>
        </dd>

        {report.pattern && (
          <>
            <dt style={{ color: 'var(--muted)', fontSize: 13 }}>Pattern</dt>
            <dd style={{ margin: 0, fontSize: 14, fontStyle: 'italic' }}>{report.pattern}</dd>
          </>
        )}
      </dl>

      {report.images?.length > 0 && (
        <div className="report-image-strip">
          {report.images.map((src, i) => (
            <img src={src} alt={`Attached screenshot ${i + 1}`} key={i} />
          ))}
        </div>
      )}
    </div>
  )
}
