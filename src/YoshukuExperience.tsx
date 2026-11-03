import { useEffect, useRef, useState } from 'react'
import { decodeYoshukuDraft, firstQuestion, mockYoshuku, newYoshukuDraft, requestYoshuku, YOSHUKU_DRAFT_KEY, YOSHUKU_ROUNDS } from './yoshuku'
import type { YoshukuAction, YoshukuDraft, YoshukuEma } from './yoshuku'

export function YoshukuExperience({ source, onClose, onDedicate }: {
  source: { id: string; title: string } | null
  onClose: () => void
  onDedicate: (draft: YoshukuDraft, ema: YoshukuEma) => boolean
}) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(YOSHUKU_DRAFT_KEY)
      return { draft: raw ? decodeYoshukuDraft(raw) : newYoshukuDraft(source?.title, source?.id), error: '', recovered: !!raw }
    } catch { return { draft: newYoshukuDraft(source?.title, source?.id), error: '下書きを読み込めませんでした。元の下書きは上書きせず残しています。', recovered: false } }
  })
  const [draft, setDraft] = useState(initial.draft)
  const [saveError, setSaveError] = useState(initial.error)
  const [blocked, setBlocked] = useState(!!initial.error)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState(false)
  const [saved, setSaved] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const locked = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const lastMessage = useRef<HTMLDivElement>(null)
  const endpoint = import.meta.env.VITE_YOSHUKU_API_URL?.trim() ?? ''
  const patch = (values: Partial<YoshukuDraft>) => setDraft(d => ({ ...d, ...values }))

  useEffect(() => {
    if (blocked || saved) return
    try { localStorage.setItem(YOSHUKU_DRAFT_KEY, JSON.stringify(draft)); setSaveError('') }
    catch { setSaveError('下書きを端末に保存できません。この画面を閉じる前に文章を別に控えてください。') }
  }, [draft, blocked, saved])
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => { lastMessage.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }, [draft.question, draft.phase, busy])

  function reset() {
    try { localStorage.removeItem(YOSHUKU_DRAFT_KEY) } catch { setError('下書きを削除できませんでした。'); return }
    setDraft(newYoshukuDraft(source?.title, source?.id)); setBlocked(false); setError(''); setConsent(false); setDiscarding(false)
  }
  async function ask(action: YoshukuAction) {
    if (locked.current || blocked || (draft.mode === 'ai' && !consent)) return
    const answer = draft.answer.trim()
    if (action !== 'rephrase' && !answer) return
    locked.current = true; setBusy(true); setError('')
    const nextTurns = action === 'rephrase' ? draft.turns : [...draft.turns, { question: draft.question, answer }]
    const actualAction: YoshukuAction = action === 'rephrase' ? action : nextTurns.length >= YOSHUKU_ROUNDS ? 'summary' : 'next'
    const request = { action: actualAction, wish: draft.wish, turns: nextTurns }
    const abort = new AbortController(); controller.current = abort
    const timer = setTimeout(() => abort.abort(), 45000)
    try {
      const text = draft.mode === 'mock' ? mockYoshuku(request) : await requestYoshuku(endpoint, request, abort.signal)
      if (abort.signal.aborted) return
      if (actualAction === 'summary') patch({ turns: nextTurns, answer: '', phase: 'preview', generatedText: text, editedText: text })
      else patch({ turns: nextTurns, question: text, ...(action !== 'rephrase' ? { answer: '' } : {}) })
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : '接続できませんでした。入力は残しています。')
      else setError('応答に時間がかかっています。入力を残していますので、もう一度お試しください。')
    } finally { clearTimeout(timer); locked.current = false; setBusy(false) }
  }
  function dedicate() {
    if (locked.current || !draft.editedText.trim() || blocked) return
    locked.current = true
    const now = new Date().toISOString()
    const ok = onDedicate(draft, { originalWish: draft.wish, generatedText: draft.generatedText, confirmedText: draft.editedText.trim(), createdAt: now, updatedAt: now, conversation: draft.turns, mode: draft.mode })
    if (ok) {
      setSaved(true)
      try { localStorage.removeItem(YOSHUKU_DRAFT_KEY) } catch { /* Stored draft is idempotent by dream ID. */ }
    } else { locked.current = false; setError('奉納できませんでした。下書きは残しています。元の絵馬や端末の保存設定を確認して、もう一度お試しください。') }
  }
  if (saved) return <section className="yoshuku-experience yoshuku-complete"><span aria-hidden="true">🌸</span><h2>夢をはぐくむ時間を、絵馬に込めました。</h2><p>未来を想像した気持ちを、いつでも読み返せます。<br/>実際に夢が叶ったときは、絵馬から記録してください。</p><button className="primary" onClick={onClose}>絵馬殿に戻る</button></section>

  return <section className="yoshuku-experience" aria-label="夢をはぐくむ予祝体験">
    <div className="yoshuku-top"><div><p className="eyebrow">YOSHUKU</p><h2>夢をはぐくむ 🌸</h2></div><button className="text-button" onClick={onClose}>下書きを残して閉じる</button></div>
    <p className="yoshuku-mode">{draft.mode === 'mock' ? 'モック体験 · AIは使用していません。外部送信はありません。' : 'AI体験 · 願いと、この体験での対話を外部AIに送信します。'}</p>
    <p className="help-text">予祝は、夢が叶った未来を想像して喜びを味わう体験です。実現を保証するものではありません。</p>
    {saveError && <p role="alert" className="storage-error">{saveError}</p>}
    {initial.recovered && draft.phase !== 'wish' && <p className="help-text">端末に残した下書きから再開しています。</p>}
    {(blocked || (source && draft.sourceId !== source.id)) && <p className="yoshuku-draft-warning">別の下書きがある場合も、勝手に上書きしません。<button type="button" onClick={reset}>残っている下書きを破棄して、この夢で始める</button></p>}
    {draft.phase === 'wish' ? <form className="dream-form" onSubmit={e => { e.preventDefault(); if (!blocked && (draft.mode !== 'ai' || consent)) patch({ wish: draft.wish.trim(), question: firstQuestion(draft.wish.trim()), phase: 'chat' }) }}>
      <label>はぐくみたい願い<input required maxLength={80} value={draft.wish} onChange={e => patch({ wish: e.target.value })} placeholder="例：海の見える場所で、のんびり過ごしたい"/></label>
      {endpoint && <label className="yoshuku-check"><input type="checkbox" checked={draft.mode === 'ai'} onChange={e => { patch({ mode: e.target.checked ? 'ai' : 'mock' }); setConsent(false) }}/>外部AIを使って体験する</label>}
      {draft.mode === 'ai' && <Consent checked={consent} onChange={setConsent}/>}
      <button className="primary full" disabled={blocked || !draft.wish.trim() || (draft.mode === 'ai' && !consent)}>叶った未来を想像する</button>
    </form> : draft.phase === 'chat' ? <>
      <p className="yoshuku-progress">心に描く時間 · {draft.turns.length + 1} / {YOSHUKU_ROUNDS}</p>
      <p className="yoshuku-wish">あなたの願い：{draft.wish}</p>
      <div className="yoshuku-messages" aria-label="予祝の対話">
        {draft.turns.map((turn, i) => <div key={i}><p className="yoshuku-guide"><small>{draft.mode === 'mock' ? '案内（モック）' : '案内人'}</small>{turn.question}</p><p className="yoshuku-answer"><small>あなた</small>{turn.answer}</p></div>)}
        <div ref={lastMessage} aria-live="polite"><p className="yoshuku-guide"><small>{draft.mode === 'mock' ? '案内（モック）' : '案内人'}</small>{draft.question}</p>{busy && <p className="yoshuku-loading" role="status">🌸 あなたの言葉を、そっと受け取っています…</p>}</div>
      </div>
      {draft.mode === 'ai' && <Consent checked={consent} onChange={setConsent}/>}
      <form className="dream-form" onSubmit={e => { e.preventDefault(); void ask('next') }}>
        <label>あなたの言葉<textarea disabled={busy} rows={3} maxLength={500} value={draft.answer} onChange={e => patch({ answer: e.target.value })} placeholder={draft.turns.length === 0 ? '例：うれしかった。ほっとした。' : '短い言葉でも、大丈夫です。'}/></label>
        {error && <p role="alert" className="yoshuku-error">{error}</p>}
        <button className="primary full" disabled={busy || blocked || !draft.answer.trim() || (draft.mode === 'ai' && !consent)}>{error ? '同じ入力でもう一度試す' : draft.turns.length === 3 ? '予祝の絵馬をつくる' : 'この気持ちを届ける'}</button>
        <button type="button" className="text-button" disabled={busy || blocked || (draft.mode === 'ai' && !consent)} onClick={() => void ask('rephrase')}>質問を言い換えてもらう</button>
      </form>
    </> : <div className="yoshuku-preview">
      <div className="yoshuku-ema-paper"><SakuraBorder/><p className="ema-tag">予祝の絵馬</p><h3>{draft.wish}</h3><p>{draft.editedText}</p><SakuraBorder bottom/></div>
      <p className="help-text">これは予祝として想像した未来の文章です。まだ実際の達成記録にはなりません。自分らしい言葉に、自由に整えてください。</p>
      <form className="dream-form" onSubmit={e => { e.preventDefault(); dedicate() }}><label>予祝の文章を編集<textarea required rows={8} maxLength={2000} value={draft.editedText} onChange={e => patch({ editedText: e.target.value })}/></label><p className="help-text">{draft.editedText.length}文字 · 100〜200文字を目安に、ご自身の言葉を大切に。</p>{error && <p role="alert" className="yoshuku-error">{error}</p>}<button className="primary full" disabled={blocked || !draft.editedText.trim()}>この絵馬を奉納する</button></form>
    </div>}
    {!busy && !blocked && <div className="yoshuku-restart">{discarding ? <><p>この下書きを破棄して、最初から始めますか？ 奉納済みの絵馬は消えません。</p><button type="button" className="text-button" onClick={reset}>下書きを破棄して始める</button><button type="button" className="text-button" onClick={() => setDiscarding(false)}>続きに戻る</button></> : <button type="button" className="text-button" onClick={() => setDiscarding(true)}>体験を最初からやり直す</button>}</div>}
  </section>
}

function Consent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="yoshuku-check"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/><span>この願いと対話を、設定されたサーバーおよび外部AIに送信することに同意します。氏名・連絡先などは書かないでください。ほかの絵馬や利用履歴は送信しません。</span></label>
}
export function SakuraBorder({ bottom = false }: { bottom?: boolean }) {
  return <span className={'sakura-border' + (bottom ? ' sakura-bottom' : '')} aria-hidden="true"><span>✿</span><i>❀</i><span>✿</span><i>❀</i><span>✿</span></span>
}
export function YoshukuText({ ema }: { ema: YoshukuEma }) {
  return <div className="yoshuku-ema-paper"><SakuraBorder/><p className="ema-tag">予祝の絵馬</p><p className="help-text">夢が叶った未来を想像した文章です{ema.mode === 'mock' ? '（モック体験で作成）' : ''}。</p><p className="yoshuku-story">{ema.confirmedText}</p><SakuraBorder bottom/></div>
}
