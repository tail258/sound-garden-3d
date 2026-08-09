import type { MorphologyFamily } from '../genotype/schema'

export type Vec3 = [number, number, number]
export type GrowthStage = 'base' | 'body' | 'organ' | 'accent'
export type MaterialRole = 'primary' | 'secondary' | 'accent'
export type LodTier = 'core' | 'detail' | 'accent'

export type PrimitiveDescriptor =
  | { kind: 'segment'; variant: 'root' | 'stem' | 'branch' }
  | { kind: 'blade'; variant: 'lance' | 'round' | 'fan' | 'spoon' | 'blade' }
  | { kind: 'cap'; variant: 'bell' | 'disc' | 'orb' }
  | { kind: 'orb'; variant: 'bud' | 'spore' }

export interface OrganDescriptor {
  id: string
  organKind: 'root' | 'stem' | 'branch' | 'leaf' | 'cap' | 'spore' | 'accent'
  primitive: PrimitiveDescriptor
  position: Vec3
  rotation: Vec3
  scale: Vec3
  materialRole: MaterialRole
  lodTier: LodTier
  growth: {
    stage: GrowthStage
    start: number
    end: number
    axis: 'x' | 'y' | 'z' | 'uniform'
  }
  motion: {
    phase: number
    amplitudeScale: number
  }
}

export interface PlantBlueprintV1 {
  blueprintVersion: 1
  generatorVersion: 'phenotype-v1'
  family: MorphologyFamily
  organs: OrganDescriptor[]
  bounds: {
    center: Vec3
    radius: number
    height: number
  }
  stats: {
    organCount: number
    estimatedTriangles: number
    warnings: string[]
  }
}
