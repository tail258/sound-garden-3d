import * as THREE from 'three'
import type { PrimitiveDescriptor } from '../../core/phenotype/types'

type BladeVariant = Extract<PrimitiveDescriptor, { kind: 'blade' }>['variant']
type CapVariant = Extract<PrimitiveDescriptor, { kind: 'cap' }>['variant']

const bladeProfiles: Record<BladeVariant, readonly number[]> = {
  lance: [0.04, 0.3, 0.42, 0.28, 0.01],
  round: [0.08, 0.42, 0.58, 0.52, 0.08],
  fan: [0.04, 0.28, 0.5, 0.68, 0.58],
  spoon: [0.05, 0.13, 0.28, 0.56, 0.32],
  blade: [0.03, 0.14, 0.18, 0.14, 0.02],
}

const bladeRows = [-0.5, -0.28, 0, 0.28, 0.5] as const
const bladeFolds = [0.005, 0.035, 0.06, 0.045, 0.01] as const

function createBladeGeometry(variant: BladeVariant): THREE.BufferGeometry {
  const widths = bladeProfiles[variant]
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let row = 0; row < bladeRows.length; row += 1) {
    const y = bladeRows[row]
    const width = widths[row]
    const fold = bladeFolds[row]
    positions.push(-width, y, 0, 0, y, fold, width, y, 0)
    const v = row / (bladeRows.length - 1)
    uvs.push(0, v, 0.5, v, 1, v)
  }

  for (let row = 0; row < bladeRows.length - 1; row += 1) {
    const current = row * 3
    const next = (row + 1) * 3
    indices.push(
      current, next, current + 1,
      current + 1, next, next + 1,
      current + 1, next + 1, current + 2,
      current + 2, next + 1, next + 2,
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.name = `geometry-v2-blade-${variant}`
  geometry.userData.geometryVersion = 'geometry-v2'
  return geometry
}

const capProfiles: Record<CapVariant, ReadonlyArray<readonly [number, number]>> = {
  bell: [[0, 0.42], [0.18, 0.4], [0.38, 0.28], [0.52, 0.08], [0.46, 0]],
  disc: [[0, 0.14], [0.25, 0.13], [0.5, 0.08], [0.62, 0]],
  orb: [[0, 0.42], [0.25, 0.38], [0.48, 0.26], [0.58, 0.08], [0.5, 0]],
}

function createCapGeometry(variant: CapVariant): THREE.BufferGeometry {
  const radialSegments = 12
  const profile = capProfiles[variant]
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let row = 0; row < profile.length; row += 1) {
    const [radius, y] = profile[row]
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2
      positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      uvs.push(segment / radialSegments, row / (profile.length - 1))
    }
  }

  for (let row = 0; row < profile.length - 1; row += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const nextSegment = (segment + 1) % radialSegments
      const current = row * radialSegments + segment
      const currentNext = row * radialSegments + nextSegment
      const next = (row + 1) * radialSegments + segment
      const nextNext = (row + 1) * radialSegments + nextSegment
      indices.push(current, next, currentNext, currentNext, next, nextNext)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.name = `geometry-v2-cap-${variant}`
  geometry.userData.geometryVersion = 'geometry-v2'
  return geometry
}

export function geometryKey(primitive: PrimitiveDescriptor): string {
  return `${primitive.kind}:${primitive.variant}`
}

export function createOrganGeometry(primitive: PrimitiveDescriptor): THREE.BufferGeometry {
  if (primitive.kind === 'blade') return createBladeGeometry(primitive.variant)
  if (primitive.kind === 'cap') return createCapGeometry(primitive.variant)
  if (primitive.kind === 'orb') return new THREE.SphereGeometry(0.5, 7, 5)

  if (primitive.variant === 'root') return new THREE.CylinderGeometry(0.42, 0.72, 1, 7, 1)
  if (primitive.variant === 'stem') return new THREE.CylinderGeometry(0.42, 0.62, 1, 8, 1)
  return new THREE.CylinderGeometry(0.34, 0.56, 1, 7, 1)
}

export function createGeometryMap(): Map<string, THREE.BufferGeometry> {
  const primitives: PrimitiveDescriptor[] = [
    { kind: 'segment', variant: 'root' },
    { kind: 'segment', variant: 'stem' },
    { kind: 'segment', variant: 'branch' },
    { kind: 'blade', variant: 'lance' },
    { kind: 'blade', variant: 'round' },
    { kind: 'blade', variant: 'fan' },
    { kind: 'blade', variant: 'spoon' },
    { kind: 'blade', variant: 'blade' },
    { kind: 'cap', variant: 'bell' },
    { kind: 'cap', variant: 'disc' },
    { kind: 'cap', variant: 'orb' },
    { kind: 'orb', variant: 'bud' },
    { kind: 'orb', variant: 'spore' },
  ]

  return new Map(primitives.map((primitive) => [geometryKey(primitive), createOrganGeometry(primitive)]))
}
