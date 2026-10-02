// Missions.js — 任务系统：一次一个目标，完成后加分并轮换
const POOL = [
  { id: 'coins30', text: '收集 30 枚金币', metric: 'coins', target: 30 },
  { id: 'coins60', text: '收集 60 枚金币', metric: 'coins', target: 60 },
  { id: 'combo8', text: '连击达到 8', metric: 'maxCombo', target: 8 },
  { id: 'combo15', text: '连击达到 15', metric: 'maxCombo', target: 15 },
  { id: 'dist4', text: '里程达到 4 km', metric: 'distance', target: 4 },
  { id: 'dist8', text: '里程达到 8 km', metric: 'distance', target: 8 },
  { id: 'score2500', text: '得分达到 2500', metric: 'score', target: 2500 },
  { id: 'score5000', text: '得分达到 5000', metric: 'score', target: 5000 },
  { id: 'shield1', text: '用护盾抵挡 1 次撞击', metric: 'shieldAbsorbs', target: 1 },
];

export class Missions {
  constructor() {
    this.done = [];
    this.current = null;
    this.completed = 0;
    this._next();
  }

  reset() {
    this.done = [];
    this.completed = 0;
    this._next();
  }

  _next() {
    const rest = POOL.filter((m) => !this.done.includes(m.id));
    const src = rest.length ? rest : POOL.slice();
    this.current = src[Math.floor(Math.random() * src.length)];
  }

  _value(st) {
    const m = this.current;
    if (!m) return 0;
    return m.metric === 'distance' ? st.distance : (st[m.metric] || 0);
  }

  progress(st) {
    const m = this.current;
    if (!m) return { text: '—', ratio: 1, value: 0, target: 0 };
    const v = this._value(st);
    return {
      text: m.text,
      ratio: Math.min(1, v / m.target),
      value: Math.min(v, m.target),
      target: m.target,
    };
  }

  update(st) {
    const m = this.current;
    if (!m) return false;
    if (this._value(st) >= m.target) {
      this.done.push(m.id);
      this.completed += 1;
      if (this.done.length >= POOL.length) this.done = [];
      this._next();
      return true;
    }
    return false;
  }
}
