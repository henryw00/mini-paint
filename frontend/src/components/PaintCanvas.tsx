import { useRef, useEffect, useState } from 'react'
import { floodFill } from '../hooks/useFloodFill'

interface Props {
  imageUrl: string
  fillColor: string
  tolerance: number
  blendMode: 'hue' | 'flat' | 'multiply'
  opacity: number
}

function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

export default function PaintCanvas({ imageUrl, fillColor, tolerance, blendMode, opacity }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<ImageData[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      setHistory([])
    }
    img.src = imageUrl
  }, [imageUrl])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory(prev => [...prev, imageData])

    const filled = floodFill(imageData, x, y, hexToRgba(fillColor), tolerance, blendMode, opacity)
    ctx.putImageData(filled, 0, 0)
  }

  const handleUndo = () => {
    const canvas = canvasRef.current
    if (!canvas || history.length === 0) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const prev = history[history.length - 1]
    ctx.putImageData(prev, 0, 0)
    setHistory(h => h.slice(0, -1))
  }

  const handleReset = () => {
    if (history.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const original = history[0]
    ctx.putImageData(original, 0, 0)
    setHistory([])
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'mini-scheme.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex gap-2 self-end pr-4">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={handleReset}
          disabled={history.length === 0}
          className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-40"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-indigo-600 rounded text-sm"
        >
          Save PNG
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="max-w-full max-h-[70vh] object-contain cursor-crosshair border border-gray-700 rounded"
      />
    </div>
  )
}