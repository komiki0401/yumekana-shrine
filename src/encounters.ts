import type { EncounterKind, Spirit } from './store'

export const encounterCatalog: Record<EncounterKind, { symbol: string; title: string; message: string }> = {
 cat: { symbol: '🐈', title: '猫が遊びに来ました', message: 'あなたのそばで、のんびりひと休み。' },
 blossoms: { symbol: '🌸', title: '桜がふわりと祝福を', message: 'ありがとうの気持ちが、花の風になりました。' },
 butterfly: { symbol: '🦋', title: '蝶が舞い降りました', message: '小さな羽が、境内に彩りを添えています。' },
 shootingStar: { symbol: '🌠', title: '願いの空に、流れ星', message: '思い描いた未来に、そっと光が差します。' },
 deity: { symbol: '✨', title: '神さまが、そっと姿を見せました', message: 'やさしい光が、あなたの夢を見守っています。' },
 miracle: { symbol: '🌈', title: '感謝と期待が結ぶ、小さな奇跡', message: '虹色の光に包まれて、神さまがそっと微笑みました。' },
}

// One draw per visit / minute. Even at high values, a quiet visit remains possible.
// Thresholds and weights are independent from the saved, ever-growing values.
export function encounterWeights(spirit: Spirit): { kind: EncounterKind; weight: number }[] {
 const g = Math.max(0, spirit.gratitude), e = Math.max(0, spirit.expectation)
 return [
  { kind: 'miracle', weight: g >= 20 && e >= 20 ? Math.min(.012, .003 + Math.min(g,e) * .0001) : 0 },
  { kind: 'deity', weight: e >= 8 ? Math.min(.05, .006 + e * .0005) : 0 },
  { kind: 'shootingStar', weight: e >= 3 ? Math.min(.15, .025 + e * .002) : 0 },
  { kind: 'butterfly', weight: g >= 5 ? Math.min(.14, .025 + g * .002) : 0 },
  { kind: 'blossoms', weight: g >= 3 ? Math.min(.14, .025 + g * .002) : 0 },
  { kind: 'cat', weight: g >= 1 ? Math.min(.24, .04 + g * .006) : 0 },
 ]
}

export function rollEncounter(spirit: Spirit, random = Math.random): EncounterKind | null {
 let roll = random()
 for (const { kind, weight } of encounterWeights(spirit)) {
  if (roll < weight) return kind
  roll -= weight
 }
 return null
}
