import type { Vec3 } from './types'

const EPSILON = 1e-8

function dot(left: Vec3, right: Vec3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

function cross(left: Vec3, right: Vec3): Vec3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function length(vector: Vec3): number {
  return Math.hypot(vector[0], vector[1], vector[2])
}

function normalize(vector: Vec3, fallback: Vec3): Vec3 {
  const magnitude = length(vector)
  if (magnitude <= EPSILON) return fallback
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude]
}

function subtractProjection(vector: Vec3, axis: Vec3): Vec3 {
  const projection = dot(vector, axis)
  return [
    vector[0] - axis[0] * projection,
    vector[1] - axis[1] * projection,
    vector[2] - axis[2] * projection,
  ]
}

function round(value: number): number {
  return Math.round(value * 100_000) / 100_000
}

function chooseFallbackNormal(axis: Vec3): Vec3 {
  const candidates: Vec3[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1]]
  return candidates.reduce((best, candidate) => (
    Math.abs(dot(candidate, axis)) < Math.abs(dot(best, axis)) ? candidate : best
  ))
}

/** Rotate a vector around a normalized or non-normalized axis using Rodrigues' formula. */
export function rotateAroundAxis(vector: Vec3, axis: Vec3, angle: number): Vec3 {
  const unitAxis = normalize(axis, [0, 1, 0])
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const axisCrossVector = cross(unitAxis, vector)
  const axisDotVector = dot(unitAxis, vector)

  return [
    vector[0] * cosine + axisCrossVector[0] * sine + unitAxis[0] * axisDotVector * (1 - cosine),
    vector[1] * cosine + axisCrossVector[1] * sine + unitAxis[1] * axisDotVector * (1 - cosine),
    vector[2] * cosine + axisCrossVector[2] * sine + unitAxis[2] * axisDotVector * (1 - cosine),
  ]
}

/**
 * Build an XYZ Euler rotation whose local +Y follows direction and local +Z
 * follows the preferred surface normal as closely as possible.
 */
export function orientationFromDirection(direction: Vec3, preferredNormal: Vec3, roll = 0): Vec3 {
  const yAxis = normalize(direction, [0, 1, 0])
  const preferred = normalize(preferredNormal, chooseFallbackNormal(yAxis))
  let zAxis = subtractProjection(preferred, yAxis)

  if (length(zAxis) <= EPSILON) {
    zAxis = subtractProjection(chooseFallbackNormal(yAxis), yAxis)
  }
  zAxis = normalize(zAxis, [0, 0, 1])

  let xAxis = normalize(cross(yAxis, zAxis), [1, 0, 0])
  zAxis = normalize(cross(xAxis, yAxis), zAxis)

  if (Math.abs(roll) > EPSILON) {
    xAxis = rotateAroundAxis(xAxis, yAxis, roll)
    zAxis = rotateAroundAxis(zAxis, yAxis, roll)
  }

  const m11 = xAxis[0]
  const m12 = yAxis[0]
  const m13 = zAxis[0]
  const m22 = yAxis[1]
  const m23 = zAxis[1]
  const m32 = yAxis[2]
  const m33 = zAxis[2]
  const clampedM13 = Math.max(-1, Math.min(1, m13))
  const y = Math.asin(clampedM13)

  let x: number
  let z: number
  if (Math.abs(clampedM13) < 0.9999999) {
    x = Math.atan2(-m23, m33)
    z = Math.atan2(-m12, m11)
  } else {
    x = Math.atan2(m32, m22)
    z = 0
  }

  return [round(x), round(y), round(z)]
}
