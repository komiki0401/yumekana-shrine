export type YoshukuTurn = { question: string; answer: string }
export type YoshukuEma = {
  originalWish: string
  generatedText: string
  confirmedText: string
  createdAt: string
  updatedAt: string
  conversation: YoshukuTurn[]
  mode: 'mock' | 'ai'
}
export type YoshukuDraft = {
  version: 1
  id: string
  sourceId?: string
  wish: string
  turns: YoshukuTurn[]
  question: string
  answer: string
  generatedText: string
  editedText: string
  phase: 'wish' | 'chat' | 'preview'
  mode: 'mock' | 'ai'
}
export const YOSHUKU_DRAFT_KEY = 'yumekana-shrine:yoshuku-draft:v1'
export const YOSHUKU_ROUNDS = 4
export const firstQuestion = (wish: string) => `ここから先は、あなたの夢が叶った世界を想像するお話です。🌸\n\n「${wish}」という願いが叶いました。\nそのとき、あなたはどんな気持ちでしたか？`
export function newYoshukuDraft(wish = '', sourceId?: string): YoshukuDraft {
  return { version: 1, id: crypto.randomUUID(), sourceId, wish, turns: [], question: '', answer: '', generatedText: '', editedText: '', phase: 'wish', mode: 'mock' }
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const bounded = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
export function validYoshukuTurns(v: unknown): v is YoshukuTurn[] {
  return Array.isArray(v) && v.length <= YOSHUKU_ROUNDS && v.every(t => record(t) && bounded(t.question, 1000) && bounded(t.answer, 500))
}
export function validYoshukuEma(v: unknown): v is YoshukuEma {
  return record(v) && bounded(v.originalWish, 80) && bounded(v.generatedText, 2000) && bounded(v.confirmedText, 2000) && typeof v.createdAt === 'string' && typeof v.updatedAt === 'string' && validYoshukuTurns(v.conversation) && ['mock', 'ai'].includes(String(v.mode))
}
export function decodeYoshukuDraft(raw: string): YoshukuDraft {
  const d: unknown = JSON.parse(raw)
  if (!record(d) || d.version !== 1 || !bounded(d.id, 100) || (d.sourceId !== undefined && !bounded(d.sourceId, 100)) || !bounded(d.wish, 80) || !validYoshukuTurns(d.turns) || !bounded(d.question, 1000) || !bounded(d.answer, 500) || !bounded(d.generatedText, 2000) || !bounded(d.editedText, 2000) || !['wish', 'chat', 'preview'].includes(String(d.phase)) || !['mock', 'ai'].includes(String(d.mode))) throw new Error('下書きを読み込めませんでした。')
  return d as YoshukuDraft
}
export type YoshukuAction = 'next' | 'rephrase' | 'summary'
export type YoshukuRequest = { action: YoshukuAction; wish: string; turns: YoshukuTurn[] }
// Explicitly a local, rule-based preview. No model or external communication.
export function mockYoshuku({ action, wish, turns }: YoshukuRequest): string {
  if (action === 'summary') {
    const labels = ['そのときの気持ち', '思い浮かべた情景', 'その未来で感じたこと', '今の自分へ贈った言葉']
    const excerpt = (s: string, limit: number) => Array.from(s).length > limit ? Array.from(s).slice(0, limit).join('') + '…' : s
    return `「${excerpt(wish, 32)}」という願いが叶った未来を想像しました。\n\n${turns.map((t, i) => `${labels[i]}は「${excerpt(t.answer, 22)}」でした。`).join('\n')}\n\nこの未来を思い描けた時間に、ありがとう。`
  }
  const previous = turns.at(-1)?.answer ?? ''
  const acknowledgement = previous ? `「${previous.slice(0, 65)}${previous.length > 65 ? '…' : ''}」という思いを、大切に受け取りました。\n\n` : ''
  const questions = action === 'rephrase'
    ? ['叶った瞬間の心に、どんな気持ちが浮かびましたか？', 'その日のまわりには、どんな景色が見えていましたか？', 'その場所で過ごしたあなたの心には、どんな思いがありましたか？', 'その未来から振り返って、今のあなたに何と伝えたかったですか？']
    : ['そのとき、あなたはどんな気持ちでしたか？', 'その幸せな日、あなたはどんな場所で過ごしていましたか？', 'その景色の中で、どんなことを感じていましたか？', 'その未来を迎えたあなたは、今の自分にどんな言葉をかけてあげたかったですか？']
  return acknowledgement + questions[Math.min(turns.length, 3)]
}
export async function requestYoshuku(endpoint: string, payload: YoshukuRequest, signal: AbortSignal): Promise<string> {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error(response.status === 429 ? '本日の利用上限に達しました。下書きを残して、またお越しください。' : '案内人につながりませんでした。入力は残っています。時間をおいて再試行できます。')
  const result: unknown = await response.json()
  if (!record(result) || result.mode !== 'ai' || !bounded(result.text, payload.action === 'summary' ? 2000 : 1000) || !result.text.trim()) throw new Error('応答を確認できませんでした。入力を残したまま再試行できます。')
  return result.text.trim()
}
