import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { PrimitiveDescriptor } from '../../core/phenotype/types'
import { createOrganGeometry } from './organGeometry'

const bladeVariants = ['lance', 'round', 'fan', 'spoon', 'blade'] as const
const capVariants = ['bell', 'disc', 'orb'] as const

function getGeometrySize(primitive: PrimitiveDescriptor) {
  const geometry = createOrganGeometry(primitive)
  geometry.computeBoundingBox()
  const size = geometry.boundingBox!.getSize(new THREE.Vector3())
  return { geometry, size }
}

function expectFiniteGeometry(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute('position')
  expect(positions.count).toBeGreaterThan(3)
  for (let index = 0; index < positions.count; index += 1) {
    expect(Number.isFinite(positions.getX(index))).toBe(true)
    expect(Number.isFinite(positions.getY(index))).toBe(true)
    expect(Number.isFinite(positions.getZ(index))).toBe(true)
  }
  const triangleCount = geometry.index
    ? geometry.index.count / 3
    : positions.count / 3
  expect(triangleCount).toBeLessThanOrEqual(160)
}

describe('geometry-v2 organ geometry', () => {
  it.each(bladeVariants)('creates a thin, finite %s leaf rather than a solid primitive', (variant) => {
    const { geometry, size } = getGeometrySize({ kind: 'blade', variant })

    expectFiniteGeometry(geometry)
    expect(geometry.type).toBe('BufferGeometry')
    expect(size.y).toBeGreaterThan(size.z * 4)
    expect(size.x).toBeGreaterThan(size.z * 3)
  })

  it('keeps the five leaf profiles visibly distinct', () => {
    const aspectRatios = bladeVariants.map((variant) => {
      const { size } = getGeometrySize({ kind: 'blade', variant })
      return Math.round((size.x / size.y) * 10) / 10
    })

    expect(new Set(aspectRatios).size).toBeGreaterThanOrEqual(4)
  })

  it.each(capVariants)('creates a finite open-bottom %s cap rather than a full sphere', (variant) => {
    const { geometry, size } = getGeometrySize({ kind: 'cap', variant })

    expectFiniteGeometry(geometry)
    expect(geometry.type).toBe('BufferGeometry')
    expect(size.x).toBeGreaterThan(size.y)
    expect(size.z).toBeCloseTo(size.x, 5)
  })

  it('keeps buds and spores spherical because their organ semantics are spherical', () => {
    expect(createOrganGeometry({ kind: 'orb', variant: 'bud' })).toBeInstanceOf(THREE.SphereGeometry)
    expect(createOrganGeometry({ kind: 'orb', variant: 'spore' })).toBeInstanceOf(THREE.SphereGeometry)
  })
})
