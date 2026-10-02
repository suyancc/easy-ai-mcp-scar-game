// HUD.js — 糖果雪地 HUD：速度/得分/任务/结算/排行榜/汽车上方道具倒计时
export class HUD {
  constructor() {
    this.speedEl = document.getElementById('speedVal');
    this.speedBar = document.getElementById('speedBar');
    this.scoreEl = document.getElementById('scoreVal');
    this.msgEl = document.getElementById('msg');
    this.comboEl = document.getElementById('combo');
    this.flashEl = document.getElementById('flash');
    this.missionTextEl = document.getElementById('missionText');
    this.missionBarEl = document.getElementById('missionBar');
    this.carStatus = document.getElementById('carStatus');
    this.newBestEl = document.getElementById('newBest');
    this.resultEl = document.getElementById('resultPanel');
    this.pauseEl = document.getElementById('pauseOverlay');
    this._msgTimer = 0;
    this._flashT = 0;
    this._lastScore = -1;
    this._lastDist = -1;
    this._lastMission = '';
    this._lastPills = '';
  }

  showMsg(html, seconds) {
    this.msgEl.innerHTML = html;
    this.msgEl.style.display = 'block';
    this._msgTimer = seconds;
  }

  hideMsg() {
    this.msgEl.style.display = 'none';
    this._msgTimer = 0;
  }

  comboPop(n) {
    this.comboEl.textContent = '×' + n + ' COMBO';
    this.comboEl.classList.remove('pop');
    void this.comboEl.offsetWidth;
    this.comboEl.classList.add('pop');
  }

  crashFlash() {
    this._flashT = 0.65;
    this.flashEl.style.opacity = '0.65';
  }

  updateMission(p) {
    if (!this.missionTextEl) return;
    const label = p.text + '   ' + Math.floor(p.value) + '/' + p.target;
    if (label !== this._lastMission) {
      this._lastMission = label;
      this.missionTextEl.textContent = label;
    }
    if (this.missionBarEl) {
      this.missionBarEl.style.width = (p.ratio * 100).toFixed(1) + '%';
    }
  }

  // ── 汽车上方道具倒计时气泡 ──
  updateBuffPills(state) {
    if (!this.carStatus) return;
    const pills = [];
    if (state.shield > 0) pills.push(this._pill('🛡', state.shield));
    if (state.magnet > 0) pills.push(this._pill('🧲', state.magnet));
    if (state.boost > 0) pills.push(this._pill('⚡', state.boost));
    const html = pills.join('');
    if (html !== this._lastPills) {
      this._lastPills = html;
      this.carStatus.innerHTML = html;
    }
  }

  _pill(icon, t) {
    const warn = t <= 3 ? ' warn' : '';
    return '<span class="bpill' + warn + '">' + icon + Math.ceil(t) + 's</span>';
  }

  positionBuffLabel(x, y, visible) {
    if (!this.carStatus) return;
    if (!visible || !this._lastPills) {
      this.carStatus.style.display = 'none';
      return;
    }
    this.carStatus.style.display = 'flex';
    this.carStatus.style.left = x + 'px';
    this.carStatus.style.top = y + 'px';
  }

  showNewBest(on) {
    if (this.newBestEl) this.newBestEl.style.display = on ? 'block' : 'none';
  }

  // ── 排行榜行渲染 ──
  renderBoardRows(list, highlightRank, elId, maxN) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<div class="brow empty">还没有战绩，跑一局吧！</div>';
      return;
    }
    const rows = list.slice(0, maxN || 10).map((e, i) => {
      const hl = highlightRank === i + 1 ? ' hl' : '';
      return '<div class="brow' + hl + '"><span class="bno">' + (i + 1) + '</span>' +
        '<span class="bsc">' + e.score + '</span>' +
        '<span class="bdist">' + e.dist + ' km · \u{1FA99}' + (e.coins || 0) + '</span></div>';
    });
    el.innerHTML = rows.join('');
  }

  showResult(d) {
    if (!this.resultEl) return;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const title = document.getElementById('rTitle');
    if (title) title.textContent = d.newBest && d.score > 0 ? '🎉 新纪录！' : '撞车啦！';
    set('rScore', d.score);
    set('rBest', d.best);
    set('rDist', d.dist + ' km');
    set('rCoins', d.coins);
    set('rCombo', '×' + d.combo);
    set('rMissions', d.missions);
    set('rShield', d.shield);
    set('rRank', d.rank ? ('#' + d.rank + (d.rank <= 10 ? '' : '（未进 Top10）')) : '—');
    this.renderBoardRows(d.list, d.rank, 'rBoard', 5);
    this.resultEl.style.display = 'flex';
  }

  hideResult() {
    if (this.resultEl) this.resultEl.style.display = 'none';
  }

  showPause(on) {
    if (this.pauseEl) this.pauseEl.style.display = on ? 'flex' : 'none';
  }

  update(state) {
    const s = Math.round(state.speed);
    this.speedEl.innerHTML = s + '<small>km/h</small>';
    this.speedBar.style.width = Math.min(100, ((state.speed - 60) / 200) * 100).toFixed(1) + '%';

    const sc = Math.floor(state.score);
    if (sc !== this._lastScore || Math.floor(state.distance * 10) !== this._lastDist) {
      this._lastScore = sc;
      this._lastDist = Math.floor(state.distance * 10);
      this.scoreEl.innerHTML = sc + '<small>里程 ' + state.distance.toFixed(1) +
        ' km &middot; 连击 ×' + state.combo +
        ' &middot; \u{1FA99} ' + (state.coins || 0) + '</small>';
    }

    if (this._flashT > 0) {
      this._flashT -= 1 / 60;
      this.flashEl.style.opacity = Math.max(0, this._flashT).toFixed(2);
    }
    if (this._msgTimer > 0 && this._msgTimer < 9000) {
      this._msgTimer -= 1 / 60;
      if (this._msgTimer <= 0) this.msgEl.style.display = 'none';
    }
  }
}
