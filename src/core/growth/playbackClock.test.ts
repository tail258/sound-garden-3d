import { describe, expect, it } from 'vitest'
import { advancePlayback } from './playbackClock'

describe('advancePlayback', () => {
  it('advances monotonically and clamps exactly at the duration', () => {
    expect(advancePlayback(1.5, 250, 2)).toEqual({
      elapsedSeconds: 1.75,
      completed: false,
    })
    expect(advancePlayback(1.75, 500, 2)).toEqual({
      elapsedSeconds: 2,
      completed: true,
    })
    expect(advancePlayback(1, -50, 2)).toEqual({
      elapsedSeconds: 1,
      completed: false,
    })
  })

  it('completes immediately for a non-positive duration without returning non-finite values', () => {
    expect(advancePlayback(0, 16, 0)).toEqual({
      elapsedSeconds: 0,
      completed: true,
    })
  })
})
