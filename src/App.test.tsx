import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('Sound Garden shell', () => {
  let nextFrameId = 1
  let scheduledFrames: Array<{ id: number; callback: FrameRequestCallback }> = []

  const runFrame = (now: number) => {
    const frame = scheduledFrames.shift()
    if (!frame) throw new Error('No animation frame was scheduled')
    act(() => frame.callback(now))
  }

  beforeEach(() => {
    nextFrameId = 1
    scheduledFrames = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextFrameId
      nextFrameId += 1
      scheduledFrames.push({ id, callback })
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      scheduledFrames = scheduledFrames.filter((frame) => frame.id !== id)
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the specimen sandbox title', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '声音植物园' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重播' })).toBeInTheDocument()
    expect(screen.getByLabelText('选择本地音频')).toHaveAttribute('accept', 'audio/*')
    expect(screen.getByText('最长 120 秒 · 最大 50 MB · 仅在本地分析')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '粗壮度' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '结构复杂度' })).toBeInTheDocument()
  })

  it('advances, pauses, and replays the visible timeline through the continuous clock', () => {
    const { container } = render(<App />)
    const startedAt = performance.now()

    runFrame(startedAt)
    runFrame(startedAt + 120)
    expect(container.querySelector('.time-readout')).toHaveTextContent('00:00.12')

    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    expect(scheduledFrames).toHaveLength(0)
    expect(container.querySelector('.time-readout')).toHaveTextContent('00:00.12')

    fireEvent.click(screen.getByRole('button', { name: '重播' }))
    expect(container.querySelector('.time-readout')).toHaveTextContent('00:00.00')
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument()
  })
})
