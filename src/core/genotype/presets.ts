import type { GenotypeV1 } from './schema'

export const deepRootTree: GenotypeV1 = {
  schemaVersion: 1,
  generatorVersion: 'phenotype-v1',
  seed: 1732050808,
  morphology: { family: 'tree', branchStyle: 'tiered', organShape: 'lance' },
  traits: {
    height: 0.88,
    spread: 0.62,
    thickness: 0.72,
    curvature: 0.22,
    asymmetry: 0.18,
    complexity: 0.72,
    organDensity: 0.66,
    organScale: 0.48,
  },
  appearance: {
    primaryColor: '#1F5A46',
    secondaryColor: '#6FAE63',
    accentColor: '#D8B86A',
    opacity: 1,
    emissiveIntensity: 0.35,
  },
  motion: { mode: 'sway', speed: 0.55, amplitude: 0.05 },
  growth: { durationSeconds: 10 },
}

export const tidalRosette: GenotypeV1 = {
  schemaVersion: 1,
  generatorVersion: 'phenotype-v1',
  seed: 3141592653,
  morphology: { family: 'rosette', layerStyle: 'spiral', organShape: 'spoon' },
  traits: {
    height: 0.28,
    spread: 0.92,
    thickness: 0.34,
    curvature: 0.58,
    asymmetry: 0.12,
    complexity: 0.55,
    organDensity: 0.78,
    organScale: 0.82,
  },
  appearance: {
    primaryColor: '#285F63',
    secondaryColor: '#72B7A7',
    accentColor: '#A8E6CF',
    opacity: 0.98,
    emissiveIntensity: 0.45,
  },
  motion: { mode: 'breathe', speed: 0.75, amplitude: 0.06 },
  growth: { durationSeconds: 8 },
}

export const mistColony: GenotypeV1 = {
  schemaVersion: 1,
  generatorVersion: 'phenotype-v1',
  seed: 2718281828,
  morphology: { family: 'colony', clusterStyle: 'ring', capShape: 'bell' },
  traits: {
    height: 0.46,
    spread: 0.84,
    thickness: 0.38,
    curvature: 0.34,
    asymmetry: 0.58,
    complexity: 0.64,
    organDensity: 0.88,
    organScale: 0.56,
  },
  appearance: {
    primaryColor: '#493B64',
    secondaryColor: '#9A76A5',
    accentColor: '#75D5C8',
    opacity: 0.96,
    emissiveIntensity: 0.65,
  },
  motion: { mode: 'pulse', speed: 0.9, amplitude: 0.08 },
  growth: { durationSeconds: 9 },
}

export const presets = {
  'deep-root-tree': deepRootTree,
  'tidal-rosette': tidalRosette,
  'mist-colony': mistColony,
} as const

export type PresetId = keyof typeof presets
