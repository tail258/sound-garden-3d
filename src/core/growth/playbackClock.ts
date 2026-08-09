export interface PlaybackAdvance {
  elapsedSeconds: number
  completed: boolean
}

export function advancePlayback(
  elapsedSeconds: number,
  deltaMilliseconds: number,
  durationSeconds: number,
): PlaybackAdvance {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { elapsedSeconds: 0, completed: true }
  }

  const safeElapsed = Number.isFinite(elapsedSeconds)
    ? Math.min(durationSeconds, Math.max(0, elapsedSeconds))
    : 0
  const safeDelta = Number.isFinite(deltaMilliseconds)
    ? Math.max(0, deltaMilliseconds) / 1000
    : 0
  const nextElapsed = Math.min(durationSeconds, safeElapsed + safeDelta)

  return {
    elapsedSeconds: nextElapsed,
    completed: nextElapsed >= durationSeconds,
  }
}
