import type { PlantBlueprintV1 } from '../phenotype/types'
import type { GrowthCueV1 } from './types'

const BIN_COUNT = 32
const round = (value: number) => Number(value.toFixed(6))

function createActivityCdf(cues: GrowthCueV1[]) {
  const weights = new Float64Array(BIN_COUNT).fill(0.18)
  for (let bin = 0; bin < BIN_COUNT; bin += 1) {
    const center = (bin + 0.5) / BIN_COUNT
    for (const cue of cues) {
      const distance = (center - Math.min(1, Math.max(0, cue.time))) / 0.09
      weights[bin] += Math.min(1, Math.max(0, cue.strength)) * Math.exp(-0.5 * distance * distance)
    }
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const cdf = new Float64Array(BIN_COUNT + 1)
  for (let index = 0; index < BIN_COUNT; index += 1) {
    cdf[index + 1] = cdf[index] + weights[index] / total
  }
  cdf[BIN_COUNT] = 1
  return cdf
}

function invertCdf(progress: number, cdf: Float64Array) {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  for (let index = 0; index < BIN_COUNT; index += 1) {
    if (cdf[index + 1] >= progress) {
      const span = cdf[index + 1] - cdf[index]
      const fraction = span > 0 ? (progress - cdf[index]) / span : 0
      return (index + fraction) / BIN_COUNT
    }
  }
  return 1
}

export function scheduleGrowthFromAudio(blueprint: PlantBlueprintV1, cues: GrowthCueV1[]): PlantBlueprintV1 {
  if (cues.length === 0) {
    return { ...blueprint, organs: blueprint.organs.map((organ) => ({ ...organ, growth: { ...organ.growth } })) }
  }
  const cdf = createActivityCdf(cues)
  const terminalEnd = Math.max(...blueprint.organs.map((organ) => organ.growth.end))
  return {
    ...blueprint,
    organs: blueprint.organs.map((organ) => {
      const start = round(invertCdf(organ.growth.start, cdf))
      const mappedEnd = round(invertCdf(organ.growth.end, cdf))
      const end = organ.growth.end === terminalEnd ? 1 : Math.min(1, Math.max(start + 0.000001, mappedEnd))
      return { ...organ, growth: { ...organ.growth, start, end } }
    }),
  }
}
