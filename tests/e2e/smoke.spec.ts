import { expect, test } from '@playwright/test'

test('loads the phenotype sandbox shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('声音植物园｜声音驱动的 3D 表型实验台')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /声音/)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.getByRole('heading', { name: '声音植物园' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重播' })).toBeVisible()
})

test('switches specimen family and keeps controls interactive', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '潮汐蔷薇' }).click()
  await expect(page.getByText('潮汐蔷薇', { exact: true }).last()).toBeVisible()
  const heightSlider = page.getByRole('slider', { name: '高度' })
  await heightSlider.press('Home')
  for (let index = 0; index < 50; index += 1) await heightSlider.press('ArrowRight')
  await expect(page.getByText('0.50', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '重播' }).click()
  await expect(page.getByText('已从 00:00 重新播放生长时间轴')).toBeVisible()
})

test('keeps the production preview free of runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/?debug=1')
  await expect(page.locator('.debug-overlay')).toContainText('FPS')
  expect(errors).toEqual([])
})

test('keeps the timeline stable through pause and three consecutive replays', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit headless disables the production requestAnimationFrame loop; verify this flow on a real iOS device.')
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  const readout = page.locator('.time-readout')

  await expect.poll(async () => await readout.textContent()).not.toContain('00:00.00')
  await page.getByRole('button', { name: '暂停' }).click()
  const pausedAt = await readout.textContent()
  await page.waitForTimeout(180)
  await expect(readout).toHaveText(pausedAt ?? '')

  for (let replay = 0; replay < 3; replay += 1) {
    await page.getByRole('button', { name: '重播' }).click()
    await expect(page.getByText('已从 00:00 重新播放生长时间轴')).toBeVisible()
    await expect.poll(async () => await readout.textContent()).not.toContain('00:00.00')
  }

  expect(errors).toEqual([])
})

test('mobile reduced quality preserves the rosette body instead of rendering roots alone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The deterministic WebGL mobile viewport check runs in Chromium; real iOS remains a manual check.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?debug=1')
  await page.getByRole('button', { name: '潮汐蔷薇' }).click()
  const overlay = page.locator('.debug-overlay')

  await expect(overlay).toContainText('REDUCED-LOD')
  await expect.poll(async () => {
    const text = await overlay.textContent()
    return Number(text?.match(/(\d+) RENDERED/)?.[1] ?? 0)
  }).toBeGreaterThan(6)
})
