// Audio.js — WebAudio 合成音效：每种事件独立音色（金币音高随连击上升）
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.ok = false;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(ctx.destination);

    // --- 引擎：双振荡器 + 低通 ---
    this.engGain = ctx.createGain();
    this.engGain.gain.value = 0.14;
    const engFilter = ctx.createBiquadFilter();
    engFilter.type = 'lowpass';
    engFilter.frequency.value = 420;
    this.engOsc1 = ctx.createOscillator();
    this.engOsc1.type = 'sawtooth';
    this.engOsc1.frequency.value = 52;
    this.engOsc2 = ctx.createOscillator();
    this.engOsc2.type = 'square';
    this.engOsc2.frequency.value = 78;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.4;
    this.engOsc1.connect(engFilter);
    this.engOsc2.connect(o2g).connect(engFilter);
    engFilter.connect(this.engGain).connect(this.master);
    this.engOsc1.start();
    this.engOsc2.start();

    // --- 风噪 ---
    this.noiseBuf = this._makeNoise(2.0);
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 900;
    windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.0;
    wind.connect(windFilter).connect(this.windGain).connect(this.master);
    wind.start();

    this.ok = true;
  }

  _makeNoise(sec) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _env(t0, gain, dur, type, freq, freqEnd) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur * 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  setSpeed(v) {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    const f = 40 + Math.max(0, v - 80) * 0.42;
    this.engOsc1.frequency.setTargetAtTime(f, t, 0.18);
    this.engOsc2.frequency.setTargetAtTime(f * 1.52, t, 0.18);
    this.engGain.gain.setTargetAtTime(0.10 + Math.max(0, v - 95) * 0.0006, t, 0.2);
    this.windGain.gain.setTargetAtTime(Math.min(0.22, Math.max(0, (v - 110) * 0.0015)), t, 0.25);
  }

  swoosh() {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1600, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.16);
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + 0.2);
  }

  crash() {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, t);
    thud.frequency.exponentialRampToValueAtTime(38, t + 0.4);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.7, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    thud.connect(tg).connect(this.master);
    thud.start(t); thud.stop(t + 0.55);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + 0.6);
  }

  combo(n) {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    const base = 520 + Math.min(600, n * 26);
    this._env(t, 0.22, 0.16, 'triangle', base, base * 1.5);
  }

  // ── 金币：双音“Bling”+ 金属泛音（专属，音高随连击上升） ──
  coin(combo) {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    const pf = 1 + Math.min(0.35, (combo || 0) * 0.018);
    this._env(t, 0.18, 0.11, 'square', 988 * pf);
    this._env(t + 0.055, 0.18, 0.14, 'square', 1319 * pf);
    this._env(t, 0.05, 0.2, 'sine', 2637 * pf);
  }

  // ── 护盾：冰晶气泡 —— 玻璃质上行琶音 + 高频辉光（专属） ──
  shieldPickup() {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      this._env(t + i * 0.055, 0.13, 0.5, 'sine', f);
    });
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.085, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + 0.75);
  }

  // ── 磁铁：弹簧颤音嗡鸣上滑（专属） ──
  magnetPickup() {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = this.ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.28);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 11;
    const lg = ctx.createGain();
    lg.gain.value = 40;
    lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(this.master);
    lfo.start(t); o.start(t);
    lfo.stop(t + 0.45); o.stop(t + 0.45);
  }

  // ── 加速：NOS 轰鸣 —— 噪声喷射 + 锯齿拉升（专属） ──
  boostPickup() {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 0.5);
    f.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + 0.6);
    this._env(t, 0.16, 0.55, 'sawtooth', 90, 320);
  }

  // ── 护盾破碎（专属） ──
  shieldBreak() {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    this._env(t, 0.3, 0.35, 'triangle', 660, 220);
  }

  // ── 任务完成：五音上行庆典（专属） ──
  missionDone() {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this._env(t + i * 0.08, 0.16, 0.4, 'triangle', f);
    });
  }

  // ── 开始/重开：上行三连 ──
  chime() {
    if (!this.ok || this.muted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      this._env(t + i * 0.09, 0.2, 0.3, 'sine', f);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ok) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }
}
