import React, { useEffect, useRef } from 'react'

const MARK_COLORS = { red: '#df3d45', amber: '#c98216', blue: '#3654f0', green: '#1a8f5c', purple: '#8758d6' }

export default function AnnotatedWork({ image, annotation, annotations = [] }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!image) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const source = new Image()
    source.onload = () => {
      canvas.width = source.width; canvas.height = source.height
      context.drawImage(source, 0, 0)
      const marks = annotations.length ? annotations : annotation ? [annotation] : []
      marks.slice(0, 4).forEach((mark, index) => {
        const x = (mark.x || 120) / 1000 * canvas.width
        const y = (mark.y || 180 + index * 80) / 1000 * canvas.height
        const width = Math.max(80, (mark.width || 420) / 1000 * canvas.width)
        const height = Math.max(50, (mark.height || 120) / 1000 * canvas.height)
        const color = MARK_COLORS[mark.color] || MARK_COLORS.red
        context.strokeStyle = color; context.lineWidth = Math.max(4, canvas.width / 150); context.setLineDash([12, 8]); context.strokeRect(x, y, width, height); context.setLineDash([])
        context.fillStyle = color; context.font = `700 ${Math.max(16, canvas.width / 36)}px sans-serif`; context.fillText(mark.label || `Step ${index + 1}`, x, Math.max(22, y - 10))
      })
    }
    source.src = image
  }, [image, annotation, annotations])
  return <div className="annotated-work"><canvas ref={canvasRef} aria-label="AI annotated student work" /></div>
}
