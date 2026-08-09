import type { GenotypeV1 } from '../../genotype/schema'
import type { SeededRandom } from '../../random/seededRandom'
import {
  addOrgan,
  clamp,
  finalizeBlueprint,
  round,
  segmentTransform,
} from '../generationUtils'
import { orientationFromDirection } from '../orientation'
import type { OrganDescriptor, Vec3 } from '../types'

export type TreeGenotype = GenotypeV1 & { morphology: Extract<GenotypeV1['morphology'], { family: 'tree' }> }

export function generateTree(genotype: TreeGenotype, random: SeededRandom) {
  const { traits, morphology } = genotype
  const organs: OrganDescriptor[] = []
  const skeleton = random.fork('skeleton')
  const organsRandom = random.fork('organs')
  const height = 2.3 + traits.height * 2.1
  const trunkSegments = 6
  let start: Vec3 = [0, 0.15, 0]

  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + skeleton.range(-0.15, 0.15)
    const length = 0.18 + traits.spread * 0.22
    const end: Vec3 = [Math.cos(angle) * length, 0.1 + index * 0.03, Math.sin(angle) * length]
    const transform = segmentTransform(start, end, 0.05 + traits.thickness * 0.04)
    addOrgan(organs, skeleton, {
      id: `root-${index}`,
      organKind: 'root',
      primitive: { kind: 'segment', variant: 'root' },
      ...transform,
      materialRole: 'primary',
      lodTier: 'core',
      stage: 'base',
      start: 0.01 + index * 0.01,
      end: 0.22 + index * 0.01,
      axis: 'y',
      amplitudeScale: 0.08,
    })
  }

  for (let index = 0; index < trunkSegments; index += 1) {
    const progress = index / trunkSegments
    const sway = traits.curvature * 0.3 * Math.sin(progress * Math.PI)
    const asymmetry = traits.asymmetry * 0.16 * (index % 2 === 0 ? 1 : -1)
    const end: Vec3 = [
      round(sway + asymmetry),
      round(0.2 + progress * height),
      round(sway * 0.55 - asymmetry * 0.4),
    ]
    const transform = segmentTransform(start, end, 0.12 - progress * 0.05 + traits.thickness * 0.04)
    addOrgan(organs, skeleton, {
      id: `trunk-${index}`,
      organKind: 'stem',
      primitive: { kind: 'segment', variant: 'stem' },
      ...transform,
      materialRole: 'primary',
      lodTier: 'core',
      stage: 'body',
      start: 0.12 + progress * 0.18,
      end: 0.42 + progress * 0.18,
      axis: 'y',
      amplitudeScale: 0.2,
    })
    start = end
  }

  const branchCount = 3 + Math.round(traits.complexity * 4)
  const branchTips: Vec3[] = []
  for (let branch = 0; branch < branchCount; branch += 1) {
    const attachProgress = 0.35 + (branch / branchCount) * 0.52
    const attach: Vec3 = [
      start[0] * attachProgress,
      0.2 + height * attachProgress,
      start[2] * attachProgress,
    ]
    const angle = (branch / branchCount) * Math.PI * 2 + organsRandom.range(-0.2, 0.2)
    const outward = 0.55 + traits.spread * 0.75
    const branchEnd: Vec3 = [
      attach[0] + Math.cos(angle) * outward,
      attach[1] + 0.28 + traits.height * 0.32 + (branch % 3 - 1) * 0.08 + organsRandom.range(-0.08, 0.16),
      attach[2] + Math.sin(angle) * outward,
    ]
    branchTips.push(branchEnd)
    const transform = segmentTransform(attach, branchEnd, 0.045 + traits.thickness * 0.025)
    addOrgan(organs, organsRandom, {
      id: `branch-${branch}`,
      organKind: 'branch',
      primitive: { kind: 'segment', variant: 'branch' },
      ...transform,
      materialRole: 'secondary',
      lodTier: 'core',
      stage: 'body',
      start: 0.35 + branch * 0.02,
      end: 0.62 + branch * 0.02,
      axis: 'y',
      amplitudeScale: 0.5,
    })

    const leafCount = 5 + Math.round(traits.organDensity * 8)
    for (let leaf = 0; leaf < leafCount; leaf += 1) {
      const leafProgress = leaf / Math.max(1, leafCount - 1)
      const leafSide = leaf % 2 === 0 ? 1 : -1
      const leafPairProgress = Math.floor(leaf / 2) / Math.max(1, Math.ceil(leafCount / 2) - 1)
      const leafAngle = angle + leafSide * (0.28 + leafPairProgress * 0.66) + organsRandom.range(-0.08, 0.08)
      const leafDistance = 0.12 + leafProgress * 0.45
      const position: Vec3 = [
        branchEnd[0] + Math.cos(leafAngle) * leafDistance,
        branchEnd[1] + leafProgress * 0.3 + organsRandom.range(-0.05, 0.08),
        branchEnd[2] + Math.sin(leafAngle) * leafDistance,
      ]
      const branchDirection: Vec3 = [
        branchEnd[0] - attach[0],
        branchEnd[1] - attach[1],
        branchEnd[2] - attach[2],
      ]
      const leafOutward: Vec3 = [
        position[0] - branchEnd[0],
        position[1] - branchEnd[1],
        position[2] - branchEnd[2],
      ]
      const leafDirection: Vec3 = [
        branchDirection[0] * 0.18 + leafOutward[0] * 0.72,
        branchDirection[1] * 0.18 + leafOutward[1] * 0.72 + 0.16 + traits.curvature * 0.08,
        branchDirection[2] * 0.18 + leafOutward[2] * 0.72,
      ]
      addOrgan(organs, organsRandom, {
        id: `leaf-${branch}-${leaf}`,
        organKind: 'leaf',
        primitive: { kind: 'blade', variant: morphology.organShape },
        position,
        rotation: orientationFromDirection(
          leafDirection,
          [0, 1, 0],
          leafSide * (0.06 + traits.asymmetry * 0.12) + organsRandom.range(-0.08, 0.08),
        ),
        scale: [
          0.16 + traits.organScale * 0.12,
          0.25 + traits.organScale * 0.22,
          0.03,
        ],
        materialRole: leaf % 3 === 0 ? 'primary' : 'secondary',
        lodTier: 'detail',
        stage: 'organ',
        start: 0.55 + leafProgress * 0.12,
        end: 0.78 + leafProgress * 0.1,
        axis: 'y',
        amplitudeScale: 0.8,
      })
    }
  }

  const accentCount = clamp(Math.round(2 + traits.organDensity * 5), 2, 8)
  for (let index = 0; index < accentCount; index += 1) {
    const angle = (index / accentCount) * Math.PI * 2
    const branchTip = branchTips[Math.floor((index / accentCount) * branchTips.length)]
    addOrgan(organs, organsRandom, {
      id: `bud-${index}`,
      organKind: 'accent',
      primitive: { kind: 'orb', variant: 'bud' },
      position: [
        branchTip[0] + Math.cos(angle) * 0.06,
        branchTip[1] + 0.08,
        branchTip[2] + Math.sin(angle) * 0.06,
      ],
      rotation: [0, angle, 0],
      scale: [0.05, 0.05, 0.05],
      materialRole: 'accent',
      lodTier: 'accent',
      stage: 'accent',
      start: 0.78,
      end: 0.98,
      amplitudeScale: 1.1,
    })
  }

  return finalizeBlueprint('tree', organs)
}
