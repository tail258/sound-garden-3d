import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { orientationFromDirection, rotateAroundAxis } from './orientation'

function applyRotation(rotation: [number, number, number], local: THREE.Vector3): THREE.Vector3 {
  return local.applyEuler(new THREE.Euler(...rotation, 'XYZ')).normalize()
}

describe('controlled natural orientation', () => {
  it('aligns the local growth axis with the requested direction', () => {
    const target = new THREE.Vector3(1, 2, -1).normalize()
    const rotation = orientationFromDirection([1, 2, -1], [0, 1, 0])
    const worldAxis = applyRotation(rotation, new THREE.Vector3(0, 1, 0))

    expect(worldAxis.dot(target)).toBeGreaterThan(0.9999)
  })

  it('uses the preferred normal to orient the local surface', () => {
    const rotation = orientationFromDirection([1, 0.15, 0], [0, 1, 0])
    const worldAxis = applyRotation(rotation, new THREE.Vector3(0, 0, 1))

    expect(worldAxis.y).toBeGreaterThan(0.9)
    expect(Math.abs(worldAxis.x)).toBeLessThan(0.4)
  })

  it('keeps degenerate inputs finite and deterministic', () => {
    const first = orientationFromDirection([0, 0, 0], [0, 0, 0], 0.25)
    const second = orientationFromDirection([0, 0, 0], [0, 0, 0], 0.25)

    expect(first).toEqual(second)
    expect(first.every(Number.isFinite)).toBe(true)
  })

  it('rotates a vector around an axis without changing its length', () => {
    const rotated = rotateAroundAxis([1, 0, 0], [0, 1, 0], Math.PI / 2)

    expect(rotated[0]).toBeCloseTo(0)
    expect(rotated[2]).toBeCloseTo(-1)
    expect(Math.hypot(...rotated)).toBeCloseTo(1)
  })
})
