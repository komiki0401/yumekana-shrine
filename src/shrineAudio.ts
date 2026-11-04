import { shrineTrack } from './audioSettings'

export type AudioStatus = 'off' | 'needs-gesture' | 'loading' | 'playing' | 'paused' | 'error'
type AudioEnvironment = Window & { webkitAudioContext?: typeof AudioContext }

/** One shared context; one looping source; no fetch until an explicit play action. */
export class ShrineAudio {
  private context?: AudioContext
  private gain?: GainNode
  private buffer?: AudioBuffer
  private loading?: Promise<AudioBuffer>
  private controller?: AbortController
  private source?: AudioBufferSourceNode
  private fading = new Set<AudioBufferSourceNode>()
  private generation = 0
  private offset = 0
  private startedAt = 0
  private volume = .35
  private wanted = false
  private unlocked = false
  private disposed = false
  private hidden = false
  private status: AudioStatus = 'off'
  private effectsUntil = 0
  private effects = new Set<OscillatorNode>()
  private effectsGeneration = 0
  private timers = new Set<ReturnType<typeof setTimeout>>()
  constructor(private onStatus: (status: AudioStatus) => void, private url = shrineTrack.src) {}

  private announce(status: AudioStatus) { this.status = status; if (!this.disposed) this.onStatus(status) }
  private ensureContext() {
    if (!this.context) {
      const Factory = window.AudioContext ?? (window as AudioEnvironment).webkitAudioContext
      if (!Factory) throw new Error('音声再生に対応していません。')
      const ctx = new Factory()
      const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination)
      this.context = ctx; this.gain = gain
      ctx.addEventListener('statechange', () => {
        // iOS/OS interruptions may suspend a previously playing context.
        if (!this.disposed && !this.hidden && this.wanted && this.source && ctx.state !== 'running') {
          this.stopSource(0); this.announce('needs-gesture')
        }
      })
    }
    return this.context
  }
  configure(enabled: boolean, volume: number) {
    this.volume = volume
    if (!enabled) {
      if (this.wanted) this.stop()
    } else if (!this.wanted) {
      this.wanted = true
      // A remembered preference is not autoplay permission.
      this.announce('needs-gesture')
    }
    if (this.source && this.context && this.gain) {
      const now = this.context.currentTime
      this.gain.gain.cancelScheduledValues(now)
      this.gain.gain.setValueAtTime(this.gain.gain.value, now)
      this.gain.gain.linearRampToValueAtTime(volume, now + .18)
    }
  }
  private async load(ctx: AudioContext) {
    if (this.buffer) return this.buffer
    if (!this.loading) {
      const controller = new AbortController(); this.controller = controller
      const job = (async () => {
        const response = await fetch(this.url, { signal: controller.signal, credentials: 'same-origin' })
        if (!response.ok) throw new Error('BGMを読み込めませんでした。')
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
        if (this.disposed) throw new Error('音声を終了しました。')
        this.buffer = buffer
        return buffer
      })()
      this.loading = job
      void job.catch(() => { if (this.loading === job) this.loading = undefined })
    }
    return this.loading
  }
  private forgetLoad() { this.controller?.abort(); this.controller = undefined; this.loading = undefined }
  async play(userGesture = true) {
    if (this.disposed) return
    this.wanted = true
    if (this.hidden) { this.announce('paused'); return }
    if (!userGesture && !this.unlocked) { this.announce('needs-gesture'); return }
    if (this.source || this.status === 'loading') return
    const token = ++this.generation
    this.announce('loading')
    let readinessTimer: ReturnType<typeof setTimeout> | undefined
    try {
      const ctx = this.ensureContext()
      // Resume synchronously inside the click, before fetch/decode awaits (Safari).
      const resume = ctx.resume().then(() => true, () => false)
      const timer = setTimeout(() => {
        this.timers.delete(timer)
        if (token === this.generation && ctx.state !== 'running') {
          this.generation++; this.forgetLoad(); this.announce('needs-gesture')
        }
      }, 4000)
      readinessTimer = timer
      this.timers.add(timer)
      const buffer = await this.load(ctx)
      await resume
      clearTimeout(timer); this.timers.delete(timer)
      if (this.disposed || token !== this.generation || !this.wanted || this.hidden) return
      if (ctx.state !== 'running') { this.announce('needs-gesture'); return }
      this.unlocked = true
      this.clearFading()
      const source = ctx.createBufferSource()
      source.buffer = buffer; source.loop = true; source.loopStart = 0
      source.loopEnd = Math.min(buffer.duration, shrineTrack.loopSeconds)
      source.connect(this.gain!)
      const now = ctx.currentTime
      this.gain!.gain.cancelScheduledValues(now)
      this.gain!.gain.setValueAtTime(0, now)
      this.gain!.gain.linearRampToValueAtTime(this.volume, now + .9)
      this.offset %= source.loopEnd
      this.startedAt = now; this.source = source
      source.onended = () => { source.disconnect(); this.fading.delete(source); this.suspendIfIdle() }
      source.start(0, this.offset)
      this.announce('playing')
    } catch {
      if (!this.disposed && token === this.generation && this.wanted && !this.hidden) this.announce('error')
      this.suspendIfIdle()
    } finally {
      if (readinessTimer !== undefined) { clearTimeout(readinessTimer); this.timers.delete(readinessTimer) }
    }
  }
  private clearFading() {
    for (const source of this.fading) { try { source.stop() } catch { /* Already ended. */ } source.disconnect() }
    this.fading.clear()
  }
  private stopSource(fade: number) {
    const ctx = this.context, gain = this.gain, source = this.source
    if (!ctx || !gain || !source) return
    const now = ctx.currentTime
    this.offset = (this.offset + now - this.startedAt + fade) % Math.min(this.buffer!.duration, shrineTrack.loopSeconds)
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + fade)
    this.source = undefined; this.fading.add(source)
    try { source.stop(now + fade) } catch { source.disconnect(); this.fading.delete(source) }
  }
  stop() {
    this.wanted = false; this.generation++; this.forgetLoad()
    this.stopSource(.65); this.announce('off'); this.suspendIfIdle()
  }
  setHidden(hidden: boolean) {
    this.hidden = hidden
    if (hidden) {
      this.generation++; this.forgetLoad(); this.stopSource(0); this.clearFading()
      this.stopEffects()
      if (this.context && this.context.state !== 'closed') void this.context.suspend().catch(() => {})
      if (this.wanted) this.announce('paused')
    } else if (this.wanted) void this.play(false)
  }
  unlockEffects() {
    if (this.disposed || this.hidden) return
    try { void this.ensureContext().resume().then(() => this.suspendIfIdle()).catch(() => {}) } catch { /* Audio is optional. */ }
  }
  chime(enabled: boolean, volume: number) {
    if (!enabled || volume <= 0 || this.disposed || this.hidden) return
    try {
      const ctx = this.ensureContext()
      const token = this.effectsGeneration, requestedAt = performance.now()
      // Do not queue a bell in a blocked context to be heard on a later gesture.
      void ctx.resume().then(() => {
        if (this.disposed || this.hidden || token !== this.effectsGeneration || ctx.state !== 'running' || performance.now() - requestedAt > 1200) return
        this.effectsUntil = ctx.currentTime + 1.4
        ;[880, 1320, 1760].forEach((frequency, i) => {
          const osc = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + i * .12
          osc.frequency.value = frequency
          gain.gain.setValueAtTime(.08 * volume, start)
          gain.gain.exponentialRampToValueAtTime(.0001, start + .65)
          osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + .7)
          this.effects.add(osc)
          osc.onended = () => { osc.disconnect(); gain.disconnect(); this.effects.delete(osc) }
        })
        const timer = setTimeout(() => { this.timers.delete(timer); this.suspendIfIdle() }, 1600)
        this.timers.add(timer)
      }).catch(() => {})
    } catch { /* SFX must not interrupt saving or navigation. */ }
  }
  stopEffects() {
    this.effectsGeneration++
    for (const effect of this.effects) { try { effect.stop() } catch { /* Already ended. */ } effect.disconnect() }
    this.effects.clear(); this.effectsUntil = 0
    this.suspendIfIdle()
  }
  private suspendIfIdle() {
    const ctx = this.context
    if (ctx && ctx.state === 'running' && !this.source && !this.fading.size && this.status !== 'loading' && ctx.currentTime >= this.effectsUntil) void ctx.suspend().catch(() => {})
  }
  dispose() {
    this.disposed = true; this.generation++; this.forgetLoad()
    for (const timer of this.timers) clearTimeout(timer)
    this.timers.clear(); this.stopSource(0); this.clearFading(); this.stopEffects(); this.gain?.disconnect()
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {})
  }
}
