// Snow.js — 飘雪粒子
import * as THREE from 'three';

export class Snow {
  constructor(scene) {
    const N = 1100;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 42;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 130;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d');
    const gr = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(c);

    const m = new THREE.PointsMaterial({
      size: 0.38, map: tex, transparent: true, depthWrite: false, opacity: 0.92,
    });
    this.points = new THREE.Points(g, m);
    scene.add(this.points);
  }

  update(dt, speed) {
    const arr = this.points.geometry.attributes.position.array;
    const fall = dt * (2.4 + speed * 0.012);
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= fall * (0.55 + ((i / 3) % 9) * 0.09);
      arr[i] += Math.sin((arr[i + 2] + performance.now() * 0.0008) * 0.4) * dt * 1.4;
      if (arr[i + 1] < -0.2) {
        arr[i + 1] = 38 + Math.random() * 5;
        arr[i] = (Math.random() - 0.5) * 100;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
