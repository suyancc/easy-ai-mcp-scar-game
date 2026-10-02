// Input.js — 键盘 + 触屏滑动 + 点击（统一重开入口）
export class Input {
  constructor() {
    this.onLeft = null;
    this.onRight = null;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.onLeft && this.onLeft();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.onRight && this.onRight();
      if (e.code === 'KeyR') this._restart();
    });
    window.addEventListener('mousedown', () => this._restart());
    let x0 = null;
    window.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 30) (dx < 0 ? this.onLeft : this.onRight)?.();
      else this._restart();
      x0 = null;
    }, { passive: true });
  }

  _restart() {
    const g = window.__game;
    if (g && g.state.gameOver) {
      g.restartGame();
    }
  }
}
