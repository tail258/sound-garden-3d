import { describe, expect, it } from 'vitest'
import { deepRootTree, mistColony, tidalRosette } from '../../core/genotype/presets'
import {
  createInitialSandboxState,
  importGenotypeJson,
  reduceSandboxState,
} from './sandboxReducer'

describe('sandbox reducer', () => {
  it('switches presets and restarts the shared timeline', () => {
    const state = { ...createInitialSandboxState(), isPlaying: false }
    const next = reduceSandboxState(state, { type: 'select-preset', id: 'tidal-rosette' })

    expect(next.genotype).toEqual(tidalRosette)
    expect(next.presetId).toBe('tidal-rosette')
    expect(next.playbackResetToken).toBe(state.playbackResetToken + 1)
    expect(next.isPlaying).toBe(true)
  })

  it('does not replace the active genotype when JSON is invalid', () => {
    const state = createInitialSandboxState()
    const result = importGenotypeJson(state, '{broken')

    expect(result.genotype).toEqual(deepRootTree)
    expect(result.message).toContain('导入失败')
  })

  it('replays by issuing a new reset token and resuming playback', () => {
    const state = createInitialSandboxState()
    const next = reduceSandboxState(
      { ...state, isPlaying: false },
      { type: 'replay' },
    )

    expect(next.playbackResetToken).toBe(state.playbackResetToken + 1)
    expect(next.isPlaying).toBe(true)
    expect(next.message).toContain('重新播放')
  })

  it('applies an audio genotype as a distinct sandbox source', () => {
    const state = createInitialSandboxState()
    const audioGenotype = { ...mistColony, seed: 42 }
    const next = reduceSandboxState(state, { type: 'apply-audio-genotype', genotype: audioGenotype })

    expect(next.genotype).toEqual(audioGenotype)
    expect(next.presetId).toBe('audio')
    expect(next.isPlaying).toBe(false)
    expect(next.message).toContain('音频分析完成')
    expect(next.mappedGenotype).toEqual(audioGenotype)
    expect(next.overriddenTraits).toEqual([])
  })

  it('keeps the audio baseline while tracking only traits changed by hand', () => {
    const mapped = reduceSandboxState(createInitialSandboxState(), {
      type: 'apply-audio-genotype',
      genotype: mistColony,
    })
    const editedHeight = reduceSandboxState(mapped, { type: 'update-trait', key: 'height', value: 0.2 })
    const editedBoth = reduceSandboxState(editedHeight, { type: 'update-trait', key: 'thickness', value: 0.9 })

    expect(editedBoth.presetId).toBe('audio')
    expect(editedBoth.mappedGenotype).toEqual(mistColony)
    expect(editedBoth.genotype.traits.height).toBe(0.2)
    expect(editedBoth.overriddenTraits).toEqual(['height', 'thickness'])

    const backAtSource = reduceSandboxState(editedBoth, {
      type: 'update-trait',
      key: 'height',
      value: mistColony.traits.height,
    })
    expect(backAtSource.overriddenTraits).toEqual(['thickness'])
  })

  it('restores one or all mapped trait values without leaving audio mode', () => {
    const mapped = reduceSandboxState(createInitialSandboxState(), {
      type: 'apply-audio-genotype',
      genotype: mistColony,
    })
    const edited = reduceSandboxState(
      reduceSandboxState(mapped, { type: 'update-trait', key: 'height', value: 0.2 }),
      { type: 'update-trait', key: 'spread', value: 0.3 },
    )
    const oneRestored = reduceSandboxState(edited, { type: 'restore-mapped-trait', key: 'height' })

    expect(oneRestored.genotype.traits.height).toBe(mistColony.traits.height)
    expect(oneRestored.genotype.traits.spread).toBe(0.3)
    expect(oneRestored.overriddenTraits).toEqual(['spread'])
    expect(oneRestored.presetId).toBe('audio')

    const allRestored = reduceSandboxState(oneRestored, { type: 'restore-all-mapped-traits' })
    expect(allRestored.genotype).toEqual(mistColony)
    expect(allRestored.overriddenTraits).toEqual([])
    expect(allRestored.presetId).toBe('audio')
  })

  it('clears audio provenance when selecting a preset or importing JSON', () => {
    const mapped = reduceSandboxState(createInitialSandboxState(), {
      type: 'apply-audio-genotype',
      genotype: mistColony,
    })

    const selected = reduceSandboxState(mapped, { type: 'select-preset', id: 'tidal-rosette' })
    expect(selected.mappedGenotype).toBeNull()
    expect(selected.overriddenTraits).toEqual([])

    const imported = reduceSandboxState(mapped, { type: 'import-genotype', genotype: deepRootTree })
    expect(imported.mappedGenotype).toBeNull()
    expect(imported.overriddenTraits).toEqual([])
  })
})
