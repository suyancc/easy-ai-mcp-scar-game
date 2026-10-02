// Obstacles.js — 障碍物：火焰油桶 / 钢钉拒马 / 爆炸桶
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LANES } from '../world/Road.js';
import { makeShadow } from '../core/Shadow.js';

const ASSETS = [
  { url: './assets/obs_barrel.glb', hit: 1.6 },
  { url: './assets/obs_caltrops.glb', hit: 1.9 },
  { url: './assets/obs_explosive.glb', hit: 1.0 },
];

export class Obstacles {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.spawnTimer = 1.2;
    this.templates = [];
  }

  async load() {
    const loader = new GLTFLoader();
    for (const a of ASSETS) {
      try {
        const gltf = await loader.loadAsync(a.url);
        const m = gltf.scene;
        m.visible = false;
        m.userData.hit = a.hit;
        m.add(makeShadow(2.6, 2.6));
        this.scene.add(m);
        this.templates.push(m);
      } catch (e) {
        console.warn('[Obstacles] load failed:', a.url, e);
      }
    }
  }

  clear() {
    for (const it of this.items) this.scene.remove(it.mesh);
    this.items.length = 0;
    this.spawnTimer = 1.2;
  }

  spawn() {
    const lane = Math.floor(Math.random() * 3);
    if (!this.templates.length) return;
    const t = this.templates[Math.floor(Math.random() * this.templates.length)];
    const mesh = t.clone();
    mesh.visible = true;
    mesh.position.set(LANES[lane], 0, 140 + Math.random() * 30);
    const s = 0.9 + Math.random() * 0.25;
    mesh.scale.setScalar(s);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.items.push({ mesh, hit: (t.userData.hit || 1.2) * s });
  }

  update(dt, speed, player, state) {
    this.spawnTimer -= dt;
    const rate = Math.max(0.9, 2.2 - speed * 0.004);
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = rate;
    }
    const dz = speed * dt * 0.28;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.mesh.position.z -= dz;
      if (it.mesh.position.z < -16) {
        this.scene.remove(it.mesh);
        this.items.splice(i, 1);
        continue;
      }
      const dx = Math.abs(it.mesh.position.x - player.group.position.x);
      const dzz = Math.abs(it.mesh.position.z - player.group.position.z);
      if (dx < it.hit && dzz < it.hit + 1.1) {
        state.crash();
        player.model && (player.model.rotation.x = -0.18);
      }
    }
  }
}
