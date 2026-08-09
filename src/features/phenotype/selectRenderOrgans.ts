import type { OrganDescriptor, PlantBlueprintV1 } from '../../core/phenotype/types'

export type RenderQuality = 'full' | 'reduced'

function selectTreeOrgans(organs: readonly OrganDescriptor[]): OrganDescriptor[] {
  return organs.filter((organ) => {
    if (organ.lodTier === 'core') return true
    if (!organ.id.startsWith('leaf-')) return false
    const leafIndex = Number(organ.id.split('-')[2])
    return Number.isInteger(leafIndex) && leafIndex % 3 === 0
  })
}

function selectRosetteOrgans(organs: readonly OrganDescriptor[]): OrganDescriptor[] {
  const selectedIds = new Set(
    organs.filter((organ) => organ.lodTier === 'core').map((organ) => organ.id),
  )
  const layers = new Map<string, OrganDescriptor[]>()

  for (const organ of organs) {
    if (!organ.id.startsWith('leaf-')) continue
    const layer = organ.id.split('-')[1]
    const current = layers.get(layer) ?? []
    current.push(organ)
    layers.set(layer, current)
  }

  for (const leaves of layers.values()) {
    leaves.sort((left, right) => {
      const leftIndex = Number(left.id.split('-')[2])
      const rightIndex = Number(right.id.split('-')[2])
      return leftIndex - rightIndex
    })
    for (const fraction of [0, 1 / 3, 2 / 3]) {
      selectedIds.add(leaves[Math.floor(leaves.length * fraction)].id)
    }
  }

  return organs.filter((organ) => selectedIds.has(organ.id))
}

function selectColonyOrgans(organs: readonly OrganDescriptor[]): OrganDescriptor[] {
  return organs.filter((organ) => organ.lodTier === 'core')
}

export function selectRenderOrgans(
  blueprint: PlantBlueprintV1,
  quality: RenderQuality,
): PlantBlueprintV1['organs'] {
  if (quality === 'full') return blueprint.organs

  const selected = blueprint.family === 'tree'
    ? selectTreeOrgans(blueprint.organs)
    : blueprint.family === 'rosette'
      ? selectRosetteOrgans(blueprint.organs)
      : selectColonyOrgans(blueprint.organs)

  return selected.slice(0, 300)
}
