import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Moon, Sprout, Star } from 'lucide-react'
import { calendarDay, jstDate, MAX_YEAR, MIN_YEAR, moonHints, zodiac } from './calendarData'
import './luckyCalendar.css'

export function LuckyCalendar() {
  const [today, setToday] = useState(jstDate)
  const [month, setMonth] = useState(() => jstDate().slice(0,7))
  const [selected, setSelected] = useState(jstDate)
  useEffect(() => {
    const refresh = () => setToday(jstDate())
    const timer = setInterval(refresh, 10000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus',refresh); document.removeEventListener('visibilitychange',refresh) }
  }, [])
  const [year, number] = month.split('-').map(Number)
  const days = useMemo(() => Array.from({ length: new Date(Date.UTC(year,number,0)).getUTCDate() }, (_, i) => calendarDay(`${month}-${String(i+1).padStart(2,'0')}`)), [month,year,number])
  const detail = days.find(d => d.date === selected) ?? days[0]
  const offset = new Date(`${month}-01T12:00:00Z`).getUTCDay()
  const move = (delta: number) => {
    const next = new Date(Date.UTC(year,number - 1 + delta,1)).toISOString().slice(0,7)
    setMonth(next); setSelected(`${next}-01`)
  }
  const backToday = () => { const now = jstDate(); setToday(now); setMonth(now.slice(0,7)); setSelected(now) }
  const retro = detail.retrogrades.filter(p => p.state !== '順行')
  return <section className="lucky-calendar" aria-label="開運暦カレンダー">
    <div className="lucky-intro"><span className="lucky-trial">試験版</span><p>暦と星を、暮らしの小さなきっかけに。<br/>今日も、あなたのペースで。</p><span className="lucky-timezone">日本時間 · JST</span></div>
    <div className="lucky-layout"><div className="lucky-month-card">
      <div className="lucky-month-toolbar"><div><small>CALENDAR & THE STARS</small><h2 aria-live="polite">{year}<span>年</span> {number}<span>月</span></h2></div><div className="lucky-month-actions"><button aria-label="前の月" onClick={() => move(-1)}><ChevronLeft size={20}/></button><button className="lucky-today" onClick={backToday}>今日に戻る</button><button aria-label="次の月" onClick={() => move(1)}><ChevronRight size={20}/></button></div></div>
      <p className="lucky-month-guide">日付をタップして、その日の暦と星のメモへ。</p>
      <div className="lucky-grid" role="group" aria-label={`${year}年${number}月の日付`}>
        {'日月火水木金土'.split('').map((day,i) => <span key={day} className={`lucky-weekday weekday-${i}`}>{day}</span>)}
        {Array.from({length:offset},(_,i) => <span key={`empty-${i}`} className="lucky-empty"/>)}
        {days.map(d => <button key={d.date} className={`lucky-day ${d.date === today ? 'is-today' : ''} ${d.date === detail.date ? 'is-selected' : ''}`} aria-label={`${d.date}${d.date === today ? ' 今日' : ''} ${d.rokuyo ?? '暦情報未取得'} ${d.labels.join(' ')} ${d.phases.map(p => p.name).join(' ')}`} aria-pressed={d.date === detail.date} aria-current={d.date === today ? 'date' : undefined} onClick={() => setSelected(d.date)}>
          <span className="lucky-day-number">{Number(d.date.slice(8))}</span><span className="lucky-rokuyo">{d.rokuyo ?? '未取得'}</span>
          <span className="lucky-day-markers">{d.labels.includes('天赦日') && <span className="lucky-mark grace" title="天赦日">赦</span>}{d.labels.includes('一粒万倍日') && <span className="lucky-mark seed" title="一粒万倍日">粒</span>}{d.labels.includes('不成就日') && <span className="lucky-mark pause" title="不成就日">静</span>}{d.phases.map(p => <span key={p.name} className="lucky-phase-mark" title={p.name}>{p.name === '新月' ? '●' : '○'}</span>)}</span>
        </button>)}
      </div>
      <div className="lucky-legend"><span><i className="lucky-mark grace">赦</i>天赦日</span><span><i className="lucky-mark seed">粒</i>一粒万倍日</span><span><i className="lucky-mark pause">静</i>不成就日</span><span>● 新月 / ○ 満月</span></div>
      <p className="lucky-range">試験対応：{MIN_YEAR}〜{MAX_YEAR}年。範囲外・計算失敗は「未取得」と表示します。</p>
    </div>
    <article className="lucky-detail" aria-label="選んだ日の詳細" aria-live="polite" aria-atomic="true">
      <p className="lucky-detail-date">{new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'long',day:'numeric',weekday:'long'}).format(new Date(`${detail.date}T12:00:00+09:00`))}{detail.date === today && <span>今日</span>}</p>
      <h2>この日の、やさしい道しるべ</h2>
      <section><h3><Sprout size={17}/>日本の暦</h3><div className="lucky-tags">{detail.rokuyo && <span>{detail.rokuyo}</span>}{detail.labels.map(label => <span key={label}>{label}</span>)}</div>
        {detail.lunar && <p className="lucky-small">旧暦 {detail.lunar.leap ? '閏' : ''}{detail.lunar.month}月{detail.lunar.day}日</p>}
        {detail.calendarError && <p role="status" className="lucky-unavailable">{detail.calendarError}</p>}
        {detail.labels.includes('一粒万倍日') && <p>ひと粒の種を育てるように。気になっていた小さな一歩を、無理のない範囲で。</p>}
        {detail.labels.includes('天赦日') && <p>自分にやさしくするきっかけに。心の中の「こうしなければ」を、少しゆるめてみても。</p>}
        {detail.labels.includes('不成就日') && <p>「不成就日」は伝統的な暦の呼び名です。何かが失敗するという意味ではありません。立ち止まって整える時間も大切に。</p>}
        {!detail.calendarError && !detail.labels.length && <p>特別な印がない日にも、あなたらしい小さな幸せを。</p>}
      </section>
      <section><h3><Moon size={17}/>空のメモ</h3>
        {detail.skyError ? <p className="lucky-unavailable">{detail.skyError}</p> : <><p className="lucky-moon-sign">月のサイン <b>{detail.moonSign}</b></p><p className="lucky-small">日本時間12:00時点・トロピカル方式の12サイン。天文学の星座とは区分が異なり、日中に移動することがあります。</p>
        {detail.phases.length ? detail.phases.map(p => <p key={p.name} className="lucky-phase-event">{p.name === '新月' ? '●' : '○'} {p.name} <time>{p.time} JST頃</time></p>) : <p className="lucky-small">この日に新月・満月の瞬間はありません。</p>}
        <p className="lucky-retro-label">惑星の見かけの動き · 12:00 JST</p><div className="lucky-planet-list">{detail.retrogrades.map(p => <span key={p.name} className={p.state !== '順行' ? 'is-retro' : ''}>{p.name}<b>{p.state}</b></span>)}</div>
        <p className="lucky-small">水星〜冥王星の地心黄経の変化から計算。「留付近」は動きがとても小さい状態です。逆行は地球から見た見かけの動きです。</p></>}
      </section>
      <section className="lucky-hint"><h3><Star size={17}/>幸せのヒント</h3><p>{detail.moonSign ? moonHints[zodiac.indexOf(detail.moonSign)] : '窓の外を眺めて、ゆっくりひと呼吸。今日の自分をねぎらう時間を。'}</p>{retro.length > 0 && <p>星の逆行を、見直しや振り返りのきっかけにしてみても。急がず進んで大丈夫です。</p>}<small>星読みは象徴を楽しむためのヒントです。未来や吉凶、行動の結果を決めるものではありません。</small></section>
    </article></div>
    <details className="lucky-sources"><summary>計算方法と出典について</summary><p>天体はAstronomy Engine 2.1.19で端末内計算。新月・満月は太陽と月の黄経差0°・180°の時刻です。国立天文台の暦要項と照合していますが、公表値そのものではなく分単位で差が出ることがあります。</p><p>旧暦は朔の日を月初、冬至を含む月を11月とし、中気と閏月から配月。二至二分の配月も確認します。節月・季節は節入りの日本時間の日付から切り替えます。六曜・不成就日は旧暦月日、一粒万倍日・天赦日は節月と日の干支で判定します。暦注には流派差があり、公式な吉凶判定ではありません。</p><ul><li><a href="https://www.ndl.go.jp/koyomi/chapter3/s6.html" target="_blank" rel="noreferrer">国立国会図書館：一粒万倍日・不成就日の規則</a></li><li><a href="https://www.ndl.go.jp/koyomi/chapter3/s5.html" target="_blank" rel="noreferrer">国立国会図書館：天赦日の規則</a></li><li><a href="https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou263.html" target="_blank" rel="noreferrer">国立天文台：2026年の朔弦望</a></li><li><a href="https://eco.mtk.nao.ac.jp/koyomi/topics/html/topics2014.html" target="_blank" rel="noreferrer">国立天文台：旧暦の配月と問題点</a></li><li><a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine：計算方法・精度検証</a></li></ul></details>
  </section>
}
