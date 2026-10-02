// PlayerCar.js — Q版主角车（白天：无车灯点光）
import * as THREE from 'three';
import { LANES } from '../world/Road.js';
import { makeShadow } from '../core/Shadow.js';

export class PlayerCar {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lane = 1;
    this.group.position.set(LANES[1], 0, 0);
    this.tilt = 0;
    this.model = null;
  }

  async load(url) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    this.model = gltf.scene;
    // glTF 车头朝 +z，与前进方向一致，不再旋转（此前转了180度脸朝镜头）
    this.model.rotation.y = 0;
    this.group.add(this.model);
    this.group.add(makeShadow(3.4, 5.8));
    this.brakeLights = [];
    for (const sx of [-0.66, 0.66]) {
      const lm = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.15, depthWrite: false })
      );
      lm.position.set(sx, 0.78, -2.12);
      lm.rotation.y = Math.PI;
      this.group.add(lm);
      this.brakeLights.push(lm);
    }
  }

  switchLane(dir) {
    const next = this.lane + dir;
    if (next < 0 || next > 2) return;
    this.lane = next;
    this.tilt = dir * 0.22;
  }

  reset() {
    this.lane = 1;
    this.group.position.set(LANES[1], 0, 0);
    this.tilt = 0;
    if (this.model) { this.model.visible = true; this.model.rotation.x = 0; }
  }

  setBrake(on) {
    if (!this.brakeLights) return;
    for (const m of this.brakeLights) m.material.opacity = on ? 0.95 : 0.15;
  }

  update(dt, speed) {
    const targetX = LANES[this.lane];
    this.group.position.x += (targetX - this.group.position.x) * 8.5 * dt;
    this.tilt += (0 - this.tilt) * 5 * dt;
    if (this.model) this.model.rotation.z = this.tilt;
    this.group.position.y = Math.sin(performance.now() * 0.004) * 0.015;
  }
}
