// GameState.js — 数值与状态机（护盾/磁铁/加速/无敌帧/任务指标）
export class GameState {
  constructor() {
    this.reset();
    this.gameOver = false;
    this.restarting = false;
  }
  reset() {
    this.speed = 95;
    this.maxSpeed = 260;
    this.accel = 9;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.distance = 0;
    this.coins = 0;
    this.shield = 0;        // 护盾剩余秒数
    this.magnet = 0;        // 磁铁剩余秒数
    this.boost = 0;         // 加速剩余秒数
    this.invincible = 0;    // 无敌帧（护盾破碎后）
    this.shieldBroke = false;
    this.shieldAbsorbs = 0;
    this.running = true;
    this.gameOver = false;
    this.slowT = 0;
  }
  crash() {
    if (!this.running || this.invincible > 0 || this.boost > 0) return;
    if (this.shield > 0) {
      this.shield = 0;
      this.invincible = 1.3;
      this.shieldBroke = true;
      this.shieldAbsorbs += 1;
      this.speed = Math.max(95, this.speed - 55);
      return;
    }
    this.running = false;
    this.gameOver = true;
    this.slowT = 1.1;
  }
  restart() {
    this.reset();
  }
}
