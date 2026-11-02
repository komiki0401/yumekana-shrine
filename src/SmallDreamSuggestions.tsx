import { useState } from 'react'
import { Plus, Shuffle, Sparkles } from 'lucide-react'
import { smallDreamSuggestions } from './dreamCatalog'
import type { DreamSuggestion } from './dreamCatalog'
import { hasSuggestedDream } from './store'
import type { Dream } from './store'

function shuffle(items: DreamSuggestion[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function SmallDreamSuggestions({ wishes, onChoose }: {
  wishes: Dream[]
  onChoose: (suggestion: DreamSuggestion) => void
}) {
  const [order, setOrder] = useState(() => shuffle(smallDreamSuggestions))
  const available = order.filter(item => !hasSuggestedDream(wishes, item))
  const visible = available.slice(0, 4)

  function refresh() {
    const visibleIds = new Set(visible.map(item => item.id))
    const rest = available.filter(item => !visibleIds.has(item.id))
    const registered = order.filter(item => hasSuggestedDream(wishes, item))
    setOrder([...shuffle(rest), ...shuffle(visible), ...registered])
  }

  return <section className="dream-suggestions small-dream-suggestions" aria-labelledby="small-suggestions-title">
    <div className="suggestions-heading"><div>
      <p className="eyebrow"><Sparkles size={14}/> 小さな幸せも、立派な夢。</p>
      <h2 id="small-suggestions-title">こんな夢は、いかがですか？</h2>
    </div><button className="suggestions-refresh" onClick={refresh} disabled={available.length <= 4}><Shuffle size={16}/>別の候補を見る</button></div>
    <p className="muted">気になる願いをタップすると、あなたの絵馬になります。</p>
    {visible.length ? <div className="suggestion-list">{visible.map(item => <button key={item.id} onClick={() => onChoose(item)}><Plus size={16}/><span>{item.title}</span></button>)}</div>
      : <p className="muted">小さな願いが、すべてあなたの絵馬になりました。さらに夢を探したり、自分の言葉で書いてみてくださいね。</p>}
  </section>
}
