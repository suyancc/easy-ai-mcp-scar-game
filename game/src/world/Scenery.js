// Scenery.js — 雪景楼体 + 远景雪原剪影
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSETS = [
  './assets/scenery_building_1.glb',
  './assets/scenery_building_2.glb',
  './assets/scenery_building_3.glb',
];
const SPAN = 190;
const COUNT = 20;

export class Scenery {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.skyline = [];
    this.clouds = [];
  }

  async load() {
    const loader = new GLTFLoader();
    const templates = [];
    for (const url of ASSETS) {
      try {
        templates.push((await loader.loadAsync(url)).scene);
      } catch (e) {
        console.warn('[Scenery] load failed:', url, e);
      }
    }
    if (templates.length) {
      for (let i = 0; i < COUNT; i++) {
        const m = templates[i % templates.length].clone();
        const side = i % 2 === 0 ? -1 : 1;
        m.position.set(side * (15 + Math.random() * 14), 0, -50 + i * (SPAN / COUNT) + Math.random() * 5);
        m.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.scene.add(m);
        this.items.push(m);
      }
    }

    // Q版云朵
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const r = 6 + Math.random() * 7;
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
        s.position.set((k - 1.5) * r * 1.1, Math.random() * r * 0.35, Math.random() * r * 0.4);
        s.scale.y = 0.55;
        g.add(s);
      }
      g.position.set(-170 + i * 46 + Math.random() * 20, 46 + Math.random() * 26, 60 + Math.random() * 220);
      this.scene.add(g);
      this.clouds.push(g);
    }

    // 远景：淡蓝雪原剪影
    const sil = new THREE.MeshBasicMaterial({ color: 0xaec6e2 });
    for (let i = 0; i < 12; i++) {
      const w = 30 + Math.random() * 40;
      const h = 16 + Math.random() * 30;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 20), sil);
      m.position.set(-150 + i * 28 + Math.random() * 12, h / 2 - 2, 150 + Math.random() * 90);
      this.scene.add(m);
      this.skyline.push(m);
    }
  }

  update(dt, speed) {
    for (const c of (this.clouds || [])) {
      c.position.x += dt * 1.4;
      if (c.position.x > 200) c.position.x = -200;
    }
    const dz = speed * dt * 0.28;
    for (const m of this.items) {
      m.position.z -= dz * 0.55;
      if (m.position.z < -55) m.position.z += SPAN;
    }
  }
}
