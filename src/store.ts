import { gratitudeChoices, composeGratitude } from './gratitudeChoices'
import type { GratitudeChoice } from './gratitudeChoices'
import { isAnimatedMiracle, resolveMiracleId } from './miracleCatalog'
import type { MiracleId } from './miracleCatalog'
import type { DreamSuggestion } from './dreamCatalog'
import { validYoshukuEma } from './yoshuku'
import type { YoshukuEma } from './yoshuku'
export type Dream = { id: string; suggestionId?: string; title: string; detail: string; createdAt: string; target: string; status: 'wishing' | 'fulfilled'; achievedAt?: string; message?: string; emaType?: 'normal' | 'yoshuku'; yoshuku?: YoshukuEma }
export type Goal = { id: string; title: string; done: boolean }
export type Transaction = { id: string; date: string; amount: number; kind: 'earn' | 'undo' | 'offer'; goalId?: string; dreamId?: string }
export type Fortune = { id: string; rank: string; message: string; action: string; color: string }
export type Gratitude = { id: string; text: string; date: string; createdAt: string; dreamId?: string; selectedThanks?: GratitudeChoice[]; freeText?: string; pointsAwarded?: 0 | 1 }
export type Spirit = { gratitude: number; expectation: number }
export type EncounterKind = MiracleId | 'miracle'
export type Encounter = { id: string; kind: EncounterKind; date: string; createdAt: string }
export type Data = { version: 1; spiritCredits: {dreams:string[];gratitudes:string[];gratitudeDays:Record<string,number>}; gratitudes: Gratitude[]; spirit: Spirit; encounters: Encounter[]; dreams: Dream[]; dailyGoals: Record<string, Goal[]>; transactions: Transaction[]; fortunes: Record<string, Fortune>; settings: { id: string; sound: boolean; welcomed: boolean } }
export const KEY = 'yumekana-shrine:v1'
export const id = () => crypto.randomUUID()
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const empty = (): Data => ({ version: 1, spiritCredits:{dreams:[],gratitudes:[],gratitudeDays:{}}, gratitudes: [], spirit: { gratitude: 0, expectation: 0 }, encounters: [], dreams: [], dailyGoals: {}, transactions: [], fortunes: {}, settings: { id: id(), sound: false, welcomed: false } })
export const balance = (d: Data) => d.transactions.reduce((n, t) => n + t.amount, 0)
export function decode(raw: string): Data {
 const d = JSON.parse(raw)
 const str = (v: unknown) => typeof v === 'string'
 if (d?.version !== 1 || !Array.isArray(d.dreams) || !d.dreams.every((x: Dream) => x && [x.id,x.title,x.detail,x.createdAt,x.target].every(str) && ['wishing','fulfilled'].includes(x.status) && (x.achievedAt === undefined || str(x.achievedAt)) && (x.message === undefined || str(x.message)) && (x.suggestionId === undefined || str(x.suggestionId))) || !d.dailyGoals || typeof d.dailyGoals !== 'object' || Array.isArray(d.dailyGoals) || !Object.values(d.dailyGoals).every(v => Array.isArray(v) && v.length <= 3 && v.every(x => x && str(x.id) && str(x.title) && typeof x.done === 'boolean')) || !Array.isArray(d.transactions) || !d.transactions.every((x: Transaction) => x && str(x.id) && str(x.date) && [-1,1].includes(x.amount) && ['earn','undo','offer'].includes(x.kind) && (x.kind === 'earn' ? x.amount === 1 : x.amount === -1)) || !d.fortunes || typeof d.fortunes !== 'object' || Array.isArray(d.fortunes) || !Object.values(d.fortunes).every(v => v && typeof v === 'object' && ['id','rank','message','action','color'].every(k => str((v as Record<string, unknown>)[k]))) || !d.settings || !str(d.settings.id) || typeof d.settings.sound !== 'boolean' || typeof d.settings.welcomed !== 'boolean' || balance(d) < 0) throw new Error('保存データの形式を確認できませんでした')
 // Additive migration: v1 data from before gratitude keeps every existing record.
 if (d.dreams.some((dream: Dream) => (dream.emaType !== undefined && !['normal','yoshuku'].includes(dream.emaType)) || (dream.yoshuku !== undefined && !validYoshukuEma(dream.yoshuku)) || (dream.emaType === 'yoshuku' && !dream.yoshuku))) throw new Error('予祝の絵馬を読み込めませんでした')
 if (d.gratitudes !== undefined && (!Array.isArray(d.gratitudes) || !d.gratitudes.every((g: Gratitude) => g && [g.id,g.text,g.date,g.createdAt].every(str) && (g.dreamId === undefined || str(g.dreamId)) && (g.freeText === undefined || str(g.freeText)) && (g.pointsAwarded === undefined || g.pointsAwarded === 0 || g.pointsAwarded === 1) && (g.selectedThanks === undefined || (Array.isArray(g.selectedThanks) && g.selectedThanks.length <= 100 && g.selectedThanks.every(choice => choice && [choice.id,choice.label,choice.sentence].every(str))))))) throw new Error('ありがとうの記録を読み込めませんでした')
 if (d.spirit !== undefined && (!d.spirit || ![d.spirit.gratitude,d.spirit.expectation].every(n => Number.isSafeInteger(n) && n >= 0))) throw new Error('感謝度・期待度を読み込めませんでした')
 if (d.encounters !== undefined && (!Array.isArray(d.encounters) || !d.encounters.every((e: Encounter) => e && [e.id,e.date,e.createdAt].every(str) && Boolean(resolveMiracleId(e.kind))))) throw new Error('境内の記録を読み込めませんでした')
 if(d.spiritCredits!==undefined&&(!d.spiritCredits||!Array.isArray(d.spiritCredits.dreams)||!d.spiritCredits.dreams.every(str)||!Array.isArray(d.spiritCredits.gratitudes)||!d.spiritCredits.gratitudes.every(str)))throw new Error('積み重ねの記録を読み込めませんでした')
 if(d.spiritCredits?.gratitudeDays!==undefined&&(!d.spiritCredits.gratitudeDays||typeof d.spiritCredits.gratitudeDays!=='object'||Array.isArray(d.spiritCredits.gratitudeDays)||!Object.values(d.spiritCredits.gratitudeDays).every(n=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<=3)))throw new Error('毎日の積み重ねを読み込めませんでした')
 const gratitudes:Gratitude[]=d.gratitudes??[]
 const migratedDays=migrateGratitudeDays(gratitudes,d.spiritCredits?.gratitudes??[])
 for(const [date,count] of Object.entries(d.spiritCredits?.gratitudeDays??{}))migratedDays[date]=Math.max(migratedDays[date]??0,Number(count))
 return {...d,gratitudes,encounters:d.encounters??[],spirit:{gratitude:d.spirit?.gratitude??gratitudes.length,expectation:d.spirit?.expectation??d.dreams.length},spiritCredits:{dreams:d.spiritCredits?.dreams??[...new Set(d.dreams.flatMap(dreamCreditKeys))],gratitudes:d.spiritCredits?.gratitudes??[...new Set(gratitudes.map(gratitudeCreditKey))],gratitudeDays:migratedDays}}

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


function dreamCreditKeys(dream:Dream):string[]{return [`title:${normalizeDreamTitle(dream.title)}`,...(dream.suggestionId?[`suggestion:${dream.suggestionId}`]:[])]}
function gratitudeCreditKey(entry:Gratitude):string{return `${entry.date}|${normalizeDreamTitle(entry.text)}`}

export function registerDream(d:Data,dream:Dream):Data{
 if(d.dreams.some(item=>item.id===dream.id))return d
 const keys=dreamCreditKeys(dream)
 const prior=new Set([...d.spiritCredits.dreams,...d.dreams.flatMap(dreamCreditKeys)])
 const credited=keys.some(key=>prior.has(key))
 return {...d,dreams:[...d.dreams,dream],spirit:{...d.spirit,expectation:d.spirit.expectation+(credited?0:1)},spiritCredits:{...d.spiritCredits,dreams:[...new Set([...prior,...keys])]}}
}
export function dedicateYoshuku(d: Data, dreamId: string, sourceId: string | undefined, title: string, yoshuku: YoshukuEma): Data {
 if (!validYoshukuEma(yoshuku) || !title.trim() || title.length > 80 || !yoshuku.confirmedText.trim()) throw new Error('願いと予祝の文章を確認してください。')
 if (sourceId) {
  const source = d.dreams.find(dream => dream.id === sourceId)
  if (!source || source.status !== 'wishing') throw new Error('元の絵馬が見つからないか、すでに叶っています。下書きは残しています。')
  return { ...d, dreams: d.dreams.map(dream => dream.id === sourceId ? { ...dream, emaType: 'yoshuku', yoshuku: { ...yoshuku, createdAt: dream.yoshuku?.createdAt ?? yoshuku.createdAt } } : dream) }
 }
 if (d.dreams.some(dream => dream.id === dreamId)) return d
 return registerDream(d, { id: dreamId, title: title.trim(), detail: '', target: '', createdAt: localDate(new Date(yoshuku.createdAt)), status: 'wishing', emaType: 'yoshuku', yoshuku })
}
export const DAILY_GRATITUDE_LIMIT=3
export function dailyGratitudePoints(d:Data,date:string):number{return d.spiritCredits.gratitudeDays[date]??0}
function migrateGratitudeDays(entries:Gratitude[],legacyKeys:string[]):Record<string,number>{
 const credits=new Map<string,Set<string>>()
 const add=(date:string,key:string)=>{if(!credits.has(date))credits.set(date,new Set());credits.get(date)!.add(key)}
 for(const key of legacyKeys){if(/^\d{4}-\d{2}-\d{2}\|/.test(key))add(key.slice(0,10),key)}
 for(const entry of entries){if(entry.pointsAwarded===1)add(entry.date,`submission:${entry.id}`);else if(entry.pointsAwarded===undefined)add(entry.date,gratitudeCreditKey(entry))}
 return Object.fromEntries([...credits].map(([date,keys])=>[date,Math.min(DAILY_GRATITUDE_LIMIT,keys.size)]))
}
export function recordGratitude(d:Data,entry:Gratitude):Data{
 const submissionKey=`submission:${entry.id}`
 if(d.gratitudes.some(item=>item.id===entry.id)||d.spiritCredits.gratitudes.includes(submissionKey))return d
 let text=entry.text.trim()
 let selected:GratitudeChoice[]|undefined
 if(entry.selectedThanks!==undefined||entry.freeText!==undefined){
  if((entry.freeText?.length??0)>1000)throw new Error('自分の言葉は1000文字以内で添えてください。')
  const selectedIds=[...new Set((entry.selectedThanks??[]).map(choice=>choice.id))]
  selected=selectedIds.map(id=>{const choice=gratitudeChoices.find(item=>item.id===id);if(!choice)throw new Error('ありがとうの選択肢が見つかりませんでした。');return {...choice}})
  text=composeGratitude(selected,entry.freeText??'')
 }
 if(!text||text.length>10000)throw new Error('ありがとうを選ぶか、自分の言葉を添えてください。')
 if(entry.selectedThanks===undefined&&entry.freeText===undefined&&text.length>1000)throw new Error('ありがとうを1000文字以内で書いてください。')
 if(entry.dreamId&&!d.dreams.some(dream=>dream.id===entry.dreamId&&dream.status==='fulfilled'))throw new Error('この夢の達成記録が見つかりませんでした。')
 const used=dailyGratitudePoints(d,entry.date),awarded:0|1=used<DAILY_GRATITUDE_LIMIT?1:0
 const saved:Gratitude={...entry,text,pointsAwarded:awarded,...(selected?{selectedThanks:selected,freeText:(entry.freeText??'').trim()}:{})}
 return {...d,gratitudes:[...d.gratitudes,saved],spirit:{...d.spirit,gratitude:d.spirit.gratitude+awarded},spiritCredits:{...d.spiritCredits,gratitudes:[...d.spiritCredits.gratitudes,submissionKey],gratitudeDays:{...d.spiritCredits.gratitudeDays,[entry.date]:used+awarded}}}
}
export function recordEncounter(d:Data,entry:Encounter):Data{
 const kind=resolveMiracleId(entry.kind)
 if(!kind||!isAnimatedMiracle(kind)||d.encounters.some(item=>item.id===entry.id))return d
 return {...d,encounters:[...d.encounters,{...entry,kind}]}
}
