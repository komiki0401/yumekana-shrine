import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SearchMoonPhase, SearchSunLongitude, SunPosition } from 'astronomy-engine'

const DAY = 86400000
export const MIN_YEAR = 2025, MAX_YEAR = 2027
export const zodiac = ['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座']
const planets = [[Body.Mercury,'水星'],[Body.Venus,'金星'],[Body.Mars,'火星'],[Body.Jupiter,'木星'],[Body.Saturn,'土星'],[Body.Uranus,'天王星'],[Body.Neptune,'海王星'],[Body.Pluto,'冥王星']] as const
export const jstDate = (date = new Date()) => new Date(date.getTime() + 9 * 3600000).toISOString().slice(0,10)
const start = (date: string) => new Date(`${date}T00:00:00+09:00`)
const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY)
export const shiftDate = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0,10)
const mod = (n: number, d: number) => ((n % d) + d) % d
export const angleDelta = (a: number, b: number) => mod(b - a + 180, 360) - 180
type LunarMonth = { start: string; end: string; month: number; leap: boolean }
const lunarCache = new Map<number, LunarMonth[]>()

// Trial range only. Use JST civil days (not UTC instants) for month boundaries.
// Check the four principal terms as an additional guard against unsupported
// Tenpo-calendar ambiguities; do not extrapolate this rule to 2033.
function lunarCycle(year: number): LunarMonth[] {
  const cached = lunarCache.get(year)
  if (cached) return cached
  const winter = (y: number) => {
    const t = SearchSunLongitude(270, new Date(`${y}-12-01T00:00:00Z`), 30)
    if (!t) throw new Error('冬至を計算できませんでした')
    return jstDate(t.date)
  }
  const firstWinter = winter(year), lastWinter = winter(year + 1)
  const moons: string[] = []
  let cursor = new Date(`${year}-11-01T00:00:00Z`)
  for (let i = 0; i < 16; i++) {
    const t = SearchMoonPhase(0, cursor, 35)
    if (!t) throw new Error('朔を計算できませんでした')
    moons.push(jstDate(t.date)); cursor = new Date(t.date.getTime() + DAY)
  }
  const first = moons.reduce((index, d, i) => d <= firstWinter ? i : index, -1)
  const last = moons.reduce((index, d, i) => d <= lastWinter ? i : index, -1)
  const count = last - first
  if (first < 0 || ![12,13].includes(count) || !moons[last + 1]) throw new Error('旧暦の月を確定できませんでした')
  const terms: { date: string; longitude: number }[] = []
  let termCursor = new Date(`${year}-11-01T00:00:00Z`)
  for (let i = 0; i < 14; i++) {
    const longitude = mod(240 + i * 30, 360)
    const t = SearchSunLongitude(longitude, termCursor, 40)
    if (!t) throw new Error('中気を計算できませんでした')
    terms.push({ date: jstDate(t.date), longitude })
    termCursor = new Date(t.date.getTime() + DAY)
  }
  let month = 11, leapUsed = false
  const result: LunarMonth[] = []
  for (let i = first; i < last; i++) {
    const hasTerm = terms.some(t => t.date >= moons[i] && t.date < moons[i + 1])
    const leap = i > first && count === 13 && !leapUsed && !hasTerm
    if (i > first && !leap) month = month % 12 + 1
    if (leap) leapUsed = true
    result.push({ start: moons[i], end: moons[i + 1], month, leap })
  }
  for (const [longitude, expected] of [[0,2],[90,5],[180,8],[270,11]]) {
    for (const t of terms.filter(t => t.longitude === longitude)) {
      const m = result.find(m => m.start <= t.date && t.date < m.end)
      if (m && (m.month !== expected || m.leap)) throw new Error('旧暦の配月に曖昧さがあります')
    }
  }
  if (count === 13 && !leapUsed) throw new Error('閏月を確定できませんでした')
  lunarCache.set(year, result)
  return result
}
export function lunarDate(date: string) {
  const year = Number(date.slice(0,4))
  if (year < MIN_YEAR || year > MAX_YEAR) throw new Error('旧暦は試験対応期間外です')
  const m = [...lunarCycle(year - 1), ...lunarCycle(year)].find(m => m.start <= date && date < m.end)
  if (!m) throw new Error('旧暦を取得できませんでした')
  return { month: m.month, day: dayNumber(date) - dayNumber(m.start) + 1, leap: m.leap }
}
export type CalendarDay = {
  date: string; rokuyo: string | null; lunar: ReturnType<typeof lunarDate> | null
  labels: string[]; calendarError: string | null; skyError: string | null
  phases: { name: string; time: string }[]; moonSign: string | null
  retrogrades: { name: string; state: '逆行' | '順行' | '留付近' }[]
}
export function calendarDay(date: string): CalendarDay {
  const d: CalendarDay = { date, rokuyo: null, lunar: null, labels: [], calendarError: null, skyError: null, phases: [], moonSign: null, retrogrades: [] }
  const year = Number(date.slice(0,4))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(start(date).getTime()) || jstDate(start(date)) !== date) throw new Error('日付が不正です')
  if (year < MIN_YEAR || year > MAX_YEAR) return { ...d, calendarError: '未取得：試験対応は2025〜2027年です', skyError: '未取得：試験対応期間外です' }
  try {
    d.lunar = lunarDate(date)
    d.rokuyo = ['大安','赤口','先勝','友引','先負','仏滅'][(d.lunar.month + d.lunar.day) % 6]
    const fujoStart = [3,2,1,4,5,6][(d.lunar.month - 1) % 6]
    if (d.lunar.day >= fujoStart && (d.lunar.day - fujoStart) % 8 === 0) d.labels.push('不成就日')
  } catch { d.calendarError = '未取得：旧暦・六曜・不成就日を確定できませんでした' }
  try {
    // Sectional months begin on the JST civil date of each solar term.
    const end = new Date(start(date).getTime() + DAY - 1)
    const solarMonth = Math.floor(mod(SunPosition(end).elon - 315, 360) / 30)
    const cycle = mod(dayNumber(date) + 2440588 + 49, 60)
    const branch = cycle % 12
    const ichiryu = [[1,6],[9,2],[0,3],[3,4],[5,6],[9,6],[0,7],[3,8],[9,6],[9,10],[11,0],[3,0]]
    if (ichiryu[solarMonth].includes(branch)) d.labels.push('一粒万倍日')
    if (cycle === [14,30,44,0][Math.floor(solarMonth / 3)]) d.labels.push('天赦日')
  } catch { d.calendarError = '未取得：暦注の計算を完了できませんでした' }
  try {
    const noon = new Date(`${date}T12:00:00+09:00`)
    const lon = EclipticGeoMoon(noon).lon
    if (!Number.isFinite(lon)) throw new Error('月の黄経が不正です')
    d.moonSign = zodiac[Math.floor(mod(lon,360) / 30)]
    for (const [phase,name] of [[0,'新月'],[180,'満月']] as const) {
      const t = SearchMoonPhase(phase, start(date), 1)
      if (t && jstDate(t.date) === date) d.phases.push({ name, time: new Intl.DateTimeFormat('ja-JP',{ timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false }).format(t.date) })
    }
    d.retrogrades = planets.map(([body,name]) => {
      // Apparent, geocentric ecliptic-of-date longitude. Central difference
      // over +/- 30 minutes. No heliocentric longitude or hard-coded dates.
      const before = Ecliptic(GeoVector(body, new Date(noon.getTime() - 1800000), true)).elon
      const after = Ecliptic(GeoVector(body, new Date(noon.getTime() + 1800000), true)).elon
      const speed = angleDelta(before, after) * 24
      if (!Number.isFinite(speed)) throw new Error('惑星の黄経が不正です')
      return { name, state: Math.abs(speed) < 0.002 ? '留付近' : speed < 0 ? '逆行' : '順行' }
    })
  } catch { d.skyError = '未取得：天体計算を完了できませんでした'; d.moonSign = null; d.phases = []; d.retrogrades = [] }
  return d
}
export const moonHints = [
  '小さく試してみたいことを、一つだけ書きとめてみませんか。',
  '好きな香りや手触りを、ゆっくり味わう時間を。',
  '気になった言葉を一つ集めて、好奇心に水をあげて。',
  'ほっとできる場所で、自分にもやさしい言葉を。',
  '好きなものを一つ、誰かと分かち合ってみても。',
  '身近な場所を一か所だけ整えると、気持ちも軽くなるかもしれません。',
  '相手の気持ちと同じくらい、自分の心地よさも大切に。',
  '心に残っている気持ちを、急がずノートへ。',
  'いつもと少し違う景色に、目を向けてみませんか。',
  '続けてきたことの中に、小さな進歩を見つけて。',
  '自分らしい工夫を一つ、暮らしに添えてみても。',
  '音楽や深呼吸とともに、心を休めるひとときを。',
]
