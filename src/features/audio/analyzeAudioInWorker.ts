import type { AudioAnalysisV1 } from '../../core/audio/types'
import type { DecodedAudioChannels } from './audioFile'

interface AnalysisTask {
  promise: Promise<AudioAnalysisV1>
  cancel: () => void
}
interface WorkerResponse {
  type: 'progress' | 'result' | 'error'
  taskId: number
  progress?: number
  analysis?: AudioAnalysisV1
  message?: string
}

export function createAudioAnalysisTask(
  decoded: DecodedAudioChannels,
  taskId: number,
  onProgress?: (progress: number) => void,
): AnalysisTask {
  const worker = new Worker(new URL('./audioAnalysis.worker.ts', import.meta.url), { type: 'module' })
  const channelBuffers = decoded.channels.map((channel) => channel.slice().buffer)
  let settled = false

  const promise = new Promise<AudioAnalysisV1>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      if (response.taskId !== taskId) return
      if (response.type === 'progress') {
        onProgress?.(response.progress ?? 0)
        return
      }
      settled = true
      worker.terminate()
      if (response.type === 'result' && response.analysis) resolve(response.analysis)
      else reject(new Error(response.message ?? '音频分析失败'))
    }
    worker.onerror = () => {
      settled = true
      worker.terminate()
      reject(new Error('音频分析 Worker 运行失败'))
    }
    worker.postMessage(
      { type: 'analyze', taskId, sampleRate: decoded.sampleRate, channels: channelBuffers },
      channelBuffers,
    )
  })

  return {
    promise,
    cancel: () => {
      if (!settled) worker.terminate()
    },
  }
}
