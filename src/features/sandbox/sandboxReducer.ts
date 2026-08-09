import { presets, type PresetId } from '../../core/genotype/presets'
import { defaultGenotype, parseGenotypeJson } from '../../core/genotype/serialization'
import type { GenotypeV1 } from '../../core/genotype/schema'
import {
  publicTraitKeys,
  type PublicTraitKey,
} from '../../core/genotype/traitSemantics'

export type SandboxPresetId = PresetId | 'custom' | 'audio'

export interface SandboxState {
  genotype: GenotypeV1
  presetId: SandboxPresetId
  playbackResetToken: number
  isPlaying: boolean
  message: string
  mappedGenotype: GenotypeV1 | null
  overriddenTraits: PublicTraitKey[]
}

export type SandboxAction =
  | { type: 'select-preset'; id: PresetId }
  | { type: 'update-trait'; key: keyof GenotypeV1['traits']; value: number }
  | { type: 'set-playing'; value: boolean }
  | { type: 'replay' }
  | { type: 'set-message'; message: string }
  | { type: 'import-genotype'; genotype: GenotypeV1; message?: string }
  | { type: 'apply-audio-genotype'; genotype: GenotypeV1 }
  | { type: 'restore-mapped-trait'; key: PublicTraitKey }
  | { type: 'restore-all-mapped-traits' }

function isPublicTraitKey(key: keyof GenotypeV1['traits']): key is PublicTraitKey {
  return publicTraitKeys.some((publicKey) => publicKey === key)
}

function getOverriddenTraits(
  genotype: GenotypeV1,
  mappedGenotype: GenotypeV1,
): PublicTraitKey[] {
  return publicTraitKeys.filter(
    (key) => genotype.traits[key] !== mappedGenotype.traits[key],
  )
}

export function createInitialSandboxState(): SandboxState {
  return {
    genotype: defaultGenotype,
    presetId: 'deep-root-tree',
    playbackResetToken: 0,
    isPlaying: true,
    message: '',
    mappedGenotype: null,
    overriddenTraits: [],
  }
}

export function reduceSandboxState(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case 'select-preset':
      return {
        genotype: presets[action.id],
        presetId: action.id,
        playbackResetToken: state.playbackResetToken + 1,
        isPlaying: true,
        message: '',
        mappedGenotype: null,
        overriddenTraits: [],
      }
    case 'update-trait': {
      const genotype = {
        ...state.genotype,
        traits: { ...state.genotype.traits, [action.key]: action.value },
      }

      if (state.mappedGenotype && isPublicTraitKey(action.key)) {
        return {
          ...state,
          genotype,
          presetId: 'audio',
          isPlaying: false,
          message: '',
          overriddenTraits: getOverriddenTraits(genotype, state.mappedGenotype),
        }
      }

      return {
        ...state,
        presetId: 'custom',
        genotype,
        playbackResetToken: state.playbackResetToken + 1,
        isPlaying: true,
        message: '',
        mappedGenotype: null,
        overriddenTraits: [],
      }
    }
    case 'set-playing':
      return { ...state, isPlaying: action.value, message: '' }
    case 'replay':
      return {
        ...state,
        playbackResetToken: state.playbackResetToken + 1,
        isPlaying: true,
        message: '已从 00:00 重新播放生长时间轴',
      }
    case 'set-message':
      return { ...state, message: action.message }
    case 'import-genotype':
      return {
        genotype: action.genotype,
        presetId: 'custom',
        playbackResetToken: state.playbackResetToken + 1,
        isPlaying: true,
        message: action.message ?? '基因型 JSON 已载入，表型保持确定性重建',
        mappedGenotype: null,
        overriddenTraits: [],
      }
    case 'apply-audio-genotype':
      return {
        genotype: action.genotype,
        presetId: 'audio',
        playbackResetToken: state.playbackResetToken + 1,
        isPlaying: false,
        message: '音频分析完成，表型已由声音确定性生成',
        mappedGenotype: action.genotype,
        overriddenTraits: [],
      }
    case 'restore-mapped-trait': {
      if (!state.mappedGenotype) return state

      const genotype = {
        ...state.genotype,
        traits: {
          ...state.genotype.traits,
          [action.key]: state.mappedGenotype.traits[action.key],
        },
      }
      return {
        ...state,
        genotype,
        presetId: 'audio',
        isPlaying: false,
        message: '',
        overriddenTraits: getOverriddenTraits(genotype, state.mappedGenotype),
      }
    }
    case 'restore-all-mapped-traits':
      if (!state.mappedGenotype) return state
      return {
        ...state,
        genotype: state.mappedGenotype,
        presetId: 'audio',
        isPlaying: false,
        message: '',
        overriddenTraits: [],
      }
  }
}

export function importGenotypeJson(state: SandboxState, json: string): SandboxState {
  const result = parseGenotypeJson(json)
  return result.success
    ? reduceSandboxState(state, { type: 'import-genotype', genotype: result.data })
    : { ...state, message: `导入失败：${result.message}` }
}
