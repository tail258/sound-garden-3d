import { describe, expect, it } from 'vitest'
import { deepRootTree } from '../genotype/presets'
import { generatePlant } from '../phenotype/generatePlant'
import { scheduleGrowthFromAudio } from './scheduleGrowth'

describe('scheduleGrowthFromAudio', () => {
  it('changes only growth timing and leaves its input untouched', () => {
    const blueprint = generatePlant(deepRootTree)
    const original = structuredClone(blueprint)
    const scheduled = scheduleGrowthFromAudio(blueprint, [
      { time: 0.12, strength: 1 },
      { time: 0.72, strength: 0.25 },
    ])

    expect(blueprint).toEqual(original)
    expect(scheduled).toEqual(scheduleGrowthFromAudio(blueprint, [
      { time: 0.12, strength: 1 },
      { time: 0.72, strength: 0.25 },
    ]))
    expect(scheduled.organs.map(({ growth: _growth, ...organ }) => organ)).toEqual(
      blueprint.organs.map(({ growth: _growth, ...organ }) => organ),
    )
    expect(scheduled.bounds).toEqual(blueprint.bounds)
    expect(scheduled.stats).toEqual(blueprint.stats)
    expect(scheduled.organs.some((organ, index) => organ.growth.start !== blueprint.organs[index].growth.start)).toBe(true)
  })

  it('keeps every remapped interval valid and reaches maturity at one', () => {
    const scheduled = scheduleGrowthFromAudio(generatePlant(deepRootTree), [
      { time: 0, strength: 0 },
      { time: 0.45, strength: 1 },
      { time: 1, strength: 0.2 },
    ])

    for (const organ of scheduled.organs) {
      expect(organ.growth.start).toBeGreaterThanOrEqual(0)
      expect(organ.growth.end).toBeLessThanOrEqual(1)
      expect(organ.growth.end).toBeGreaterThan(organ.growth.start)
    }
    expect(Math.max(...scheduled.organs.map((organ) => organ.growth.end))).toBe(1)
  })
})
