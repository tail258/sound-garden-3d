import type { GenotypeV1 } from '../../genotype/schema'
import type { SeededRandom } from '../../random/seededRandom'
import { addOrgan, finalizeBlueprint, segmentTransform } from '../generationUtils'
import { orientationFromDirection } from '../orientation'
import type { OrganDescriptor } from '../types'

export type RosetteGenotype = GenotypeV1 & { morphology: Extract<GenotypeV1['morphology'], { family: 'rosette' }> }

export function generateRosette(genotype: RosetteGenotype, random: SeededRandom) {
  const { traits, morphology } = genotype
  const organs: OrganDescriptor[] = []
  const baseRandom = random.fork('skeleton')
  const leafRandom = random.fork('organs')

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2
    const start: [number, number, number] = [0, 0.12, 0]
    const end: [number, number, number] = [Math.cos(angle) * 0.3, 0.14, Math.sin(angle) * 0.3]
    addOrgan(organs, baseRandom, {
      id: `root-${index}`,
      organKind: 'root',
      primitive: { kind: 'segment', variant: 'root' },
      ...segmentTransform(start, end, 0.035 + traits.thickness * 0.035),
      materialRole: 'primary',
      lodTier: 'core',
      stage: 'base',
      start: 0.02,
      end: 0.24,
      axis: 'y',
    })
  }

  const layers = 3 + Math.round(traits.complexity * 2)
  const leavesPerLayer = 6 + Math.round(traits.organDensity * 6)
  for (let layer = 0; layer < layers; layer += 1) {
    const layerProgress = layer / Math.max(1, layers - 1)
    const radius = 0.22 + layerProgress * (0.85 + traits.spread * 0.85)
    const leafHeight = 0.22 + layerProgress * (0.38 + traits.height * 0.8)

    for (let leaf = 0; leaf < leavesPerLayer; leaf += 1) {
      const progress = leaf / leavesPerLayer
      const baseAngle = (leaf / leavesPerLayer) * Math.PI * 2
      const angleOffset = morphology.layerStyle === 'spiral' ? layer * 0.55 : 0
      const angle = baseAngle + angleOffset + leafRandom.range(-0.08, 0.08)
      const position: [number, number, number] = [
        Math.cos(angle) * radius,
        leafHeight + leafRandom.range(-0.04, 0.05),
        Math.sin(angle) * radius,
      ]
      const horizontalLift = 0.72 + layerProgress * 0.35
      const verticalLift = 1.18 - layerProgress * 0.62 + traits.height * 0.18
      addOrgan(organs, leafRandom, {
        id: `leaf-${layer}-${leaf}`,
        organKind: 'leaf',
        primitive: { kind: 'blade', variant: morphology.organShape },
        position,
        rotation: orientationFromDirection(
          [Math.cos(angle) * horizontalLift, verticalLift, Math.sin(angle) * horizontalLift],
          [0, 1, 0],
          traits.asymmetry * Math.sin(angle) * 0.24 + leafRandom.range(-0.08, 0.08),
        ),
        scale: [
          0.12 + traits.organScale * 0.11 + traits.thickness * 0.08,
          0.28 + traits.organScale * 0.35 + layerProgress * 0.1,
          0.02 + traits.thickness * 0.03,
        ],
        materialRole: layer % 2 === 0 ? 'primary' : 'secondary',
        lodTier: 'detail',
        stage: 'organ',
        start: 0.36 + layerProgress * 0.25 + progress * 0.04,
        end: 0.68 + layerProgress * 0.16 + progress * 0.04,
        axis: 'y',
        amplitudeScale: 0.7,
      })
    }
  }

  addOrgan(organs, leafRandom, {
    id: 'center-bud',
    organKind: 'accent',
    primitive: { kind: 'orb', variant: 'bud' },
    position: [0, 0.6 + traits.height * 0.55, 0],
    scale: Array(3).fill(0.11 + traits.thickness * 0.08) as [number, number, number],
    materialRole: 'accent',
    lodTier: 'accent',
    stage: 'accent',
    start: 0.75,
    end: 0.96,
    amplitudeScale: 1,
  })

  return finalizeBlueprint('rosette', organs)
}
