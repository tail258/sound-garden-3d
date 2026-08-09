import { fftMagnitudes } from './fft'
import type { AudioAnalysisV1, AudioFeatureSet, AudioSegmentV1 } from './types'

const ANALYSIS_SAMPLE_RATE = 22_050 as const
const FFT_SIZE = 1_024
const HOP_SIZE = 512
const MAX_ANALYSIS_FRAMES = 1_024
const SILENCE_THRESHOLD = 0.005

interface FrameFeatures {
  time: number
  rms: number
  peak: number
  zeroCrossingRate: number
  silenceRatio: number
  spectralCentroid: number
  spectralRolloff: number
  spectralFlatness: number
  spectralFlux: number
  lowEnergy: number
  midEnergy: number
  highEnergy: number
}
const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
const rounded = (value: number) => Number(clamp01(value).toFixed(6))

function downmixAndResample(channels: Float32Array[], sourceSampleRate: number) {
  const sourceLength = Math.max(...channels.map((channel) => channel.length))
  if (sourceLength === 0) throw new Error('音频声道不能为空')
  const outputLength = Math.max(1, Math.round((sourceLength * ANALYSIS_SAMPLE_RATE) / sourceSampleRate))
  const output = new Float32Array(outputLength)

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = (index * sourceSampleRate) / ANALYSIS_SAMPLE_RATE
    const left = Math.floor(sourcePosition)
    const fraction = sourcePosition - left
    let mixed = 0
    for (const channel of channels) {
      const first = channel[Math.min(left, channel.length - 1)] ?? 0
      const second = channel[Math.min(left + 1, channel.length - 1)] ?? first
      mixed += first + (second - first) * fraction
    }
    output[index] = mixed / channels.length
  }
  return output
}

function fingerprint(samples: Float32Array) {
  let hash = 0x811c9dc5
  const stride = Math.max(1, Math.floor(samples.length / 8_192))
  for (let index = 0; index < samples.length; index += stride) {
    const value = Math.round((clamp01((samples[index] + 1) / 2) * 2 - 1) * 32_767)
    hash ^= value & 0xff
    hash = Math.imul(hash, 0x01000193)
    hash ^= (value >>> 8) & 0xff
    hash = Math.imul(hash, 0x01000193)
  }
  hash ^= samples.length
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function timeFeatures(samples: Float32Array | Float64Array) {
  let squared = 0
  let peak = 0
  let crossings = 0
  let silent = 0
  for (let index = 0; index < samples.length; index += 1) {
    const value = samples[index]
    squared += value * value
    peak = Math.max(peak, Math.abs(value))
    if (Math.abs(value) < SILENCE_THRESHOLD) silent += 1
    if (index > 0 && (value >= 0) !== (samples[index - 1] >= 0)) crossings += 1
  }
  return {
    rms: Math.sqrt(squared / samples.length),
    peak,
    zeroCrossingRate: crossings / Math.max(1, samples.length - 1),
    silenceRatio: silent / samples.length,
  }
}

function spectralFeatures(magnitudes: Float64Array, previous: Float64Array | undefined) {
  let magnitudeSum = 0
  let weightedFrequency = 0
  let logSum = 0
  let energySum = 0
  let low = 0
  let mid = 0
  let high = 0
  let flux = 0

  for (let index = 1; index < magnitudes.length; index += 1) {
    const magnitude = magnitudes[index]
    const frequency = (index * ANALYSIS_SAMPLE_RATE) / FFT_SIZE
    magnitudeSum += magnitude
    weightedFrequency += magnitude * frequency
    logSum += Math.log(magnitude + 1e-12)
    const energy = magnitude * magnitude
    energySum += energy
    if (frequency < 500) low += energy
    else if (frequency < 2_500) mid += energy
    else high += energy
    if (previous) flux += Math.max(0, magnitude - previous[index])
  }

  let rolloffBin = 0
  let cumulative = 0
  const rolloffTarget = energySum * 0.85
  for (let index = 1; index < magnitudes.length; index += 1) {
    cumulative += magnitudes[index] * magnitudes[index]
    if (cumulative >= rolloffTarget) {
      rolloffBin = index
      break
    }
  }

  const binCount = Math.max(1, magnitudes.length - 1)
  const meanMagnitude = magnitudeSum / binCount
  return {
    spectralCentroid: weightedFrequency / Math.max(magnitudeSum, 1e-12) / (ANALYSIS_SAMPLE_RATE / 2),
    spectralRolloff: rolloffBin / magnitudes.length,
    spectralFlatness: Math.exp(logSum / binCount) / Math.max(meanMagnitude, 1e-12),
    spectralFlux: previous ? flux / Math.max(magnitudeSum, 1e-12) : 0,
    lowEnergy: low / Math.max(energySum, 1e-12),
    midEnergy: mid / Math.max(energySum, 1e-12),
    highEnergy: high / Math.max(energySum, 1e-12),
  }
}

function analyzeFrames(samples: Float32Array) {
  const availableFrames = Math.max(1, Math.ceil(Math.max(0, samples.length - FFT_SIZE) / HOP_SIZE) + 1)
  const frameStride = Math.max(1, Math.ceil(availableFrames / MAX_ANALYSIS_FRAMES))
  const frames: FrameFeatures[] = []
  let previousMagnitudes: Float64Array | undefined

  for (let frameIndex = 0; frameIndex < availableFrames; frameIndex += frameStride) {
    const start = frameIndex * HOP_SIZE
    const window = new Float64Array(FFT_SIZE)
    for (let index = 0; index < FFT_SIZE; index += 1) {
      const sample = samples[start + index] ?? 0
      window[index] = sample * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (FFT_SIZE - 1)))
    }
    const magnitudes = fftMagnitudes(window)
    frames.push({
      time: Math.min(1, (start + FFT_SIZE / 2) / samples.length),
      ...timeFeatures(window),
      ...spectralFeatures(magnitudes, previousMagnitudes),
    })
    previousMagnitudes = magnitudes
  }
  return frames
}

