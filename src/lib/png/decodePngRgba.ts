import { unzlibSync } from 'fflate'

/**
 * Minimal decoder for 8-bit RGB or RGBA PNGs (Terrarium tiles).
 * Returns raw interleaved RGB(A) bytes without alpha stripping.
 */
export function decodePngToRgba(pngBytes: Uint8Array): {
  width: number
  height: number
  rgba: Uint8Array
} {
  if (
    pngBytes[0] !== 137 ||
    pngBytes[1] !== 80 ||
    pngBytes[2] !== 78 ||
    pngBytes[3] !== 71
  ) {
    throw new Error('Not a PNG file')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = -1
  const idatParts: Uint8Array[] = []

  while (offset + 8 <= pngBytes.length) {
    const len =
      (pngBytes[offset]! << 24) |
      (pngBytes[offset + 1]! << 16) |
      (pngBytes[offset + 2]! << 8) |
      pngBytes[offset + 3]!
    const type = String.fromCharCode(
      pngBytes[offset + 4]!,
      pngBytes[offset + 5]!,
      pngBytes[offset + 6]!,
      pngBytes[offset + 7]!,
    )
    const data = pngBytes.subarray(offset + 8, offset + 8 + len)
    if (type === 'IHDR') {
      width =
        (data[0]! << 24) | (data[1]! << 16) | (data[2]! << 8) | data[3]!
      height =
        (data[4]! << 24) | (data[5]! << 16) | (data[6]! << 8) | data[7]!
      bitDepth = data[8]!
      colorType = data[9]!
    } else if (type === 'IDAT') {
      idatParts.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + len
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(
      `Unsupported PNG (depth=${bitDepth}, colorType=${colorType}); need 8-bit RGB/RGBA`,
    )
  }

  let idatLen = 0
  for (const p of idatParts) idatLen += p.length
  const idat = new Uint8Array(idatLen)
  let o = 0
  for (const p of idatParts) {
    idat.set(p, o)
    o += p.length
  }

  const inflated = unzlibSync(idat)
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const rgba = new Uint8Array(width * height * 4)

  // Filter reconstruction (filters 0–4)
  const prev = new Uint8Array(stride)
  const cur = new Uint8Array(stride)
  let inPos = 0
  for (let y = 0; y < height; y++) {
    const filter = inflated[inPos++]!
    for (let x = 0; x < stride; x++) {
      const raw = inflated[inPos++]!
      const a = x >= bpp ? cur[x - bpp]! : 0
      const b = prev[x]!
      const c = x >= bpp ? prev[x - bpp]! : 0
      let val = raw
      if (filter === 1) val = (raw + a) & 255
      else if (filter === 2) val = (raw + b) & 255
      else if (filter === 3) val = (raw + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
        val = (raw + pr) & 255
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter ${filter}`)
      }
      cur[x] = val
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp
      const di = (y * width + x) * 4
      rgba[di] = cur[si]!
      rgba[di + 1] = cur[si + 1]!
      rgba[di + 2] = cur[si + 2]!
      rgba[di + 3] = bpp === 4 ? cur[si + 3]! : 255
    }
    prev.set(cur)
  }

  return { width, height, rgba }
}
