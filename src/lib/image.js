export async function compressImage(file, { maxSide = 1280, quality = 0.85 } = {}) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const { w, h } = fit(img.width, img.height, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/webp', quality)
    })
    return { blob, width: w, height: h, type: 'image/webp' }
  } finally { URL.revokeObjectURL(url) }
}
function fit(w, h, maxSide) {
  const s = Math.min(1, maxSide / Math.max(w, h))
  return { w: Math.round(w * s), h: Math.round(h * s) }
}
function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = url
  })
}
