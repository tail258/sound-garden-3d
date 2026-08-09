import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AudioAnalysisV1, MappingResultV1 } from '../../core/audio/types'
import { AudioAnalysisPanel } from './AudioAnalysisPanel'

describe('AudioAnalysisPanel', () => {
  it('renders the selected family, scores, key features, and mapping reasons', () => {
    const analysis = {
      global: { rms: 0.42, spectralCentroid: 0.31, spectralFlux: 0.27, onsetDensity: 0.5 },
    } as AudioAnalysisV1
    const mapping = {
      genotype: { morphology: { family: 'rosette' } },
      familyScores: { tree: 0.3, rosette: 0.8, colony: 0.2 },
      explanations: [{ parameter: '扩张', value: '0.72', reason: '中频与频谱变化共同决定横向展开。' }],
    } as MappingResultV1

    render(<AudioAnalysisPanel analysis={analysis} mapping={mapping} />)

    expect(screen.getByRole('heading', { name: '声音如何长成植物' })).toBeInTheDocument()
    expect(screen.getAllByText('莲座')).toHaveLength(2)
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('中频与频谱变化共同决定横向展开。')).toBeInTheDocument()
  })
})
