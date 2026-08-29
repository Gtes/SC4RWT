import {
  generateTerrainPng,
  suggestAdjustmentsForRegion,
} from '../lib/sc4/generate'
import type { WorkerInbound, WorkerOutbound } from '../types/worker'

let cancelled = false

self.onmessage = async (ev: MessageEvent<WorkerInbound>) => {
  const msg = ev.data
  if (msg.type === 'cancel') {
    cancelled = true
    return
  }

  if (msg.type === 'suggest') {
    cancelled = false
    try {
      const applied = await suggestAdjustmentsForRegion(
        msg.request.center,
        msg.request.largeTilesX,
        msg.request.largeTilesY,
        (p) => {
          if (cancelled) return
          const out: WorkerOutbound = { type: 'progress', ...p }
          ;(self as DedicatedWorkerGlobalScope).postMessage(out)
        },
      )
      if (cancelled) return
      const out: WorkerOutbound = { type: 'suggestResult', applied }
      ;(self as DedicatedWorkerGlobalScope).postMessage(out)
    } catch (err) {
      if (cancelled) return
      const message = err instanceof Error ? err.message : String(err)
      const out: WorkerOutbound = { type: 'suggestError', message }
      ;(self as DedicatedWorkerGlobalScope).postMessage(out)
    }
    return
  }

  if (msg.type !== 'generate') return

  cancelled = false
  try {
    await generateTerrainPng(msg.request, (p) => {
      if (cancelled) return
      const out: WorkerOutbound = { type: 'progress', ...p }
      ;(self as DedicatedWorkerGlobalScope).postMessage(out)
    })
  } catch (err) {
    if (cancelled) return
    const message = err instanceof Error ? err.message : String(err)
    const out: WorkerOutbound = { type: 'progress', stage: 'error', message }
    ;(self as DedicatedWorkerGlobalScope).postMessage(out)
  }
}
