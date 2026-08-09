import { describe, expect, it } from 'vitest'
import { publicTraitKeys, traitSemantics } from './traitSemantics'

describe('public phenotype trait semantics', () => {
  it('defines the four public traits in the inspector order', () => {
    expect(publicTraitKeys).toEqual(['height', 'thickness', 'spread', 'complexity'])
    expect(traitSemantics.thickness.label).toBe('粗壮度')
    expect(traitSemantics.spread.label).toBe('扩张度')
    expect(traitSemantics.complexity.label).toBe('结构复杂度')
  })

  it('explains every trait for every morphology family', () => {
    for (const key of publicTraitKeys) {
      const semantic = traitSemantics[key]
      expect(semantic.meaning.length).toBeGreaterThan(4)
      expect(semantic.familyImpact.tree.length).toBeGreaterThan(4)
      expect(semantic.familyImpact.rosette.length).toBeGreaterThan(4)
      expect(semantic.familyImpact.colony.length).toBeGreaterThan(4)
    }

    expect(traitSemantics.complexity.familyImpact.colony).toContain('高度层级')
    expect(traitSemantics.thickness.familyImpact.rosette).toContain('叶片宽厚')
  })
})
