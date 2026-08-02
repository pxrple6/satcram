import React, { useCallback, useEffect, useRef, useState } from 'react'

// One compressed screenshot is enough for a single SAT question and keeps
// vision requests predictable for the student's AI-credit allowance.
const MAX_IMAGES = 1
const MAX_FILE_BYTES = 2 * 1024 * 1024

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function ImageDropzone({ images, onChange, maxImages = MAX_IMAGES }) {
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)
  const zoneRef = useRef(null)

  const processFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
      if (!files.length) {
        setError('Only image files (PNG, JPG, etc.) are supported.')
        return
      }

      setError('')
      const room = maxImages - images.length
      if (room <= 0) {
        setError(`Maximum ${maxImages} images per mistake. Remove one to add another.`)
        return
      }

      if (files.length > room) {
        setError(`Only ${maxImages} images allowed — adding the first ${room}.`)
      }

      const toAdd = files.slice(0, room)
      const oversized = toAdd.find((f) => f.size > MAX_FILE_BYTES)
      if (oversized) {
        setError(`"${oversized.name}" is over 2 MB — try a smaller screenshot.`)
      }

      const accepted = toAdd.filter((f) => f.size <= MAX_FILE_BYTES)
      if (!accepted.length) return

      setLoading(true)
      try {
        const withData = await Promise.all(
          accepted.map(async (file) => ({
            id: `${file.name}_${file.size}_${Date.now()}_${Math.random()}`,
            name: file.name,
            size: file.size,
            dataUrl: await fileToDataUrl(file),
          }))
        )
        onChange([...images, ...withData])
      } finally {
        setLoading(false)
      }
    },
    [images, maxImages, onChange]
  )

  useEffect(() => {
    function onPaste(e) {
      if (!zoneRef.current?.contains(document.activeElement) && document.activeElement?.tagName !== 'BODY') {
        const inForm = document.activeElement?.closest('.upload-form')
        if (!inForm) return
      }

      const items = e.clipboardData?.items
      if (!items) return

      const files = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length) {
        e.preventDefault()
        processFiles(files)
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [processFiles])

  function removeImage(id) {
    onChange(images.filter((img) => img.id !== id))
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    processFiles(e.dataTransfer.files)
  }

  const atLimit = images.length >= maxImages

  return (
    <div className="image-dropzone-wrap" ref={zoneRef}>
      <div
        className={`dropzone dropzone-enhanced${dragActive ? ' drag-active' : ''}${atLimit ? ' at-limit' : ''}${loading ? ' loading' : ''}`}
        onClick={() => !atLimit && !loading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!atLimit) setDragActive(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false)
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!atLimit) fileInputRef.current?.click()
          }
        }}
        aria-label="Upload question screenshot"
      >
        {dragActive && (
          <div className="dropzone-overlay">
            <span>Drop to attach</span>
          </div>
        )}

        <div className="dz-visual">
          <div className="dz-icon-ring">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="dz-main">
            {loading ? 'Reading image…' : atLimit ? `${maxImages} images attached` : 'Drop a screenshot, click to browse, or paste (⌘V)'}
          </div>
          <div className="dz-sub">PNG, JPG, or WebP · one screenshot · 2 MB maximum</div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          disabled={atLimit || loading}
          onChange={(e) => {
            processFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && <div className="upload-error">{error}</div>}

      {images.length > 0 && (
        <div className="image-preview-list">
          {images.map((img, i) => (
            <div className="image-preview-card" key={img.id}>
              <button
                type="button"
                className="image-preview-thumb"
                onClick={() => setLightbox(img)}
                aria-label={`View ${img.name}`}
              >
                <img src={img.dataUrl} alt={img.name} />
                <span className="image-preview-zoom">View</span>
              </button>
              <div className="image-preview-meta">
                <span className="image-preview-name" title={img.name}>
                  Screenshot {i + 1}
                </span>
                <span className="image-preview-size">{formatBytes(img.size)}</span>
              </div>
              <button
                type="button"
                className="image-preview-remove"
                onClick={() => removeImage(img.id)}
                aria-label={`Remove screenshot ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.dataUrl} alt={lightbox.name} />
            <button type="button" className="lightbox-close" onClick={() => setLightbox(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { MAX_IMAGES }
