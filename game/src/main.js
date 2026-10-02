// main.js — 游戏装配与主循环（雪地 · 成品模型 · 音效/道具/任务/胎痕/选车/排行/昼夜/BGM）
import * as THREE from 'three';
import { SceneSetup } from './render/SceneSetup.js';
import { Road } from './world/Road.js';
import { Scenery } from './world/Scenery.js';
import { Snow } from './world/Snow.js';
import { Spray } from './world/Spray.js';
import { Tracks } from './world/Tracks.js';
import { PlayerCar } from './entities/PlayerCar.js';
import { Traffic } from './entities/Traffic.js';
import { Obstacles } from './entities/Obstacles.js';
import { Collectibles } from './entities/Collectibles.js';
import { Input } from './core/Input.js';
import { GameState } from './core/GameState.js';
import { AudioBus } from './core/Audio.js';
import { Music } from './core/Music.js';
import { Board } from './core/Board.js';
import { Missions } from './core/Missions.js';
import { HUD } from './ui/HUD.js';

class Game {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.setup = new SceneSetup(this.renderer, container);
    this.state = new GameState();
    this.hud = new HUD();
    this.input = new Input();
    this.audio = new AudioBus();
    this.music = new Music();
    this.missions = new Missions();

    this.road = new Road(this.setup.scene);
    this.scenery = new Scenery(this.setup.scene);
    this.snow = new Snow(this.setup.scene);
    this.spray = new Spray(this.setup.scene);
    this.tracks = new Tracks(this.setup.scene);
    this.player = new PlayerCar(this.setup.scene);
    this.traffic = new Traffic(this.setup.scene);
    this.obstacles = new Obstacles(this.setup.scene);
    this.collectibles = new Collectibles(this.setup.scene);

    this.clock = new THREE.Clock();
    this.input.onLeft = () => { this.player.switchLane(-1); this.audio.swoosh(); };
    this.input.onRight = () => { this.player.switchLane(1); this.audio.swoosh(); };
    this._lastCombo = 0;
    this._nbShown = false;
    this.paused = false;
    this._v = new THREE.Vector3();
    this.started = false;
    this.best = parseInt(localStorage.getItem('snowrush_best') || '0', 10) || 0;

    // ── 选车 ──
    this.cars = [
      { name: '雪球号', file: 'cyber_car.glb' },
      { name: '极速号', file: 'player_race.glb' },
      { name: '巡逻号', file: 'player_police.glb' },
      { name: '的士号', file: 'player_taxi.glb' },
    ];
    this.selectedCar = 0;
    const cards = document.querySelectorAll('.carCard');
    cards.forEach((el, i) => {
      el.addEventListener('click', () => {
        this.selectedCar = i;
        cards.forEach((x, j) => x.classList.toggle('sel', i === j));
      });
    });

