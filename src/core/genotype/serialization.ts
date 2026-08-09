import { genotypeSchema, type GenotypeV1 } from './schema'
import { deepRootTree } from './presets'

export type ParseGenotypeResult =
  | { success: true; data: GenotypeV1 }
  | { success: false; message: string }

function canonicalizeGenotype(genotype: GenotypeV1): GenotypeV1 {
  const morphology = genotype.morphology

  return {
    schemaVersion: genotype.schemaVersion,
    generatorVersion: genotype.generatorVersion,
    seed: genotype.seed,
    morphology:
      morphology.family === 'tree'
        ? {
            family: morphology.family,
            branchStyle: morphology.branchStyle,
            organShape: morphology.organShape,
          }
        : morphology.family === 'rosette'
          ? {
              family: morphology.family,
              layerStyle: morphology.layerStyle,
              organShape: morphology.organShape,
            }
          : {
              family: morphology.family,
              clusterStyle: morphology.clusterStyle,
              capShape: morphology.capShape,
            },
    traits: {
      height: genotype.traits.height,
      spread: genotype.traits.spread,
      thickness: genotype.traits.thickness,
      curvature: genotype.traits.curvature,
      asymmetry: genotype.traits.asymmetry,
      complexity: genotype.traits.complexity,
      organDensity: genotype.traits.organDensity,
      organScale: genotype.traits.organScale,
    },
    appearance: {
      primaryColor: genotype.appearance.primaryColor,
      secondaryColor: genotype.appearance.secondaryColor,
      accentColor: genotype.appearance.accentColor,
      opacity: genotype.appearance.opacity,
      emissiveIntensity: genotype.appearance.emissiveIntensity,
    },
    motion: {
      mode: genotype.motion.mode,
      speed: genotype.motion.speed,
      amplitude: genotype.motion.amplitude,
    },
    growth: { durationSeconds: genotype.growth.durationSeconds },
  }
}

export const defaultGenotype = deepRootTree

export function serializeGenotype(genotype: GenotypeV1): string {
  const validated = genotypeSchema.parse(genotype)
  return JSON.stringify(canonicalizeGenotype(validated), null, 2)
}

export function parseGenotypeJson(json: string): ParseGenotypeResult {
  let value: unknown

  try {
    value = JSON.parse(json)
  } catch {
    return { success: false, message: 'JSON 语法错误，请检查逗号和引号。' }
  }

  const result = genotypeSchema.safeParse(value)
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}：${issue.message}`)
      .join('；')
    return { success: false, message }
  }

  return { success: true, data: canonicalizeGenotype(result.data) }
}
