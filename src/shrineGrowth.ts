import { spiritTotal } from './encounters'
import type { Spirit } from './store'

export const shrineStages = [
  { level: 1, threshold: 0, name: 'はじまりの境内', description: '小さな願いを、そっと迎える神社。', sky: '#f5dfdf', horizon: '#f9ece6' },
  { level: 2, threshold: 15, name: '花あかりの境内', description: '花と灯りが、あなたの歩みを彩ります。', sky: '#eddfef', horizon: '#faeae5' },
  { level: 3, threshold: 50, name: '光満ちる境内', description: '感謝と夢が、金色のぬくもりに包まれて。', sky: '#f4dfd8', horizon: '#fff0d8' },
] as const
export type ShrineStage = typeof shrineStages[number]
export function getShrineGrowth(spirit: Spirit) {
  const total = spiritTotal(spirit)
  const stage = [...shrineStages].reverse().find(item => total >= item.threshold) ?? shrineStages[0]
  const next = shrineStages.find(item => item.level === stage.level + 1)
  return { total, stage, next, remaining: next ? Math.max(0, next.threshold - total) : 0, progress: next ? Math.min(1, (total - stage.threshold) / (next.threshold - stage.threshold)) : 1 }
}
