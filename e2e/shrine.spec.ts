import { expect, test, type Page } from '@playwright/test'
import { encounterWeights } from '../src/encounters'
import { implementedMiracles,miracleCatalog } from '../src/miracleCatalog'
import type { AnimatedMiracleId } from '../src/miracleCatalog'

async function navigate(page: Page, label: string) {
  const mobile = await page.locator('.bottom-nav').isVisible()
  await page.locator(mobile ? '.bottom-nav' : '.desktop-nav').getByRole('button', { name: label, exact: true }).click()
}

async function enter(page: Page) {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる' }).click()
}

test('夢の登録・編集・達成確認とリロード後の履歴', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await enter(page)
  await navigate(page, '絵馬殿')
  await page.getByRole('button', { name: '最初の絵馬を書く' }).click()
  await page.getByRole('textbox', { name: '夢のタイトル' }).fill('小さなカフェを開く')
  await page.getByRole('textbox', { name: '夢の詳細' }).fill('桜の見える場所で')
  await page.getByRole('button', { name: '願いを込めて、保存する' }).click()
  await page.locator('.ema-open').first().click()
  await page.getByRole('button', { name: '編集する' }).click()
  await page.getByRole('textbox', { name: '夢のタイトル' }).fill('桜のカフェを開く')
  await page.getByRole('button', { name: '願いを込めて、保存する' }).click()
  await page.locator('.ema-open').first().click()
  await page.getByRole('button', { name: '夢が叶った！' }).click()
  await page.getByRole('button', { name: 'まだ願い中にしておく' }).click()
  await expect(page.locator('.ema')).toHaveCount(1)
  await page.locator('.ema-open').first().click()
  await page.getByRole('button', { name: '夢が叶った！' }).click()
  await page.getByRole('textbox', { name: '今の気持ちをひとこと' }).fill('ありがとう、自分。')
  await page.getByRole('button', { name: '夢が叶ったことを記録する' }).click()
  await page.getByRole('button', { name: '演出をスキップ' }).click()
  await page.reload()
  await navigate(page, 'あゆみ')
  await expect(page.getByRole('heading', { name: '桜のカフェを開く' })).toBeVisible()
  await expect(page.locator('.timeline')).toContainText('ありがとう、自分。')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('叶えた夢のシャボン玉・思い出・小判が保存される', async ({ page }) => {
  await enter(page)
  await navigate(page, '叶えた夢リスト')
  await expect(page.getByRole('heading', { name: '叶った夢が、ここに浮かびます。' })).toBeVisible()
  await page.getByRole('button', { name: '絵馬殿で夢を見つける' }).click()
  const title = (await page.locator('.small-dream-suggestions .suggestion-list button').first().innerText()).trim()
  await page.locator('.small-dream-suggestions .suggestion-list button').first().click()
  await page.locator('.ema-open').first().click()
  await page.getByRole('button', { name: '夢が叶った！' }).click()
  await page.getByRole('textbox', { name: '今の気持ちをひとこと' }).fill('とても幸せでした。')
  await page.getByRole('button', { name: '夢が叶ったことを記録する' }).click()
  await page.getByRole('button', { name: '演出をスキップ' }).click()
  await expect(page.locator('.coin-pill b')).toHaveText('1')
  await navigate(page, '叶えた夢リスト')
  await expect(page.locator('.dream-bubble')).toHaveCount(1)
  await expect(page.locator('.bubble-title')).toHaveText(title)
  await page.getByRole('button', { name: '動きをとめる' }).click()
  await expect(page.locator('.bubble-garden')).toHaveClass(/paused/)
  await page.locator('.dream-bubble').click()
  await expect(page.getByRole('dialog')).toContainText('とても幸せでした。')
  await page.getByRole('button', { name: 'シャボン玉を眺める', exact: true }).click()
  await page.reload()
  await navigate(page, '叶えた夢リスト')
  await expect(page.locator('.bubble-title')).toHaveText(title)
  await expect(page.locator('.coin-pill b')).toHaveText('1')
  await page.locator('.coin-pill').click()
  await page.getByRole('button', { name: '小判1枚を奉納する' }).click()
  await page.getByRole('button', { name: '演出をスキップ' }).click()
  await expect(page.locator('.coin-pill b')).toHaveText('0')
  await expect(page.getByRole('button', { name: '小判1枚を奉納する' })).toBeDisabled()
  await navigate(page, 'おみくじ')
  await page.getByRole('button', { name: 'おみくじを引く · 無料' }).click()
  const result = await page.locator('.fortune-paper').textContent()
  await page.reload()
  await navigate(page, 'おみくじ')
  await expect(page.locator('.fortune-paper')).toHaveText(result!)
})

test('以前の達成記録と小判を保持し長い夢も丸い枠で表示する', async ({ page }, testInfo) => {
  await enter(page)
  await page.evaluate(() => {
    const key = 'yumekana-shrine:v1'
    const data = JSON.parse(localStorage.getItem(key)!)
    data.dailyGoals['2026-11-01'] = [{ id: 'old-goal', title: '散歩', done: true }]
    data.transactions.push({ id: 'old-earn', date: '2026-11-01', amount: 1, kind: 'earn', goalId: 'old-goal' })
    data.dreams = Array.from({length: 12}, (_, i) => ({ id: 'old-dream-' + i, title: i ? '美味しいご飯を食べる ' + i : '大切な人と笑い合いながら美味しいご飯をゆっくり食べて思い出をたくさん作る'.repeat(2), detail: '', target: '', createdAt: '2026-10-01', status: 'fulfilled', achievedAt: '2026-11-01', message: '大切な思い出' }))
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()
  await navigate(page, '叶えた夢リスト')
  await expect(page.locator('.dream-bubble')).toHaveCount(12)
  await page.screenshot({ path: testInfo.outputPath('dream-bubbles.png'), fullPage: true })
  await expect(page.locator('.coin-pill b')).toHaveText('1')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.locator('.dream-bubble').first().click()
  await expect(page.getByRole('dialog')).toContainText('大切な思い出')
  await page.getByRole('button', { name: 'シャボン玉を眺める', exact: true }).click()
  await navigate(page, 'あゆみ')
  await expect(page.locator('.day-history')).toContainText('2026-11-01')
})

test('破損した保存データを上書きせずに起動できる', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.setItem('yumekana-shrine:v1', '{broken'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('元のデータは上書きしません')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる' }).click()
  await page.getByRole('button', { name: '音声を有効にする' }).click()
  expect(await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1'))).toBe('{broken')
})

test('9ジャンルの200候補を探し、追加・重複防止・再読み込みできる', async ({ page }, testInfo) => {
  await enter(page)
  await navigate(page, '絵馬殿')
  await expect(page.locator('.genre-grid')).not.toBeVisible()
  await page.getByText('さらに夢を探しに行く', { exact: false }).click()
  await expect(page.locator('.genre-card')).toHaveCount(9)
  await expect(page.locator('.dream-explorer .suggestion-list button')).toHaveCount(0)
  const genres = [
    ['小さな幸せ', 30, '美味しいご飯を食べる'],
    ['旅行・おでかけ', 25, 'きれいな景色を見に行く'],
    ['恋愛・人間関係', 20, '大切な人と手をつないで散歩する'],
    ['美容・健康', 20, '好きな服を着て出かける'],
    ['仕事・成長', 20, '興味のある分野の話を聞きに行く'],
    ['お金・豊かさ', 20, '旅のための貯金箱を用意する'],
    ['趣味・遊び', 25, '新しい料理を作ってみる'],
    ['暮らし', 20, 'お気に入りの花を一輪飾る'],
    ['新しい挑戦', 20, '初めての場所へ一人で出かける'],
  ] as const
  for (const [label, count, title] of genres) {
    const genre = page.getByRole('button', { name: `${label} ${count}の夢`, exact: true })
    await genre.click()
    await expect(genre).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.dream-explorer .suggestion-list button')).toHaveCount(8)
    await expect(page.locator('.dream-explorer .suggestion-list button').first()).toContainText(title)
    await page.getByRole('button', { name: 'もっと見る', exact: true }).click()
    await expect(page.locator('.dream-explorer .suggestion-list button')).toHaveCount(16)
    while (await page.getByRole('button', { name: 'もっと見る', exact: true }).count()) {
      await page.getByRole('button', { name: 'もっと見る', exact: true }).click()
    }
    await expect(page.locator('.dream-explorer .suggestion-list button')).toHaveCount(count)
  }
  await page.getByRole('button', { name: '小さな幸せ 30の夢', exact: true }).click()
  const candidate = page.locator('.dream-explorer .suggestion-list button').first()
  const chosen = (await candidate.innerText()).trim()
  await candidate.click()
  await expect(candidate).toBeDisabled()
  await expect(candidate).toContainText('絵馬に追加済み')
  await expect(page.locator('.ema')).toHaveCount(1)
  await expect(page.locator('.ema h2')).toHaveText(chosen)
  await page.reload()
  await navigate(page, '絵馬殿')
  await expect(page.locator('.ema h2')).toHaveText(chosen)
  await page.getByText('さらに夢を探しに行く', { exact: false }).click()
  await page.getByRole('button', { name: '小さな幸せ 30の夢', exact: true }).click()
  await expect(page.locator('.dream-explorer .suggestion-list button').first()).toBeDisabled()
  if (testInfo.project.name === 'mobile-chromium') await page.setViewportSize({width: 320, height: 760})
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const cards = await page.locator('.genre-card').evaluateAll(items => items.map(item => {const r=item.getBoundingClientRect();return {top:r.top,width:r.width,height:r.height}}))
  expect(cards.filter(card => Math.abs(card.top - cards[0].top) < 1)).toHaveLength(3)
  expect(cards.every(card => card.width >= 44 && card.height >= 44)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('dream-genres.png'), fullPage: true })
})

test('絵馬掛けに小さな絵馬を並べ、詳細から編集できる', async ({ page }, testInfo) => {
  await enter(page)
  const title = '大切な人と美味しいご飯を食べながらゆっくり話す時間を持つ'
  await page.evaluate(title => {
    const key = 'yumekana-shrine:v1'
    const data = JSON.parse(localStorage.getItem(key)!)
    data.dreams = Array.from({length: 12}, (_, i) => ({id: 'ema-' + i, title: i ? '小さな願い ' + i : title, detail: '大切にしている願いの詳細', target: '2027-01-01', createdAt: '2026-11-02', status: 'wishing'}))
    localStorage.setItem(key, JSON.stringify(data))
  }, title)
  await page.reload()
  await navigate(page, '絵馬殿')
  await expect(page.locator('.ema-open')).toHaveCount(12)
  const cards = await page.locator('.ema-open').evaluateAll(items => items.map(item => {const r=item.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width}}))
  const columns = testInfo.project.name === 'mobile-chromium' ? 3 : 6
  expect(cards.filter(card => Math.abs(card.y - cards[0].y) < 1)).toHaveLength(columns)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('ema-rack.png'),fullPage:true})
  await page.locator('.ema-open').first().click()
  await expect(page.getByRole('dialog')).toContainText(title)
  await expect(page.getByRole('dialog')).toContainText('大切にしている願いの詳細')
  await expect(page.getByRole('dialog')).toContainText('2027-01-01')
  await page.getByRole('button',{name:'編集する',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'夢のタイトル'})).toHaveValue(title)
})


