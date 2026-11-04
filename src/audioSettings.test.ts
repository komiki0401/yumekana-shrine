import { describe, expect, it } from 'vitest'
import { audioDefaults, readAudioPreferences } from './audioSettings'
import { decode, empty } from './store'

describe('BGMと効果音の設定・互換性', () => {
  it('初期状態はBGM・効果音ともOFFで、別々の音量を持つ', () => {
    const data = empty()
    expect(data.settings.sound).toBe(false)
    expect(readAudioPreferences(data.settings)).toEqual(audioDefaults)
  })
  it('音声項目がない旧データの夢・小判・効果音設定をそのまま引き継ぐ', () => {
    const old = empty()
    old.settings = { id: 'old', sound: true, welcomed: true }
    old.dreams = [{ id: 'dream', title: '海を眺める', detail: '大切な願い', createdAt: '2026-11-01', target: '', status: 'wishing' }]
    old.transactions = [{ id: 'coin', amount: 1, date: '2026-11-01', kind: 'earn' }]
    const restored = decode(JSON.stringify(old))
    expect(restored).toEqual(old)
    expect(readAudioPreferences(restored.settings)).toEqual(audioDefaults)
    expect(restored.settings.sound).toBe(true)
  })
  it('BGMのON/OFFと2つの音量を保存・復元する', () => {
    const data = empty()
    data.settings = { ...data.settings, sound: false, bgmEnabled: true, bgmVolume: .2, soundVolume: .7 }
    expect(readAudioPreferences(decode(JSON.stringify(data)).settings)).toEqual({ bgmEnabled: true, bgmVolume: .2, soundVolume: .7 })
    expect(decode(JSON.stringify(data)).settings.sound).toBe(false)
  })
  it('音量の範囲外や不正値があっても、記録を壊さず安全な音量で扱う', () => {
    expect(readAudioPreferences({ bgmVolume: 5, soundVolume: -1 })).toMatchObject({ bgmVolume: 1, soundVolume: 0 })
    expect(readAudioPreferences({ bgmVolume: NaN, soundVolume: Infinity })).toEqual(audioDefaults)
  })
})
