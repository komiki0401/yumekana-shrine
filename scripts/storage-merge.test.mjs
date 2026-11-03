import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planMerge } from './storage-merge.mjs'

const empty = () => ({ version: 1, dreams: [], gratitudes: [], encounters: [], transactions: [], dailyGoals: {}, fortunes: {}, settings: { id: 'device', sound: false, welcomed: true }, spirit: { gratitude: 0, expectation: 0 }, spiritCredits: { dreams: [], gratitudes: [], gratitudeDays: {} } })
const dream = { id: 'dream', title: '夢', detail: '', createdAt: '2026-11-03', target: '', status: 'fulfilled' }
const reward = { id: 'reward', date: '2026-11-03', amount: 1, kind: 'earn', dreamId: 'dream' }

test('identical backups and repeated merge do not double-count rewards or offerings', () => {
  const a = empty()
  a.dreams = [dream]; a.transactions = [reward, { id: 'offer', date: reward.date, amount: -1, kind: 'offer' }]
  const once = planMerge(a, a)
  assert.equal(once.conflicts.length, 0)
  assert.equal(once.summary.candidate.balance, 0)
  assert.equal(once.summary.candidate.offerings, 1)
  assert.deepEqual(planMerge(once.data, a).data, once.data)
})
test('same ID edits block output rather than silently overwriting', () => {
  const a = empty(), b = empty(); a.dreams = [dream]; b.dreams = [{ ...dream, title: '編集' }]
  assert.ok(planMerge(a, b).conflicts.some(x => x.path === 'dreams/dream'))
})
test('different reward IDs for the same dream require reconciliation', () => {
  const a = empty(), b = empty(); a.transactions = [reward]; b.transactions = [{ ...reward, id: 'reward-2' }]
  assert.ok(planMerge(a, b).conflicts.some(x => x.reason.includes('Multiple reward')))
})
test('independent coin spends stop even when combined balance is nonnegative', () => {
  const a = empty(), b = empty()
  a.transactions = [reward, { ...reward, id: 'other', dreamId: 'other' }, { id: 'spend-a', date: reward.date, amount: -1, kind: 'offer' }]
  b.transactions = [...a.transactions.slice(0, 2), { ...a.transactions[2], id: 'spend-b' }]
  assert.ok(planMerge(a, b).conflicts.some(x => x.reason.includes('Both sides diverged')))
})
test('credit superset retains totals without adding and preserves daily cap', () => {
  const a = empty(), b = empty()
  a.spirit = { gratitude: 2, expectation: 0 }; b.spirit = { gratitude: 3, expectation: 0 }
  a.spiritCredits.gratitudes = ['submission:1', 'submission:2']
  b.spiritCredits.gratitudes = [...a.spiritCredits.gratitudes, 'submission:3']
  a.spiritCredits.gratitudeDays = { '2026-11-03': 2 }; b.spiritCredits.gratitudeDays = { '2026-11-03': 3 }
  const result = planMerge(a, b)
  assert.equal(result.conflicts.length, 0)
  assert.equal(result.data.spirit.gratitude, 3)
  assert.equal(result.data.spiritCredits.gratitudeDays['2026-11-03'], 3)
})
test('divergent gratitude credits cannot be merged by sum or max', () => {
  const a = empty(), b = empty()
  a.spiritCredits.gratitudes = ['submission:a']; b.spiritCredits.gratitudes = ['submission:b']
  assert.ok(planMerge(a, b).conflicts.some(x => x.path === 'spirit'))
})
test('same text with different IDs is not silently deleted or credited', () => {
  const a = empty(), b = empty()
  a.gratitudes = [{ id: 'a', date: '2026-11-03', text: 'ありがとう' }]
  b.gratitudes = [{ ...a.gratitudes[0], id: 'b' }]
  const result = planMerge(a, b)
  assert.equal(result.data.gratitudes.length, 2)
  assert.ok(result.conflicts.some(x => x.path === 'gratitudes/b'))
})
test('negative balance, duplicate IDs and competing fortunes are rejected', () => {
  const a = empty(), b = empty()
  a.transactions = [{ id: 'o', kind: 'offer', date: '2026-11-03', amount: -1 }]
  a.dreams = [dream, dream]
  a.fortunes = { today: { id: 'a' } }; b.fortunes = { today: { id: 'b' } }
  assert.equal(planMerge(a, b).conflicts.length, 3)
})
