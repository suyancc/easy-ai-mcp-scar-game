// Collectibles.js — 金币 / 护盾 / 磁铁 / 加速道具 + 护盾气泡 + 磁铁吸附
import * as THREE from 'three';
import { LANES } from '../world/Road.js';

function makeCoin() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.16, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffc94d, emissive: 0xb07a00, emissiveIntensity: 0.55,
      metalness: 0, roughness: 0.4,
    })
  );
  disc.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.07, 10, 22),
    new THREE.MeshStandardMaterial({
      color: 0xffe08a, emissive: 0xc08a00, emissiveIntensity: 0.4,
      metalness: 0, roughness: 0.35,
    })
  );
  g.add(disc);
  g.add(rim);
  return g;
}

function makeShieldPickup() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({
      color: 0x66e0ff, emissive: 0x2288cc, emissiveIntensity: 0.8,
      metalness: 0, roughness: 0.3,
    })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.09, 10, 26),
    new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0x88ddff, emissiveIntensity: 0.6,
      metalness: 0, roughness: 0.3,
    })
  );
  ring.rotation.x = Math.PI / 2.4;
  g.add(core);
  g.add(ring);
  return g;
}

function makeMagnet() {
  // 马蹄形磁铁：半环 + 红蓝磁极
  const g = new THREE.Group();
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.2, 12, 22, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0xd8e2ee, emissive: 0x35506b, emissiveIntensity: 0.35,
      metalness: 0, roughness: 0.35,
    })
  );
  arc.rotation.z = Math.PI; // 开口朝下
  const tipMat = (c, e) => new THREE.MeshStandardMaterial({
    color: c, emissive: e, emissiveIntensity: 0.55, metalness: 0, roughness: 0.4,
  });
  const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), tipMat(0xff6b6b, 0x992222));
  tipL.position.set(-0.62, -0.28, 0);
  const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), tipMat(0x6bb8ff, 0x225599));
  tipR.position.set(0.62, -0.28, 0);
  g.add(arc);
  g.add(tipL);
  g.add(tipR);
  return g;
}

function makeBoost() {
  // 加速能量瓶：圆柱 + 锥头 + 发光环
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 1.05, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff8a3c, emissive: 0xc04a10, emissiveIntensity: 0.7,
      metalness: 0, roughness: 0.35,
    })
  );
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.42, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffd166, emissive: 0xb07a00, emissiveIntensity: 0.6,
      metalness: 0, roughness: 0.35,
    })
  );
  nose.position.y = 0.72;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.08, 10, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffaa55, emissiveIntensity: 0.7,
      metalness: 0, roughness: 0.3,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  g.add(body);
  g.add(nose);
  g.add(ring);
  g.rotation.z = 0.3;
  return g;
}

function makeBubble() {
  const g = new THREE.Group();
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(2.35, 22, 16),
    new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.16, depthWrite: false })
  );
  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(2.62, 22, 16),
    new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.07, depthWrite: false })
  );
  g.add(inner);
  g.add(outer);
  g.position.set(0, 1.15, 0);
  return g;
}

export class Collectibles {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.coinTimer = 1.6;
    this.shieldTimer = 12;
    this.magnetTimer = 11;
    this.boostTimer = 14;
    this.bubble = makeBubble();
    scene.add(this.bubble);
    this.bubble.visible = false;
  }

  clear() {
    for (const it of this.items) this.scene.remove(it.mesh);
    this.items.length = 0;
    this.coinTimer = 1.6;
    this.shieldTimer = 12;
    this.magnetTimer = 11;
    this.boostTimer = 14;
    this.bubble.visible = false;
  }

  _spawnCoinRow() {
    const lane = Math.floor(Math.random() * 3);
    const z0 = 135 + Math.random() * 25;
    for (let k = 0; k < 3; k++) {
      const mesh = makeCoin();
      mesh.position.set(LANES[lane], 0.95, z0 - k * 4.2);
      this.scene.add(mesh);
      this.items.push({ mesh, kind: 'coin' });
    }
  }

  _spawnPower(kind) {
    const lane = Math.floor(Math.random() * 3);
    const mesh = kind === 'shield' ? makeShieldPickup()
      : kind === 'magnet' ? makeMagnet() : makeBoost();
    mesh.position.set(LANES[lane], 1.15, 140 + Math.random() * 20);
    this.scene.add(mesh);
    this.items.push({ mesh, kind });
  }

  update(dt, speed, player, state) {
    const ev = { coins: 0, shield: false, magnet: false, boost: false };

    this.coinTimer -= dt;
    if (this.coinTimer <= 0) {
      this._spawnCoinRow();
      this.coinTimer = 2.1 + Math.random() * 1.6;
    }
    this.shieldTimer -= dt;
    if (this.shieldTimer <= 0) {
      this._spawnPower('shield');
      this.shieldTimer = 17 + Math.random() * 10;
    }
    this.magnetTimer -= dt;
    if (this.magnetTimer <= 0) {
      this._spawnPower('magnet');
      this.magnetTimer = 15 + Math.random() * 9;
    }
    this.boostTimer -= dt;
    if (this.boostTimer <= 0) {
      this._spawnPower('boost');
      this.boostTimer = 16 + Math.random() * 10;
    }

    const dz = speed * dt * 0.28;
    const px = player.group.position.x;
    const pz = player.group.position.z;
    const magnetOn = state.magnet > 0;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const m = it.mesh;

      // 磁铁吸附（全部道具：金币 + 护盾 + 磁铁 + 加速）
      if (magnetOn) {
        const dx = px - m.position.x;
        const dy = (it.kind === 'coin' ? 0.95 : 1.15) - m.position.y;
        const dzz = pz - m.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dzz * dzz);
        if (dist < 15) {
          const k = Math.min(1, dt * 5.2);
          m.position.x += dx * k;
          m.position.y += dy * k;
          m.position.z += dzz * k * 0.55;
        }
      }

      m.position.z -= dz;
      m.rotation.y += dt * 2.6;
      if (it.kind === 'coin') {
        m.position.y = Math.max(m.position.y, 0) + (magnetOn ? 0 : Math.sin(m.rotation.y * 1.4) * 0.08);
      } else {
        if (!magnetOn) m.position.y = 1.15 + Math.sin(m.rotation.y) * 0.12;
        m.rotation.z += dt * 1.2;
      }

      if (m.position.z < -16) {
        this.scene.remove(m);
        this.items.splice(i, 1);
        continue;
      }
      const dx = Math.abs(m.position.x - px);
      const dzp = Math.abs(m.position.z - pz);
      if (dx < 1.85 && dzp < 2.1) {
        if (it.kind === 'coin') {
          ev.coins += 1;
          state.coins += 1;
          state.score += 30;
        } else if (it.kind === 'shield') {
          ev.shield = true;
          state.shield = 7;
        } else if (it.kind === 'magnet') {
          ev.magnet = true;
          state.magnet = 9;
        } else {
          ev.boost = true;
          state.boost = 4.5;
        }
        this.scene.remove(m);
        this.items.splice(i, 1);
      }
    }

    // 护盾气泡跟随主角
    const on = state.shield > 0;
    this.bubble.visible = on;
    if (on) {
      this.bubble.position.x = px;
      const s = 1 + Math.sin(performance.now() * 0.006) * 0.035;
      this.bubble.scale.setScalar(s);
    }
    return ev;
  }
}
