// Road.js — 雪地公路：雪原地面 + 雪垄 + 糖果路桩
import * as THREE from 'three';

const SEG_LEN = 30;
const SEG_COUNT = 8;
export const LANES = [4.2, 0, -4.2]; // 屏幕左->右（相机朝 +z，屏幕右 = -x）

export class Road {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // 大雪原
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xeef4fb, roughness: 0.92, metalness: 0 });
    const snowGround = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), snowMat);
    snowGround.rotation.x = -Math.PI / 2;
    snowGround.position.y = -0.06;
    scene.add(snowGround);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0xb8c4d4, roughness: 0.85, metalness: 0 });
    const dashMat = new THREE.MeshBasicMaterial({ color: 0x2e3a52 });
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xd84848 });
    const bankMat = new THREE.MeshStandardMaterial({ color: 0xf4f8fd, roughness: 0.9 });
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd84848, roughness: 0.6 });

    for (let i = 0; i < SEG_COUNT; i++) {
      const g = new THREE.Group();
      const road = new THREE.Mesh(new THREE.PlaneGeometry(15, SEG_LEN), roadMat);
      road.rotation.x = -Math.PI / 2;
      g.add(road);

      for (const x of [-2.1, 2.1]) {
        for (let k = 0; k < 6; k++) {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.2), dashMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.012, -SEG_LEN / 2 + 2.5 + k * 5);
          g.add(dash);
        }
      }
      for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.14, SEG_LEN), edgeMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(side * 7.35, 0.012, 0);
        g.add(edge);
        // 雪垄
        const bank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, SEG_LEN), bankMat);
        bank.position.set(side * 8.3, 0.22, 0);
        g.add(bank);
        // 糖果路桩
        for (let k = 0; k < 3; k++) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.4, 10), poleMat);
          pole.position.set(side * 9.3, 1.2, -SEG_LEN / 2 + 5 + k * 11);
          g.add(pole);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bankMat);
          cap.position.set(side * 9.3, 2.5, -SEG_LEN / 2 + 5 + k * 11);
          g.add(cap);
        }
      }
      g.position.z = i * SEG_LEN;
      this.segments.push(g);
      scene.add(g);
    }
    this.scroll = 0;
  }

  update(dt, speed) {
    const dz = speed * dt * 0.28;
    this.scroll += dz;
    for (const g of this.segments) {
      g.position.z -= dz;
      if (g.position.z < -SEG_LEN) g.position.z += SEG_LEN * SEG_COUNT;
    }
  }
}
