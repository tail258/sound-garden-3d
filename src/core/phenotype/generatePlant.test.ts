import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { presets } from '../genotype/presets'
import { generatePlant } from './generatePlant'
import type { PlantBlueprintV1 } from './types'

const presetList = Object.values(presets)

function worldAxis(rotation: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(...rotation, 'XYZ')).normalize()
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function expectValidBlueprint(blueprint: PlantBlueprintV1) {
  expect(blueprint.organs.length).toBeGreaterThan(0)
  expect(blueprint.organs.length).toBeLessThanOrEqual(600)
  expect(blueprint.stats.estimatedTriangles).toBeLessThanOrEqual(75_000)
  expect(new Set(blueprint.organs.map((organ) => organ.id)).size).toBe(
    blueprint.organs.length,
  )

  for (const organ of blueprint.organs) {
    expect(organ.growth.start).toBeGreaterThanOrEqual(0)
    expect(organ.growth.end).toBeLessThanOrEqual(1)
    expect(organ.growth.start).toBeLessThan(organ.growth.end)
    for (const value of [...organ.position, ...organ.rotation, ...organ.scale]) {
      expect(Number.isFinite(value)).toBe(true)
    }
  }
}

describe('PlantBlueprintV1 generators', () => {
  it('generates the same blueprint for the same genotype', () => {
    for (const genotype of presetList) {
      expect(generatePlant(genotype)).toEqual(generatePlant(genotype))
    }
  })

  it('keeps the three prototype silhouettes structurally distinct', () => {
    const blueprints = presetList.map(generatePlant)
    const families = blueprints.map((blueprint) => blueprint.family)

    expect(new Set(families)).toEqual(new Set(['tree', 'rosette', 'colony']))
    expect(new Set(blueprints.map((blueprint) => blueprint.organs.length)).size).toBe(3)
  })

  it('anchors every tree bud to the leafy crown instead of leaving floating accents', () => {
    const blueprint = generatePlant(presets['deep-root-tree'])
    const leaves = blueprint.organs.filter((organ) => organ.organKind === 'leaf')
    const buds = blueprint.organs.filter((organ) => organ.organKind === 'accent')

    for (const bud of buds) {
      const nearestLeafDistance = Math.min(...leaves.map((leaf) => Math.hypot(
        bud.position[0] - leaf.position[0],
        bud.position[1] - leaf.position[1],
        bud.position[2] - leaf.position[2],
      )))
      expect(nearestLeafDistance).toBeLessThan(0.3)
    }
  })

  it('alternates tree leaves around each branch instead of lining them up on one side', () => {
    const blueprint = generatePlant(presets['deep-root-tree'])
    const branches = blueprint.organs.filter((organ) => organ.organKind === 'branch')

    for (const branch of branches) {
      const branchDirection = worldAxis(branch.rotation)
      const branchEnd = new THREE.Vector3(...branch.position).addScaledVector(branchDirection, branch.scale[1] / 2)
      const branchAngle = Math.atan2(branchDirection.z, branchDirection.x)
      const leaves = blueprint.organs
        .filter((organ) => organ.id.startsWith(`${branch.id.replace('branch-', 'leaf-')}-`))
        .sort((left, right) => Number(left.id.split('-')[2]) - Number(right.id.split('-')[2]))

      expect(leaves.length).toBeGreaterThanOrEqual(6)
      for (const [index, leaf] of leaves.slice(0, 6).entries()) {
        const offset = new THREE.Vector3(...leaf.position).sub(branchEnd)
        const offsetAngle = wrapAngle(Math.atan2(offset.z, offset.x) - branchAngle)
        expect(Math.sign(offsetAngle)).toBe(index % 2 === 0 ? 1 : -1)
      }
    }
  })

  it('orients rosette leaves outward with a visible layer-aware lift', () => {
    const blueprint = generatePlant(presets['tidal-rosette'])
    const leaves = blueprint.organs.filter((organ) => organ.organKind === 'leaf')
    const layerHeights = new Map<string, number[]>()

    for (const leaf of leaves) {
      const radial = new THREE.Vector3(leaf.position[0], 0, leaf.position[2]).normalize()
      const axis = worldAxis(leaf.rotation)
      expect(axis.dot(radial)).toBeGreaterThan(0.35)

      const layer = leaf.id.split('-')[1]
      const values = layerHeights.get(layer) ?? []
      values.push(axis.y)
      layerHeights.set(layer, values)
    }

    const firstLayer = layerHeights.get('0') ?? []
    const lastLayer = layerHeights.get(String(layerHeights.size - 1)) ?? []
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    expect(average(firstLayer)).toBeGreaterThan(average(lastLayer) + 0.08)
  })

  it('keeps every colony cap aligned with its matching stem direction', () => {
    const blueprint = generatePlant(presets['mist-colony'])
    const stems = new Map(
      blueprint.organs
        .filter((organ) => organ.id.startsWith('stem-'))
        .map((organ) => [organ.id.replace('stem-', ''), worldAxis(organ.rotation)]),
    )
    const caps = blueprint.organs.filter((organ) => organ.id.startsWith('cap-'))

    expect(caps.length).toBeGreaterThan(4)
    for (const cap of caps) {
      const stemAxis = stems.get(cap.id.replace('cap-', ''))
      expect(stemAxis).toBeDefined()
      expect(worldAxis(cap.rotation).dot(stemAxis!)).toBeGreaterThan(0.999)
    }
  })

  it('makes rosette thickness visibly strengthen roots, leaves, and the center', () => {
    const preset = presets['tidal-rosette']
    const thin = generatePlant({ ...preset, traits: { ...preset.traits, thickness: 0 } })
    const thick = generatePlant({ ...preset, traits: { ...preset.traits, thickness: 1 } })
    const averageScale = (blueprint: PlantBlueprintV1, kind: 'root' | 'leaf', axis: 0 | 2) => {
      const organs = blueprint.organs.filter((organ) => organ.organKind === kind)
      return organs.reduce((sum, organ) => sum + organ.scale[axis], 0) / organs.length
    }
    const centerScale = (blueprint: PlantBlueprintV1) => blueprint.organs.find((organ) => organ.id === 'center-bud')!.scale[0]

    expect(thick.organs.map((organ) => organ.id)).toEqual(thin.organs.map((organ) => organ.id))
    expect(averageScale(thick, 'root', 0)).toBeGreaterThan(averageScale(thin, 'root', 0) + 0.02)
    expect(averageScale(thick, 'leaf', 0)).toBeGreaterThan(averageScale(thin, 'leaf', 0) + 0.05)
    expect(averageScale(thick, 'leaf', 2)).toBeGreaterThan(averageScale(thin, 'leaf', 2) + 0.02)
    expect(centerScale(thick)).toBeGreaterThan(centerScale(thin) + 0.05)
  })

  it('makes colony complexity create stable height and cap-size groups without adding individuals', () => {
    const preset = presets['mist-colony']
    const simple = generatePlant({ ...preset, traits: { ...preset.traits, complexity: 0 } })
    const complex = generatePlant({ ...preset, traits: { ...preset.traits, complexity: 1 } })
    const caps = (blueprint: PlantBlueprintV1) => blueprint.organs.filter((organ) => organ.id.startsWith('cap-'))
    const stems = (blueprint: PlantBlueprintV1) => blueprint.organs.filter((organ) => organ.id.startsWith('stem-'))
    const heightVariance = (blueprint: PlantBlueprintV1) => {
      const heights = stems(blueprint).map((stem) => stem.position[1] + worldAxis(stem.rotation).y * stem.scale[1] / 2)
      const mean = heights.reduce((sum, height) => sum + height, 0) / heights.length
      return heights.reduce((sum, height) => sum + (height - mean) ** 2, 0) / heights.length
    }

    expect(complex.organs.map((organ) => organ.id)).toEqual(simple.organs.map((organ) => organ.id))
    expect(caps(complex)).toHaveLength(caps(simple).length)
    expect(new Set(caps(complex).map((cap) => cap.scale[0].toFixed(3))).size).toBeGreaterThanOrEqual(3)
    expect(heightVariance(complex)).toBeGreaterThan(heightVariance(simple) + 0.005)
  })

  it('keeps every preset within the safety budget', () => {
    for (const genotype of presetList) {
      expectValidBlueprint(generatePlant(genotype))
    }
  })

  it('keeps arbitrary seeds finite and bounded for every family', () => {
    for (const genotype of presetList) {
      for (let seed = 0; seed < 128; seed += 1) {
        expectValidBlueprint(generatePlant({ ...genotype, seed }))
      }
    }
  }, 20_000)
})
