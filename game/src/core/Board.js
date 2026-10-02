// Board.js — 本地排行榜（localStorage Top 10）
const KEY = 'snowrush_board';

export class Board {
  static load() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  static add(score, dist, coins, combo) {
    const entry = {
      score: Math.floor(score),
      dist: Math.round(dist * 10) / 10,
      coins: coins || 0,
      combo: combo || 0,
      t: Date.now(),
    };
    const list = Board.load();
    list.push(entry);
    list.sort((a, b) => b.score - a.score || b.dist - a.dist);
    const rank = list.indexOf(entry) + 1;
    const top = list.slice(0, 10);
    try { localStorage.setItem(KEY, JSON.stringify(top)); } catch (e) {}
    return { rank, list: top, saved: rank <= 10 };
  }

  static top5() {
    return Board.load().slice(0, 5);
  }
}
