import { expect, test } from '@playwright/test'

for (const [total, level, name] of [[0, 1, 'はじまりの境内'], [15, 2, '花あかりの境内'], [50, 3, '光満ちる境内']] as const) {
  test(`合計${total}で彩り${level}の境内になり、再読み込みでも記録を保持する`, async ({ page }, testInfo) => {
    await page.addInitScript(total => {
      if (localStorage.getItem('yumekana-shrine:v1')) return
      localStorage.setItem('yumekana-shrine:v1', JSON.stringify({ version: 1, dreams: [{ id: 'protected', title: '大切な願い', detail: '保持する', target: '', status: 'wishing', createdAt: '2026-11-01' }], dailyGoals: {}, transactions: [{ id: 'old', date: '2026-11-01', kind: 'earn', amount: 1 }], fortunes: {}, gratitudes: [], encounters: [], spirit: { gratitude: Math.floor(total / 2), expectation: total - Math.floor(total / 2) }, spiritCredits: { dreams: [], gratitudes: [], gratitudeDays: {} }, settings: { id: 'device', welcomed: true, sound: false } }))
    }, total)
    await page.goto('./')
    const before = await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1'))
    await expect(page.locator('.shrine-scene')).toHaveAttribute('data-shrine-stage', String(level))
    await expect(page.locator('.growth-heading')).toContainText(name)
    await expect(page.locator('.growth-lantern')).toHaveCount(level === 1 ? 0 : level === 2 ? 2 : 4)
    await expect(page.locator('.growth-pavilion')).toHaveCount(level === 3 ? 2 : 0)
    if (level === 3) await expect(page.locator('.growth-pond')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`shrine-stage-${level}.png`) })
    await page.reload()
    await expect(page.locator('.shrine-scene')).toHaveAttribute('data-shrine-stage', String(level))
    expect(await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1'))).toBe(before)
    await page.setViewportSize({ width: 320, height: 740 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: '絵馬殿 ↗', exact: true }).click()
    await expect(page.getByRole('heading', { name: '夢を、絵馬に込めて' })).toBeVisible()
  })
}

test('感謝の奉納で境界を越えると、新しい境内が自動で開く', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  await page.evaluate(() => {
    const key = 'yumekana-shrine:v1', data = JSON.parse(localStorage.getItem(key)!)
    data.spirit = { gratitude: 7, expectation: 7 }; localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()
  const nav = page.locator(await page.locator('.bottom-nav').isVisible() ? '.bottom-nav' : '.desktop-nav')
  await nav.getByRole('button', { name: 'お礼参り', exact: true }).click()
  await page.getByRole('textbox', { name: '自分の言葉（任意）' }).fill('今日も穏やかに過ごせた。ありがとう。')
  await page.getByRole('button', { name: 'ありがとうを奉納する', exact: true }).click()
  await nav.getByRole('button', { name: '神社', exact: true }).click()
  await expect(page.locator('.shrine-scene')).toHaveAttribute('data-shrine-stage', '2')
  await expect(page.locator('.growth-heading')).toContainText('花あかりの境内')
  await expect(page.locator('.coin-pill b')).toHaveText('0')
})
