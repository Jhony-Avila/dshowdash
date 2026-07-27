'use strict';
// =============================================================
// weather-fx / engine / governor
// FLUIDEZ > densidade. Detecta o refresh do monitor (sob carga leve)
// e adapta: degrada o supersample primeiro (2 → 1.5 → 1), depois a
// densidade; recupera na ordem inversa. Genérico — a densityScale é
// exposta no env e cada efeito decide como usá-la.
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.engine.governor';
export const VERSION = '0.1.0-ETAPA1';

const SS_LEVELS = [1, 1.5, 2];

export class Governor {
  targetHz = 120;
  densityScale = 1;                 // 0.4..1
  private ssIndex = 2;              // começa em 2x
  private detecting = true;         // detecção roda em 1x (carga leve)
  private minDt = Infinity; private detFrames = 0; private detElapsed = 0;
  private lowCount = 0; private highCount = 0; private cooldown = 0;
  private onSSChange: (ss: number) => void;

  constructor(onSSChange: (ss: number) => void) { this.onSSChange = onSSChange; }

  get supersample(): number { return this.detecting ? 1 : SS_LEVELS[this.ssIndex]; }
  get isDetecting(): boolean { return this.detecting; }

  // por frame — menor dt observado sob carga leve = refresh
  sampleFrame(raw: number): void {
    if (!this.detecting) return;
    this.detElapsed += raw;
    if (raw > 0 && raw < 0.1) { this.detFrames++; if (raw < this.minDt) this.minDt = raw; }
    if ((this.detFrames >= 80 || this.detElapsed > 2) && isFinite(this.minDt)) {
      this.targetHz = snapHz(1 / this.minDt);
      this.detecting = false;
      this.onSSChange(this.supersample);   // sobe de 1x → 2x (start em 2x)
    }
  }

  // por janela de stats (~0.5s) — governa DPR/densidade pelo fps
  sampleFps(fps: number): void {
    if (this.detecting) return;
    if (this.cooldown > 0) this.cooldown -= 0.5;
    const low  = fps < this.targetHz * 0.90;
    const high = fps > this.targetHz * 0.96;
    if (low) {
      this.highCount = 0; this.lowCount++;
      if (this.lowCount >= 2 && this.cooldown <= 0) {
        if (this.ssIndex > 0) { this.ssIndex--; this.onSSChange(this.supersample); this.cooldown = 1.5; }
        else if (this.densityScale > 0.42) { this.densityScale = clamp(this.densityScale - 0.12, 0.4, 1); this.cooldown = 1.5; }
        this.lowCount = 0;
      }
    } else if (high) {
      this.lowCount = 0; this.highCount++;
      if (this.highCount >= 4 && this.cooldown <= 0) {
        if (this.densityScale < 1) { this.densityScale = clamp(this.densityScale + 0.08, 0.4, 1); this.cooldown = 1.2; }
        else if (this.ssIndex < 2) { this.ssIndex++; this.onSSChange(this.supersample); this.cooldown = 1.5; }
        this.highCount = 0;
      }
    } else { this.lowCount = 0; this.highCount = 0; }
  }
}

function snapHz(hz: number): number {
  const list = [60, 75, 90, 100, 120, 144, 165, 240];
  let best = list[0], bd = 1e9;
  for (let i = 0; i < list.length; i++) { const d = Math.abs(hz - list[i]); if (d < bd) { bd = d; best = list[i]; } }
  return best;
}
function clamp(v: number, a: number, b: number): number { return v < a ? a : (v > b ? b : v); }
export default Governor;