test('最初の4候補を入れ替え、必要なときだけジャンルを開ける', async ({ page }, testInfo) => {
  await enter(page)
  await navigate(page, '絵馬殿')
  const candidates = page.locator('.small-dream-suggestions .suggestion-list button')
  await expect(candidates).toHaveCount(4)
  await expect(page.locator('.genre-grid')).not.toBeVisible()
  const before = await candidates.allTextContents()
  await page.getByRole('button', { name: '別の候補を見る', exact: true }).click()
  const after = await candidates.allTextContents()
  expect(after.every(title => !before.includes(title))).toBe(true)
  const chosen = (await candidates.first().innerText()).trim()
  await candidates.first().click()
  await expect(page.locator('.ema h2')).toHaveText(chosen)
  expect(await candidates.allTextContents()).not.toContain(chosen)
  await page.getByText('さらに夢を探しに行く', { exact: false }).click()
  await expect(page.locator('.genre-grid')).toBeVisible()
  await page.getByRole('button', { name: '小さな幸せ 30の夢', exact: true }).click()
  await page.getByText('さらに夢を探しに行く', { exact: false }).click()
  await expect(page.locator('.genre-grid')).not.toBeVisible()
  await expect(candidates).toHaveCount(4)
  if (testInfo.project.name === 'mobile-chromium') await page.setViewportSize({width: 320, height: 760})
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('お礼参りの記録・下書き・感謝度と夢からのお礼を保存する', async ({ page }, testInfo) => {
  await enter(page)
  await navigate(page, 'お礼参り')
  const text = page.getByRole('textbox', { name: '自分の言葉（任意）', exact: true })
  await text.fill('今日も美味しいご飯が食べられた')
  await navigate(page, 'おみくじ')
  await navigate(page, 'お礼参り')
  await expect(text).toHaveValue('今日も美味しいご飯が食べられた')
  await page.getByRole('button', { name: 'ありがとうを奉納する', exact: true }).click()
  await expect(page.locator('.gratitude-record')).toHaveCount(1)
  await expect(page.locator('.spirit-panel strong').first()).toHaveText('1')
  await expect(page.locator('.gratitude-complete')).toContainText('ありがとうが、ひとつ光になりました。')
  await page.reload()
  await navigate(page, 'お礼参り')
  await expect(page.locator('.gratitude-record')).toContainText('今日も美味しいご飯が食べられた')
  await navigate(page, '絵馬殿')
  await page.locator('.small-dream-suggestions button').filter({ has: page.locator('svg.lucide-plus') }).first().click()
  const title = await page.locator('.ema h2').innerText()
  await page.locator('.ema-open').first().click()
  await page.getByRole('button', { name: '夢が叶った！' }).click()
  await page.getByRole('button', { name: '夢が叶ったことを記録する' }).click()
  await page.getByRole('button', { name: 'お礼参りへ進む', exact: true }).click()
  await expect(page.locator('.gratitude-linked')).toContainText(title)
  await text.fill('夢が叶って嬉しい。ありがとう！')
  await page.getByRole('button', { name: 'ありがとうを奉納する', exact: true }).click()
  await expect(page.locator('.gratitude-record')).toHaveCount(2)
  await expect(page.locator('.spirit-panel strong').first()).toHaveText('2')
  await expect(page.locator('.spirit-panel strong').nth(1)).toHaveText('1')
  await expect(page.locator('.gratitude-dream-tag')).toHaveCount(1)
  await page.reload()
  await navigate(page, 'お礼参り')
  await expect(page.locator('.gratitude-record')).toHaveCount(2)
  if (testInfo.project.name === 'mobile-chromium') await page.setViewportSize({width:320,height:760})
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('gratitude-page.png'),fullPage:true})
})

