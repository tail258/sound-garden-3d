import type { Vec3 } from '../phenotype/types'
import { getLocalGrowthProgress } from './timeline'

export function getAnimatedScale(
  baseScale: Vec3,
  progress: number,
  start: number,
  end: number,
  axis: 'x' | 'y' | 'z' | 'uniform',
): Vec3 {
  const local = getLocalGrowthProgress(progress, start, end)
  const eased = 1 - (1 - local) ** 3
  const thicknessEased = 1 - (1 - local) ** 2
  const axisScale: Vec3 = axis === 'x'
    ? [eased, thicknessEased, thicknessEased]
    : axis === 'y'
      ? [thicknessEased, eased, thicknessEased]
      : axis === 'z'
        ? [thicknessEased, thicknessEased, eased]
        : [eased, eased, eased]
  return [baseScale[0] * axisScale[0], baseScale[1] * axisScale[1], baseScale[2] * axisScale[2]]
}

export function getOrganOpacity(progress: number, start: number, end: number): number {
  return getLocalGrowthProgress(progress, start, end)
}
