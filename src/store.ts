import type { DreamSuggestion } from './dreamCatalog'
export type Dream = { id: string; suggestionId?: string; title: string; detail: string; createdAt: string; target: string; status: 'wishing' | 'fulfilled'; achievedAt?: string; message?: string }
export type Goal = { id: string; title: string; done: boolean }
export type Transaction = { id: string; date: string; amount: number; kind: 'earn' | 'undo' | 'offer'; goalId?: string; dreamId?: string }
export type Fortune = { id: string; rank: string; message: string; action: string; color: string }
export type Gratitude = { id: string; text: string; date: string; createdAt: string; dreamId?: string }
export type Spirit = { gratitude: number; expectation: number }
export type EncounterKind = 'cat' | 'blossoms' | 'butterfly' | 'shootingStar' | 'deity' | 'miracle'
export type Encounter = { id: string; kind: EncounterKind; date: string; createdAt: string }
export type Data = { version: 1; gratitudes: Gratitude[]; spirit: Spirit; encounters: Encounter[]; dreams: Dream[]; dailyGoals: Record<string, Goal[]>; transactions: Transaction[]; fortunes: Record<string, Fortune>; settings: { id: string; sound: boolean; welcomed: boolean } }
export const KEY = 'yumekana-shrine:v1'
export const id = () => crypto.randomUUID()
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const empty = (): Data => ({ version: 1, gratitudes: [], spirit: { gratitude: 0, expectation: 0 }, encounters: [], dreams: [], dailyGoals: {}, transactions: [], fortunes: {}, settings: { id: id(), sound: false, welcomed: false } })
export const balance = (d: Data) => d.transactions.reduce((n, t) => n + t.amount, 0)
export function decode(raw: string): Data {
 const d = JSON.parse(raw)
 const str = (v: unknown) => typeof v === 'string'
 if (d?.version !== 1 || !Array.isArray(d.dreams) || !d.dreams.every((x: Dream) => x && [x.id,x.title,x.detail,x.createdAt,x.target].every(str) && ['wishing','fulfilled'].includes(x.status) && (x.achievedAt === undefined || str(x.achievedAt)) && (x.message === undefined || str(x.message)) && (x.suggestionId === undefined || str(x.suggestionId))) || !d.dailyGoals || typeof d.dailyGoals !== 'object' || Array.isArray(d.dailyGoals) || !Object.values(d.dailyGoals).every(v => Array.isArray(v) && v.length <= 3 && v.every(x => x && str(x.id) && str(x.title) && typeof x.done === 'boolean')) || !Array.isArray(d.transactions) || !d.transactions.every((x: Transaction) => x && str(x.id) && str(x.date) && [-1,1].includes(x.amount) && ['earn','undo','offer'].includes(x.kind) && (x.kind === 'earn' ? x.amount === 1 : x.amount === -1)) || !d.fortunes || typeof d.fortunes !== 'object' || Array.isArray(d.fortunes) || !Object.values(d.fortunes).every(v => v && typeof v === 'object' && ['id','rank','message','action','color'].every(k => str((v as Record<string, unknown>)[k]))) || !d.settings || !str(d.settings.id) || typeof d.settings.sound !== 'boolean' || typeof d.settings.welcomed !== 'boolean' || balance(d) < 0) throw new Error('保存データの形式を確認できませんでした')
 // Additive migration: v1 data from before gratitude keeps every existing record.
 if (d.gratitudes !== undefined && (!Array.isArray(d.gratitudes) || !d.gratitudes.every((g: Gratitude) => g && [g.id,g.text,g.date,g.createdAt].every(str) && (g.dreamId === undefined || str(g.dreamId))))) throw new Error('ありがとうの記録を読み込めませんでした')
 if (d.spirit !== undefined && (!d.spirit || ![d.spirit.gratitude,d.spirit.expectation].every(n => Number.isSafeInteger(n) && n >= 0))) throw new Error('感謝度・期待度を読み込めませんでした')
 if (d.encounters !== undefined && (!Array.isArray(d.encounters) || !d.encounters.every((e: Encounter) => e && [e.id,e.date,e.createdAt].every(str) && ['cat','blossoms','butterfly','shootingStar','deity','miracle'].includes(e.kind)))) throw new Error('境内の記録を読み込めませんでした')
 return { ...d, gratitudes: d.gratitudes ?? [], encounters: d.encounters ?? [], spirit: { gratitude: Math.max(d.spirit?.gratitude ?? 0, d.gratitudes?.length ?? 0), expectation: Math.max(d.spirit?.expectation ?? 0, d.dreams.length) } }
}
export function toggleGoal(d: Data, date: string, goalId: string): Data {
 const goal = d.dailyGoals[date]?.find(g => g.id === goalId)
 if (!goal) return d
 if (goal.done && balance(d) < 1) throw new Error('この小判は奉納済みです。小判が1枚以上あるときに取り消せます。')
 return { ...d, dailyGoals: { ...d.dailyGoals, [date]: d.dailyGoals[date].map(g => g.id === goalId ? { ...g, done: !g.done } : g) }, transactions: [...d.transactions, { id: id(), date, amount: goal.done ? -1 : 1, kind: goal.done ? 'undo' : 'earn', goalId }] }
}
export function offer(d: Data, date: string): Data {
 if (balance(d) < 1) throw new Error('絵馬殿で夢を叶えると、小判を1枚もらえます。')
 return { ...d, transactions: [...d.transactions, { id: id(), date, amount: -1, kind: 'offer' }] }
}
const messages = [
 ['大吉','あなたの中の小さな勇気が、花ひらく日。','気になっていたことを、5分だけ始めてみよう。','桜ピンク'],
 ['中吉','ゆっくりでも、ちゃんと前に進んでいます。','あたたかい飲み物で、ひと息つこう。','藤むらさき'],
 ['小吉','いつもの日々に、小さな宝物が隠れています。','今日よかったことを、ひとつ書いてみよう。','若草色'],
 ['吉','あなたの優しさが、あなた自身も包みます。','自分に「よくやっているね」と伝えよう。','生成り'],
 ['末吉','まだつぼみの夢にも、根っこは育っています。','窓を開けて、ゆっくり深呼吸しよう。','空色'],
]
export function draw(d: Data, date: string): Data {
 if (d.fortunes[date]) return d
 const [rank,message,action,color] = messages[Math.floor(Math.random()*messages.length)]
 return { ...d, fortunes: { ...d.fortunes, [date]: { id: id(), rank,message,action,color } } }
}

