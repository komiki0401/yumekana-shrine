import { describe, expect, it } from 'vitest'
import { dreamGenres, suggestionCount, smallDreamSuggestions } from './dreamCatalog'
import { addSuggestedDream, decode, empty, hasSuggestedDream } from './store'

const expectedCounts: Record<string, number> = {
 happiness: 30, travel: 25, relationships: 20, wellbeing: 20, growth: 20,
 abundance: 20, hobbies: 25, home: 20, challenge: 20,
}

describe('ジャンル別の夢の候補', () => {
 it('9ジャンルで指定の内訳・合計200件を持つ', () => {
  expect(dreamGenres).toHaveLength(9)
  expect(suggestionCount).toBe(200)
  for (const genre of dreamGenres) expect(genre.suggestions).toHaveLength(expectedCounts[genre.id])
 })
 it('ジャンルID、候補IDと候補の文章が重複しない', () => {
  const suggestions = dreamGenres.flatMap(genre => genre.suggestions)
  expect(new Set(dreamGenres.map(genre => genre.id)).size).toBe(9)
  expect(new Set(suggestions.map(item => item.id)).size).toBe(200)
  expect(new Set(suggestions.map(item => item.title)).size).toBe(200)
  expect(suggestions.every(item => item.id.length > 0 && item.title.trim().length > 0)).toBe(true)
 })
 it('IDで二重登録を防ぎ、タイトルを編集しても同じ候補を重複登録しない', () => {
  const suggestion = dreamGenres[0].suggestions[0]
  const original = empty()
  const data = addSuggestedDream(original, suggestion, '2026-11-02')
  expect(original.dreams).toHaveLength(0)
  expect(data.dreams[0]).toMatchObject({ title: suggestion.title, suggestionId: suggestion.id, status: 'wishing', createdAt: '2026-11-02' })
  expect(addSuggestedDream(data, suggestion, '2026-11-02')).toBe(data)
  data.dreams[0].title = '自分の言葉で書き直した願い'
  expect(addSuggestedDream(data, suggestion, '2026-11-02')).toBe(data)
  expect(decode(JSON.stringify(data))).toEqual(data)
 })
 it('以前の絵馬と達成記録、小判を初期化せずに候補を追加する', () => {
  const original = empty()
  original.dreams = [{ id: 'legacy', title: '以前からの夢', detail: '思い出', createdAt: '2026-10-01', target: '', status: 'fulfilled', achievedAt: '2026-10-02' }]
  original.transactions = [{ id: 'legacy-coin', date: '2026-10-02', amount: 1, kind: 'earn' }]
  const next = addSuggestedDream(original, dreamGenres[0].suggestions[0], '2026-11-02')
  expect(next.dreams[0]).toEqual(original.dreams[0])
  expect(next.transactions).toEqual(original.transactions)
  expect(next.settings).toEqual(original.settings)
 })
 it('候補IDがない旧データや手書きの同じ願いも認識する', () => {
  const suggestion = dreamGenres[0].suggestions[0]
  const original = empty()
  original.dreams = [{ id: 'legacy', title: '美味しい ご飯を食べる。', detail: '', createdAt: '2026-10-01', target: '', status: 'wishing' }]
  expect(hasSuggestedDream(original.dreams, suggestion)).toBe(true)
  expect(addSuggestedDream(original, suggestion, '2026-11-02')).toBe(original)
 })
})


it('初期の20候補は同じ200候補のIDを共有する', () => {
 expect(smallDreamSuggestions).toHaveLength(20)
 expect(new Set(smallDreamSuggestions.map(item => item.id)).size).toBe(20)
 const all = dreamGenres.flatMap(genre => genre.suggestions)
 expect(smallDreamSuggestions.every(item => all.includes(item))).toBe(true)
 expect(smallDreamSuggestions.map(item => item.title)).toContain('美味しいご飯を食べる')
})