test('境内のレア演出は保存され、別ページでは抽選しない', async ({ page }) => {
  await enter(page)
  await page.evaluate(() => {
    const key = 'yumekana-shrine:v1'
    const data = JSON.parse(localStorage.getItem(key)!)
    data.spirit = {gratitude:0,expectation:40}
    localStorage.setItem(key,JSON.stringify(data))
  })
  const weights=encounterWeights({gratitude:0,expectation:40})
  const target=weights.findIndex(entry=>entry.kind==='deitySmile')
  const roll=weights.slice(0,target).reduce((sum,entry)=>sum+entry.weight,0)+weights[target].weight/2
  await page.addInitScript(roll => { Math.random = () => roll },roll)
  await page.clock.install()
  await page.reload()
  await page.clock.fastForward(9000)
  await expect(page.locator('.encounter-miracle')).toBeVisible()
  await expect(page.locator('.encounter-caption')).toContainText('神様が微笑む')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters.length)).toBe(1)
  await navigate(page, 'お礼参り')
  await page.clock.fastForward(120000)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters.length)).toBe(1)
  await expect(page.locator('.spirit-panel strong').first()).toHaveText('0')
  await expect(page.locator('.spirit-panel strong').nth(1)).toHaveText('40')
  await expect(page.locator('.spirit-total b')).toHaveText('40')
})


