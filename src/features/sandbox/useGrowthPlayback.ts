import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { advancePlayback } from '../../core/growth/playbackClock'
import { getGrowthProgress } from '../../core/growth/timeline'

interface UseGrowthPlaybackOptions {
  durationSeconds: number
  isPlaying: boolean
  resetToken: number
  onComplete: () => void
  uiUpdateIntervalMs?: number
}

interface PlaybackSnapshot {
  elapsedSeconds: number
  progress: number
}

export function useGrowthPlayback({
  durationSeconds,
  isPlaying,
  resetToken,
  onComplete,
  uiUpdateIntervalMs = 80,
}: UseGrowthPlaybackOptions) {
  const progressRef = useRef(0)
  const elapsedRef = useRef(0)
  const lastFrameAtRef = useRef<number | null>(null)
  const lastUiUpdateAtRef = useRef(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>({
    elapsedSeconds: 0,
    progress: 0,
  })

  onCompleteRef.current = onComplete

  useLayoutEffect(() => {
    elapsedRef.current = 0
    progressRef.current = 0
    lastFrameAtRef.current = null
    lastUiUpdateAtRef.current = 0
    completedRef.current = false
    setSnapshot({ elapsedSeconds: 0, progress: 0 })
  }, [durationSeconds, resetToken])

  useEffect(() => {
    if (!isPlaying || completedRef.current) {
      lastFrameAtRef.current = null
      return
    }

    let frameId = 0
    const tick = (now: number) => {
      const lastFrameAt = lastFrameAtRef.current
      lastFrameAtRef.current = now

      if (lastFrameAt !== null) {
        const next = advancePlayback(elapsedRef.current, now - lastFrameAt, durationSeconds)
        elapsedRef.current = next.elapsedSeconds
        progressRef.current = getGrowthProgress(next.elapsedSeconds, durationSeconds)

        if (now - lastUiUpdateAtRef.current >= uiUpdateIntervalMs || next.completed) {
          lastUiUpdateAtRef.current = now
          setSnapshot({
            elapsedSeconds: next.elapsedSeconds,
            progress: progressRef.current,
          })
        }

        if (next.completed) {
          if (!completedRef.current) {
            completedRef.current = true
            onCompleteRef.current()
          }
          return
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      lastFrameAtRef.current = null
    }
  }, [durationSeconds, isPlaying, resetToken, uiUpdateIntervalMs])

  return {
    progressRef,
    elapsedSeconds: snapshot.elapsedSeconds,
    progress: snapshot.progress,
  }
}