export function fulfillDream(d: Data, dreamId: string, date: string, message: string): Data {
 const dream = d.dreams.find(item => item.id === dreamId)
 if (!dream || dream.status === 'fulfilled') return d
 return { ...d, dreams: d.dreams.map(item => item.id === dreamId ? { ...item, status: 'fulfilled', achievedAt: date, message } : item), transactions: [...d.transactions, { id: id(), date, amount: 1, kind: 'earn', dreamId }] }
}

const normalizeDreamTitle = (title: string) => title.normalize('NFKC').replace(/\s+/g, '').replace(/[。.!！?？]+$/, '')

export function hasSuggestedDream(dreams: Dream[], suggestion: DreamSuggestion): boolean {
 return dreams.some(dream => dream.status === 'wishing' && (dream.suggestionId === suggestion.id || normalizeDreamTitle(dream.title) === normalizeDreamTitle(suggestion.title)))
}

export function addSuggestedDream(d: Data, suggestion: DreamSuggestion, date: string): Data {
 if (hasSuggestedDream(d.dreams, suggestion)) return d
 return registerDream(d, { id: id(), suggestionId: suggestion.id, title: suggestion.title, detail: '', target: '', createdAt: date, status: 'wishing' })
}


export function registerDream(d: Data, dream: Dream): Data {
 if (d.dreams.some(item => item.id === dream.id)) return d
 return { ...d, dreams: [...d.dreams, dream], spirit: { ...d.spirit, expectation: d.spirit.expectation + 1 } }
}

export function recordGratitude(d: Data, entry: Gratitude): Data {
 if (d.gratitudes.some(item => item.id === entry.id)) return d
 const text = entry.text.trim()
 if (!text || text.length > 1000) throw new Error('ありがとうを1〜1000文字で書いてください。')
 if (entry.dreamId && !d.dreams.some(dream => dream.id === entry.dreamId && dream.status === 'fulfilled')) throw new Error('この夢の達成記録が見つかりませんでした。')
 return { ...d, gratitudes: [...d.gratitudes, { ...entry, text }], spirit: { ...d.spirit, gratitude: d.spirit.gratitude + 1 } }
}

export function recordEncounter(d: Data, entry: Encounter): Data {
 if (d.encounters.some(item => item.id === entry.id)) return d
 return { ...d, encounters: [...d.encounters, entry] }
}
