/// <reference lib="webworker" />

import { analyzePcm } from '../../core/audio/analyzePcm'

interface AnalyzeRequest {
  type: 'analyze'
  taskId: number
  sampleRate: number
  channels: ArrayBuffer[]
}

self.onmessage = (event: MessageEvent<AnalyzeRequest>) => {
  const { taskId, sampleRate, channels } = event.data
  try {
    self.postMessage({ type: 'progress', taskId, progress: 0.12 })
    const analysis = analyzePcm(channels.map((channel) => new Float32Array(channel)), sampleRate)
    self.postMessage({ type: 'result', taskId, analysis })
  } catch (error) {
    self.postMessage({
      type: 'error',
      taskId,
      message: error instanceof Error ? error.message : '音频分析失败',
    })
  }
}

export {}
