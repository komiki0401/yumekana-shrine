import { useEffect, useRef, useState } from 'react'
import { Heart, Sparkles } from 'lucide-react'
import type { Dream, Gratitude, Spirit } from './store'
import { id, localDate } from './store'
import { spiritTotal } from './encounters'

export function GratitudePage({ entries, spirit, text, onText, linkedDream, onUnlink, onRecord, onVisit }: {
 entries: Gratitude[]; spirit: Spirit; text: string; onText: (text: string) => void
 linkedDream: Dream | null; onUnlink: () => void
 onRecord: (entry: Gratitude) => boolean; onVisit: () => void
}) {
 const [celebrating, setCelebrating] = useState(false)
 const submitting = useRef(false)
 const draftId = useRef(id())
 useEffect(() => {
  if (!celebrating) return
  const timer = setTimeout(() => { setCelebrating(false); submitting.current = false; draftId.current = id() }, 2600)
  return () => clearTimeout(timer)
 }, [celebrating])
 const ordered = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
 const days = new Set(entries.map(entry => entry.date)).size
 const today = localDate()
 return <div className="gratitude-page">
   <section className="spirit-panel" aria-label="感謝と期待の積み重ね">
    <div><span className="spirit-orb gratitude-orb"><Heart size={23}/></span><span><small>感謝度</small><strong>{spirit.gratitude}</strong><em>気づいた、ありがとう。</em></span></div>
    <div><span className="spirit-orb expectation-orb"><Sparkles size={23}/></span><span><small>期待度</small><strong>{spirit.expectation}</strong><em>思い描いた、これから。</em></span></div>
    <div className="spirit-total"><span>感謝度 ＋ 期待度</span><b>{spiritTotal(spirit)}</b><small>合計の数値で、境内の出会いが増えていきます。</small></div><p>数字は減りません。あなたのペースで、少しずつ。<br/>感謝からでも、夢からでも。境内に小さな彩りが育ちます。</p>
   </section>
   <section className={'content-card gratitude-writing' + (celebrating ? ' gratitude-celebrating' : '')}>
    <p className="eyebrow"><Heart size={14}/> THANK YOU, TODAY</p><h2>今日のありがとう</h2>
    <p className="muted">大きな出来事でなくて、大丈夫。<br/>今日、心がふっとあたたかくなったことを。</p>
    {linkedDream && <div className="gratitude-linked"><span>叶った夢へのお礼<br/><b>{linkedDream.title}</b></span><button onClick={onUnlink}>紐づけを外す</button></div>}
    <form onSubmit={event => {
     event.preventDefault()
     if (submitting.current || !text.trim()) return
     submitting.current = true
     const now = new Date()
     const ok = onRecord({ id: draftId.current, text, date: localDate(now), createdAt: now.toISOString(), ...(linkedDream ? { dreamId: linkedDream.id } : {}) })
     if (ok) { onText(''); setCelebrating(true) } else submitting.current = false
    }}>
     <label htmlFor="gratitude-text">ありがとうを記録する</label>
     <textarea id="gratitude-text" value={text} onChange={event => onText(event.target.value)} rows={4} maxLength={1000} placeholder="例：今日も美味しいご飯が食べられた" required/>
     <div className="gratitude-form-bottom"><span>{text.length} / 1000</span><button className="primary" disabled={!text.trim() || celebrating}><Heart size={16}/>ありがとうを残す</button></div>
    </form>
    {celebrating && <div className="gratitude-glow" role="status"><Sparkles size={20}/><b>ありがとうが、境内に届きました。</b><span aria-hidden="true">✿　✧　✿</span></div>}
    <p className="help-text">書きたいときだけで大丈夫。お休みしても、これまでの気持ちはそのままです。</p>
   </section>
   <div className="gratitude-stats"><span><b>{entries.length}</b> 回のありがとう</span><span><b>{days}</b> 日の思い出</span><button onClick={onVisit}>境内を訪れる <span aria-hidden="true">↗</span></button></div>
   <section className="gratitude-records" aria-labelledby="gratitude-records-title"><h2 id="gratitude-records-title">ありがとうの記録</h2>
    {ordered.length ? <div className="gratitude-cards">{ordered.map(entry => <article className="gratitude-record" key={entry.id}>
     <time dateTime={entry.date}>{entry.date}{entry.date === today && <small>今日</small>}</time><p>{entry.text}</p>
     {entry.dreamId && <span className="gratitude-dream-tag"><Sparkles size={12}/>叶った夢へのお礼</span>}
    </article>)}</div> : <div className="gratitude-empty"><Heart size={30}/><p>美味しいご飯、大切な人の笑顔、穏やかなひととき。<br/>あなたの「ありがとう」が、ここに積み重なっていきます。</p></div>}
   </section>
 </div>
}
