// SceneSetup.js — 冬日雪景：白天→黄昏→夜晚时段渐变 / 柔光 / 轻泛光 / 追车
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// 时段三档配色：[白天, 黄昏, 夜晚]（夜晚保持通透的蓝调，不压黑）
const SKY = [
  ['#3d7fd4', '#4166bc', '#2c4a88'],
  ['#7ab3ec', '#a07ac8', '#4a6ca8'],
  ['#b8d8f5', '#f2b090', '#7a96c8'],
  ['#eaf4fd', '#ffe2c8', '#b0c8e8'],
];
const SKY_STOPS = [0.0, 0.42, 0.72, 1.0];
const FOG = [0xcfe4f5, 0xf0c8a8, 0x8aa4cc];
const HEMI_SKY = [0xbdd8f5, 0xe8b898, 0x7090c0];
const HEMI_GND = [0xeaf2fc, 0xe0c8d0, 0x9ab0d0];
const HEMI_INT = [1.35, 1.22, 1.02];
const SUN_COL = [0xfff2dd, 0xffb888, 0xa8c0e8];
const SUN_INT = [2.1, 1.85, 1.15];
const BNC_COL = [0xd8e8ff, 0xf0c0a0, 0x8098c0];
const BNC_INT = [0.75, 0.62, 0.5];
const BLOOM = [0.25, 0.32, 0.45];

function mixHex(stops, k) {
  const c = new THREE.Color(stops[0]);
  if (k < 0.5) return c.lerp(new THREE.Color(stops[1]), k * 2);
  return new THREE.Color(stops[1]).lerp(new THREE.Color(stops[2]), (k - 0.5) * 2);
}
function mixNum(stops, k) {
  return k < 0.5
    ? stops[0] + (stops[1] - stops[0]) * k * 2
    : stops[1] + (stops[2] - stops[1]) * (k - 0.5) * 2;
}

export class SceneSetup {
  constructor(renderer, container) {
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = this.makeSky();
    this.scene.fog = new THREE.Fog(0xcfe4f5, 70, 280);

    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 500);
    this.camera.position.set(0, 5.2, -9.5);
    this.camera.lookAt(0, 1, 6);

    // 冬日白天：暖阳 + 天蓝补光 + 雪地反光
    this.hemi = new THREE.HemisphereLight(0xbdd8f5, 0xeaf2fc, 1.35);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2dd, 2.1);
    this.sun.position.set(-30, 42, -18);
    this.scene.add(this.sun);
    this.bounce = new THREE.DirectionalLight(0xd8e8ff, 0.75); // 雪地反光
    this.bounce.position.set(16, -6, 22);
    this.scene.add(this.bounce);

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.55, 0.88);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.onResize());
    this.camTarget = new THREE.Vector3();
    this._shake = 0;
    this._fov = 62;
    this._todK = -1;
  }

  makeSky() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 512;
    const g = c.getContext('2d');
    this._skyC = c;
    this._skyG = g;
    const grad = g.createLinearGradient(0, 0, 0, 512);
    SKY.forEach((stops, i) => grad.addColorStop(SKY_STOPS[i], stops[0]));
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._skyTex = tex;
    return tex;
  }

  // k: 0=白天 0.5=黄昏 1=夜晚（按里程推进）
  setTimeOfDay(k) {
    k = Math.max(0, Math.min(1, k));
    const q = Math.round(k * 50) / 50;
    if (this._todK === q) return;
    this._todK = q;

    // 天空渐变重绘
    const g = this._skyG;
    const grad = g.createLinearGradient(0, 0, 0, 512);
    SKY.forEach((stops, i) => grad.addColorStop(SKY_STOPS[i], '#' + mixHex(stops, q).getHexString()));
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 512);
    this._skyTex.needsUpdate = true;

    this.scene.fog.color.copy(mixHex(FOG, q));
    this.hemi.color.copy(mixHex(HEMI_SKY, q));
    this.hemi.groundColor.copy(mixHex(HEMI_GND, q));
    this.hemi.intensity = mixNum(HEMI_INT, q);
    this.sun.color.copy(mixHex(SUN_COL, q));
    this.sun.intensity = mixNum(SUN_INT, q);
    this.bounce.color.copy(mixHex(BNC_COL, q));
    this.bounce.intensity = mixNum(BNC_INT, q);
    this.bloom.strength = mixNum(BLOOM, q);
  }

  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.bloom.setSize(innerWidth, innerHeight);
  }

  render() {
    this.composer.render();
  }

  setSpeedFov(speed, dt) {
    const target = 62 + Math.min(11, Math.max(0, (speed - 95) * 0.075));
    if (Math.abs(this._fov - target) > 0.02) {
      this._fov += (target - this._fov) * Math.min(1, dt * 3);
      this.camera.fov = this._fov;
      this.camera.updateProjectionMatrix();
    }
  }

  shake(amount) {
    this._shake = Math.min(1.2, (this._shake || 0) + amount);
  }

  updateShake(dt) {
    if (this._shake > 0.002) {
      this._shake *= Math.pow(0.015, dt);
      const s = this._shake * 0.38;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s * 0.6;
      this.camera.rotation.z += (Math.random() - 0.5) * s * 0.05;
    } else {
      this._shake = 0;
    }
  }

  updateCamera(dt, playerPos, speed) {
    const back = 9.2 + speed * 0.012;
    const tx = playerPos.x * 0.55;
    this.camera.position.x += (tx - this.camera.position.x) * 3.2 * dt;
    this.camera.position.y += (5.0 + speed * 0.006 - this.camera.position.y) * 2.4 * dt;
    this.camera.position.z += (-back - this.camera.position.z) * 2.4 * dt;
    this.camTarget.set(playerPos.x * 0.75, 1.15, playerPos.z + 7);
    this.camera.lookAt(this.camTarget);
  }
}
