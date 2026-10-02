// Music.js — WebAudio 循环生成的轻快冬日 BGM（与音效分轨，接入 master 受静音统一控制）
const BPM = 96;
const STEP = 60 / BPM / 4; // 十六分音符

// 4 小节和弦：C - Am - F - G
const BARS = [
  { root: 130.81, pad: [261.63, 329.63, 392.00] },
  { root: 110.00, pad: [220.00, 261.63, 329.63] },
  { root: 87.31, pad: [174.61, 220.00, 261.63] },
  { root: 98.00, pad: [196.00, 246.94, 293.66] },
];

// 旋律（五声音阶，0=休止）——每小节 16 步
const MEL = [
  [523, 0, 392, 0, 523, 0, 659, 0, 587, 0, 523, 0, 392, 0, 0, 0],
  [440, 0, 523, 0, 659, 0, 523, 0, 440, 0, 392, 0, 330, 0, 0, 0],
  [349, 0, 440, 0, 523, 0, 440, 0, 392, 0, 349, 0, 294, 0, 0, 0],
  [392, 0, 494, 0, 587, 0, 494, 0, 392, 0, 330, 0, 294, 0, 0, 0],
];

export class Music {
  constructor() {
    this.playing = false;
  }

  start(ctx, master) {
    if (this.playing || !ctx) return;
    this.ctx = ctx;
    this.playing = true;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0.55;
    this.gain.connect(master);

    // 沙锤：循环噪声源
    const len = Math.floor(ctx.sampleRate * 0.06);
    this.hatBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.hatBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

    this.step = 0;
    this.nextT = ctx.currentTime + 0.12;
    this.timer = setInterval(() => this._sched(), 90);
    this._sched();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
    if (this.gain) {
      try { this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); } catch (e) {}
    }
  }

  _sched() {
    if (!this.playing) return;
    while (this.nextT < this.ctx.currentTime + 0.28) {
      this._playStep(this.step, this.nextT);
      this.step = (this.step + 1) % 64;
      this.nextT += STEP;
    }
  }

  _note(t, freq, dur, type, gain) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.gain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _hat(t) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.hatBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 5200;
    const g = ctx.createGain();
    g.gain.value = 0.028;
    s.connect(f).connect(g).connect(this.gain);
    s.start(t);
  }

  _playStep(s, t) {
    const bar = Math.floor(s / 16);
    const st = s % 16;
    const ch = BARS[bar];
    if (st === 0 || st === 8) this._note(t, ch.root, 0.55, 'sine', 0.30);
    if (st === 0) {
      ch.pad.forEach((f, i) => this._note(t + i * 0.02, f, 1.9, 'triangle', 0.07));
    }
    const mel = MEL[bar][st];
    if (mel) this._note(t, mel, 0.28, 'triangle', 0.16);
    if (st % 4 === 2) this._hat(t);
  }
}
