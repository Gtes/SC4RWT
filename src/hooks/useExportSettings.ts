import { useEffect, useState } from 'react'
import type { Sc4RegionSize } from '../lib/sc4/constants'
import type { LatLon } from '../types/terrain'
import {
  parseAppUrlFromLocation,
  replaceAppUrl,
  type WaterPlaneMode,
} from '../utils/urlState'

const initialUrl = parseAppUrlFromLocation()

export const useExportSettings = () => {
  const [center, setCenter] = useState<LatLon>(initialUrl.center)
  const [largeTiles, setLargeTiles] = useState<Sc4RegionSize>(
    initialUrl.largeTiles,
  )
  const [waterPlaneMode, setWaterPlaneMode] = useState<WaterPlaneMode>(
    initialUrl.waterPlaneMode,
  )
  const [waterPlaneMeters, setWaterPlaneMeters] = useState(
    initialUrl.waterPlaneMeters,
  )
  const [waterDepthMeters, setWaterDepthMeters] = useState(
    initialUrl.waterDepthMeters,
  )
  const [verticalScale, setVerticalScale] = useState(initialUrl.verticalScale)

  useEffect(() => {
    const id = window.setTimeout(() => {
      replaceAppUrl({
        center,
        largeTiles,
        waterPlaneMode,
        waterPlaneMeters,
        waterDepthMeters,
        verticalScale,
      })
    }, 150)
    return () => window.clearTimeout(id)
  }, [
    center,
    largeTiles,
    waterDepthMeters,
    waterPlaneMeters,
    waterPlaneMode,
    verticalScale,
  ])

  useEffect(() => {
    const onPopState = () => {
      const next = parseAppUrlFromLocation()
      setCenter(next.center)
      setLargeTiles(next.largeTiles)
      setWaterPlaneMode(next.waterPlaneMode)
      setWaterPlaneMeters(next.waterPlaneMeters)
      setWaterDepthMeters(next.waterDepthMeters)
      setVerticalScale(next.verticalScale)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return {
    center,
    setCenter,
    largeTiles,
    setLargeTiles,
    waterPlaneMode,
    setWaterPlaneMode,
    waterPlaneMeters,
    setWaterPlaneMeters,
    waterDepthMeters,
    setWaterDepthMeters,
    verticalScale,
    setVerticalScale,
  }
}
