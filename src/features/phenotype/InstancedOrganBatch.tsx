import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GenotypeV1 } from '../../core/genotype/schema'
import type { PlantBlueprintV1 } from '../../core/phenotype/types'
import { initializeInstanceMatrices, writeOrganInstanceMatrices } from './instanceMatrices'

interface InstancedOrganBatchProps {
  genotype: GenotypeV1
  organs: PlantBlueprintV1['organs']
  geometry: THREE.BufferGeometry
  progressRef: RefObject<number>
  silhouette: boolean
}

export function InstancedOrganBatch({
  genotype,
  organs,
  geometry,
  progressRef,
  silhouette,
}: InstancedOrganBatchProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const lastProgressRef = useRef(Number.NaN)
  const materialRole = organs[0]?.materialRole ?? 'primary'
  const color = genotype.appearance[`${materialRole}Color` as 'primaryColor' | 'secondaryColor' | 'accentColor']
  const isAccent = materialRole === 'accent'

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    mesh.visible = false
    initializeInstanceMatrices(mesh)
    writeOrganInstanceMatrices(mesh, organs, progressRef.current)
    lastProgressRef.current = progressRef.current
    mesh.visible = true
  }, [organs, progressRef])

  useFrame(() => {
    const mesh = meshRef.current
    const progress = progressRef.current
    if (!mesh || progress === lastProgressRef.current) return

    writeOrganInstanceMatrices(mesh, organs, progress)
    lastProgressRef.current = progress
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, organs.length]}
      visible={false}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={silhouette ? '#071611' : color}
        roughness={isAccent ? 0.32 : 0.68}
        metalness={isAccent ? 0.12 : 0.02}
        transparent={genotype.appearance.opacity < 1}
        opacity={genotype.appearance.opacity}
        emissive={silhouette ? '#000000' : isAccent ? color : '#071c15'}
        emissiveIntensity={silhouette ? 0 : isAccent ? genotype.appearance.emissiveIntensity * 1.4 : genotype.appearance.emissiveIntensity * 0.28}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}
