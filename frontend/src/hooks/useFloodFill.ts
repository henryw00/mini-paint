type BlendMode = 'hue' | 'flat' | 'multiply'

function hexToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ]
}

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number = 30,
  blendMode: BlendMode = 'hue',
  opacity: number = 1.0
): ImageData {
  const { width, height, data } = imageData
  const result = new ImageData(new Uint8ClampedArray(data), width, height)
  const rd = result.data

  const idx = (x: number, y: number) => (y * width + x) * 4
  const start = idx(startX, startY)
  const targetColor: [number, number, number, number] = [
    data[start], data[start + 1], data[start + 2], data[start + 3]
  ]

  const colorMatch = (i: number) =>
    Math.abs(rd[i] - targetColor[0]) <= tolerance &&
    Math.abs(rd[i + 1] - targetColor[1]) <= tolerance &&
    Math.abs(rd[i + 2] - targetColor[2]) <= tolerance &&
    Math.abs(rd[i + 3] - targetColor[3]) <= tolerance

  const [fh, fs] = hexToHsl(fillColor[0], fillColor[1], fillColor[2])

  const blendPixel = (i: number) => {
    const or = rd[i], og = rd[i + 1], ob = rd[i + 2]
    let nr: number, ng: number, nb: number

    if (blendMode === 'hue') {
      // Keep original lightness and saturation, replace hue
      const [, , l] = hexToHsl(or, og, ob)
      ;[nr, ng, nb] = hslToRgb(fh, fs, l)
    } else if (blendMode === 'multiply') {
      // Multiply blend: darkens, good for washes
      nr = (or * fillColor[0]) / 255
      ng = (og * fillColor[1]) / 255
      nb = (ob * fillColor[2]) / 255
    } else {
      // Flat: original behavior
      ;[nr, ng, nb] = [fillColor[0], fillColor[1], fillColor[2]]
    }

    // Apply opacity — blend between original and new color
    rd[i]     = Math.round(or + (nr - or) * opacity)
    rd[i + 1] = Math.round(og + (ng - og) * opacity)
    rd[i + 2] = Math.round(ob + (nb - ob) * opacity)
  }

  const stack = [[startX, startY]]
  const visited = new Uint8Array(width * height)

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    const i = idx(x, y)
    if (visited[y * width + x] || !colorMatch(i)) continue
    visited[y * width + x] = 1
    blendPixel(i)
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  return result
}