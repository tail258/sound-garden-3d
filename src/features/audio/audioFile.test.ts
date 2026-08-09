import { describe, expect, it } from 'vitest'
import { validateAudioDuration, validateAudioFile } from './audioFile'

describe('audio file validation', () => {
  it('accepts a local audio file within the 50 MB boundary', () => {
    expect(validateAudioFile({ name: 'garden.wav', size: 50 * 1024 * 1024, type: 'audio/wav' })).toEqual({
      success: true,
    })
    expect(validateAudioFile({ name: 'garden.mp3', size: 12, type: '' })).toEqual({ success: true })
  })

  it('rejects oversized and non-audio files before decoding', () => {
    expect(validateAudioFile({ name: 'large.wav', size: 50 * 1024 * 1024 + 1, type: 'audio/wav' })).toEqual({
      success: false,
      message: '音频文件不能超过 50 MB',
    })
    expect(validateAudioFile({ name: 'notes.txt', size: 10, type: 'text/plain' })).toEqual({
      success: false,
      message: '请选择浏览器可解码的音频文件',
    })
  })

  it('accepts at most 120 seconds and rejects invalid decoded durations', () => {
    expect(validateAudioDuration(120)).toEqual({ success: true })
    expect(validateAudioDuration(120.001)).toEqual({ success: false, message: '音频时长不能超过 120 秒' })
    expect(validateAudioDuration(0)).toEqual({ success: false, message: '音频时长无效' })
    expect(validateAudioDuration(Number.NaN)).toEqual({ success: false, message: '音频时长无效' })
  })
})
