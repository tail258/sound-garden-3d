import { expect, test } from '@playwright/test'

test('measures an interactive render loop without blocking the UI', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit headless disables the production WebGL loop; use a real iOS device for mobile FPS.')
  await page.goto('/')
  const metric = await page.evaluate(() => new Promise<{ frames: number; elapsedMs: number }>((resolve) => {
    let frames = 0
    let startedAt = 0
    const sample = (now: number) => {
      if (!startedAt) startedAt = now
      frames += 1
      if (now - startedAt >= 700) {
        resolve({ frames, elapsedMs: now - startedAt })
        return
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  }))

  const fps = metric.frames / (metric.elapsedMs / 1000)
  console.log(`[perf] ${page.viewportSize()?.width}px viewport: ${fps.toFixed(1)} FPS over ${metric.elapsedMs.toFixed(0)}ms`)
  expect(metric.frames).toBeGreaterThan(8)
})
