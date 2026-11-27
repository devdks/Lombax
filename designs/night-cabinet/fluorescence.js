export const specimens = {
  fluorite: {
    name: 'Fluorite', formula: 'CaF₂', color: 'violet-blue', tint: [102, 82, 255],
    alt: 'Intergrown lavender fluorite cubes with stepped faces',
  },
  calcite: {
    name: 'Calcite', formula: 'CaCO₃', color: 'orange-red', tint: [255, 76, 33],
    alt: 'Ivory calcite crystals tapering to sharp points',
  },
  willemite: {
    name: 'Willemite', formula: 'Zn₂SiO₄', color: 'yellow-green', tint: [139, 255, 37],
    alt: 'An irregular piece of dark rock mottled with olive willemite grains',
  },
}

export function renderFluorescence(image, canvas, mineral) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return false

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  context.drawImage(image, 0, 0)
  const bitmap = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = bitmap.data
  const { tint } = specimens[mineral]
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const light = (0.3 * r + 0.59 * g + 0.11 * b) / 255
    // Keep the surrounding rock dark by weighting the olive-colored grains.
    const response = mineral === 'willemite' ? Math.min(1, Math.max(0, (g - b) / 42)) : 1
    const intensity = Math.pow(light, 0.72) * response
    for (let channel = 0; channel < 3; channel++) {
      pixels[i + channel] = 1.5 * intensity * tint[channel] + 28 * light
    }
  }
  context.putImageData(bitmap, 0, 0)
  return true
}
