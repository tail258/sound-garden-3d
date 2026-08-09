import { describe, expect, it } from 'vitest'
import { analyzePcm } from './analyzePcm'

function sine(frequency: number, seconds = 1, sampleRate = 44_100) {
  const samples = new Float32Array(seconds * sampleRate)
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.6
  }
  return samples
}

describe('analyzePcm', () => {
  it('identifies silence without producing invalid spectral values', () => {
    const analysis = analyzePcm([new Float32Array(44_100)], 44_100)

    expect(analysis.analysisVersion).toBe('audio-analysis-v1')
    expect(analysis.analysisSampleRate).toBe(22_050)
    expect(analysis.durationSeconds).toBe(1)
    expect(analysis.global.rms).toBe(0)
    expect(analysis.global.silenceRatio).toBe(1)
    expect(analysis.global.spectralCentroid).toBe(0)
    expect(analysis.segments).toHaveLength(8)
    expect(Object.values(analysis.global).every(Number.isFinite)).toBe(true)
  })

  it('places a high tone above a low tone in normalized spectral features', () => {
    const low = analyzePcm([sine(180)], 44_100)
    const high = analyzePcm([sine(4_000)], 44_100)

    expect(low.global.lowEnergy).toBeGreaterThan(low.global.highEnergy)
    expect(high.global.highEnergy).toBeGreaterThan(high.global.lowEnergy)
    expect(high.global.spectralCentroid).toBeGreaterThan(low.global.spectralCentroid + 0.2)
    expect(high.global.zeroCrossingRate).toBeGreaterThan(low.global.zeroCrossingRate)
  })

  it('is deterministic for the same multi-channel PCM input', () => {
    const channels = [sine(440, 2), sine(660, 2)]

    expect(analyzePcm(channels, 44_100)).toEqual(analyzePcm(channels, 44_100))
  })

  it('rejects empty channels and invalid sample rates', () => {
    expect(() => analyzePcm([], 44_100)).toThrow('至少需要一个音频声道')
    expect(() => analyzePcm([new Float32Array(10)], 0)).toThrow('采样率无效')
  })
})
