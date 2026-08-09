import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioGrowthPlayback } from './useAudioGrowthPlayback'

function Harness() {
  const playback = useAudioGrowthPlayback({ durationSeconds: 10 })
  return (
    <div>
      <audio ref={playback.audioRef} onEnded={playback.handleEnded} />
      <button type="button" onClick={playback.play}>play</button>
      <button type="button" onClick={playback.pause}>pause</button>
      <button type="button" onClick={playback.replay}>replay</button>
      <button type="button" onClick={() => playback.seek(0.75)}>seek</button>
      <output data-testid="snapshot">{playback.elapsedSeconds.toFixed(1)}:{playback.progress.toFixed(2)}:{String(playback.isPlaying)}</output>
    </div>
  )
}

describe('useAudioGrowthPlayback', () => {
  let frames: FrameRequestCallback[]

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses audio currentTime as the growth clock and pauses without resetting', async () => {
    const { container } = render(<Harness />)
    const audio = container.querySelector('audio')!

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'play' })))
    audio.currentTime = 4
    act(() => frames.shift()?.(100))
    expect(screen.getByTestId('snapshot')).toHaveTextContent('4.0:0.40:true')

    fireEvent.click(screen.getByRole('button', { name: 'pause' }))
    expect(screen.getByTestId('snapshot')).toHaveTextContent('4.0:0.40:false')
  })

  it('seeks, replays, and ends at a mature progress of one', async () => {
    const { container } = render(<Harness />)
    const audio = container.querySelector('audio')!

    fireEvent.click(screen.getByRole('button', { name: 'seek' }))
    expect(audio.currentTime).toBe(7.5)
    expect(screen.getByTestId('snapshot')).toHaveTextContent('7.5:0.75:false')

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'replay' })))
    expect(audio.currentTime).toBe(0)
    expect(screen.getByTestId('snapshot')).toHaveTextContent('0.0:0.00:true')

    fireEvent.ended(audio)
    expect(screen.getByTestId('snapshot')).toHaveTextContent('10.0:1.00:false')
  })

  it('does not resume when pause wins a pending play request', async () => {
    let resolvePlay!: () => void
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(() => new Promise<void>((resolve) => {
      resolvePlay = resolve
    }))
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'replay' }))
    fireEvent.click(screen.getByRole('button', { name: 'pause' }))
    await act(async () => resolvePlay())

    expect(screen.getByTestId('snapshot')).toHaveTextContent('0.0:0.00:false')
  })
})
