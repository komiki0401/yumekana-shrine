import { useState } from 'react'
import { Plus, Shuffle, Sparkles } from 'lucide-react'

const suggestions = [
  '美味しいご飯を食べる',
  '人と楽しく話す',
  'ぐっすり眠って、気持ちよく目覚める',
  '好きな音楽をゆっくり聴く',
  'きれいな景色を見に行く',
  '大切な人にありがとうを伝える',
  '気になっていたお店に行く',
  '心から笑える時間を過ごす',
  '好きな本に出会う',
  '自分のために、ゆっくりお茶を飲む',
  '季節の花を楽しむ',
  '会いたい人に会う',
  '新しい料理を作ってみる',
  'お気に入りの場所を見つける',
  '何も気にせず、のんびり休む',
  '小さな親切を誰かに届ける',
  '朝の光を浴びて散歩する',
  '好きな服を着て出かける',
  '自分の好きなところを見つける',
  '今日の幸せを、ひとつ写真に残す',
]

function shuffle(items: string[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function DreamSuggestions({ wishingTitles, onChoose }: {
  wishingTitles: string[]
  onChoose: (title: string) => void
}) {
  const [order, setOrder] = useState(() => shuffle(suggestions))
  const available = order.filter(title => !wishingTitles.includes(title))
  const visible = available.slice(0, 4)

  function refresh() {
    // Avoid immediately repeating the currently displayed suggestions.
    const rest = available.filter(title => !visible.includes(title))
    setOrder([...shuffle(rest), ...shuffle(visible), ...order.filter(title => wishingTitles.includes(title))])
  }

  return <section className="dream-suggestions" aria-labelledby="suggestions-title">
    <div className="suggestions-heading">
      <div>
        <p className="eyebrow"><Sparkles size={14}/> 小さな幸せも、立派な夢。</p>
        <h2 id="suggestions-title">こんな夢は、いかがですか？</h2>
      </div>
      <button className="suggestions-refresh" onClick={refresh} disabled={available.length <= 4}>
        <Shuffle size={16}/>別の候補を見る
      </button>
    </div>
    <p className="muted">気になる願いをタップすると、あなたの絵馬になります。</p>
    {visible.length ? <div className="suggestion-list">{visible.map(title =>
      <button key={title} onClick={() => onChoose(title)}><Plus size={16}/><span>{title}</span></button>
    )}</div> : <p className="muted">すべての候補が、あなたの絵馬になりました。自由な夢も書いてみてくださいね。</p>}
  </section>
}
