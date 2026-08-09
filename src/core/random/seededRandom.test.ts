import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './seededRandom'

describe('SeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createSeededRandom(1732050808)
    const second = createSeededRandom(1732050808)

    expect(Array.from({ length: 5 }, () => first.next())).toEqual(
      Array.from({ length: 5 }, () => second.next()),
    )
  })

  it('creates isolated named child streams', () => {
    const root = createSeededRandom(42)
    const first = root.fork('skeleton')
    const second = root.fork('skeleton')
    const different = root.fork('organs')

    expect(first.next()).toBe(second.next())
    expect(first.next()).not.toBe(different.next())
  })

  it('provides bounded integers and picks', () => {
    const random = createSeededRandom(99)

    for (let i = 0; i < 20; i += 1) {
      const value = random.int(3, 7)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)
    }

    expect(['a', 'b', 'c']).toContain(random.pick(['a', 'b', 'c']))
  })
})
