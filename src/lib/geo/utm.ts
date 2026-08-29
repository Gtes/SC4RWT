/**
 * UTM zone number from longitude (1–60).
 * Throws for polar latitudes outside practical UTM use.
 */
export function utmZoneFromLon(lon: number): number {
  if (lon < -180 || lon > 180) {
    throw new Error(`Longitude out of range: ${lon}`)
  }
  return Math.floor((lon + 180) / 6) + 1
}

export function assertSupportedLatitude(lat: number): void {
  if (lat < -80 || lat > 84) {
    throw new Error(
      `Latitude ${lat} is outside UTM support (±80°S–84°N). Choose a non-polar location.`,
    )
  }
}

export function utmEpsg(zone: number, northern: boolean): string {
  if (zone < 1 || zone > 60) {
    throw new Error(`Invalid UTM zone: ${zone}`)
  }
  const base = northern ? 32600 : 32700
  return `EPSG:${base + zone}`
}

export function describeUtm(lat: number, lon: number): {
  zone: number
  northern: boolean
  epsg: string
} {
  assertSupportedLatitude(lat)
  const zone = utmZoneFromLon(lon)
  const northern = lat >= 0
  return { zone, northern, epsg: utmEpsg(zone, northern) }
}
