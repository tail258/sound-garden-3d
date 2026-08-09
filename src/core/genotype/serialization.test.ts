import { describe, expect, it } from 'vitest'
import {
  defaultGenotype,
  parseGenotypeJson,
  serializeGenotype,
} from './serialization'

describe('GenotypeV1 serialization', () => {
  it('round trips a valid genotype without changing its canonical data', () => {
    const json = serializeGenotype(defaultGenotype)
    const parsed = parseGenotypeJson(json)

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(serializeGenotype(parsed.data)).toBe(json)
    }
  })

  it('rejects unsupported versions and reports a field path', () => {
    const parsed = parseGenotypeJson(
      JSON.stringify({ ...defaultGenotype, schemaVersion: 99 }),
    )

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.message).toContain('schemaVersion')
    }
  })

  it('rejects non-finite and out-of-range values', () => {
    const parsed = parseGenotypeJson(
      JSON.stringify({
        ...defaultGenotype,
        seed: -1,
        traits: { ...defaultGenotype.traits, height: 2 },
      }),
    )

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.message).toContain('seed')
      expect(parsed.message).toContain('traits.height')
    }
  })
})
