const MODULE_ID = "panel-home.weather-fx.engine.governor";
const VERSION = "0.1.0-ETAPA1";
const SS_LEVELS = [1, 1.5, 2];
class Governor {
  targetHz = 120;
  densityScale = 1;
  // 0.4..1
  ssIndex = 2;
  // começa em 2x
  detecting = true;
  // detecção roda em 1x (carga leve)
  minDt = Infinity;
  detFrames = 0;
  detElapsed = 0;
  lowCount = 0;
  highCount = 0;
  cooldown = 0;
  onSSChange;
  constructor(onSSChange) {
    this.onSSChange = onSSChange;
  }
  get supersample() {
    return this.detecting ? 1 : SS_LEVELS[this.ssIndex];
  }
  get isDetecting() {
    return this.detecting;
  }
  // por frame — menor dt observado sob carga leve = refresh
  sampleFrame(raw) {
    if (!this.detecting) return;
    this.detElapsed += raw;
    if (raw > 0 && raw < 0.1) {
      this.detFrames++;
      if (raw < this.minDt) this.minDt = raw;
    }
    if ((this.detFrames >= 80 || this.detElapsed > 2) && isFinite(this.minDt)) {
      this.targetHz = snapHz(1 / this.minDt);
      this.detecting = false;
      this.onSSChange(this.supersample);
    }
  }
  // por janela de stats (~0.5s) — governa DPR/densidade pelo fps
  sampleFps(fps) {
    if (this.detecting) return;
    if (this.cooldown > 0) this.cooldown -= 0.5;
    const low = fps < this.targetHz * 0.9;
    const high = fps > this.targetHz * 0.96;
    if (low) {
      this.highCount = 0;
      this.lowCount++;
      if (this.lowCount >= 2 && this.cooldown <= 0) {
        if (this.ssIndex > 0) {
          this.ssIndex--;
          this.onSSChange(this.supersample);
          this.cooldown = 1.5;
        } else if (this.densityScale > 0.42) {
          this.densityScale = clamp(this.densityScale - 0.12, 0.4, 1);
          this.cooldown = 1.5;
        }
        this.lowCount = 0;
      }
    } else if (high) {
      this.lowCount = 0;
      this.highCount++;
      if (this.highCount >= 4 && this.cooldown <= 0) {
        if (this.densityScale < 1) {
          this.densityScale = clamp(this.densityScale + 0.08, 0.4, 1);
          this.cooldown = 1.2;
        } else if (this.ssIndex < 2) {
          this.ssIndex++;
          this.onSSChange(this.supersample);
          this.cooldown = 1.5;
        }
        this.highCount = 0;
      }
    } else {
      this.lowCount = 0;
      this.highCount = 0;
    }
  }
}
function snapHz(hz) {
  const list = [60, 75, 90, 100, 120, 144, 165, 240];
  let best = list[0], bd = 1e9;
  for (let i = 0; i < list.length; i++) {
    const d = Math.abs(hz - list[i]);
    if (d < bd) {
      bd = d;
      best = list[i];
    }
  }
  return best;
}
function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
var governor_default = Governor;
export {
  Governor,
  MODULE_ID,
  VERSION,
  governor_default as default
};
