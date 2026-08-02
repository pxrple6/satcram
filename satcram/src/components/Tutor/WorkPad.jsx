import React, { useEffect, useRef } from 'react'

export default function WorkPad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#1b2033'
    context.lineWidth = 3
    context.lineCap = 'round'
    context.lineJoin = 'round'
  }, [])

  function point(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height) }
  }
  function start(event) { drawingRef.current = true; const p = point(event); const context = canvasRef.current.getContext('2d'); context.beginPath(); context.moveTo(p.x, p.y); event.currentTarget.setPointerCapture?.(event.pointerId) }
  function draw(event) { if (!drawingRef.current) return; const p = point(event); const context = canvasRef.current.getContext('2d'); context.lineTo(p.x, p.y); context.stroke() }
  function end() { if (!drawingRef.current) return; drawingRef.current = false; onChange(canvasRef.current.toDataURL('image/png')) }
  function clear() { const canvas = canvasRef.current; const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); onChange('') }

  return <div className="work-pad"><div className="work-pad-head"><span>Write your steps here</span><button type="button" className="text-action" onClick={clear}>Clear</button></div><canvas ref={canvasRef} width="900" height="560" onPointerDown={start} onPointerMove={draw} onPointerUp={end} onPointerLeave={end} aria-label="Handwritten work area" /><p>Use a finger, mouse, or Apple Pencil. The tutor will review the first wrong step.</p></div>
}
