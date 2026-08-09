import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { GenotypeV1 } from '../../core/genotype/schema'
import type { PlantBlueprintV1 } from '../../core/phenotype/types'
import { InstancedOrganBatch } from './InstancedOrganBatch'
import { createGeometryMap, geometryKey } from './organGeometry'
import { selectRenderOrgans } from './selectRenderOrgans'
import { canUseWebgl } from './webglSupport'

interface SpecimenCanvasProps {
  genotype: GenotypeV1
  blueprint: PlantBlueprintV1
  progressRef: RefObject<number>
  silhouette?: boolean
  mobileMode?: boolean
  debug?: boolean
  onDebugStats?: (stats: RenderStats) => void
}

export interface RenderStats {
  fps: number
  drawCalls: number
  triangles: number
  renderedOrgans: number
  quality: 'full' | 'reduced-lod'
}

function PlantMotion({ genotype, children }: { genotype: GenotypeV1; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime() * genotype.motion.speed
    const wave = Math.sin(t) * genotype.motion.amplitude
    const pulse = 1 + Math.sin(t * 0.72 + 0.8) * genotype.motion.amplitude * 0.18
    group.current.rotation.z = genotype.motion.mode === 'sway' ? wave * 0.7 : wave * 0.18
    group.current.rotation.x = genotype.motion.mode === 'sway' ? wave * 0.22 : wave * 0.08
    group.current.scale.setScalar(genotype.motion.mode === 'pulse' ? pulse : 1)
  })

  return <group ref={group}>{children}</group>
}

function DebugStats({ quality, organCount, onUpdate }: { quality: RenderStats['quality']; organCount: number; onUpdate: (stats: RenderStats) => void }) {
  const { gl } = useThree()
  const windowRef = useRef({ startedAt: 0, frames: 0 })
  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    if (!windowRef.current.startedAt) windowRef.current.startedAt = now
    windowRef.current.frames += 1
    if (now - windowRef.current.startedAt < 0.5) return
    const elapsed = now - windowRef.current.startedAt
    onUpdate({
      fps: windowRef.current.frames / elapsed,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      renderedOrgans: organCount,
      quality,
    })
    windowRef.current = { startedAt: now, frames: 0 }
  })
  return null
}

function SpecimenScene({ genotype, blueprint, progressRef, silhouette = false, mobileMode = false, debug = false, onDebugStats }: SpecimenCanvasProps) {
  const geometries = useMemo(createGeometryMap, [])
  useEffect(() => () => {
    for (const geometry of geometries.values()) geometry.dispose()
  }, [geometries])
  const renderOrgans = useMemo(
    () => selectRenderOrgans(blueprint, mobileMode ? 'reduced' : 'full'),
    [blueprint, mobileMode],
  )
  const batches = useMemo(() => {
    const grouped = new Map<string, PlantBlueprintV1['organs']>()
    for (const organ of renderOrgans) {
      const key = `${geometryKey(organ.primitive)}:${organ.materialRole}`
      const current = grouped.get(key) ?? []
      current.push(organ)
      grouped.set(key, current)
    }
    return [...grouped.values()]
  }, [renderOrgans])

  return (
    <>
      <color attach="background" args={[silhouette ? '#dbe8df' : '#071411']} />
      <fog attach="fog" args={[silhouette ? '#dbe8df' : '#071411', 7, 18]} />
      <ambientLight intensity={silhouette ? 0.9 : 0.45} color="#c1f2dc" />
      <directionalLight position={[4, 8, 5]} intensity={silhouette ? 1.1 : 2.3} color="#e0fff2" />
      <pointLight position={[-3, 3, 2]} intensity={silhouette ? 0 : 2.2} distance={9} color={genotype.appearance.accentColor} />
      <pointLight position={[3, 1, -4]} intensity={silhouette ? 0 : 1.1} distance={8} color={genotype.appearance.secondaryColor} />
      <gridHelper args={[12, mobileMode ? 12 : 24, silhouette ? '#91a79a' : '#25443a', silhouette ? '#bdcec2' : '#12281f']} position={[0, 0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={silhouette ? '#b8c9bd' : '#0d211a'} roughness={0.92} metalness={0.02} />
      </mesh>
      <PlantMotion genotype={genotype}>
        {batches.map((organs) => {
          const geometry = geometries.get(geometryKey(organs[0].primitive))
          const batchKey = `${geometryKey(organs[0].primitive)}:${organs[0].materialRole}`
          return geometry ? (
            <InstancedOrganBatch
              key={batchKey}
              genotype={genotype}
              organs={organs}
              geometry={geometry}
              progressRef={progressRef}
              silhouette={silhouette}
            />
          ) : null
        })}
      </PlantMotion>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4}
        maxDistance={13}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.52}
        target={[0, blueprint.bounds.height * 0.45, 0]}
      />
      {debug && onDebugStats && (
        <DebugStats
          quality={mobileMode ? 'reduced-lod' : 'full'}
          organCount={renderOrgans.length}
          onUpdate={onDebugStats}
        />
      )}
    </>
  )
}

export function SpecimenFallback({ label = '3D 表型正在准备', silhouette = false }: { label?: string; silhouette?: boolean }) {
  return (
    <div className={`specimen-fallback ${silhouette ? 'specimen-fallback--silhouette' : ''}`} data-testid="specimen-fallback">
      <div className="fallback-orbit fallback-orbit--one" />
      <div className="fallback-orbit fallback-orbit--two" />
      <div className="fallback-core" />
      <span>{label}</span>
    </div>
  )
}

export function SpecimenCanvas(props: SpecimenCanvasProps) {
  if (!canUseWebgl()) {
    return <SpecimenFallback silhouette={props.silhouette} />
  }

  const dpr: [number, number] = typeof window !== 'undefined' && window.innerWidth <= 720 ? [1, 1.25] : [1, 1.5]
  const mobileMode = typeof window !== 'undefined' && window.innerWidth <= 720

  return (
    <Canvas
      dpr={props.silhouette ? [1, 1] : mobileMode ? [0.75, 1] : dpr}
      camera={{ position: [5.3, 3.6, 7.2], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: !mobileMode, powerPreference: 'high-performance' }}
      fallback={<SpecimenFallback silhouette={props.silhouette} />}
    >
      <SpecimenScene {...props} mobileMode={mobileMode} />
    </Canvas>
  )
}
