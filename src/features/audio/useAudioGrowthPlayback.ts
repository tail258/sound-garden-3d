import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface UseAudioGrowthPlaybackOptions {
  durationSeconds: number
  uiUpdateIntervalMs?: number
}

interface PlaybackSnapshot {
  elapsedSeconds: number
  progress: number
}

export function useAudioGrowthPlayback({
  durationSeconds,
  uiUpdateIntervalMs = 80,
}: UseAudioGrowthPlaybackOptions) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef(0)
  const lastUiUpdateRef = useRef(0)
  const playRequestRef = useRef(0)
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>({ elapsedSeconds: 0, progress: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState('')

  const publish = useCallback((elapsedSeconds: number) => {
    const progress = durationSeconds > 0 ? Math.min(1, Math.max(0, elapsedSeconds / durationSeconds)) : 0
    progressRef.current = progress
    setSnapshot({ elapsedSeconds, progress })
  }, [durationSeconds])

  useLayoutEffect(() => {
    playRequestRef.current += 1
    progressRef.current = 0
    lastUiUpdateRef.current = 0
    setSnapshot({ elapsedSeconds: 0, progress: 0 })
    setIsPlaying(false)
  }, [durationSeconds])

  useEffect(() => {
    if (!isPlaying) return
    let frameId = 0
    const tick = (now: number) => {
      const audio = audioRef.current
      if (!audio) return
      const elapsedSeconds = Math.min(durationSeconds, Math.max(0, audio.currentTime))
      progressRef.current = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 0
      if (now - lastUiUpdateRef.current >= uiUpdateIntervalMs) {
        lastUiUpdateRef.current = now
        setSnapshot({ elapsedSeconds, progress: progressRef.current })
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [durationSeconds, isPlaying, uiUpdateIntervalMs])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    const requestId = playRequestRef.current + 1
    playRequestRef.current = requestId
    try {
      await audio.play()
      if (playRequestRef.current !== requestId) return
      setPlaybackError('')
      setIsPlaying(true)
    } catch {
      if (playRequestRef.current !== requestId) return
      setPlaybackError('浏览器阻止了播放，请再次点击播放')
      setIsPlaying(false)
    }
  }, [])

  const pause = useCallback(() => {
    playRequestRef.current += 1
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const seek = useCallback((progress: number) => {
    const normalized = Math.min(1, Math.max(0, progress))
    const elapsedSeconds = durationSeconds * normalized
    if (audioRef.current) audioRef.current.currentTime = elapsedSeconds
    publish(elapsedSeconds)
  }, [durationSeconds, publish])

  const replay = useCallback(async () => {
    seek(0)
    await play()
  }, [play, seek])

  const handleEnded = useCallback(() => {
    playRequestRef.current += 1
    publish(durationSeconds)
    setIsPlaying(false)
  }, [durationSeconds, publish])

  return {
    audioRef,
    progressRef,
    elapsedSeconds: snapshot.elapsedSeconds,
    progress: snapshot.progress,
    isPlaying,
    playbackError,
    play,
    pause,
    replay,
    seek,
    handleEnded,
  }
}