for (const kind of implementedMiracles.map(item=>item.id) as AnimatedMiracleId[]) {
 test(`レア演出「${kind}」の専用画像を表示できる`, async ({ page }, testInfo) => {
  await enter(page)
  const weights = encounterWeights({gratitude:40,expectation:0})
  let start = 0
  for (const entry of weights) {
   if (entry.kind === kind) break
   start += entry.weight
  }
  const weight = weights.find(entry => entry.kind === kind)!.weight
  await page.evaluate(() => {
   const key = 'yumekana-shrine:v1'
   const data = JSON.parse(localStorage.getItem(key)!)
   data.spirit = {gratitude:40,expectation:0}
   localStorage.setItem(key,JSON.stringify(data))
  })
  await page.addInitScript(roll => { Math.random = () => roll }, start + weight / 2)
  await page.clock.install()
  await page.reload()
  await page.clock.fastForward(9000)
  const image = page.locator(`.encounter-${kind} .encounter-image`).first()
  await expect(image).toBeVisible()
  expect(await image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters)
  expect(entries).toHaveLength(1)
  expect(entries[0].kind).toBe(kind)
  await expect(page.locator('.deity-light')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('encounter-image.png')})
 })
}

test('画像を読み込めないときは見えない出会いを記録しない', async ({ page }) => {
 await enter(page)
 await page.evaluate(() => {
  const key = 'yumekana-shrine:v1'
  const data = JSON.parse(localStorage.getItem(key)!)
  data.spirit = {gratitude:1,expectation:0}
  localStorage.setItem(key,JSON.stringify(data))
 })
 await page.addInitScript(() => { Math.random = () => 0 })
 await page.route('**/assets/cat-*.png', route => route.abort())
 await page.clock.install()
 const failed = page.waitForEvent('requestfailed', request => /assets\/cat-.*\.png/.test(request.url()))
 await page.reload()
 await page.clock.fastForward(9000)
 await failed
 await expect(page.locator('.shrine-encounter')).toHaveCount(0)
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters)).toHaveLength(0)
 await navigate(page, 'お礼参り')
 await expect(page.getByRole('heading', {name:'お礼参り',exact:true})).toBeVisible()
})


