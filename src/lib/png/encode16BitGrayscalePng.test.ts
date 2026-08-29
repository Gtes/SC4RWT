import { describe, expect, it } from 'vitest'
import {
  decode16BitGrayscalePng,
  encode16BitGrayscalePng,
  packUint16BigEndian,
} from './encode16BitGrayscalePng'

describe('16-bit PNG encoder', () => {
  it('packs big-endian', () => {
    const packed = packUint16BigEndian(new Uint16Array([2500, 0xabcd]))
    expect(packed[0]).toBe(0x09)
    expect(packed[1]).toBe(0xc4)
    expect(packed[2]).toBe(0xab)
    expect(packed[3]).toBe(0xcd)
  })

  it('writes PNG signature and 16-bit grayscale IHDR', async () => {
    const w = 4
    const h = 4
    const values = new Uint16Array(w * h)
    values.fill(100)
    values[0] = 10
    values[w - 1] = 20
    values[(h - 1) * w] = 30
    values[h * w - 1] = 40

    const blob = encode16BitGrayscalePng(w, h, values)
    const buf = new Uint8Array(await blob.arrayBuffer())
    expect([...buf.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    expect(String.fromCharCode(...buf.slice(12, 16))).toBe('IHDR')
    expect(buf[24]).toBe(16)
    expect(buf[25]).toBe(0)
  })

  it('round-trips sea-level 2500 for 257×257 (SC4 1×1)', async () => {
    const w = 257
    const h = 257
    const values = new Uint16Array(w * h).fill(2500)
    values[0] = 10
    values[w - 1] = 20
    values[(h - 1) * w] = 30
    values[h * w - 1] = 40

    const blob = encode16BitGrayscalePng(w, h, values)
    const buf = new Uint8Array(await blob.arrayBuffer())
    const decoded = decode16BitGrayscalePng(buf)
    expect(decoded.width).toBe(257)
    expect(decoded.height).toBe(257)
    expect(decoded.values[0]).toBe(10)
    expect(decoded.values[w - 1]).toBe(20)
    expect(decoded.values[(h - 1) * w]).toBe(30)
    expect(decoded.values[h * w - 1]).toBe(40)
    expect(decoded.values[100]).toBe(2500)
  })

  it('contains only IHDR/IDAT/IEND (no gamma/profile chunks)', async () => {
    const blob = encode16BitGrayscalePng(8, 8, new Uint16Array(64).fill(2500))
    const buf = new Uint8Array(await blob.arrayBuffer())
    const types: string[] = []
    let o = 8
    while (o + 8 <= buf.length) {
      const len =
        (buf[o]! << 24) | (buf[o + 1]! << 16) | (buf[o + 2]! << 8) | buf[o + 3]!
      types.push(
        String.fromCharCode(buf[o + 4]!, buf[o + 5]!, buf[o + 6]!, buf[o + 7]!),
      )
      o += 12 + len
      if (types[types.length - 1] === 'IEND') break
    }
    expect(types).toEqual(['IHDR', 'IDAT', 'IEND'])
  })
})
