import type { AudioAnalysisV1, MappingResultV1 } from '../../core/audio/types'

const familyNames = { tree: '乔木', rosette: '莲座', colony: '群落' } as const

export function AudioAnalysisPanel({ analysis, mapping }: { analysis: AudioAnalysisV1; mapping: MappingResultV1 }) {
  const feature = analysis.global
  const family = mapping.genotype.morphology.family
  return (
    <section className="audio-analysis-panel" aria-label="声音映射解释">
      <div className="audio-analysis-heading">
        <div><span>ANALYSIS / V1</span><h3>声音如何长成植物</h3></div>
        <strong>{familyNames[family]}</strong>
      </div>
      <div className="audio-feature-grid">
        <div><b>{Math.round(feature.rms * 100)}%</b><span>响度</span></div>
        <div><b>{Math.round(feature.spectralCentroid * 100)}%</b><span>明亮度</span></div>
        <div><b>{Math.round(feature.spectralFlux * 100)}%</b><span>变化量</span></div>
        <div><b>{Math.round(feature.onsetDensity * 100)}%</b><span>起音密度</span></div>
      </div>
      <div className="family-score-list">
        {(Object.entries(mapping.familyScores) as Array<[keyof typeof familyNames, number]>).map(([key, score]) => (
          <div key={key} className={key === family ? 'is-selected' : ''}>
            <span>{familyNames[key]}</span><i><em style={{ width: `${score * 100}%` }} /></i><b>{Math.round(score * 100)}%</b>
          </div>
        ))}
      </div>
      <div className="mapping-explanations">
        {mapping.explanations.map((item) => (
          <article key={item.parameter}>
            <div><b>{item.parameter}</b><strong>{item.value}</strong></div>
            <p>{item.reason}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
