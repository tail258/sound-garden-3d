import { describe, expect, it } from 'vitest'
import { genotypeSchema } from '../genotype/schema'
import { mapAudioToPhenotype } from './mapping'
import type { AudioAnalysisV1, AudioFeatureSet } from './types'

const baseFeatures: AudioFeatureSet = {
  rms: 0.5,
  peak: 0.8,
  zeroCrossingRate: 0.2,
  silenceRatio: 0.05,
  spectralCentroid: 0.3,
  spectralRolloff: 0.4,
  spectralFlatness: 0.2,
  spectralFlux: 0.25,
  onsetDensity: 0.4,
  lowEnergy: 0.25,
  midEnergy: 0.65,
  highEnergy: 0.1,
}

function analysis(overrides: Partial<AudioFeatureSet>): AudioAnalysisV1 {
  const global = { ...baseFeatures, ...overrides }
  return {
    analysisVersion: 'audio-analysis-v1',
    analysisSampleRate: 22_050,
    fingerprint: '8badf00d',
    durationSeconds: 16,
    global,
    segments: Array.from({ length: 8 }, (_, index) => ({
      start: index * 2,
      end: index * 2 + 2,
      ...global,
      rms: Math.min(1, global.rms + index * 0.02),
    })),
  }
}

describe('mapAudioToPhenotype', () => {
  it.each([
    ['tree', { lowEnergy: 0.9, midEnergy: 0.08, highEnergy: 0.02, spectralCentroid: 0.05, spectralFlatness: 0.05, spectralFlux: 0.04 }],
    ['rosette', { lowEnergy: 0.05, midEnergy: 0.9, highEnergy: 0.05, spectralCentroid: 0.35, spectralFlatness: 0.25, spectralFlux: 0.35, onsetDensity: 0.6 }],
    ['colony', { lowEnergy: 0.04, midEnergy: 0.11, highEnergy: 0.85, spectralCentroid: 0.75, spectralFlatness: 0.8, spectralFlux: 0.75, zeroCrossingRate: 0.6 }],
  ] as const)('selects %s from its characteristic sound profile', (family, features) => {
    const result = mapAudioToPhenotype(analysis(features))

    expect(result.genotype.morphology.family).toBe(family)
    expect(result.familyScores[family]).toBe(Math.max(...Object.values(result.familyScores)))
    expect(genotypeSchema.safeParse(result.genotype).success).toBe(true)
  })

  it('derives a stable seed, bounded traits, cues, and readable explanations', () => {
    const input = analysis({ spectralFlux: 0.5, onsetDensity: 0.7 })
    const first = mapAudioToPhenotype(input)

    expect(first).toEqual(mapAudioToPhenotype(input))
    expect(first.mappingVersion).toBe('audio-to-phenotype-v1')
    expect(first.genotype.seed).toBe(0x8badf00d)
    expect(Object.values(first.genotype.traits).every((value) => value >= 0 && value <= 1)).toBe(true)
    expect(first.growthCues).toHaveLength(input.segments.length)
    expect(first.growthCues.every((cue) => cue.time >= 0 && cue.time <= 1 && cue.strength >= 0 && cue.strength <= 1)).toBe(true)
    expect(first.explanations.map((item) => item.parameter)).toEqual([
      '形态族',
      '高度',
      '粗壮度',
      '扩张度',
      '结构复杂度',
      '固定种子',
    ])
    expect(first.explanations.find((item) => item.parameter === '粗壮度')?.reason).toContain('低频能量')
    expect(first.explanations.find((item) => item.parameter === '结构复杂度')?.reason).toContain('起音密度')
    expect(first.explanations.every((item) => item.reason.length > 8)).toBe(true)
  })
})
