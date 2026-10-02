// Spray.js — 车尾雪雾飞溅（速度感）
import * as THREE from 'three';

function sprayTex() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Spray {
  constructor(scene, count = 140) {
    this.n = count;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    for (let i = 0; i < count; i++) this.pos[i * 3 + 1] = -999;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.32, map: sprayTex(), transparent: true,
      opacity: 0.5, depthWrite: false, color: 0xffffff,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this._emitT = 0;
  }

  update(dt, speed, playerX) {
    const rate = 0.25 + (speed / 260);
    this._emitT += dt * (26 * rate);
    while (this._emitT >= 1) {
      this._emitT -= 1;
      this._emit(playerX, speed);
    }
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const j = i * 3;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      this.vel[j + 1] -= 7.5 * dt;
      if (this.life[i] <= 0 || this.pos[j + 1] < 0.02) {
        this.pos[j + 1] = -999;
        this.life[i] = 0;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  _emit(px, speed) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] > 0) continue;
      const j = i * 3;
      const side = Math.random() < 0.5 ? -1 : 1;
      this.pos[j] = px + side * (0.85 + Math.random() * 0.5);
      this.pos[j + 1] = 0.12 + Math.random() * 0.18;
      this.pos[j + 2] = -1.4 - Math.random() * 1.4;
      const kick = 0.6 + (speed / 260) * 2.2;
      this.vel[j] = side * (0.4 + Math.random() * 1.1);
      this.vel[j + 1] = 1.0 + Math.random() * 1.7;
      this.vel[j + 2] = -(kick + Math.random() * 2.2);
      this.life[i] = 0.4 + Math.random() * 0.35;
      return;
    }
  }
}
