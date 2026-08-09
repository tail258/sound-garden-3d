import type { MorphologyFamily } from './schema'

export const publicTraitKeys = ['height', 'thickness', 'spread', 'complexity'] as const

export type PublicTraitKey = (typeof publicTraitKeys)[number]

export interface TraitSemantic {
  label: string
  meaning: string
  familyImpact: Record<MorphologyFamily, string>
}
export const traitSemantics: Record<PublicTraitKey, TraitSemantic> = {
  height: {
    label: '高度',
    meaning: '植物的相对纵向尺度',
    familyImpact: {
      tree: '主干高度 · 分枝抬升',
      rosette: '叶片抬升 · 中心高度',
      colony: '菌柄高度 · 高度分布',
    },
  },
  thickness: {
    label: '粗壮度',
    meaning: '主承力结构与器官的质量感',
    familyImpact: {
      tree: '根干半径 · 分枝粗细',
      rosette: '根部半径 · 叶片宽厚 · 中心体量',
      colony: '菌柄粗细 · 菌盖体量',
    },
  },
  spread: {
    label: '扩张度',
    meaning: '植物的水平覆盖范围',
    familyImpact: {
      tree: '根幅 · 枝展 · 树冠半径',
      rosette: '叶片半径 · 展开倾角',
      colony: '菌落半径 · 个体间距',
    },
  },
  complexity: {
    label: '结构复杂度',
    meaning: '结构层级与分组变化程度',
    familyImpact: {
      tree: '分枝数量 · 树冠层级',
      rosette: '叶层数量 · 层间错位',
      colony: '高度层级 · 半径分组 · 菌盖分组',
    },
  },
}
