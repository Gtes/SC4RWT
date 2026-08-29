import { useCallback, useEffect, useRef, useState } from 'react'
import type { Sc4RegionSize } from '../lib/sc4/constants'
import type { GenerateRequest, LatLon } from '../types/terrain'
import type { WorkerInbound, WorkerOutbound } from '../types/worker'
import { downloadBlob } from '../utils/downloadBlob'
import type { WaterPlaneMode } from '../utils/urlState'

interface UseTerrainWorkerParams {
  center: LatLon
  largeTiles: Sc4RegionSize
  waterPlaneMode: WaterPlaneMode
  waterPlaneMeters: number
  waterDepthMeters: number
  verticalScale: number
  setWaterPlaneMeters: (value: number) => void
  setWaterDepthMeters: (value: number) => void
  setVerticalScale: (value: number) => void
}

export const useTerrainWorker = ({
  center,
  largeTiles,
  waterPlaneMode,
  waterPlaneMeters,
  waterDepthMeters,
  verticalScale,
  setWaterPlaneMeters,
  setWaterDepthMeters,
  setVerticalScale,
}: UseTerrainWorkerParams) => {
  const [lastAutoReason, setLastAutoReason] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const downloadMetaRef = useRef({ largeTiles, center })
  const waterPlaneModeRef = useRef(waterPlaneMode)

  useEffect(() => {
    downloadMetaRef.current = { largeTiles, center }
  }, [largeTiles, center])

  useEffect(() => {
    waterPlaneModeRef.current = waterPlaneMode
  }, [waterPlaneMode])

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/generateTerrain.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker
    worker.onmessage = (ev: MessageEvent<WorkerOutbound>) => {
      const msg = ev.data
      if (msg.type === 'suggestResult') {
        setSuggesting(false)
        setWaterPlaneMeters(msg.applied.waterPlaneMeters)
        setWaterDepthMeters(msg.applied.waterDepthMeters)
        setVerticalScale(msg.applied.verticalScale)
        setLastAutoReason(msg.applied.reason)
        setErrorMessage(null)
        return
      }
      if (msg.type === 'suggestError') {
        setSuggesting(false)
        setErrorMessage(msg.message)
        return
      }
      if (msg.type !== 'progress') return
      const { type: _t, ...progress } = msg
      if (progress.stage === 'done') {
        setBusy(false)
        setErrorMessage(null)
        if (progress.applied) {
          setLastAutoReason(progress.applied.reason)
          if (waterPlaneModeRef.current === 'auto') {
            setWaterPlaneMeters(progress.applied.waterPlaneMeters)
            setWaterDepthMeters(progress.applied.waterDepthMeters)
            setVerticalScale(progress.applied.verticalScale)
          }
        }
        const meta = downloadMetaRef.current
        downloadBlob(
          progress.blob,
          `sc4-${meta.largeTiles}x${meta.largeTiles}-${meta.center.lat.toFixed(4)}_${meta.center.lon.toFixed(4)}.png`,
        )
      } else if (progress.stage === 'error') {
        setBusy(false)
        setSuggesting(false)
        setErrorMessage(progress.message)
      }
    }
    worker.onerror = (err) => {
      setBusy(false)
      setSuggesting(false)
      setErrorMessage(err.message || 'Worker error')
    }
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [setWaterDepthMeters, setVerticalScale, setWaterPlaneMeters])

  const onGenerate = useCallback(() => {
    if (!workerRef.current || busy || suggesting) return
    setBusy(true)
    setErrorMessage(null)
    const request: GenerateRequest = {
      center,
      largeTilesX: largeTiles,
      largeTilesY: largeTiles,
      waterPlaneMode,
      waterPlaneMeters,
      waterDepthMeters,
      verticalScale,
    }
    const msg: WorkerInbound = { type: 'generate', request }
    workerRef.current.postMessage(msg)
  }, [
    busy,
    center,
    largeTiles,
    suggesting,
    waterDepthMeters,
    waterPlaneMeters,
    waterPlaneMode,
    verticalScale,
  ])

  const onCalculateManual = useCallback(() => {
    if (!workerRef.current || busy || suggesting) return
    setSuggesting(true)
    setErrorMessage(null)
    const msg: WorkerInbound = {
      type: 'suggest',
      request: {
        center,
        largeTilesX: largeTiles,
        largeTilesY: largeTiles,
      },
    }
    workerRef.current.postMessage(msg)
  }, [busy, center, largeTiles, suggesting])

  const onResetDefaults = useCallback(() => {
    setWaterPlaneMeters(0)
    setWaterDepthMeters(15)
    setVerticalScale(1)
    setLastAutoReason('')
  }, [setWaterDepthMeters, setVerticalScale, setWaterPlaneMeters])

  const onCancel = useCallback(() => {
    workerRef.current?.postMessage({ type: 'cancel' } satisfies WorkerInbound)
    setBusy(false)
    setSuggesting(false)
    setErrorMessage(null)
  }, [])

  return {
    errorMessage,
    busy,
    suggesting,
    lastAutoReason,
    controlsLocked: busy || suggesting,
    onGenerate,
    onCalculateManual,
    onResetDefaults,
    onCancel,
  }
}
