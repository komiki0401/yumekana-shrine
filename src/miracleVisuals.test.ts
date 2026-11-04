import { describe, expect, it } from 'vitest'
const artFiles = import.meta.glob<string>('./assets/encounters/*.svg', { query: '?raw', import: 'default', eager: true })
import { miracleCatalog } from './miracleCatalog'
import { vectorMiracles, vectorVisual } from './miracleVisuals'
import { encounterImages } from './encounterImages'
import { encounterRate, encounterWeights, rarityProbabilities } from './encounters'

describe('追加した40種類の専用演出', () => {
  it('40枚のオリジナルSVGと個別の動きを揃え、外部素材を参照しない', () => {
    let size = 0
    expect(Object.keys(vectorMiracles)).toHaveLength(40)
    expect(new Set(Object.values(vectorMiracles).map(v => v.motion)).size).toBe(40)
    for (const [id, visual] of Object.entries(vectorMiracles)) {
      const svg = artFiles[`./assets/encounters/${id}.svg`]
      size += new TextEncoder().encode(svg).byteLength
      expect(svg).toContain('viewBox="0 0 480 360"')
      expect(svg).not.toMatch(/<script|<foreignObject|<image|href=|<animate|<style/)
      expect(encounterImages[id as keyof typeof encounterImages]).toContain('.svg')
    }
    expect(size).toBeLessThan(120000)
  })
  it('従来の10枚は維持し、追加の40枚がカテゴリに応じた場所に現れる', () => {
    expect(Object.keys(encounterImages)).toHaveLength(50)
    expect(vectorVisual('cat')).toBeUndefined()
    expect(vectorVisual('dragon')?.placement).toBe('panorama')
    expect(vectorVisual('rabbit')?.motion).toBe('rabbit-hop')
    expect(vectorVisual('floweringTree')?.particles).toBe('petals')
    for (const item of miracleCatalog) expect(encounterImages[item.id]).toBeTruthy()
  })
  it('50種類に増えても合計の発生率と5レアリティの配分を維持する', () => {
    for (const spirit of [{ gratitude: 0, expectation: 0 }, { gratitude: 40, expectation: 0 }, { gratitude: 200, expectation: 200 }]) {
      const weights = encounterWeights(spirit), rarities = rarityProbabilities(spirit)
      expect(weights.reduce((s, item) => s + item.weight, 0)).toBeCloseTo(encounterRate(spirit))
      for (const rarity of ['N', 'R', 'SR', 'SSR', 'UR'] as const) {
        const total = weights.filter(w => miracleCatalog.find(m => m.id === w.kind)?.rarity === rarity).reduce((s, item) => s + item.weight, 0)
        expect(total / encounterRate(spirit)).toBeCloseTo(rarities[rarity])
      }
    }
  })
})
