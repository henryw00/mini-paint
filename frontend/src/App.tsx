import { useState } from 'react'
import PaintCanvas from './components/PaintCanvas'

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fillColor, setFillColor] = useState('#ff0000')
  const [tolerance, setTolerance] = useState(30)
  const [blendMode, setBlendMode] = useState<'hue' | 'flat' | 'multiply'>('hue')
  const [opacity, setOpacity] = useState(0.8)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUrl(URL.createObjectURL(file))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 border-b border-gray-700 flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold">Mini Painter</h1>
        <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-gray-300" />
        <label className="flex items-center gap-2 text-sm">
          Color
          <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Tolerance
          <input type="range" min={5} max={100} value={tolerance} onChange={e => setTolerance(Number(e.target.value))} className="w-24" />
          <span className="w-6 text-gray-400">{tolerance}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Mode
          <select
            value={blendMode}
            onChange={e => setBlendMode(e.target.value as 'hue' | 'flat' | 'multiply')}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            <option value="hue">Hue</option>
            <option value="flat">Flat</option>
            <option value="multiply">Multiply</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Opacity
          <input type="range" min={0.1} max={1} step={0.05} value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-24"
          />
          <span className="w-8 text-gray-400">{Math.round(opacity * 100)}%</span>
        </label>
      </header>
      <main className="flex-1 flex items-start justify-center p-4">
        {imageUrl
          ? <PaintCanvas
              imageUrl={imageUrl}
              fillColor={fillColor}
              tolerance={tolerance}
              blendMode={blendMode}
              opacity={opacity}
            />
          : <div className="text-gray-500 mt-20">Upload an image to get started</div>
        }
      </main>
    </div>
  )
}