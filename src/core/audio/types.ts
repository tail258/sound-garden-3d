import type { GenotypeV1, MorphologyFamily } from '../genotype/schema'

export interface AudioFeatureSet {
  rms: number
  peak: number
  zeroCrossingRate: number
  silenceRatio: number
  spectralCentroid: number
  spectralRolloff: number
  spectralFlatness: number
  spectralFlux: number
  onsetDensity: number
  lowEnergy: number
  midEnergy: number
  highEnergy: number
}
export interface AudioSegmentV1 extends AudioFeatureSet {
  start: number
  end: number
}

export interface AudioAnalysisV1 {
  analysisVersion: 'audio-analysis-v1'
  fingerprint: string
  durationSeconds: number
  analysisSampleRate: 22_050
  global: AudioFeatureSet
  segments: AudioSegmentV1[]
}

export interface GrowthCueV1 {
  time: number
  strength: number
}

export interface MappingExplanationV1 {
  parameter: string
  value: string
  reason: string
}

export interface MappingResultV1 {
  mappingVersion: 'audio-to-phenotype-v1'
  genotype: GenotypeV1
  familyScores: Record<MorphologyFamily, number>
  growthCues: GrowthCueV1[]
  explanations: MappingExplanationV1[]
}
