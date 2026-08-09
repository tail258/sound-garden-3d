export interface SeededRandom {
  next(): number
  range(min: number, max: number): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  fork(label: string): SeededRandom
}

function hashLabel(seed: number, label: string): number {
  let hash = (seed ^ 0x811c9dc5) >>> 0

  for (let index = 0; index < label.length; index += 1) {
    hash ^= label.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

export function createSeededRandom(seed: number): SeededRandom {
  const normalizedSeed = seed >>> 0
  let state = normalizedSeed

  return {
    next() {
      state = (state + 0x6d2b79f5) | 0
      let value = Math.imul(state ^ (state >>> 15), 1 | state)
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    },
    range(min, max) {
      return min + (max - min) * this.next()
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1))
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty collection')
      }

      return items[this.int(0, items.length - 1)]
    },
    fork(label) {
      return createSeededRandom(hashLabel(normalizedSeed, label))
    },
  }
}
