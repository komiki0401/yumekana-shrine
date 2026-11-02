import { Pause, Play, Sparkles, Flower2 } from 'lucide-react'
import { useState } from 'react'
import type { Dream } from './store'

export function FulfilledDreams({ dreams, onSelect, onWrite }: {
  dreams: Dream[]
  onSelect: (dream: Dream) => void
  onWrite: () => void
}) {
  const [paused, setPaused] = useState(false)
  return <section className={'bubble-garden' + (paused ? ' paused' : '')} aria-label="叶えた夢のシャボン玉">
    <div className="bubble-garden-top"><span><Sparkles size={17}/>{dreams.length} 個の夢が、ふわり。</span>
      {dreams.length > 0 && <button className="bubble-motion" onClick={() => setPaused(!paused)}>{paused ? <Play size={15}/> : <Pause size={15}/>} {paused ? '動きを再開' : '動きをとめる'}</button>}
    </div>
    {dreams.length ? <><p className="bubble-hint">シャボン玉にふれると、その日の気持ちを読み返せます。</p>
      <div className="bubble-list">{dreams.map((dream, index) => <div className={'bubble-space bubble-color-' + index % 4} key={dream.id} style={{ animationDelay: `${-(index % 7)}s`, animationDuration: `${7 + index % 5}s` }}>
        <button className="dream-bubble" onClick={() => onSelect(dream)} aria-label={`${dream.title}の思い出を見る`}>
          <span className="bubble-sparkle" aria-hidden="true">✧</span><span className="bubble-title">{dream.title}</span>
          <time dateTime={dream.achievedAt}>{dream.achievedAt || '叶った夢'}</time>
        </button>
      </div>)}</div></> : <div className="bubble-empty"><div className="empty-bubble"><Flower2 size={42}/><span>これからの、幸せ。</span></div><h2>叶った夢が、ここに浮かびます。</h2><p>美味しいご飯も、誰かと笑えた時間も。<br/>絵馬殿で「夢が叶った！」を押すと、<br/>あなたの幸せがひとつ、シャボン玉になります。</p><button className="primary" onClick={onWrite}>絵馬殿で夢を見つける</button></div>}
    <p className="bubble-closing">ひとつひとつが、あなたの毎日を彩った幸せ。</p>
  </section>
}
