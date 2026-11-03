import { describe, expect, it, vi } from 'vitest'
import { decode, dedicateYoshuku, empty, fulfillDream, registerDream } from './store'
import { decodeYoshukuDraft, firstQuestion, mockYoshuku, newYoshukuDraft, requestYoshuku } from './yoshuku'
import type { YoshukuEma, YoshukuTurn } from './yoshuku'

const turns: YoshukuTurn[] = ['安心した', '海の見えるホテル', '豊かだと感じた', '楽しみにしていてね'].map((answer, i) => ({ question: `質問${i}？`, answer }))
const ema = (): YoshukuEma => ({ originalWish: '海を見る', generatedText: mockYoshuku({ action: 'summary', wish: '海を見る', turns }), confirmedText: '海を眺めて、安心しました。ありがとう。', createdAt: '2026-11-03T10:00:00.000Z', updatedAt: '2026-11-03T10:00:00.000Z', conversation: turns, mode: 'mock' })

describe('予祝絵馬と既存の保存形式', () => {
  it('旧絵馬・小判・おみくじを変更せずに読み込む', () => {
    const data = empty()
    data.dreams.push({ id: 'old', title: 'ご飯を食べる', detail: '大事な願い', target: '', status: 'wishing', createdAt: '2026-10-01' })
    expect(decode(JSON.stringify(data))).toEqual(data)
  })
  it('予祝の奉納・復元後も特別な種類・元の生成文・編集文・会話を保持する', () => {
    const data = dedicateYoshuku(empty(), 'new', undefined, '海を見る', ema())
    const restored = decode(JSON.stringify(data))
    expect(restored.dreams[0]).toMatchObject({ emaType: 'yoshuku', status: 'wishing', yoshuku: ema() })
    expect(restored.spirit.expectation).toBe(1)
    expect(restored.transactions).toEqual([])
    expect(dedicateYoshuku(restored, 'new', undefined, '海を見る', ema())).toBe(restored)
  })
  it('既存絵馬からの奉納は同じIDの絵馬を更新し、目標日・詳細・期待度を保持する', () => {
    const data = registerDream(empty(), { id: 'old', title: '海を見る', detail: 'もとの詳細', target: '2027-01-01', status: 'wishing', createdAt: '2026-10-01' })
    const next = dedicateYoshuku(data, 'unused', 'old', '海を見る', ema())
    expect(next.dreams).toHaveLength(1)
    expect(next.dreams[0]).toMatchObject({ id: 'old', detail: 'もとの詳細', target: '2027-01-01', createdAt: '2026-10-01' })
    expect(next.spirit).toEqual(data.spirit)
    const fulfilled = fulfillDream(next, 'old', '2026-11-03', '実際に叶った')
    expect(fulfilled.transactions).toHaveLength(1)
    expect(fulfilled.dreams[0].yoshuku).toEqual(ema())
  })
  it('削除済み・達成済みの元絵馬を勝手に再作成しない', () => {
    expect(() => dedicateYoshuku(empty(), 'unused', 'missing', '海を見る', ema())).toThrow('元の絵馬')
    const data = registerDream(empty(), { id: 'old', title: '海を見る', detail: '', target: '', status: 'fulfilled', createdAt: '2026-10-01' })
    expect(() => dedicateYoshuku(data, 'unused', 'old', '海を見る', ema())).toThrow('すでに叶って')
  })
  it('追加のデータが壊れていれば読み込みを失敗させて元データを保護する', () => {
    const data = dedicateYoshuku(empty(), 'new', undefined, '海を見る', ema())
    const raw = JSON.stringify(data).replace('"mode":"mock"', '"mode":"unknown"')
    expect(() => decode(raw)).toThrow('予祝')
  })
})
describe('予祝の体験と通信', () => {
  it('どんな願いでも最初に過去形で感情だけを尋ねる', () => {
    for (const wish of ['100万円が欲しい', '人と楽しく話す']) {
      const question = firstQuestion(wish)
      expect(question).toContain('どんな気持ちでしたか？')
      expect(question.match(/[?？]/g)).toHaveLength(1)
      expect(question).not.toMatch(/使い道|方法/)
    }
  })
  it('モックの4段階と言い換え・要約に元の言葉だけを使用する', () => {
    for (let n = 0; n < 4; n++) {
      const question = mockYoshuku({ action: 'next', wish: '海を見る', turns: turns.slice(0, n) })
      expect(question.match(/[?？]/g)).toHaveLength(1)
      expect(mockYoshuku({ action: 'rephrase', wish: '海を見る', turns: turns.slice(0, n) })).not.toBe(question)
    }
    const story = mockYoshuku({ action: 'summary', wish: '海を見る', turns })
    for (const turn of turns) expect(story).toContain(turn.answer)
    expect(story).toContain('想像しました')
    expect(story).not.toContain('家族')
  })
  it('途中入力やプレビュー編集を下書きから復元できる', () => {
    const draft = { ...newYoshukuDraft('海を見る', 'old'), phase: 'chat' as const, answer: '安心しました', turns: turns.slice(0, 1) }
    expect(decodeYoshukuDraft(JSON.stringify(draft))).toEqual(draft)
    expect(() => decodeYoshukuDraft('{broken')).toThrow()
    expect(() => decodeYoshukuDraft(JSON.stringify({ ...draft, turns: [...turns, ...turns] }))).toThrow()
  })
  it('長い回答でもモックの要約は保存可能な長さに収まり、元の会話を残せる', () => {
    const longTurns = turns.map(t => ({ ...t, answer: 'とてもうれしかった。'.repeat(40) }))
    const generatedText = mockYoshuku({ action: 'summary', wish: '海を見る', turns: longTurns })
    const data = dedicateYoshuku(empty(), 'long', undefined, '海を見る', { ...ema(), generatedText, confirmedText: generatedText, conversation: longTurns })
    expect(generatedText.length).toBeLessThan(350)
    expect(decode(JSON.stringify(data)).dreams[0].yoshuku?.conversation).toEqual(longTurns)
  })
  it('APIへの送信は願いとこの対話のみ、失敗時は再試行可能なエラーを返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const payload = { action: 'next' as const, wish: '海を見る', turns: turns.slice(0, 1) }
      await expect(requestYoshuku('https://example.test/api/yoshuku', payload, new AbortController().signal)).rejects.toThrow('利用上限')
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload)
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ mode: 'mock', text: '偽のAI' })))
      await expect(requestYoshuku('https://example.test', payload, new AbortController().signal)).rejects.toThrow('応答を確認')
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ mode: 'ai', text: 'どんな景色でしたか？' })))
      await expect(requestYoshuku('https://example.test', payload, new AbortController().signal)).resolves.toBe('どんな景色でしたか？')
    } finally { vi.unstubAllGlobals() }
  })
})
