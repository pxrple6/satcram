import React, { useEffect, useRef } from 'react'

export default function AnnotatedWork({ image, annotation }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!image) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const source = new Image()
    source.onload = () => {
      canvas.width = source.width; canvas.height = source.height
      context.drawImage(source, 0, 0)
      if (!annotation) return
      const x = (annotation.x || 120) / 1000 * canvas.width
      const y = (annotation.y || 180) / 1000 * canvas.height
      const width = Math.max(80, (annotation.width || 420) / 1000 * canvas.width)
      const height = Math.max(50, (annotation.height || 120) / 1000 * canvas.height)
      context.strokeStyle = '#e03939'; context.lineWidth = Math.max(4, canvas.width / 150); context.setLineDash([12, 8]); context.strokeRect(x, y, width, height); context.setLineDash([])
      context.fillStyle = '#e03939'; context.font = `${Math.max(16, canvas.width / 36)}px sans-serif`; context.fillText(annotation.label || 'First step to revisit', x, Math.max(22, y - 10))
    }
    source.src = image
  }, [image, annotation])
  return <div className="annotated-work"><canvas ref={canvasRef} aria-label="AI annotated student work" /></div>
}
