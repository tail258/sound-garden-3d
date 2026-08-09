import { useCallback, useEffect, useRef, useState } from 'react'
import { mapAudioToPhenotype } from '../../core/audio/mapping'
import type { AudioAnalysisV1, MappingResultV1 } from '../../core/audio/types'
import { createAudioAnalysisTask } from './analyzeAudioInWorker'
import { decodeAudioFile, validateAudioFile } from './audioFile'

export type AudioPipelineStatus = 'idle' | 'validating' | 'decoding' | 'analyzing' | 'ready' | 'error'

interface AudioPipelineState {
  status: AudioPipelineStatus
  progress: number
  fileName: string
  audioUrl: string
  durationSeconds: number
  analysis: AudioAnalysisV1 | null
  mapping: MappingResultV1 | null
  error: string
}

const initialState: AudioPipelineState = {
  status: 'idle',
  progress: 0,
  fileName: '',
  audioUrl: '',
  durationSeconds: 0,
  analysis: null,
  mapping: null,
  error: '',
}

export function useAudioPipeline(onReady: (mapping: MappingResultV1) => void) {
  const [state, setState] = useState(initialState)
  const taskIdRef = useRef(0)
  const cancelRef = useRef<(() => void) | null>(null)
  const audioUrlRef = useRef('')
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const clear = useCallback(() => {
    taskIdRef.current += 1
    cancelRef.current?.()
    cancelRef.current = null
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = ''
    setState(initialState)
  }, [])

  useEffect(() => () => {
    taskIdRef.current += 1
    cancelRef.current?.()
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
  }, [])

  const selectFile = useCallback(async (file: File) => {
    const taskId = taskIdRef.current + 1
    taskIdRef.current = taskId
    cancelRef.current?.()
    cancelRef.current = null
    setState((current) => ({ ...current, status: 'validating', progress: 0.02, error: '' }))

    const fileValidation = validateAudioFile(file)
    if (!fileValidation.success) {
      setState((current) => ({ ...current, status: 'error', error: fileValidation.message, progress: 0 }))
      return
    }

    let candidateUrl = ''
    try {
      candidateUrl = URL.createObjectURL(file)
      setState((current) => ({ ...current, status: 'decoding', progress: 0.08 }))
      const decoded = await decodeAudioFile(file)
      if (taskIdRef.current !== taskId) {
        URL.revokeObjectURL(candidateUrl)
        return
      }

      setState((current) => ({ ...current, status: 'analyzing', progress: 0.18 }))
      const analysisTask = createAudioAnalysisTask(decoded, taskId, (progress) => {
        if (taskIdRef.current === taskId) {
          setState((current) => ({ ...current, progress: 0.18 + progress * 0.72 }))
        }
      })
      cancelRef.current = analysisTask.cancel
      const analysis = await analysisTask.promise
      if (taskIdRef.current !== taskId) {
        URL.revokeObjectURL(candidateUrl)
        return
      }

      const mapping = mapAudioToPhenotype(analysis)
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = candidateUrl
      cancelRef.current = null
      setState({
        status: 'ready',
        progress: 1,
        fileName: file.name,
        audioUrl: candidateUrl,
        durationSeconds: decoded.durationSeconds,
        analysis,
        mapping,
        error: '',
      })
      onReadyRef.current(mapping)
    } catch (error) {
      if (candidateUrl) URL.revokeObjectURL(candidateUrl)
      if (taskIdRef.current !== taskId) return
      cancelRef.current = null
      setState((current) => ({
        ...current,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : '音频处理失败',
      }))
    }
  }, [])

  return { ...state, selectFile, clear }
}
