import { useCallback, useDeferredValue, useMemo, useReducer, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { scheduleGrowthFromAudio } from './core/audio/scheduleGrowth'
import type { MappingResultV1 } from './core/audio/types'
import type { PresetId } from './core/genotype/presets'
import { parseGenotypeJson, serializeGenotype } from './core/genotype/serialization'
import type { PublicTraitKey } from './core/genotype/traitSemantics'
import { generatePlant } from './core/phenotype/generatePlant'
import { AudioAnalysisPanel } from './features/audio/AudioAnalysisPanel'
import { AudioInput } from './features/audio/AudioInput'
import { useAudioGrowthPlayback } from './features/audio/useAudioGrowthPlayback'
import { useAudioPipeline } from './features/audio/useAudioPipeline'
import { SpecimenCanvas, type RenderStats } from './features/phenotype/SpecimenCanvas'
import { createInitialSandboxState, reduceSandboxState } from './features/sandbox/sandboxReducer'
import { TraitInspector } from './features/sandbox/TraitInspector'
import { useGrowthPlayback } from './features/sandbox/useGrowthPlayback'
import './App.css'

const morphologyTabs: Array<{ id: PresetId; label: string; eyebrow: string; mark: string }> = [
  { id: 'deep-root-tree', label: '深根树', eyebrow: 'TREE', mark: '⌁' },
  { id: 'tidal-rosette', label: '潮汐蔷薇', eyebrow: 'ROSETTE', mark: '✦' },
  { id: 'mist-colony', label: '雾生菌落', eyebrow: 'COLONY', mark: '◌' },
]

function Glyph({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <span className="glyph" style={{ width: size, height: size }} aria-hidden="true">
      {children}
    </span>
  )
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${remainder.toFixed(2).padStart(5, '0')}`
}

function App() {
  const [state, dispatch] = useReducer(reduceSandboxState, undefined, createInitialSandboxState)
  const {
    genotype,
    presetId,
    playbackResetToken,
    isPlaying,
    message,
    mappedGenotype,
    overriddenTraits,
  } = state
  const importInputRef = useRef<HTMLInputElement>(null)
  const [renderStats, setRenderStats] = useState<RenderStats>({ fps: 0, drawCalls: 0, triangles: 0, renderedOrgans: 0, quality: 'full' })
  const deferredGenotype = useDeferredValue(genotype)
  const debugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
  const silhouetteMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('silhouette') === '1'

  const applyAudioMapping = useCallback((mapping: MappingResultV1) => {
    dispatch({ type: 'apply-audio-genotype', genotype: mapping.genotype })
  }, [])
  const audioPipeline = useAudioPipeline(applyAudioMapping)
  const audioPlayback = useAudioGrowthPlayback({ durationSeconds: audioPipeline.durationSeconds })
  const isAudioMode = audioPipeline.mapping !== null && presetId === 'audio'

  const blueprint = useMemo(() => {
    const generated = generatePlant(deferredGenotype)
    return isAudioMode
      && audioPipeline.mapping
      && deferredGenotype.seed === audioPipeline.mapping.genotype.seed
      ? scheduleGrowthFromAudio(generated, audioPipeline.mapping.growthCues)
      : generated
  }, [audioPipeline.mapping, deferredGenotype, isAudioMode])
  const onPlaybackComplete = useCallback(() => {
    dispatch({ type: 'set-playing', value: false })
  }, [])
  const {
    elapsedSeconds: simulatedElapsedSeconds,
    progress: simulatedGrowthProgress,
    progressRef: simulatedProgressRef,
  } = useGrowthPlayback({
    durationSeconds: genotype.growth.durationSeconds,
    isPlaying,
    resetToken: playbackResetToken,
    onComplete: onPlaybackComplete,
  })
  const elapsedSeconds = isAudioMode ? audioPlayback.elapsedSeconds : simulatedElapsedSeconds
  const growthProgress = isAudioMode ? audioPlayback.progress : simulatedGrowthProgress
  const progressRef = isAudioMode ? audioPlayback.progressRef : simulatedProgressRef
  const activeDuration = isAudioMode ? audioPipeline.durationSeconds : genotype.growth.durationSeconds
  const activeIsPlaying = isAudioMode ? audioPlayback.isPlaying : isPlaying

  const leaveAudioMode = () => {
    audioPlayback.pause()
    audioPipeline.clear()
  }

  const selectPreset = (id: PresetId) => {
    if (isAudioMode) leaveAudioMode()
    dispatch({ type: 'select-preset', id })
  }

  const replay = () => {
    if (isAudioMode) void audioPlayback.replay()
    else dispatch({ type: 'replay' })
  }

  const updateTrait = (key: PublicTraitKey, value: number) => {
    dispatch({ type: 'update-trait', key, value })
  }

  const restoreMappedTrait = (key: PublicTraitKey) => {
    dispatch({ type: 'restore-mapped-trait', key })
  }

  const restoreAllMappedTraits = () => {
    dispatch({ type: 'restore-all-mapped-traits' })
  }

  const togglePlayback = () => {
    if (isAudioMode) {
      if (audioPlayback.isPlaying) audioPlayback.pause()
      else void audioPlayback.play()
    } else {
      dispatch({ type: 'set-playing', value: !isPlaying })
    }
  }

  const exportJson = () => {
    const blob = new Blob([serializeGenotype(genotype)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sound-garden-${genotype.morphology.family}-genotype.json`
    anchor.click()
    URL.revokeObjectURL(url)
    dispatch({ type: 'set-message', message: '基因型 JSON 已导出' })
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = parseGenotypeJson(await file.text())
    if (!result.success) {
      dispatch({ type: 'set-message', message: `导入失败：${result.message}` })
      return
    }
    if (isAudioMode) leaveAudioMode()
    dispatch({ type: 'import-genotype', genotype: result.data })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="brand-kicker">SOUND GARDEN / 01</p>
            <h1>声音植物园</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="online-pill"><span className="status-dot" /> GENOTYPE V1 <b>•</b> ONLINE</span>
          <button className="icon-button" aria-label="打开设置" type="button"><Glyph>⌘</Glyph></button>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="section-index">01 / PHENOTYPE LAB</p>
          <h2>3D 表型实验台</h2>
          <p className="intro-copy">把一段声音拆成可解释的基因型，再让植物在时间轴上完成一次可复现的生长。</p>
        </div>
        <div className="intro-metric">
          <span>LIVE SEED</span>
          <strong>{genotype.seed}</strong>
          <small>固定种子 · 同输入同表型</small>
        </div>
      </section>

      <AudioInput
        status={audioPipeline.status}
        progress={audioPipeline.progress}
        fileName={audioPipeline.fileName}
        error={audioPipeline.error}
        onSelect={audioPipeline.selectFile}
      />

      <nav className="morphology-tabs" aria-label="表型形态族">
        {morphologyTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`morphology-tab ${presetId === tab.id ? 'is-active' : ''}`}
            onClick={() => selectPreset(tab.id)}
          >
            <span className="tab-mark">{tab.mark}</span>
            <span><small>{tab.eyebrow}</small><b>{tab.label}</b></span>
            {presetId === tab.id && <i aria-hidden="true" />}
          </button>
        ))}
      </nav>

      <section className="workspace-grid">
        <section className="stage-panel" aria-label="3D 表型视窗">
          <div className="stage-toolbar">
            <div className="stage-title"><span className="live-ring" /> SPECIMEN / {genotype.morphology.family.toUpperCase()}</div>
            <div className="stage-tools"><span>CAMERA 01</span><span className="tool-divider" /><span>DRAG TO ORBIT</span></div>
          </div>
          <div className={`stage-canvas ${silhouetteMode ? 'stage-canvas--silhouette' : ''}`} data-silhouette={silhouetteMode ? 'true' : 'false'}>
            <div className="stage-corner stage-corner--tl">X / Y / Z</div>
            <div className="stage-corner stage-corner--br">{blueprint.stats.organCount.toString().padStart(3, '0')} ORGANS</div>
            <SpecimenCanvas genotype={genotype} blueprint={blueprint} progressRef={progressRef} silhouette={silhouetteMode} debug={debugMode} onDebugStats={setRenderStats} />
            {debugMode && <div className="debug-overlay">{renderStats.fps.toFixed(0)} FPS · {renderStats.drawCalls} CALLS · {renderStats.triangles.toLocaleString()} TRI · {renderStats.quality.toUpperCase()} · {renderStats.renderedOrgans} RENDERED / {blueprint.stats.organCount} ORGANS</div>}
          </div>
          <div className="stage-caption">
            <div><span className="caption-label">CURRENT SPECIMEN</span><strong>{presetId === 'audio' ? '声音映射表型' : morphologyTabs.find((tab) => tab.id === presetId)?.label ?? '自定义表型'}</strong></div>
            <div className="caption-coordinate"><span>BOUNDS</span><b>{blueprint.bounds.height.toFixed(2)} H</b><b>{blueprint.bounds.radius.toFixed(2)} R</b></div>
          </div>
        </section>

        <aside className="inspector-panel" aria-label="基因型检查器">
          <div className="inspector-heading"><div><p className="section-index">INSPECTOR / 001</p><h3>基因型</h3></div><span className="version-tag">V1</span></div>
          <div className="identity-card">
            <div className="identity-top"><span className="identity-label">MORPHOLOGY FAMILY</span><span className="identity-chip">DETERMINISTIC</span></div>
            <strong>{genotype.morphology.family === 'tree' ? 'Deep-root tree' : genotype.morphology.family === 'rosette' ? 'Tidal rosette' : 'Mist colony'}</strong>
            <span>seed / {genotype.seed}</span>
          </div>

          <TraitInspector
            genotype={genotype}
            mappedGenotype={mappedGenotype}
            overriddenTraits={overriddenTraits}
            onChange={updateTrait}
            onRestore={restoreMappedTrait}
            onRestoreAll={restoreAllMappedTraits}
          />

          <div className="inspector-section phenotype-summary">
            <div className="subsection-heading"><span>PHENOTYPE OUTPUT</span><small>GENERATED</small></div>
            <div className="summary-grid">
              <div><b>{blueprint.stats.organCount}</b><span>ORGANS</span></div>
              <div><b>{Math.round(blueprint.stats.estimatedTriangles / 1000)}k</b><span>TRIANGLES</span></div>
              <div><b>{Math.round(activeDuration)}s</b><span>GROWTH</span></div>
            </div>
          </div>

          <div className="inspector-actions">
            <button type="button" className="secondary-button" onClick={exportJson}><Glyph>↓</Glyph> 导出 JSON</button>
            <button type="button" className="secondary-button" onClick={() => importInputRef.current?.click()}><Glyph>↑</Glyph> 导入 JSON</button>
            <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json" onChange={importJson} />
          </div>
        </aside>
      </section>

      {isAudioMode && audioPipeline.analysis && audioPipeline.mapping ? (
        <AudioAnalysisPanel analysis={audioPipeline.analysis} mapping={audioPipeline.mapping} />
      ) : null}

      <section className="timeline-dock" aria-label="生长时间轴">
        <div className="timeline-controls">
          <button className="play-button" type="button" onClick={togglePlayback} aria-label={activeIsPlaying ? '暂停' : '播放'}>
            <span>{activeIsPlaying ? 'Ⅱ' : '▶'}</span>
          </button>
          <button className="replay-button" type="button" onClick={replay}><Glyph>↻</Glyph> 重播</button>
          <span className="time-readout">{formatTime(elapsedSeconds)} <i>/</i> {formatTime(activeDuration)}</span>
        </div>
        <div className="timeline-track-wrap">
          <div className="timeline-track"><span className="timeline-fill" style={{ width: `${growthProgress * 100}%` }} /><span className="timeline-thumb" style={{ left: `${growthProgress * 100}%` }} /></div>
          {isAudioMode ? <input className="timeline-scrubber" type="range" min="0" max="1" step="0.001" value={growthProgress} onChange={(event) => audioPlayback.seek(Number(event.target.value))} aria-label="拖动音频生长时间轴" /> : null}
          <div className="timeline-labels"><span>SEED</span><span>BODY</span><span>ORGANS</span><span>ACCENTS</span><span>MATURE</span></div>
        </div>
        <div className="timeline-status"><span className="status-dot" /> {activeIsPlaying ? 'GROWING' : growthProgress >= 1 ? 'MATURE' : 'PAUSED'}<small>{audioPlayback.playbackError || message || (isAudioMode ? '音频时钟同步' : '实时表型同步')}</small></div>
      </section>
      <audio ref={audioPlayback.audioRef} src={audioPipeline.audioUrl || undefined} onEnded={audioPlayback.handleEnded} preload="metadata" className="visually-hidden" />
    </main>
  )
}

export default App
