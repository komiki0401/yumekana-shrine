import { expect, test, type Page } from '@playwright/test'

async function open(page: Page) {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  const mobile = await page.locator('.bottom-nav').isVisible()
  await page.locator(mobile ? '.bottom-nav' : '.desktop-nav').getByRole('button', { name: '絵馬殿', exact: true }).click()
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
}
test('外部送信は同意後のみ・回答に応じた応答・4回答で要約と編集', async ({ page }) => {
  const sent: { action: string; wish: string; turns: { question: string; answer: string }[] }[] = []
  await page.route('https://yoshuku.example.test/api/yoshuku', async route => {
    const input = route.request().postDataJSON()
    sent.push(input)
    await route.fulfill({ json: { mode: 'ai', text: input.action === 'summary' ? '想像した未来。うれしさに包まれ、海を眺めて過ごしました。この時間にありがとう。' : `「${input.turns.at(-1).answer}」という思いを受け取りました。その日の${input.turns.length === 1 ? '景色' : input.turns.length === 2 ? '心の中' : '今の自分への言葉'}は、どんなものでしたか？` }, headers: { 'Access-Control-Allow-Origin': '*' } })
  })
  await open(page)
  await page.getByRole('textbox', { name: 'はぐくみたい願い' }).fill('海へ行く')
  await page.getByRole('checkbox', { name: '外部AIを使って体験する' }).check()
  await expect(page.getByRole('button', { name: '叶った未来を想像する' })).toBeDisabled()
  expect(sent).toHaveLength(0)
  await page.getByRole('checkbox', { name: /この願いと対話を/ }).check()
  await page.getByRole('button', { name: '叶った未来を想像する' }).click()
  await expect(page.locator('.yoshuku-guide')).toContainText('どんな気持ちでしたか？')
  for (let i = 0; i < 4; i++) {
    await page.getByRole('textbox', { name: 'あなたの言葉', exact: true }).fill(['うれしかった', '海辺', '安心した', 'ありがとう'][i])
    await page.getByRole('button', { name: i === 3 ? '予祝の絵馬をつくる' : 'この気持ちを届ける', exact: true }).click()
    if (i === 0) await expect(page.locator('.yoshuku-guide').last()).toContainText('うれしかった')
    else if (i < 3) await expect(page.locator('.yoshuku-progress')).toContainText(`${i + 2} / 4`)
  }
  await expect(page.getByRole('textbox', { name: '予祝の文章を編集' })).toHaveValue(/想像した未来/)
  expect(sent.map(s => s.action)).toEqual(['next', 'next', 'next', 'summary'])
  expect(Object.keys(sent[0]).sort()).toEqual(['action', 'turns', 'wish'])
})
test('API失敗・待機中の連打・下書き再開後も入力が残り、同意を取り直せる', async ({ page }) => {
  let calls = 0
  await page.route('https://yoshuku.example.test/api/yoshuku', async route => {
    calls++
    if (calls === 1) { await new Promise(resolve => setTimeout(resolve, 250)); await route.fulfill({ status: 503, json: {}, headers: { 'Access-Control-Allow-Origin': '*' } }) }
    else await route.fulfill({ json: { mode: 'ai', text: '安心したのですね。その日、どんな景色が見えていましたか？' }, headers: { 'Access-Control-Allow-Origin': '*' } })
  })
  await open(page)
  await page.getByRole('textbox', { name: 'はぐくみたい願い' }).fill('海へ行く')
  await page.getByRole('checkbox', { name: '外部AIを使って体験する' }).check()
  await page.getByRole('checkbox', { name: /この願いと対話を/ }).check()
  await page.getByRole('button', { name: '叶った未来を想像する' }).click()
  await page.getByRole('textbox', { name: 'あなたの言葉', exact: true }).fill('安心した')
  await page.getByRole('button', { name: 'この気持ちを届ける', exact: true }).dblclick()
  await expect(page.getByRole('alert')).toContainText('入力は残っています')
  expect(calls).toBe(1)
  await expect(page.getByRole('textbox', { name: 'あなたの言葉', exact: true })).toHaveValue('安心した')
  await page.reload()
  const mobile = await page.locator('.bottom-nav').isVisible()
  await page.locator(mobile ? '.bottom-nav' : '.desktop-nav').getByRole('button', { name: '絵馬殿', exact: true }).click()
  await page.getByRole('button', { name: '夢をはぐくむ', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'あなたの言葉', exact: true })).toHaveValue('安心した')
  await expect(page.getByRole('button', { name: 'この気持ちを届ける', exact: true })).toBeDisabled()
  await page.getByRole('checkbox', { name: /この願いと対話を/ }).check()
  await page.getByRole('button', { name: 'この気持ちを届ける', exact: true }).click()
  await expect(page.locator('.yoshuku-guide').last()).toContainText('どんな景色')
  expect(calls).toBe(2)
})