function averageFrames(frames: FrameFeatures[], onsetThreshold: number): AudioFeatureSet {
  if (frames.length === 0) return emptyFeatures()
  const sum = frames.reduce((total, frame) => ({
    rms: total.rms + frame.rms,
    peak: Math.max(total.peak, frame.peak),
    zeroCrossingRate: total.zeroCrossingRate + frame.zeroCrossingRate,
    silenceRatio: total.silenceRatio + frame.silenceRatio,
    spectralCentroid: total.spectralCentroid + frame.spectralCentroid,
    spectralRolloff: total.spectralRolloff + frame.spectralRolloff,
    spectralFlatness: total.spectralFlatness + frame.spectralFlatness,
    spectralFlux: total.spectralFlux + frame.spectralFlux,
    onsetDensity: total.onsetDensity + (frame.spectralFlux > onsetThreshold ? 1 : 0),
    lowEnergy: total.lowEnergy + frame.lowEnergy,
    midEnergy: total.midEnergy + frame.midEnergy,
    highEnergy: total.highEnergy + frame.highEnergy,
  }), emptyFeatures())

  return {
    rms: rounded(sum.rms / frames.length),
    peak: rounded(sum.peak),
    zeroCrossingRate: rounded(sum.zeroCrossingRate / frames.length),
    silenceRatio: rounded(sum.silenceRatio / frames.length),
    spectralCentroid: rounded(sum.spectralCentroid / frames.length),
    spectralRolloff: rounded(sum.spectralRolloff / frames.length),
    spectralFlatness: rounded(sum.spectralFlatness / frames.length),
    spectralFlux: rounded(sum.spectralFlux / frames.length),
    onsetDensity: rounded(sum.onsetDensity / frames.length),
    lowEnergy: rounded(sum.lowEnergy / frames.length),
    midEnergy: rounded(sum.midEnergy / frames.length),
    highEnergy: rounded(sum.highEnergy / frames.length),
  }
}

function emptyFeatures(): AudioFeatureSet {
  return { rms: 0, peak: 0, zeroCrossingRate: 0, silenceRatio: 0, spectralCentroid: 0, spectralRolloff: 0, spectralFlatness: 0, spectralFlux: 0, onsetDensity: 0, lowEnergy: 0, midEnergy: 0, highEnergy: 0 }
}

function createSegments(frames: FrameFeatures[], durationSeconds: number, count: number, onsetThreshold: number) {
  const segments: AudioSegmentV1[] = []
  for (let index = 0; index < count; index += 1) {
    const startRatio = index / count
    const endRatio = (index + 1) / count
    const selected = frames.filter((frame) => frame.time >= startRatio && (index === count - 1 ? frame.time <= endRatio : frame.time < endRatio))
    segments.push({
      start: Number((startRatio * durationSeconds).toFixed(4)),
      end: Number((endRatio * durationSeconds).toFixed(4)),
      ...averageFrames(selected, onsetThreshold),
    })
  }
  return segments
}

export function analyzePcm(channels: Float32Array[], sourceSampleRate: number): AudioAnalysisV1 {
  if (channels.length === 0) throw new Error('至少需要一个音频声道')
  if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) throw new Error('采样率无效')
  const samples = downmixAndResample(channels, sourceSampleRate)
  const durationSeconds = samples.length / ANALYSIS_SAMPLE_RATE
  const frames = analyzeFrames(samples)
  const fluxMean = frames.reduce((sum, frame) => sum + frame.spectralFlux, 0) / frames.length
  const fluxVariance = frames.reduce((sum, frame) => sum + (frame.spectralFlux - fluxMean) ** 2, 0) / frames.length
  const onsetThreshold = fluxMean + Math.sqrt(fluxVariance) * 0.5
  const spectral = averageFrames(frames, onsetThreshold)
  const time = timeFeatures(samples)
  const global: AudioFeatureSet = {
    ...spectral,
    rms: rounded(time.rms),
    peak: rounded(time.peak),
    zeroCrossingRate: rounded(time.zeroCrossingRate),
    silenceRatio: rounded(time.silenceRatio),
  }
  const segmentCount = Math.min(32, Math.max(8, Math.round(durationSeconds / 2)))
  return {
    analysisVersion: 'audio-analysis-v1',
    fingerprint: fingerprint(samples),
    durationSeconds: Number(durationSeconds.toFixed(4)),
    analysisSampleRate: ANALYSIS_SAMPLE_RATE,
    global,
    segments: createSegments(frames, durationSeconds, segmentCount, onsetThreshold),
  }
}
