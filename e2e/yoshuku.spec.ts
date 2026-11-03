import { expect, test, type Page } from '@playwright/test'

async function dreams(page: Page) {
  const mobile = await page.locator('.bottom-nav').isVisible()
  await page.locator(mobile ? '.bottom-nav' : '.desktop-nav').getByRole('button', { name: '絵馬殿', exact: true }).click()
}
async function enter(page: Page) {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  await dreams(page)
}
async function start(page: Page) {
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
  await page.getByRole('textbox', { name: 'はぐくみたい願い' }).fill('海の見えるホテルで過ごしたい')
  await page.getByRole('button', { name: '叶った未来を想像する' }).click()
}
async function finish(page: Page) {
  const answers = ['うれしくて、ほっとした', '海の見えるホテル', '心が豊かになった', 'そのままで、大丈夫だよ']
  for (let i = 0; i < answers.length; i++) {
    await page.getByRole('textbox', { name: 'あなたの言葉', exact: true }).fill(answers[i])
    await page.getByRole('button', { name: i === 3 ? '予祝の絵馬をつくる' : 'この気持ちを届ける', exact: true }).click()
  }
}
test('モックの感情質問・言い換え・4往復・編集・桜絵馬・保存後の全文と編集', async ({ page }, testInfo) => {
  const external: string[] = []
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url()) })
  await enter(page)
  await start(page)
  await expect(page.locator('.yoshuku-mode')).toContainText('AIは使用していません')
  await expect(page.locator('.yoshuku-guide')).toContainText('どんな気持ちでしたか？')
  await page.getByRole('button', { name: '質問を言い換えてもらう' }).click()
  await expect(page.locator('.yoshuku-guide')).toContainText('どんな気持ちが浮かびましたか？')
  await finish(page)
  await expect(page.getByRole('textbox', { name: '予祝の文章を編集' })).toHaveValue(/海の見えるホテル/)
  await page.getByRole('textbox', { name: '予祝の文章を編集' }).fill('想像した未来。海を眺め、ほっとした気持ちでした。この時間にありがとう。')
  await page.screenshot({ path: testInfo.outputPath('yoshuku-preview.png'), fullPage: true })
  await page.getByRole('button', { name: 'この絵馬を奉納する', exact: true }).dblclick()
  await expect(page.getByRole('heading', { name: '夢をはぐくむ時間を、絵馬に込めました。' })).toBeVisible()
  await page.getByRole('button', { name: '絵馬殿に戻る' }).click()
  await expect(page.locator('.ema-yoshuku')).toHaveCount(1)
  await expect(page.locator('.ema-yoshuku .sakura-border')).toHaveCount(2)
  await expect(page.locator('.coin-pill b')).toHaveText('0')
  await page.reload(); await dreams(page)
  await page.locator('.ema-yoshuku').click()
  await expect(page.locator('.yoshuku-story')).toHaveText('想像した未来。海を眺め、ほっとした気持ちでした。この時間にありがとう。')
  await page.getByRole('button', { name: '編集する', exact: true }).click()
  await page.getByRole('textbox', { name: '予祝の文章', exact: true }).fill('想像した未来に、もう一度ありがとう。')
  await page.getByRole('button', { name: '願いを込めて、保存する' }).click()
  await page.locator('.ema-yoshuku').click()
  await expect(page.locator('.yoshuku-story')).toHaveText('想像した未来に、もう一度ありがとう。')
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!))
  expect(data.dreams[0].yoshuku.generatedText).toContain('海の見えるホテル')
  expect(data.dreams[0].yoshuku.conversation).toHaveLength(4)
  expect(data.spirit.expectation).toBe(1)
  expect(external).toEqual([])
})
test('途中の回答とプレビュー編集は閉じる・再読み込み後も残る', async ({ page }) => {
  await enter(page); await start(page)
  await page.getByRole('textbox', { name: 'あなたの言葉', exact: true }).fill('まだ送っていない、安心した気持ち')
  await page.getByRole('button', { name: '下書きを残して閉じる' }).click()
  await page.reload(); await dreams(page)
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'あなたの言葉', exact: true })).toHaveValue('まだ送っていない、安心した気持ち')
  await finish(page)
  await page.getByRole('textbox', { name: '予祝の文章を編集' }).fill('編集した途中の文章を残す。')
  await page.reload(); await dreams(page)
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '予祝の文章を編集' })).toHaveValue('編集した途中の文章を残す。')
  await page.getByRole('button', { name: '体験を最初からやり直す', exact: true }).click()
  await page.getByRole('button', { name: '続きに戻る', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '予祝の文章を編集' })).toHaveValue('編集した途中の文章を残す。')
  await page.getByRole('button', { name: '体験を最初からやり直す', exact: true }).click()
  await page.getByRole('button', { name: '下書きを破棄して始める', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'はぐくみたい願い' })).toHaveValue('')
})
test('既存の絵馬からは同じ絵馬を更新し、実際の達成時だけ報酬を受け取る', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: '願いを絵馬に書く', exact: true }).click()
  await page.getByRole('textbox', { name: '夢のタイトル' }).fill('家族と海へ行く')
  await page.getByRole('textbox', { name: '夢の詳細' }).fill('元から大事にしていた願い')
  await page.getByRole('button', { name: '願いを込めて、保存する' }).click()
  await page.locator('.ema-open').click()
  await page.getByRole('button', { name: 'この夢をはぐくむ' }).click()
  await expect(page.getByRole('textbox', { name: 'はぐくみたい願い' })).toHaveValue('家族と海へ行く')
  await page.getByRole('button', { name: '叶った未来を想像する' }).click()
  await finish(page)
  await page.getByRole('button', { name: 'この絵馬を奉納する', exact: true }).click()
  await page.getByRole('button', { name: '絵馬殿に戻る' }).click()
  await expect(page.locator('.ema-open')).toHaveCount(1)
  await page.locator('.ema-open').click()
  await expect(page.getByRole('dialog')).toContainText('元から大事にしていた願い')
  await page.getByRole('button', { name: '夢が叶った！' }).click()
  await page.getByRole('button', { name: '夢が叶ったことを記録する' }).click()
  await page.getByRole('button', { name: '演出をスキップ' }).click()
  await expect(page.locator('.coin-pill b')).toHaveText('1')
})
test('320pxでも読みやすい配置と桜の上下枠を保つ', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await enter(page); await start(page); await finish(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const paper = page.locator('.yoshuku-ema-paper')
  await expect(paper.locator('.sakura-border')).toHaveCount(2)
  expect(await paper.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'この絵馬を奉納する', exact: true })).toBeEnabled()
})

test('端末への保存に失敗した奉納は完了扱いにせず、編集内容を下書きに残す', async ({ page }) => {
  await enter(page); await start(page); await finish(page)
  await page.getByRole('textbox', { name: '予祝の文章を編集' }).fill('保存に失敗しても残したい、想像した未来の文章。')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'yumekana-shrine:v1') throw new DOMException('No space', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'この絵馬を奉納する', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('下書きは残しています')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).dreams)).toHaveLength(0)
  await page.reload(); await dreams(page)
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '予祝の文章を編集' })).toHaveValue('保存に失敗しても残したい、想像した未来の文章。')
})
