import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Page } from '../types'

const STORAGE_KEY = 'summer-book-progress'

type ToolMode = 'brush' | 'eraser' | 'fill'

export default function ColoringCanvas({ page }: { page: Page }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const historyRef = useRef<string[]>([])
  const [tool, setTool] = useState<ToolMode>('brush')
  const [brushColor, setBrushColor] = useState('#ff5a5f')
  const [brushSize, setBrushSize] = useState(12)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = page.svg
    img.onload = () => {
      baseImageRef.current = img
      renderBaseImage(img)
      pushHistory()
      restoreSavedPage()
    }
  }, [page])

  const renderBaseImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 840
    canvas.height = 1120

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const scale = Math.min((canvas.width - 80) / img.width, (canvas.height - 140) / img.height)
    const drawW = img.width * scale
    const drawH = img.height * scale
    const offsetX = (canvas.width - drawW) / 2
    const offsetY = 40

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
  }

  const drawStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (tool === 'fill') {
      floodFill(x, y, brushColor)
      return
    }

    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushSize
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.moveTo(x, y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.closePath()
    setDrawing(true)
  }

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endStroke = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.closePath()
    ctx.globalCompositeOperation = 'source-over'
    setDrawing(false)
    pushHistory()
    saveProgress()
  }

  const pushHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const snapshot = canvas.toDataURL('image/png')
    historyRef.current.push(snapshot)
    if (historyRef.current.length > 20) {
      historyRef.current.shift()
    }
  }

  const redrawFromDataUrl = (dataUrl: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = dataUrl
  }

  const undo = () => {
    if (historyRef.current.length <= 1) return
    historyRef.current.pop()
    const previous = historyRef.current[historyRef.current.length - 1]
    redrawFromDataUrl(previous)
    saveProgress()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const img = baseImageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const scale = Math.min((canvas.width - 80) / img.width, (canvas.height - 140) / img.height)
    const drawW = img.width * scale
    const drawH = img.height * scale
    const offsetX = (canvas.width - drawW) / 2
    const offsetY = 40
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

    pushHistory()
    saveProgress()
  }

  const saveProgress = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const state = raw ? JSON.parse(raw) : {}
      state[page.id] = canvas.toDataURL('image/png')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Could not save page progress', error)
    }
  }

  const restoreSavedPage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const state = JSON.parse(raw)
      const saved = state[page.id]
      if (!saved) return

      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        pushHistory()
      }
      img.src = saved
    } catch (error) {
      console.warn('Could not restore page progress', error)
    }
  }

  const floodFill = (x: number, y: number, color: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const target = hexToRgba(color)
    const startIndex = (Math.floor(y) * width + Math.floor(x)) * 4

    const targetColor = {
      r: imageData.data[startIndex],
      g: imageData.data[startIndex + 1],
      b: imageData.data[startIndex + 2],
      a: imageData.data[startIndex + 3]
    }

    if (
      targetColor.r === target.r &&
      targetColor.g === target.g &&
      targetColor.b === target.b &&
      targetColor.a === target.a
    ) {
      return
    }

    const stack: Array<[number, number]> = [[Math.floor(x), Math.floor(y)]]

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue

      const idx = (cy * width + cx) * 4
      if (
        imageData.data[idx] === targetColor.r &&
        imageData.data[idx + 1] === targetColor.g &&
        imageData.data[idx + 2] === targetColor.b &&
        imageData.data[idx + 3] === targetColor.a
      ) {
        imageData.data[idx] = target.r
        imageData.data[idx + 1] = target.g
        imageData.data[idx + 2] = target.b
        imageData.data[idx + 3] = target.a

        stack.push([
          cx + 1, cy
        ], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }
    }

    ctx.putImageData(imageData, 0, 0)
    pushHistory()
    saveProgress()
  }

  const hexToRgba = (hex: string) => {
    const clean = hex.replace('#', '')
    const bigint = parseInt(clean, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
      a: 255
    }
  }

  return (
    <div className="coloring-panel">
      <div className="toolbar">
        <div className="swatches">
          {['#ff5a5f', '#ff9f1c', '#ffd166', '#2ec4b6', '#4cc9f0', '#4361ee', '#9b5de5', '#f15bb5'].map((swatch) => (
            <button
              key={swatch}
              className={`swatch ${brushColor === swatch ? 'active' : ''}`}
              style={{ background: swatch }}
              onClick={() => setBrushColor(swatch)}
              aria-label={`Select ${swatch}`}
            />
          ))}
        </div>

        <div className="tool-row">
          <label className="slider-wrap">
            Size
            <input
              type="range"
              min="4"
              max="28"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </label>

          <button className={`tool-btn ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')}>
            Brush
          </button>
          <button className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>
            Eraser
          </button>
          <button className={`tool-btn ${tool === 'fill' ? 'active' : ''}`} onClick={() => setTool('fill')}>
            Fill
          </button>
          <button className="tool-btn" onClick={undo}>Undo</button>
          <button className="tool-btn" onClick={clearCanvas}>Clear</button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="coloring-canvas"
        onPointerDown={drawStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
    </div>
  )
}
