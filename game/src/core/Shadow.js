// Shadow.js — Q版软圆阴影（车/障碍落地）
import * as THREE from 'three';

let _tex = null;
function shadowTex() {
  if (_tex) return _tex;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(40,60,90,0.40)');
  grad.addColorStop(1, 'rgba(40,60,90,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  _tex = new THREE.CanvasTexture(c);
  return _tex;
}

export function makeShadow(w, d, opacity = 1) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, opacity })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}
