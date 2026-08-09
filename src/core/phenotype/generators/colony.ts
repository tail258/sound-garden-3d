import type { GenotypeV1 } from '../../genotype/schema'
import type { SeededRandom } from '../../random/seededRandom'
import { addOrgan, finalizeBlueprint, segmentTransform } from '../generationUtils'
import { orientationFromDirection } from '../orientation'
import type { OrganDescriptor } from '../types'

export type ColonyGenotype = GenotypeV1 & { morphology: Extract<GenotypeV1['morphology'], { family: 'colony' }> }

export function generateColony(genotype: ColonyGenotype, random: SeededRandom) {
  const { traits, morphology } = genotype
  const organs: OrganDescriptor[] = []
  const baseRandom = random.fork('skeleton')
  const colonyRandom = random.fork('organs')
  const count = 7 + Math.round(traits.organDensity * 17)
  const spread = 0.45 + traits.spread * 1.25

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2
    const start: [number, number, number] = [0, 0.08, 0]
    const end: [number, number, number] = [Math.cos(angle) * 0.28, 0.12, Math.sin(angle) * 0.28]
    addOrgan(organs, baseRandom, {
      id: `mycelium-${index}`,
      organKind: 'root',
      primitive: { kind: 'segment', variant: 'root' },
      ...segmentTransform(start, end, 0.04),
      materialRole: 'primary',
      lodTier: 'core',
      stage: 'base',
      start: 0.02,
      end: 0.22,
      axis: 'y',
    })
  }

  for (let index = 0; index < count; index += 1) {
    const progress = index / Math.max(1, count - 1)
    const tierCount = 1 + Math.round(traits.complexity * 3)
    const tierProgress = tierCount === 1 ? 0.5 : (index % tierCount) / (tierCount - 1)
    const tierOffset = (tierProgress - 0.5) * traits.complexity
    const ringAngle = (index / count) * Math.PI * 2
    const angle = morphology.clusterStyle === 'ring' ? ringAngle : ringAngle + colonyRandom.range(-0.42, 0.42)
    const baseRadius = morphology.clusterStyle === 'mound'
      ? spread * (0.2 + progress * 0.7)
      : spread * (0.45 + colonyRandom.range(-0.16, 0.16))
    const radius = baseRadius * (1 + tierOffset * 0.3)
    const x = Math.cos(angle) * radius + traits.asymmetry * 0.25
    const z = Math.sin(angle) * radius
    const stemHeight = 0.25 + traits.height * 0.65 + colonyRandom.range(-0.08, 0.24) + tierOffset * 0.35
    const base: [number, number, number] = [x, 0.12, z]
    const leanAngle = angle + (index % 2 === 0 ? Math.PI / 2 : -Math.PI / 2) + colonyRandom.range(-0.28, 0.28)
    const leanAmount = 0.03 + traits.curvature * 0.08 + colonyRandom.range(0, 0.04)
    const stemTop: [number, number, number] = [
      x + Math.cos(leanAngle) * leanAmount,
      stemHeight,
      z + Math.sin(leanAngle) * leanAmount,
    ]
    const stemDirection: [number, number, number] = [
      stemTop[0] - base[0],
      stemTop[1] - base[1],
      stemTop[2] - base[2],
    ]
    const stemLength = Math.max(0.01, Math.hypot(...stemDirection))
    const capPosition: [number, number, number] = [
      stemTop[0] + (stemDirection[0] / stemLength) * 0.14,
      stemTop[1] + (stemDirection[1] / stemLength) * 0.14,
      stemTop[2] + (stemDirection[2] / stemLength) * 0.14,
    ]
    addOrgan(organs, colonyRandom, {
      id: `stem-${index}`,
      organKind: 'stem',
      primitive: { kind: 'segment', variant: 'stem' },
      ...segmentTransform(base, stemTop, 0.035 + traits.thickness * 0.025),
      materialRole: 'secondary',
      lodTier: 'core',
      stage: 'body',
      start: 0.14 + progress * 0.28,
      end: 0.46 + progress * 0.2,
      axis: 'y',
      amplitudeScale: 0.4,
    })
    addOrgan(organs, colonyRandom, {
      id: `cap-${index}`,
      organKind: 'cap',
      primitive: { kind: 'cap', variant: morphology.capShape },
      position: capPosition,
      rotation: orientationFromDirection(stemDirection, [0, 1, 0], colonyRandom.range(-0.04, 0.04)),
      scale: [
        (0.14 + traits.organScale * 0.13) * (1 + tierOffset * 0.34),
        (0.09 + traits.organScale * 0.06) * (1 + tierOffset * 0.34),
        (0.14 + traits.organScale * 0.13) * (1 + tierOffset * 0.34),
      ],
      materialRole: index % 3 === 0 ? 'primary' : 'secondary',
      lodTier: 'core',
      stage: 'organ',
      start: 0.42 + progress * 0.2,
      end: 0.76 + progress * 0.12,
      axis: 'y',
      amplitudeScale: 0.5,
    })
    if (index % 3 === 0) {
      addOrgan(organs, colonyRandom, {
        id: `spore-${index}`,
        organKind: 'spore',
        primitive: { kind: 'orb', variant: 'spore' },
        position: [stemTop[0] + colonyRandom.range(-0.15, 0.15), stemTop[1] + 0.24, stemTop[2] + colonyRandom.range(-0.15, 0.15)],
        scale: [0.035, 0.035, 0.035],
        materialRole: 'accent',
        lodTier: 'accent',
        stage: 'accent',
        start: 0.7 + progress * 0.1,
        end: 0.98,
        amplitudeScale: 1.2,
      })
    }
  }

  return finalizeBlueprint('colony', organs)
}
