// Tracks.js — 雪地胎痕（后轮双印，随世界滚走并淡出）
import * as THREE from 'three';

export class Tracks {
  constructor(scene, count = 90) {
    this.n = count;
    this.pool = [];
    this.life = new Float32Array(count);
    const geo = new THREE.PlaneGeometry(0.5, 0.95);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0x7d92aa, transparent: true, opacity: 0, depthWrite: false,
      }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.016;
      m.visible = false;
      scene.add(m);
      this.pool.push(m);
    }
    this._t = 0;
    this._flip = false;
  }

  clear() {
    for (let i = 0; i < this.n; i++) {
      this.life[i] = 0;
      this.pool[i].visible = false;
    }
    this._t = 0;
  }

  update(dt, speed, playerX) {
    this._t += dt;
    const interval = 0.062;
    while (this._t >= interval) {
      this._t -= interval;
      this._stamp(playerX);
    }
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const m = this.pool[i];
      m.position.z -= speed * dt * 0.28;
      const k = Math.max(0, this.life[i] / 3.2);
      m.material.opacity = 0.30 * k;
      if (this.life[i] <= 0 || m.position.z < -30) {
        m.visible = false;
        this.life[i] = 0;
      }
    }
  }

  _stamp(px) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] > 0) continue;
      const m = this.pool[i];
      this._flip = !this._flip;
      m.position.x = px + (this._flip ? -0.74 : 0.74);
      m.position.z = -1.85;
      m.visible = true;
      m.material.opacity = 0.3;
      this.life[i] = 3.2;
      return;
    }
  }
}
