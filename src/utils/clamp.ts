export const clampNumber = (n: number, min: number, max: number): number => {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}
