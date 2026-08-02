import React, { useEffect, useRef, useState } from 'react'

const COLORS = ['#1b2033', '#3654f0', '#e03939', '#1a8f5c', '#c9861f']

export default function WorkPad({ onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const historyRef = useRef([])
  const [color, setColor] = useState(COLORS[0])
  const [tool, setTool] = useState('pen')
  const [size, setSize] = useState(4)

  function context() { return canvasRef.current.getContext('2d') }
  function saveHistory() { historyRef.current.push(canvasRef.current.toDataURL()); if (historyRef.current.length > 20) historyRef.current.shift() }
  function exportWork() { onChange(canvasRef.current.toDataURL('image/png')) }
  useEffect(() => { const c = canvasRef.current; const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); exportWork() }, [])
  function point(event) { const rect = canvasRef.current.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height) } }
  function start(event) { saveHistory(); drawingRef.current = true; const p = point(event); const ctx = context(); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.strokeStyle = color; ctx.lineWidth = tool === 'eraser' ? size * 6 : size; ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'; event.currentTarget.setPointerCapture?.(event.pointerId) }
  function draw(event) { if (!drawingRef.current) return; const p = point(event); const ctx = context(); ctx.lineTo(p.x, p.y); ctx.stroke() }
  function end() { if (!drawingRef.current) return; drawingRef.current = false; context().globalCompositeOperation = 'source-over'; exportWork() }
  function undo() { const previous = historyRef.current.pop(); if (!previous) return; const image = new Image(); image.onload = () => { const ctx = context(); ctx.clearRect(0, 0, 900, 560); ctx.drawImage(image, 0, 0); exportWork() }; image.src = previous }
  function clear() { saveHistory(); const ctx = context(); ctx.clearRect(0, 0, 900, 560); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 900, 560); exportWork() }

  return <div className="work-pad"><div className="work-pad-head"><span>Write your steps here</span><div className="work-pad-tools"><div className="color-picker" aria-label="Pen colors">{COLORS.map((swatch) => <button key={swatch} type="button" aria-label={`Use ${swatch} pen`} className={`color-swatch ${color === swatch && tool === 'pen' ? 'active' : ''}`} style={{ background: swatch }} onClick={() => { setColor(swatch); setTool('pen') }} />)}</div><button type="button" className={`tool-button ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>Eraser</button><label className="size-control">Size<input type="range" min="2" max="12" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><button type="button" className="tool-button" onClick={undo}>Undo</button><button type="button" className="text-action" onClick={clear}>Clear</button></div></div><canvas ref={canvasRef} width="900" height="560" onPointerDown={start} onPointerMove={draw} onPointerUp={end} onPointerLeave={end} aria-label="Handwritten work area" /><p>Use a finger, mouse, or Apple Pencil. When you submit, AI marks the first step to revisit on this work.</p></div>
}