test('奇跡図鑑に全50種類を表示し、旧履歴の初回日時とフィルターを保持する',async({page},testInfo)=>{
 await enter(page)
 await page.evaluate(()=>{
  const k='yumekana-shrine:v1',d=JSON.parse(localStorage.getItem(k)!)
  d.encounters=[
   {id:'old',kind:'miracle',date:'2026-11-01',createdAt:'2026-11-01T01:00:00.000Z'},
   {id:'new',kind:'deitySmile',date:'2026-11-02',createdAt:'2026-11-02T01:00:00.000Z'},
   {id:'cat',kind:'cat',date:'2026-11-02',createdAt:'2026-11-02T02:00:00.000Z'},
  ]
  localStorage.setItem(k,JSON.stringify(d))
 })
 await page.reload()
 await page.locator('.miracle-book-button').click()
 await expect(page.locator('.miracle-card')).toHaveCount(50)
 await expect(page.locator('.miracle-card.discovered')).toHaveCount(2)
 await expect(page.locator('.book-overview b')).toHaveText('2 / 50')
 const smile=page.getByRole('article',{name:'神様が微笑む',exact:true})
 await expect(smile.locator('time')).toHaveAttribute('datetime','2026-11-01T01:00:00.000Z')
 await expect(page.getByRole('heading',{name:'龍が空を横切る',exact:true})).toHaveCount(0)
 await page.getByRole('button',{name:'SSR：奇跡',exact:true}).click()
 await expect(page.locator('.miracle-card')).toHaveCount(miracleCatalog.filter(item=>item.rarity==='SSR').length)
 await expect(page.locator('.miracle-card.discovered')).toHaveCount(1)
 await page.getByRole('button',{name:'すべて',exact:true}).click()
 if(testInfo.project.name==='mobile-chromium')await page.setViewportSize({width:320,height:760})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:testInfo.outputPath('miracle-book.png'),fullPage:true})
 await expect(page.getByText('開発用：演出確認（記録しません）',{exact:true})).toHaveCount(0)
 await page.getByRole('button',{name:'境内へ戻る',exact:true}).click()
 await expect(page.locator('.miracle-book-button')).toContainText('2/50')
 await page.reload()
 await page.locator('.miracle-book-button').click()
 await expect(page.locator('.miracle-card.discovered')).toHaveCount(2)
})

