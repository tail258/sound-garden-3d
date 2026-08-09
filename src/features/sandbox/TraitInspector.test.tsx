import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deepRootTree, mistColony } from '../../core/genotype/presets'
import { TraitInspector } from './TraitInspector'

afterEach(cleanup)

describe('TraitInspector', () => {
  it('shows the four public traits with family-specific effects', () => {
    render(
      <TraitInspector
        genotype={deepRootTree}
        mappedGenotype={null}
        overriddenTraits={[]}
        onChange={vi.fn()}
        onRestore={vi.fn()}
        onRestoreAll={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('slider').map((slider) => slider.getAttribute('aria-label'))).toEqual([
      '高度',
      '粗壮度',
      '扩张度',
      '结构复杂度',
    ])
    expect(screen.getByText('根干半径 · 分枝粗细')).toBeInTheDocument()
    expect(screen.queryByText(/声音值/)).not.toBeInTheDocument()
  })

  it('distinguishes mapped values from hand overrides and restores either scope', () => {
    const onChange = vi.fn()
    const onRestore = vi.fn()
    const onRestoreAll = vi.fn()
    const genotype = {
      ...mistColony,
      traits: { ...mistColony.traits, height: 0.2 },
    }

    render(
      <TraitInspector
        genotype={genotype}
        mappedGenotype={mistColony}
        overriddenTraits={['height']}
        onChange={onChange}
        onRestore={onRestore}
        onRestoreAll={onRestoreAll}
      />,
    )

    expect(screen.getByText('声音 0.46 → 当前 0.20')).toBeInTheDocument()
    expect(screen.getByText('声音值 0.38')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('slider', { name: '高度' }), { target: { value: '0.31' } })
    expect(onChange).toHaveBeenCalledWith('height', 0.31)

    fireEvent.click(screen.getByRole('button', { name: '恢复高度声音值' }))
    expect(onRestore).toHaveBeenCalledWith('height')

    fireEvent.click(screen.getByRole('button', { name: '全部恢复声音值' }))
    expect(onRestoreAll).toHaveBeenCalledOnce()
  })
})
