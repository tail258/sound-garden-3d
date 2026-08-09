export const MAX_AUDIO_BYTES = 50 * 1024 * 1024
export const MAX_AUDIO_DURATION_SECONDS = 120

type ValidationResult = { success: true } | { success: false; message: string }

export interface AudioFileLike {
  name: string
  size: number
  type: string
}

export interface DecodedAudioChannels {
  sampleRate: number
  durationSeconds: number
  channels: Float32Array[]
}

export function validateAudioFile(file: AudioFileLike): ValidationResult {
  if (file.size > MAX_AUDIO_BYTES) return { success: false, message: '音频文件不能超过 50 MB' }
  const hasAudioExtension = /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav|webm)$/i.test(file.name)
  if (!file.type.startsWith('audio/') && !(file.type === '' && hasAudioExtension)) {
    return { success: false, message: '请选择浏览器可解码的音频文件' }
  }
  return { success: true }
}

export function validateAudioDuration(durationSeconds: number): ValidationResult {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return { success: false, message: '音频时长无效' }
  if (durationSeconds > MAX_AUDIO_DURATION_SECONDS) return { success: false, message: '音频时长不能超过 120 秒' }
  return { success: true }
}

export async function decodeAudioFile(file: File): Promise<DecodedAudioChannels> {
  const context = new AudioContext()
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer())
    const validation = validateAudioDuration(buffer.duration)
    if (!validation.success) throw new Error(validation.message)
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index).slice())
    return { sampleRate: buffer.sampleRate, durationSeconds: buffer.duration, channels }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('音频')) throw error
    throw new Error('无法解码该音频，请换用 WAV、MP3、M4A 或 OGG 文件')
  } finally {
    await context.close()
  }
}
