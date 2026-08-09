import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGrowthPlayback } from './useGrowthPlayback'

interface ScheduledFrame {
  id: number
  callback: FrameRequestCallback
}

describe('useGrowthPlayback', () => {
  let nextFrameId = 1
  let scheduledFrames: ScheduledFrame[] = []

  const runFrame = (now: number) => {
    const frame = scheduledFrames.shift()
    if (!frame) throw new Error('No animation frame was scheduled')
    act(() => frame.callback(now))
  }

  beforeEach(() => {
    nextFrameId = 1
    scheduledFrames = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextFrameId
      nextFrameId += 1
      scheduledFrames.push({ id, callback })
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      scheduledFrames = scheduledFrames.filter((frame) => frame.id !== id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updates the render ref every frame while throttling the React snapshot', () => {
    const { result } = renderHook(() => useGrowthPlayback({
      durationSeconds: 1,
      isPlaying: true,
      resetToken: 0,
      onComplete: vi.fn(),
      uiUpdateIntervalMs: 100,
    }))

    runFrame(0)
    runFrame(16)

    expect(result.current.progressRef.current).toBeCloseTo(0.016)
    expect(result.current.elapsedSeconds).toBe(0)

    runFrame(120)

    expect(result.current.elapsedSeconds).toBeCloseTo(0.12)
    expect(result.current.progress).toBeCloseTo(0.12)
  })

  it('does not advance while paused and resets immediately when the token changes', () => {
    const onComplete = vi.fn()
    const { result, rerender } = renderHook(
      ({ isPlaying, resetToken }) => useGrowthPlayback({
        durationSeconds: 1,
        isPlaying,
        resetToken,
        onComplete,
        uiUpdateIntervalMs: 20,
      }),
      { initialProps: { isPlaying: true, resetToken: 0 } },
    )

    runFrame(0)
    runFrame(40)
    expect(result.current.progressRef.current).toBeCloseTo(0.04)

    rerender({ isPlaying: false, resetToken: 0 })
    expect(scheduledFrames).toHaveLength(0)
    expect(result.current.progressRef.current).toBeCloseTo(0.04)

    rerender({ isPlaying: false, resetToken: 1 })
    expect(result.current.progressRef.current).toBe(0)
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('completes once and stops scheduling frames at maturity', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useGrowthPlayback({
      durationSeconds: 0.1,
      isPlaying: true,
      resetToken: 0,
      onComplete,
      uiUpdateIntervalMs: 100,
    }))

    runFrame(0)
    runFrame(120)

    expect(result.current.progressRef.current).toBe(1)
    expect(result.current.elapsedSeconds).toBe(0.1)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(scheduledFrames).toHaveLength(0)
  })
})
