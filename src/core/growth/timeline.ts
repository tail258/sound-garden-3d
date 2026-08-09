import { clamp } from '../phenotype/generationUtils'

/** Convert elapsed seconds to a normalized, clamped growth progress. */
export function getGrowthProgress(elapsedSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 1
  }

  return clamp(elapsedSeconds / durationSeconds, 0, 1)
}
/** Map a normalized global progress into an organ's local birth window. */
export function getLocalGrowthProgress(progress: number, start: number, end: number): number {
  if (end <= start) {
    return progress >= end ? 1 : 0
  }

  return clamp((progress - start) / (end - start), 0, 1)
}
