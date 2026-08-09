import { deepRootTree, mistColony, tidalRosette } from '../genotype/presets'
import type { GenotypeV1, MorphologyFamily } from '../genotype/schema'
import type { AudioAnalysisV1, MappingResultV1 } from './types'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const round = (value: number) => Number(clamp01(value).toFixed(4))

function cloneGenotype(genotype: GenotypeV1): GenotypeV1 {
  return {
    ...genotype,
    morphology: { ...genotype.morphology },
    traits: { ...genotype.traits },
    appearance: { ...genotype.appearance },
    motion: { ...genotype.motion },
    growth: { ...genotype.growth },
  } as GenotypeV1
}

function seedFromFingerprint(fingerprint: string) {
  const parsed = Number.parseInt(fingerprint.slice(0, 8), 16)
  if (Number.isFinite(parsed)) return parsed >>> 0
  let hash = 0x811c9dc5
  for (const character of fingerprint) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function familyScores(analysis: AudioAnalysisV1): Record<MorphologyFamily, number> {
  const feature = analysis.global
  const rhythmic = clamp01(1 - Math.abs(feature.onsetDensity - 0.55) / 0.55)
  const structuredFlux = clamp01(1 - Math.abs(feature.spectralFlux - 0.35) / 0.65)
  const middleCentroid = clamp01(1 - Math.abs(feature.spectralCentroid - 0.35) / 0.65)
  return {
    tree: round(
      feature.lowEnergy * 0.42
      + (1 - feature.spectralCentroid) * 0.24
      + (1 - feature.spectralFlatness) * 0.2
      + (1 - feature.spectralFlux) * 0.14,
    ),
    rosette: round(
      feature.midEnergy * 0.3
      + rhythmic * 0.25
      + structuredFlux * 0.2
      + (1 - feature.silenceRatio) * 0.15
      + middleCentroid * 0.1,
    ),
    colony: round(
      feature.highEnergy * 0.3
      + feature.spectralCentroid * 0.22
      + feature.spectralFlatness * 0.2
      + feature.spectralFlux * 0.18
      + feature.zeroCrossingRate * 0.1,
    ),
  }
}

function selectFamily(scores: Record<MorphologyFamily, number>): MorphologyFamily {
  return (Object.entries(scores) as Array<[MorphologyFamily, number]>).reduce((selected, candidate) => (
    candidate[1] > selected[1] ? candidate : selected
  ))[0]
}

const featurePercent = (value: number) => `${Math.round(value * 100)}%`

export function mapAudioToPhenotype(analysis: AudioAnalysisV1): MappingResultV1 {
  const scores = familyScores(analysis)
  const family = selectFamily(scores)
  const base = family === 'tree' ? deepRootTree : family === 'rosette' ? tidalRosette : mistColony
  const genotype = cloneGenotype(base)
  const feature = analysis.global

  genotype.seed = seedFromFingerprint(analysis.fingerprint)
  genotype.traits = {
    height: round(0.25 + feature.lowEnergy * 0.5 + (1 - feature.spectralCentroid) * 0.25),
    spread: round(0.25 + feature.midEnergy * 0.4 + feature.spectralFlux * 0.25 + feature.highEnergy * 0.1),
    thickness: round(0.2 + feature.rms * 0.5 + feature.lowEnergy * 0.3),
    curvature: round(0.12 + feature.spectralFlux * 0.43 + feature.spectralFlatness * 0.3 + feature.midEnergy * 0.15),
    asymmetry: round(0.08 + feature.spectralFlatness * 0.45 + feature.spectralFlux * 0.35 + feature.highEnergy * 0.12),
    complexity: round(0.2 + feature.onsetDensity * 0.3 + feature.spectralFlux * 0.25 + feature.spectralCentroid * 0.2),
    organDensity: round(0.22 + feature.onsetDensity * 0.32 + feature.rms * 0.25 + feature.highEnergy * 0.16),
    organScale: round(0.28 + feature.rms * 0.32 + feature.lowEnergy * 0.22 + (1 - feature.spectralFlatness) * 0.15),
  }
  genotype.motion = {
    ...genotype.motion,
    speed: Number((0.3 + feature.onsetDensity * 1.4).toFixed(3)),
    amplitude: Number((0.02 + feature.spectralFlux * 0.12).toFixed(3)),
  }

  const growthCues = analysis.segments.map((segment) => ({
    time: round(((segment.start + segment.end) / 2) / analysis.durationSeconds),
    strength: round(segment.rms * 0.5 + segment.spectralFlux * 0.3 + segment.onsetDensity * 0.2),
  }))
  const familyName = family === 'tree' ? '乔木' : family === 'rosette' ? '莲座' : '群落'

  return {
    mappingVersion: 'audio-to-phenotype-v1',
    genotype,
    familyScores: scores,
    growthCues,
    explanations: [
      {
        parameter: '形态族',
        value: familyName,
        reason: `低频 ${featurePercent(feature.lowEnergy)}、中频 ${featurePercent(feature.midEnergy)}、高频 ${featurePercent(feature.highEnergy)} 与频谱变化共同评分。`,
      },
      {
        parameter: '高度',
        value: genotype.traits.height.toFixed(2),
        reason: `低频能量 ${featurePercent(feature.lowEnergy)} 与偏低的频谱质心共同提高纵向生长。`,
      },
      {
        parameter: '粗壮度',
        value: genotype.traits.thickness.toFixed(2),
        reason: `响度 ${featurePercent(feature.rms)} 与低频能量 ${featurePercent(feature.lowEnergy)} 共同提高结构质量感。`,
      },
      {
        parameter: '扩张度',
        value: genotype.traits.spread.toFixed(2),
        reason: `中频能量 ${featurePercent(feature.midEnergy)} 与频谱通量 ${featurePercent(feature.spectralFlux)} 共同决定横向展开。`,
      },
      {
        parameter: '结构复杂度',
        value: genotype.traits.complexity.toFixed(2),
        reason: `起音密度 ${featurePercent(feature.onsetDensity)}、频谱通量与频谱质心共同增加结构层次。`,
      },
      {
        parameter: '固定种子',
        value: String(genotype.seed),
        reason: `种子来自音频指纹 ${analysis.fingerprint}，因此同一段声音会稳定重建同一表型。`,
      },
    ],
  }
}
