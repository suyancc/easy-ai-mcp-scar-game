// Traffic.js — 敌车生成与碰撞（狂暴系 GLB：rammer / buggy / truck）
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LANES } from '../world/Road.js';
import { makeShadow } from '../core/Shadow.js';

const ENEMY_ASSETS = ['./assets/enemy_rammer.glb', './assets/enemy_buggy.glb', './assets/enemy_truck.glb'];
const FALLBACK_COLORS = [0x2a2f45, 0x3a1f4c, 0x1f3a4c, 0x4c2a1f];

export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.spawnTimer = 0;
    this.templates = [];
  }

  async load() {
    const loader = new GLTFLoader();
    for (const url of ENEMY_ASSETS) {
      try {
        const gltf = await loader.loadAsync(url);
        const m = gltf.scene;
        m.rotation.y = Math.PI; // glTF +Z 前 → -Z 前（对头来车）
        m.visible = false;
        m.add(makeShadow(3.6, 6.2));
        this.scene.add(m);
        this.templates.push(m);
      } catch (e) {
        console.warn('[Traffic] load failed:', url, e);
      }
    }
  }

  clear() {
    for (const it of this.items) this.scene.remove(it.mesh);
    this.items.length = 0;
    this.spawnTimer = 0;
  }

  spawn() {
    const lane = Math.floor(Math.random() * 3);
    let mesh;
    if (this.templates.length) {
      mesh = this.templates[Math.floor(Math.random() * this.templates.length)].clone();
      mesh.visible = true;
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 4.1), new THREE.MeshStandardMaterial({
        color: FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)],
        metalness: 0.65, roughness: 0.4,
      }));
      mesh.position.y = 0.62;
    }
    mesh.position.x = LANES[lane];
    mesh.position.z = 130 + Math.random() * 40;
    this.scene.add(mesh);
    this.items.push({ mesh, lane, passed: false });
  }

  update(dt, speed, player, state) {
    this.spawnTimer -= dt;
    const rate = Math.max(0.55, 1.45 - speed * 0.0032);
    if (this.spawnTimer <= 0) { this.spawn(); this.spawnTimer = rate; }

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
      if (!it.passed && dx < 1.8 && dzz < 2.8) {
        state.crash();
        player.model && (player.model.rotation.x = -0.18);
      } else if (!it.passed && it.mesh.position.z < player.group.position.z - 3.2) {
        it.passed = true;
        state.combo = Math.min(30, state.combo + 1);
      }
    }
  }
}