test('100候補からのランダムな6択・複数選択・自由記述任意・再奉納に対応する',async({page},testInfo)=>{
 await enter(page)
 await navigate(page,'お礼参り')
 await expect(page.getByRole('heading',{name:'今日、ちょっと幸せだったことは？',exact:true})).toBeVisible()
 const choices=page.locator('.gratitude-choice')
 await expect(choices).toHaveCount(6)
 const before=await choices.allTextContents()
 await choices.first().getByRole('checkbox').check()
 await page.getByRole('button',{name:'別の幸せを見る',exact:true}).click()
 expect((await choices.allTextContents()).every(label=>!before.includes(label))).toBe(true)
 await choices.first().getByRole('checkbox').check()
 await expect(page.locator('.gratitude-selected-sentences>div')).toHaveCount(2)
 const text=page.getByRole('textbox',{name:'自分の言葉（任意）',exact:true})
 await expect(text).not.toHaveAttribute('required')
 await expect(text).toHaveAttribute('placeholder','今日、心があたたかくなったことは…')
 // Two submits in the same event turn must still produce one entry.
 await page.locator('.gratitude-choice-writing form').evaluate((form:HTMLFormElement)=>{form.requestSubmit();form.requestSubmit()})
 await expect(page.locator('.gratitude-complete')).toContainText('ありがとうが、ひとつ光になりました。')
 await expect(page.locator('.gratitude-record')).toHaveCount(1)
 await expect(page.locator('.spirit-panel strong').first()).toHaveText('1')
 await page.getByRole('button',{name:'もう一度ありがとうを奉納する',exact:true}).click()
 await expect(text).toHaveValue('')
 await expect(page.locator('.gratitude-choice input:checked')).toHaveCount(0)
 await expect(page.locator('.gratitude-record')).toHaveCount(1)
 await expect(page.getByRole('button',{name:'ありがとうを奉納する',exact:true})).toBeDisabled()
 if(testInfo.project.name==='mobile-chromium')await page.setViewportSize({width:320,height:760})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:testInfo.outputPath('gratitude-choices.png'),fullPage:true})
})

test('1日3ポイントの後も記録でき、翌日のローカル日付で加点を再開する',async({page})=>{
 await page.clock.install({time:new Date(2026,10,2,12,0)})
 await enter(page)
 await navigate(page,'お礼参り')
 const text=page.getByRole('textbox',{name:'自分の言葉（任意）',exact:true})
 for(let i=0;i<5;i++){
  if(await page.getByRole('button',{name:'もう一度ありがとうを奉納する',exact:true}).count())await page.getByRole('button',{name:'もう一度ありがとうを奉納する',exact:true}).click()
  if(i===0||i===2)await page.locator('.gratitude-choice input').first().check()
  if(i!==0)await text.fill('自分の言葉 '+i)
  await page.getByRole('button',{name:'ありがとうを奉納する',exact:true}).click()
  await expect(page.locator('.gratitude-record')).toHaveCount(i+1)
  await expect(page.locator('.spirit-panel strong').first()).toHaveText(String(Math.min(i+1,3)))
  if(i===2){await page.reload();await navigate(page,'お礼参り')}
 }
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('yumekana-shrine:v1')!))
 expect(stored.gratitudes.map((entry:{pointsAwarded:number})=>entry.pointsAwarded)).toEqual([1,1,1,0,0])
 expect(stored.gratitudes[0].selectedThanks.length).toBe(1)
 expect(stored.gratitudes[0].freeText).toBe('')
 expect(stored.gratitudes[1].selectedThanks).toEqual([])
 expect(stored.gratitudes[1].freeText).toBe('自分の言葉 1')
 expect(stored.gratitudes[2].selectedThanks.length).toBe(1)
 expect(stored.gratitudes[2].freeText).toBe('自分の言葉 2')
 await navigate(page,'あゆみ')
 await expect(page.locator('.gratitude-record')).toHaveCount(5)
 await expect(page.locator('.recorded-free-text').first()).toContainText('自分の言葉')
 await expect(page.locator('.gratitude-record time').first()).toHaveAttribute('datetime',/T/)
 await page.clock.fastForward(24*60*60*1000)
 await navigate(page,'お礼参り')
 await text.fill('翌日のありがとう')
 await page.getByRole('button',{name:'ありがとうを奉納する',exact:true}).click()
 await expect(page.locator('.gratitude-record')).toHaveCount(6)
 await expect(page.locator('.spirit-panel strong').first()).toHaveText('4')
 await expect(page.locator('.gratitude-daily-note b')).toHaveText('1 / 3')
})
