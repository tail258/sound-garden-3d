import type { SeededRandom } from '../random/seededRandom'
import { orientationFromDirection } from './orientation'
import type {
  GrowthStage,
  LodTier,
  MaterialRole,
  OrganDescriptor,
  PlantBlueprintV1,
  PrimitiveDescriptor,
  Vec3,
} from './types'

export const MAX_ORGANS = 600
export const MAX_TRIANGLES = 75_000

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function round(value: number): number {
  return Math.round(value * 100_000) / 100_000
}

export function segmentTransform(start: Vec3, end: Vec3, width: number): {
  position: Vec3
  rotation: Vec3
  scale: Vec3
} {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const dz = end[2] - start[2]
  const length = Math.max(0.01, Math.hypot(dx, dy, dz))

  return {
    position: [round((start[0] + end[0]) / 2), round((start[1] + end[1]) / 2), round((start[2] + end[2]) / 2)],
    rotation: orientationFromDirection([dx, dy, dz], [0, 0, 1]),
    scale: [round(width), round(length), round(width)],
  }
}

export function addOrgan(
  organs: OrganDescriptor[],
  random: SeededRandom,
  input: {
    id: string
    organKind: OrganDescriptor['organKind']
    primitive: PrimitiveDescriptor
    position: Vec3
    rotation?: Vec3
    scale: Vec3
    materialRole: MaterialRole
    lodTier: LodTier
    stage: GrowthStage
    start: number
    end: number
    axis?: OrganDescriptor['growth']['axis']
    phase?: number
    amplitudeScale?: number
  },
): void {
  organs.push({
    id: input.id,
    organKind: input.organKind,
    primitive: input.primitive,
    position: input.position.map(round) as Vec3,
    rotation: (input.rotation ?? [0, 0, 0]).map(round) as Vec3,
    scale: input.scale.map((value) => round(Math.max(0.01, value))) as Vec3,
    materialRole: input.materialRole,
    lodTier: input.lodTier,
    growth: {
      stage: input.stage,
      start: round(clamp(input.start, 0, 0.99)),
      end: round(clamp(Math.max(input.end, input.start + 0.01), 0.01, 1)),
      axis: input.axis ?? 'uniform',
    },
    motion: {
      phase: round(input.phase ?? random.range(0, Math.PI * 2)),
      amplitudeScale: round(input.amplitudeScale ?? random.range(0.2, 1)),
    },
  })
}

const triangleCost: Record<PrimitiveDescriptor['kind'], number> = {
  segment: 48,
  blade: 18,
  cap: 64,
  orb: 32,
}

export function estimateTriangles(organs: readonly OrganDescriptor[]): number {
  return organs.reduce((total, organ) => total + triangleCost[organ.primitive.kind], 0)
}

export function calculateBounds(organs: readonly OrganDescriptor[]) {
  if (organs.length === 0) {
    return { center: [0, 0, 0] as Vec3, radius: 1, height: 1 }
  }

  const xs = organs.map((organ) => organ.position[0])
  const ys = organs.map((organ) => organ.position[1])
  const zs = organs.map((organ) => organ.position[2])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const width = Math.max(maxX - minX, maxZ - minZ)

  return {
    center: [round((minX + maxX) / 2), round((minY + maxY) / 2), round((minZ + maxZ) / 2)] as Vec3,
    radius: round(Math.max(0.5, width / 2 + 0.5)),
    height: round(Math.max(1, maxY - minY + 1)),
  }
}

export function finalizeBlueprint(
  family: PlantBlueprintV1['family'],
  organs: OrganDescriptor[],
): PlantBlueprintV1 {
  const warnings: string[] = []
  if (organs.length > MAX_ORGANS) {
    warnings.push(`器官数量已从 ${organs.length} 限制到 ${MAX_ORGANS}`)
    organs = organs.slice(0, MAX_ORGANS)
  }

  const estimatedTriangles = estimateTriangles(organs)
  if (estimatedTriangles > MAX_TRIANGLES) {
    warnings.push(`估算三角面 ${estimatedTriangles} 超过预算`)
  }

  return {
    blueprintVersion: 1,
    generatorVersion: 'phenotype-v1',
    family,
    organs,
    bounds: calculateBounds(organs),
    stats: {
      organCount: organs.length,
      estimatedTriangles,
      warnings,
    },
  }
}
