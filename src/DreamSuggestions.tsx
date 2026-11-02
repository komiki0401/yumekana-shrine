import { useState } from 'react'
import { Check, ChevronDown, Plus, Sparkles } from 'lucide-react'
import { dreamGenres } from './dreamCatalog'
import type { DreamSuggestion } from './dreamCatalog'
import type { Dream } from './store'
import { hasSuggestedDream } from './store'

const PAGE_SIZE = 8

export function DreamSuggestions({ wishes, onChoose }: {
  wishes: Dream[]
  onChoose: (suggestion: DreamSuggestion) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const genre = dreamGenres.find(item => item.id === selectedId)

  return <section className="dream-suggestions" aria-labelledby="suggestions-title">
    <div className="suggestions-heading"><div>
      <p className="eyebrow"><Sparkles size={14}/> 小さな幸せも、大きな憧れも。</p>
      <h2 id="suggestions-title">どんな夢を、叶えたいですか？</h2>
    </div></div>
    <p className="muted">気になるジャンルから、あなたらしい願いを探しましょう。</p>
    <div className="genre-grid" role="group" aria-label="夢のジャンル">
      {dreamGenres.map(item => <button key={item.id} className={'genre-card' + (selectedId === item.id ? ' selected' : '')} aria-pressed={selectedId === item.id} aria-controls="genre-suggestions" onClick={() => { setSelectedId(item.id); setVisibleCount(PAGE_SIZE) }}>
        <span className="genre-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>{item.suggestions.length}の夢</small>
      </button>)}
    </div>
    <div id="genre-suggestions">
      {genre ? <>
        <div className="genre-result-heading"><h3>{genre.icon} {genre.label}</h3><span>{Math.min(visibleCount, genre.suggestions.length)} / {genre.suggestions.length} 件</span></div>
        <p className="genre-help">「＋」で絵馬に追加できます。自分の言葉で夢を書いても大丈夫。</p>
        <div className="suggestion-list">{genre.suggestions.slice(0, visibleCount).map(suggestion => {
          const added = hasSuggestedDream(wishes, suggestion)
          return <button key={suggestion.id} disabled={added} onClick={() => onChoose(suggestion)}>
            {added ? <Check size={16}/> : <Plus size={16}/>}<span>{suggestion.title}{added && <small className="suggestion-added">絵馬に追加済み</small>}</span>
          </button>
        })}</div>
        {visibleCount < genre.suggestions.length && <button className="suggestions-more" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}><ChevronDown size={17}/>もっと見る</button>}
      </> : <p className="genre-prompt">上の9つのジャンルから、気になるものを選んでみてください。</p>}
    </div>
  </section>
}
