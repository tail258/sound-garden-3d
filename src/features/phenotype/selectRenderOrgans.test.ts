import { describe, expect, it } from 'vitest'
import { deepRootTree, mistColony, tidalRosette } from '../../core/genotype/presets'
import { generatePlant } from '../../core/phenotype/generatePlant'
import { selectRenderOrgans } from './selectRenderOrgans'

describe('selectRenderOrgans', () => {
  it('returns the complete stable organ list at full quality', () => {
    const blueprint = generatePlant(deepRootTree)

    expect(selectRenderOrgans(blueprint, 'full')).toEqual(blueprint.organs)
  })

  it('keeps stable leaf anchors for every tree branch at reduced quality', () => {
    const blueprint = generatePlant(deepRootTree)
    const reduced = selectRenderOrgans(blueprint, 'reduced')
    const branchIds = blueprint.organs
      .filter((organ) => organ.organKind === 'branch')
      .map((organ) => organ.id.replace('branch-', ''))

    for (const branchId of branchIds) {
      expect(reduced.some((organ) => organ.id.startsWith(`leaf-${branchId}-`))).toBe(true)
    }
    expect(reduced.some((organ) => organ.lodTier === 'accent')).toBe(false)
  })

  it('keeps leaves in every rosette layer with broad angular coverage', () => {
    const blueprint = generatePlant(tidalRosette)
    const reduced = selectRenderOrgans(blueprint, 'reduced')
    const leafLayers = new Set(
      blueprint.organs
        .filter((organ) => organ.id.startsWith('leaf-'))
        .map((organ) => organ.id.split('-')[1]),
    )

    for (const layer of leafLayers) {
      const leaves = reduced.filter((organ) => organ.id.startsWith(`leaf-${layer}-`))
      expect(leaves.length).toBeGreaterThanOrEqual(3)
      const occupiedQuadrants = new Set(leaves.map((organ) => {
        const angle = Math.atan2(organ.position[2], organ.position[0])
        return Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 4) % 4
      }))
      expect(occupiedQuadrants.size).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps every reduced colony stem paired with its matching cap', () => {
    const blueprint = generatePlant(mistColony)
    const reduced = selectRenderOrgans(blueprint, 'reduced')
    const ids = new Set(reduced.map((organ) => organ.id))

    for (const organ of reduced) {
      if (organ.id.startsWith('stem-')) expect(ids.has(organ.id.replace('stem-', 'cap-'))).toBe(true)
      if (organ.id.startsWith('cap-')) expect(ids.has(organ.id.replace('cap-', 'stem-'))).toBe(true)
    }
  })

  it('is deterministic and remains inside the reduced instance budget', () => {
    for (const genotype of [deepRootTree, tidalRosette, mistColony]) {
      const blueprint = generatePlant(genotype)
      const first = selectRenderOrgans(blueprint, 'reduced')
      const second = selectRenderOrgans(blueprint, 'reduced')

      expect(first).toEqual(second)
      expect(first.length).toBeLessThanOrEqual(300)
    }
  })
})
