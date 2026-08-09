import * as THREE from 'three'
import { getAnimatedScale } from '../../core/growth/organAnimation'
import type { OrganDescriptor } from '../../core/phenotype/types'

const scratchObject = new THREE.Object3D()

function writeZeroMatrix(mesh: THREE.InstancedMesh, index: number): void {
  scratchObject.position.set(0, 0, 0)
  scratchObject.rotation.set(0, 0, 0)
  scratchObject.scale.set(0, 0, 0)
  scratchObject.updateMatrix()
  mesh.setMatrixAt(index, scratchObject.matrix)
}

export function initializeInstanceMatrices(mesh: THREE.InstancedMesh): void {
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  for (let index = 0; index < mesh.count; index += 1) {
    writeZeroMatrix(mesh, index)
  }
  mesh.instanceMatrix.needsUpdate = true
}

export function writeOrganInstanceMatrices(
  mesh: THREE.InstancedMesh,
  organs: readonly OrganDescriptor[],
  progress: number,
): void {
  const instanceCount = Math.min(mesh.count, organs.length)

  for (let index = 0; index < instanceCount; index += 1) {
    const organ = organs[index]
    const scale = getAnimatedScale(
      organ.scale,
      progress,
      organ.growth.start,
      organ.growth.end,
      organ.growth.axis,
    )

    scratchObject.position.fromArray(organ.position)
    scratchObject.rotation.set(...organ.rotation)
    scratchObject.scale.fromArray(scale)
    scratchObject.updateMatrix()
    mesh.setMatrixAt(index, scratchObject.matrix)
  }

  for (let index = instanceCount; index < mesh.count; index += 1) {
    writeZeroMatrix(mesh, index)
  }

  mesh.instanceMatrix.needsUpdate = true
}
