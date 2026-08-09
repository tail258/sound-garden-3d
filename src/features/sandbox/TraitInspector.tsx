import type { GenotypeV1 } from '../../core/genotype/schema'
import {
  publicTraitKeys,
  traitSemantics,
  type PublicTraitKey,
} from '../../core/genotype/traitSemantics'

interface TraitInspectorProps {
  genotype: GenotypeV1
  mappedGenotype: GenotypeV1 | null
  overriddenTraits: PublicTraitKey[]
  onChange: (key: PublicTraitKey, value: number) => void
  onRestore: (key: PublicTraitKey) => void
  onRestoreAll: () => void
}

export function TraitInspector({
  genotype,
  mappedGenotype,
  overriddenTraits,
  onChange,
  onRestore,
  onRestoreAll,
}: TraitInspectorProps) {
  return (
    <div className="inspector-section">
      <div className="subsection-heading">
        <span>TRAITS</span>
        <small>{mappedGenotype ? '声音映射 + 人工覆盖' : '0.00 — 1.00'}</small>
      </div>
      <div className="trait-list">
        {publicTraitKeys.map((key) => {
          const semantic = traitSemantics[key]
          const value = genotype.traits[key]
          const mappedValue = mappedGenotype?.traits[key]
          const isOverridden = overriddenTraits.includes(key)

          return (
            <div className={`trait-row ${isOverridden ? 'is-overridden' : ''}`} key={key}>
              <span className="trait-label">
                <b>{semantic.label}</b>
                <small>{semantic.familyImpact[genotype.morphology.family]}</small>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(event) => onChange(key, Number(event.target.value))}
                aria-label={semantic.label}
              />
              <output>{value.toFixed(2)}</output>
              {mappedValue === undefined ? null : (
                <span className="trait-source">
                  {isOverridden
                    ? `声音 ${mappedValue.toFixed(2)} → 当前 ${value.toFixed(2)}`
                    : `声音值 ${mappedValue.toFixed(2)}`}
                </span>
              )}
              {isOverridden ? (
                <button
                  className="trait-restore"
                  type="button"
                  onClick={() => onRestore(key)}
                  aria-label={`恢复${semantic.label}声音值`}
                >
                  恢复
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
      {mappedGenotype && overriddenTraits.length > 0 ? (
        <button className="restore-all" type="button" onClick={onRestoreAll}>
          全部恢复声音值
        </button>
      ) : null}
    </div>
  )
}
