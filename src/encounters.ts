import type { EncounterKind, Spirit } from './store'

export const encounterCatalog: Record<EncounterKind, { title: string; message: string }> = {
 cat: { title: '猫が遊びに来ました', message: 'あなたのそばで、のんびりひと休み。' },
 blossoms: { title: '桜がふわりと祝福を', message: 'ありがとうの気持ちが、花の風になりました。' },
 butterfly: { title: '蝶が舞い降りました', message: '小さな羽が、境内に彩りを添えています。' },
 shootingStar: { title: '願いの空に、流れ星', message: '思い描いた未来に、そっと光が差します。' },
 deity: { title: '神さまが、そっと姿を見せました', message: 'やさしい光が、あなたの夢を見守っています。' },
 miracle: { title: '感謝と期待が結ぶ、小さな奇跡', message: '虹色の光に包まれて、神さまがそっと微笑みました。' },
}

// All unlocks depend only on the combined value. The old 20 + 20 condition
// becomes a total of 40, so either gratitude or dreams can unlock the miracle.
export const encounterThresholds: Record<EncounterKind, number> = {
 cat: 1, blossoms: 3, butterfly: 5, shootingStar: 3, deity: 8, miracle: 40,
}
export const ENCOUNTER_RATE_MULTIPLIER = 3
export const MAX_ENCOUNTER_RATE = .95
export const spiritTotal = (spirit: Spirit) => Math.max(0, spirit.gratitude) + Math.max(0, spirit.expectation)

export function encounterWeights(spirit: Spirit): { kind: EncounterKind; weight: number }[] {
 const total = spiritTotal(spirit)
 const base: { kind: EncounterKind; weight: number }[] = [
  { kind: 'miracle', weight: total >= encounterThresholds.miracle ? Math.min(.012, .003 + total / 2 * .0001) : 0 },
  { kind: 'deity', weight: total >= encounterThresholds.deity ? Math.min(.05, .006 + total * .0005) : 0 },
  { kind: 'shootingStar', weight: total >= encounterThresholds.shootingStar ? Math.min(.15, .025 + total * .002) : 0 },
  { kind: 'butterfly', weight: total >= encounterThresholds.butterfly ? Math.min(.14, .025 + total * .002) : 0 },
  { kind: 'blossoms', weight: total >= encounterThresholds.blossoms ? Math.min(.14, .025 + total * .002) : 0 },
  { kind: 'cat', weight: total >= encounterThresholds.cat ? Math.min(.24, .04 + total * .006) : 0 },
 ]
 const baseRate = base.reduce((sum, entry) => sum + entry.weight, 0)
 // Multiply every eligible rate equally; retain relative rarity at the cap.
 const scale = baseRate ? Math.min(ENCOUNTER_RATE_MULTIPLIER, MAX_ENCOUNTER_RATE / baseRate) : 0
 return base.map(entry => ({ ...entry, weight: entry.weight * scale }))
}

export function rollEncounter(spirit: Spirit, random = Math.random): EncounterKind | null {
 let roll = random()
 for (const { kind, weight } of encounterWeights(spirit)) {
  if (roll < weight) return kind
  roll -= weight
 }
 return null
}
