import { describe, expect, it } from 'vitest'
import { angleDelta, calendarDay, jstDate, lunarDate } from './calendarData'

describe('開運暦の計算', () => {
  it('日本時間で日付を区切り、UTCや端末のタイムゾーンに依存しない', () => {
    expect(jstDate(new Date('2026-11-08T15:00:00Z'))).toBe('2026-11-09')
    expect(jstDate(new Date('2026-11-08T14:59:59Z'))).toBe('2026-11-08')
  })
  it('瀬戸内町の2026年11月旧暦カレンダーと一致する', () => {
    // https://www.town.setouchi.lg.jp/lunarcal/lunar_calendar.php?month=11&year=2026
    expect(lunarDate('2026-11-03')).toEqual({ month:9, day:24, leap:false })
    expect(calendarDay('2026-11-03').rokuyo).toBe('友引')
    expect(lunarDate('2026-11-09')).toEqual({ month:10, day:1, leap:false })
    expect(calendarDay('2026-11-09').rokuyo).toBe('仏滅')
  })
  it('閏月を維持し、日本時間の日付で旧暦月を切り替える', () => {
    expect(lunarDate('2025-07-25')).toEqual({ month:6, day:1, leap:true })
    // 2027 new moon is Feb 7 JST, not Feb 6 (UTC/Chinese calendar).
    expect(lunarDate('2027-02-06')).toEqual({ month:12, day:30, leap:false })
    expect(lunarDate('2027-02-07')).toEqual({ month:1, day:1, leap:false })
  })
  it('暦注を別々に表示し、不成就日と一粒万倍日を相殺しない', () => {
    expect(calendarDay('2026-01-01').labels).toEqual(expect.arrayContaining(['一粒万倍日','不成就日']))
    expect(calendarDay('2026-03-05').labels).toEqual(expect.arrayContaining(['一粒万倍日','天赦日']))
    expect(calendarDay('2026-12-16').labels).toEqual(expect.arrayContaining(['一粒万倍日','天赦日']))
  })
  it('2026年の新月・満月25件を国立天文台の公表日時と2分以内で照合', () => {
    // NAOJ 2026 暦要項 朔弦望 (JST), linked in the UI and docs.
    const moons = [
      ['01-03','満月','19:03'],['01-19','新月','04:52'],['02-02','満月','07:09'],['02-17','新月','21:01'],
      ['03-03','満月','20:38'],['03-19','新月','10:23'],['04-02','満月','11:12'],['04-17','新月','20:52'],
      ['05-02','満月','02:23'],['05-17','新月','05:01'],['05-31','満月','17:45'],['06-15','新月','11:54'],['06-30','満月','08:57'],
      ['07-14','新月','18:44'],['07-29','満月','23:36'],['08-13','新月','02:37'],['08-28','満月','13:19'],
      ['09-11','新月','12:27'],['09-27','満月','01:49'],['10-11','新月','00:50'],['10-26','満月','13:12'],
      ['11-09','新月','16:02'],['11-24','満月','23:54'],['12-09','新月','09:52'],['12-24','満月','10:28'],
    ]
    const minutes = (time:string) => { const [h,m] = time.split(':').map(Number); return h*60+m }
    for (const [day,name,time] of moons) {
      const phase = calendarDay(`2026-${day}`).phases.find(p => p.name === name)
      expect(phase,day).toBeDefined()
      expect(Math.abs(minutes(phase!.time)-minutes(time)),day).toBeLessThanOrEqual(2)
    }
    expect(calendarDay('2026-11-08').phases).toEqual([])
  })
  it('黄経の0度跨ぎを正しく処理し、逆行と順行の向きを反転させない', () => {
    expect(angleDelta(359.9,0.1)).toBeCloseTo(0.2)
    expect(angleDelta(0.1,359.9)).toBeCloseTo(-0.2)
    const mercury = (date:string) => calendarDay(date).retrogrades.find(p => p.name === '水星')?.state
    expect(mercury('2026-11-03')).toBe('逆行')
    expect(mercury('2026-12-16')).toBe('順行')
    expect(calendarDay('2026-11-03').retrogrades).toHaveLength(8)
  })
  it('試験範囲外は月相やサインを推測しない', () => {
    const d = calendarDay('2033-11-01')
    expect(d.rokuyo).toBeNull(); expect(d.moonSign).toBeNull()
    expect(d.labels).toEqual([]); expect(d.retrogrades).toEqual([])
    expect(d.calendarError).toContain('未取得'); expect(d.skyError).toContain('未取得')
  })
  it('不正な日付を補正して別の日の情報にしない', () => {
    expect(() => calendarDay('2026-02-30')).toThrow()
  })
})
