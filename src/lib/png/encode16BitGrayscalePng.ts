import { zlibSync, unzlibSync } from 'fflate'

/**
 * Pack Uint16Array into big-endian bytes required by PNG 16-bit samples.
 */
export function packUint16BigEndian(values: Uint16Array): Uint8Array {
  const out = new Uint8Array(values.length * 2)
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!
    out[i * 2] = (v >> 8) & 0xff
    out[i * 2 + 1] = v & 0xff
  }
  return out
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

function writeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array([
    type.charCodeAt(0),
    type.charCodeAt(1),
    type.charCodeAt(2),
    type.charCodeAt(3),
  ])
  const len = data.length
  const out = new Uint8Array(4 + 4 + len + 4)
  out.set(u32be(len), 0)
  out.set(typeBytes, 4)
  out.set(data, 8)
  const crcBuf = new Uint8Array(4 + len)
  crcBuf.set(typeBytes, 0)
  crcBuf.set(data, 4)
  out.set(u32be(crc32(crcBuf)), 8 + len)
  return out
}

/**
 * Encode a true 16-bit grayscale PNG (color type 0, bit depth 16).
 *
 * - non-interlaced, filter None
 * - zlib compression level 0 (store)
 * - no ancillary chunks (no gamma/sRGB/iCCP)
 */
export function encode16BitGrayscalePng(
  width: number,
  height: number,
  values: Uint16Array,
): Blob {
  if (values.length !== width * height) {
    throw new Error(
      `Expected ${width * height} samples, got ${values.length}`,
    )
  }

  const packed = packUint16BigEndian(values)
  const rowBytes = width * 2
  const raw = new Uint8Array(height * (1 + rowBytes))
  for (let y = 0; y < height; y++) {
    const dest = y * (1 + rowBytes)
    raw[dest] = 0 // filter None
    raw.set(packed.subarray(y * rowBytes, (y + 1) * rowBytes), dest + 1)
  }

  const compressed = zlibSync(raw, { level: 0 })

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = new Uint8Array(13)
  ihdr.set(u32be(width), 0)
  ihdr.set(u32be(height), 4)
  ihdr[8] = 16 // bit depth
  ihdr[9] = 0 // grayscale
  ihdr[10] = 0 // compression = zlib
  ihdr[11] = 0 // filter method
  ihdr[12] = 0 // no interlace

  const parts = [
    signature,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', new Uint8Array(0)),
  ]

  let total = 0
  for (const p of parts) total += p.length
  const file = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    file.set(p, offset)
    offset += p.length
  }

  return new Blob([file], { type: 'image/png' })
}

/** Decode our own 16-bit grayscale PNG back to Uint16 (test/diagnostics). */
export function decode16BitGrayscalePng(png: Uint8Array): {
  width: number
  height: number
  values: Uint16Array
} {
  if (
    png[0] !== 137 ||
    png[1] !== 80 ||
    png[2] !== 78 ||
    png[3] !== 71
  ) {
    throw new Error('Not a PNG')
  }
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = -1
  const idatParts: Uint8Array[] = []
  while (offset + 8 <= png.length) {
    const len =
      (png[offset]! << 24) |
      (png[offset + 1]! << 16) |
      (png[offset + 2]! << 8) |
      png[offset + 3]!
    const type = String.fromCharCode(
      png[offset + 4]!,
      png[offset + 5]!,
      png[offset + 6]!,
      png[offset + 7]!,
    )
    const data = png.subarray(offset + 8, offset + 8 + len)
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
  if (bitDepth !== 16 || colorType !== 0) {
    throw new Error(`Expected 16-bit gray, got depth=${bitDepth} ctype=${colorType}`)
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
  const rowBytes = width * 2
  const values = new Uint16Array(width * height)
  let inPos = 0
  for (let y = 0; y < height; y++) {
    const filter = inflated[inPos++]!
    if (filter !== 0) throw new Error(`Unexpected filter ${filter}`)
    for (let x = 0; x < width; x++) {
      const hi = inflated[inPos++]!
      const lo = inflated[inPos++]!
      values[y * width + x] = (hi << 8) | lo
    }
    void rowBytes
  }
  return { width, height, values }
}
