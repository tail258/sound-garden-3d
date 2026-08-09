import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { OrganDescriptor } from '../../core/phenotype/types'
import { initializeInstanceMatrices, writeOrganInstanceMatrices } from './instanceMatrices'

const organ: OrganDescriptor = {
  id: 'test-leaf',
  organKind: 'leaf',
  primitive: { kind: 'blade', variant: 'spoon' },
  position: [1, 2, 3],
  rotation: [0, 0.5, 0],
  scale: [2, 3, 4],
  materialRole: 'secondary',
  lodTier: 'detail',
  growth: { stage: 'organ', start: 0.25, end: 0.75, axis: 'y' },
  motion: { phase: 0, amplitudeScale: 1 },
}

describe('instance matrix animation', () => {
  let geometry: THREE.BufferGeometry
  let material: THREE.Material
  let mesh: THREE.InstancedMesh

  beforeEach(() => {
    geometry = new THREE.BoxGeometry(1, 1, 1)
    material = new THREE.MeshBasicMaterial()
    mesh = new THREE.InstancedMesh(geometry, material, 1)
  })

  afterEach(() => {
    geometry.dispose()
    material.dispose()
  })

  const readTransform = () => {
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    mesh.getMatrixAt(0, matrix)
    matrix.decompose(position, rotation, scale)
    return { matrix, position, scale }
  }

  it('replaces default identity matrices with zero scale before the first render', () => {
    initializeInstanceMatrices(mesh)

    const { matrix, position } = readTransform()
    expect(position.toArray()).toEqual([0, 0, 0])
    expect(matrix.elements.slice(0, 15)).toEqual(new Array(15).fill(0))
    expect(matrix.determinant()).toBe(0)
  })

  it('keeps unborn organs at zero and grows all axes continuously inside the birth window', () => {
    writeOrganInstanceMatrices(mesh, [organ], 0)
    expect(readTransform().matrix.determinant()).toBe(0)

    writeOrganInstanceMatrices(mesh, [organ], 0.5)
    const halfway = readTransform()
    expect(halfway.position.toArray()).toEqual([1, 2, 3])
    expect(halfway.scale.x).toBeCloseTo(1.5)
    expect(halfway.scale.y).toBeCloseTo(2.625)
    expect(halfway.scale.z).toBeCloseTo(3)
  })

  it('matches the blueprint transform at maturity and is deterministic', () => {
    writeOrganInstanceMatrices(mesh, [organ], 1)
    const first = readTransform()
    const firstElements = first.matrix.elements.slice()

    expect(first.position.toArray()).toEqual([1, 2, 3])
    expect(first.scale.x).toBeCloseTo(2)
    expect(first.scale.y).toBeCloseTo(3)
    expect(first.scale.z).toBeCloseTo(4)

    writeOrganInstanceMatrices(mesh, [organ], 1)
    expect(readTransform().matrix.elements).toEqual(firstElements)
  })
})
