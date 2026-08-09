import type { PlantBlueprintV1 } from './types'

export function assertValidBlueprint(blueprint: PlantBlueprintV1): void {
  const ids = new Set<string>()

  for (const organ of blueprint.organs) {
    if (ids.has(organ.id)) {
      throw new Error(`重复器官 ID：${organ.id}`)
    }
    ids.add(organ.id)

    const values = [...organ.position, ...organ.rotation, ...organ.scale]
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`器官 ${organ.id} 包含非有限数字`)
    }
    if (organ.growth.start < 0 || organ.growth.end > 1 || organ.growth.start >= organ.growth.end) {
      throw new Error(`器官 ${organ.id} 的生长区间无效`)
    }
  }

  if (!Number.isFinite(blueprint.bounds.radius) || !Number.isFinite(blueprint.bounds.height)) {
    throw new Error('植物边界包含非有限数字')
  }
}
