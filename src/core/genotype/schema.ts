import { z } from 'zod'

const unitInterval = z.number().finite().min(0).max(1)
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const treeMorphology = z
  .object({
    family: z.literal('tree'),
    branchStyle: z.enum(['tiered', 'crown', 'weeping']),
    organShape: z.enum(['lance', 'round', 'fan']),
  })
  .strict()

const rosetteMorphology = z
  .object({
    family: z.literal('rosette'),
    layerStyle: z.enum(['radial', 'spiral', 'nested']),
    organShape: z.enum(['spoon', 'blade', 'fan']),
  })
  .strict()

const colonyMorphology = z
  .object({
    family: z.literal('colony'),
    clusterStyle: z.enum(['ring', 'scatter', 'mound']),
    capShape: z.enum(['bell', 'disc', 'orb']),
  })
  .strict()

export const genotypeSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatorVersion: z.literal('phenotype-v1'),
    seed: z.number().finite().int().min(0).max(0xffffffff),
    morphology: z.discriminatedUnion('family', [
      treeMorphology,
      rosetteMorphology,
      colonyMorphology,
    ]),
    traits: z
      .object({
        height: unitInterval,
        spread: unitInterval,
        thickness: unitInterval,
        curvature: unitInterval,
        asymmetry: unitInterval,
        complexity: unitInterval,
        organDensity: unitInterval,
        organScale: unitInterval,
      })
      .strict(),
    appearance: z
      .object({
        primaryColor: color,
        secondaryColor: color,
        accentColor: color,
        opacity: z.number().finite().min(0.65).max(1),
        emissiveIntensity: z.number().finite().min(0).max(1.5),
      })
      .strict(),
    motion: z
      .object({
        mode: z.enum(['breathe', 'sway', 'pulse']),
        speed: z.number().finite().min(0.2).max(2),
        amplitude: z.number().finite().min(0).max(0.2),
      })
      .strict(),
    growth: z
      .object({
        durationSeconds: z.number().finite().min(4).max(16),
      })
      .strict(),
  })
  .strict()

export type GenotypeV1 = z.infer<typeof genotypeSchema>
export type Morphology = GenotypeV1['morphology']
export type MorphologyFamily = Morphology['family']