    // ── 开始界面 ──
    this.startEl = document.getElementById('start');
    const bestEl = document.getElementById('bestLine');
    if (bestEl) bestEl.textContent = '最高分 ' + this.best;
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        if (this._starting) return;
        this._starting = true;
        startBtn.textContent = '加载中…';
        this.audio.unlock();
        // 按所选车型加载（选车在开始前生效）
        await this.player.load('./assets/' + this.cars[this.selectedCar].file);
        this.tuneMats();
        this.audio.chime();
        this.music.start(this.audio.ctx, this.audio.master);
        this.started = true;
        if (this.startEl) this.startEl.style.display = 'none';
      });
    }
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        muteBtn.textContent = this.audio.toggleMute() ? '🔇' : '🔊';
      });
    }
    const againBtn = document.getElementById('againBtn');
    if (againBtn) againBtn.addEventListener('click', () => this.restartGame());
    const pauseEl = document.getElementById('pauseOverlay');
    if (pauseEl) {
      pauseEl.addEventListener('click', () => {
        this.paused = false;
        this.hud.showPause(false);
      });
    }

    // ── 排行榜面板 ──
    const boardBtn = document.getElementById('boardBtn');
    const boardPanel = document.getElementById('boardPanel');
    if (boardBtn && boardPanel) {
      boardBtn.addEventListener('click', () => {
        this.hud.renderBoardRows(Board.load(), 0, 'boardList', 10);
        boardPanel.style.display = boardPanel.style.display === 'flex' ? 'none' : 'flex';
      });
    }
    const boardClose = document.getElementById('boardClose');
    if (boardClose && boardPanel) {
      boardClose.addEventListener('click', () => { boardPanel.style.display = 'none'; });
    }

    // 切后台自动暂停
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.started && this.state.running && !this.paused) {
        this.paused = true;
        this.hud.showPause(true);
      }
    });
    // Esc / P 手动暂停
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && this.started && this.state.running) {
        this.paused = !this.paused;
        this.hud.showPause(this.paused);
      }
    });

    window.__game = this;
  }

  tuneMats() {
    const seen = new Set();
    this.setup.scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (seen.has(m)) continue;
        seen.add(m);
        if ('emissiveIntensity' in m) m.emissiveIntensity = Math.min(m.emissiveIntensity, 1.6);
        if ('metalness' in m) m.metalness = 0;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.3;
      }
    });
  }

  restartGame() {
    // UI 先清（避免任何游戏逻辑异常把面板钉在屏幕上）
    this.hud.hideMsg();
    this.hud.hideResult();
    this.hud.showNewBest(false);
    this.state.restart();
    this.player.reset();
    this.traffic.clear();
    this.obstacles.clear();
    this.collectibles.clear();
    this.tracks.clear();
    this.missions.reset();
    this._lastCombo = 0;
    this._nbShown = false;
    this.audio.chime();
  }

  async start() {
    // 玩家车在点击「开始游戏」时按所选车型加载
    await Promise.all([
      this.traffic.load(),
      this.obstacles.load(),
      this.scenery.load(),
    ]);
    this.tuneMats();
    this.setup.onResize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  frame() {
    if (this.paused) {
      this.audio.setSpeed(0);
      this.setup.render();
      return;
    }
    const dtRaw = Math.min(this.clock.getDelta(), 0.05);
    const st = this.state;
    if (st.slowT > 0) st.slowT -= dtRaw;
    const dt = dtRaw * (st.slowT > 0 ? 0.28 : 1);

    if (st.running && this.started) {
      // 速度：加速道具冲刺 / 平时缓加速
      if (st.boost > 0) {
        st.boost -= dtRaw;
        st.speed = Math.min(340, st.speed + 150 * dtRaw);
      } else if (st.speed > st.maxSpeed) {
        st.speed = Math.max(st.maxSpeed, st.speed - 130 * dtRaw);
      } else {
        st.speed = Math.min(st.maxSpeed, st.speed + st.accel * dtRaw);
      }
      if (st.magnet > 0) st.magnet -= dtRaw;
      if (st.invincible > 0) st.invincible -= dtRaw;
      if (st.shield > 0) st.shield -= dtRaw;

      st.distance += st.speed * dtRaw * 0.028;
      st.score += st.speed * dtRaw * 0.028 * (1 + st.combo * 0.1);
      if (st.combo !== this._lastCombo) {
        if (st.combo > this._lastCombo) {
          if (st.combo > 1) {
            this.hud.comboPop(st.combo);
            this.audio.combo(st.combo);
          }
          if (st.combo > st.maxCombo) st.maxCombo = st.combo;
        }
        this._lastCombo = st.combo;
      }
      this.road.update(dt, st.speed);
      this.scenery.update(dt, st.speed);
      this.snow.update(dtRaw, st.speed);
      this.spray.update(dtRaw, st.speed, this.player.group.position.x);
      this.tracks.update(dtRaw, st.speed, this.player.group.position.x);
      this.traffic.update(dt, st.speed, this.player, st);
      this.obstacles.update(dt, st.speed, this.player, st);
      const ev = this.collectibles.update(dt, st.speed, this.player, st);
      if (ev.coins > 0) this.audio.coin(st.combo);
      if (ev.shield) this.audio.shieldPickup();
      if (ev.magnet) this.audio.magnetPickup();
      if (ev.boost) this.audio.boostPickup();
      this.player.update(dtRaw, st.speed);
      this.player.setBrake(false);
      this.setup.updateCamera(dtRaw, this.player.group.position, st.speed);
      this.setup.setSpeedFov(st.speed, dtRaw);

      // 任务进度
      if (this.missions.update(st)) {
        st.score += 250;
        this.hud.showMsg('<b>⭐ 任务完成!</b> +250 分', 2.4);
        this.audio.missionDone();
      }
      this.hud.updateMission(this.missions.progress(st));

      // 新纪录徽章
      const nb = this.best > 0 && st.score > this.best;
      if (nb !== this._nbShown) {
        this._nbShown = nb;
        this.hud.showNewBest(nb);
      }
    } else {
      if (st.gameOver) st.speed = Math.max(0, st.speed - 340 * dtRaw); // 撞车滑停
      this.road.update(dt, st.speed);
      this.scenery.update(dt, st.speed);
      this.snow.update(dtRaw, st.speed);
      if (this.started) {
        this.spray.update(dtRaw, st.speed, this.player.group.position.x);
        this.tracks.update(dtRaw, st.speed, this.player.group.position.x);
      }
      this.collectibles.update(dt, st.speed, this.player, st);
      this.player.setBrake(st.gameOver && st.speed > 1);
      this.setup.updateCamera(dt, this.player.group.position, st.speed);
      if (st.gameOver && !st._msgShown) {
        st._msgShown = true;
        this.hud.crashFlash();
        this.setup.shake(0.6);
        this.audio.crash();
        if (navigator.vibrate) navigator.vibrate(80);
        const sc = Math.floor(st.score);
        const isBest = sc > this.best && sc > 0;
        if (isBest) {
          this.best = sc;
          try { localStorage.setItem('snowrush_best', String(sc)); } catch (e) {}
        }
        const res = Board.add(sc, st.distance, st.coins, st.maxCombo);
        this.hud.showNewBest(false);
        this.hud.showResult({
          newBest: isBest,
          score: sc,
          best: this.best,
          dist: st.distance.toFixed(1),
          coins: st.coins,
          combo: st.maxCombo,
          missions: this.missions.completed,
          shield: st.shieldAbsorbs,
          rank: res.rank,
          list: res.list,
        });
      }
    }
    st._msgShown = st._msgShown && !st.running;

    // 护盾破碎反馈
    if (st.shieldBroke) {
      st.shieldBroke = false;
      this.hud.crashFlash();
      this.setup.shake(0.45);
      this.audio.shieldBreak();
    }

    // 昼夜渐变（里程 60 起渐入黄昏，160 入夜——里程是高速累加单位）
    this.setup.setTimeOfDay(Math.max(0, Math.min(1, (st.distance - 60) / 100)));

    // 汽车上方道具倒计时（投影定位）
    const p = this.player.group.position;
    this._v.set(p.x, 3.7, p.z).project(this.setup.camera);
    this.hud.updateBuffPills(st);
    this.hud.positionBuffLabel(
      (this._v.x * 0.5 + 0.5) * window.innerWidth,
      (-this._v.y * 0.5 + 0.5) * window.innerHeight,
      this._v.z < 1 && st.running && this.started
    );

    this.audio.setSpeed(st.speed);
    this.setup.updateShake(dtRaw);
    this.hud.update(st);
    this.setup.render();
  }
}

const game = new Game(document.getElementById('app'));
game.start();
