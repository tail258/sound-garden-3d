import type { ChangeEvent } from 'react'
import type { AudioPipelineStatus } from './useAudioPipeline'

const statusLabels: Record<AudioPipelineStatus, string> = {
  idle: '等待声音',
  validating: '正在校验',
  decoding: '正在解码',
  analyzing: '正在提取特征',
  ready: '分析完成',
  error: '处理失败',
}
interface AudioInputProps {
  status: AudioPipelineStatus
  progress: number
  fileName: string
  error: string
  onSelect: (file: File) => void
}

export function AudioInput({ status, progress, fileName, error, onSelect }: AudioInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onSelect(file)
    event.target.value = ''
  }

  const busy = status === 'validating' || status === 'decoding' || status === 'analyzing'
  return (
    <section className="audio-input-card" aria-label="声音输入">
      <div className="audio-input-copy">
        <span className="audio-input-index">AUDIO / LOCAL</span>
        <strong>{fileName || '选择一段声音，让它长成植物'}</strong>
        <small>{error || '最长 120 秒 · 最大 50 MB · 仅在本地分析'}</small>
      </div>
      <label className={`audio-file-button ${busy ? 'is-busy' : ''}`}>
        <input className="visually-hidden" type="file" accept="audio/*" aria-label="选择本地音频" onChange={handleChange} disabled={busy} />
        <span>{busy ? statusLabels[status] : fileName ? '更换音频' : '选择音频'}</span>
      </label>
      <div className="audio-progress" aria-label={statusLabels[status]}>
        <span style={{ width: `${progress * 100}%` }} />
      </div>
    </section>
  )
}
