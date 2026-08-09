import { describe, expect, it } from 'vitest'
import { getGrowthProgress, getLocalGrowthProgress } from './timeline'

describe('growth timeline', () => {
  it('clamps elapsed time to the full growth duration', () => {
    expect(getGrowthProgress(-1, 10)).toBe(0)
    expect(getGrowthProgress(5, 10)).toBe(0.5)
    expect(getGrowthProgress(20, 10)).toBe(1)
  })

  it('maps an organ birth window to a monotonic local progress', () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      getLocalGrowthProgress(progress, 0.25, 0.75),
    )

    expect(samples).toEqual([0, 0, 0.5, 1, 1])
    expect(samples).toEqual([...samples].sort((a, b) => a - b))
  })
})
