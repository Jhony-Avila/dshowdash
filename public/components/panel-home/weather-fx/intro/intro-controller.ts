'use strict';
// =============================================================
// weather-fx / intro / intro-controller
// Sequência de ENTRADA ("Weather Reveal") — roda 1× por mount.
//
// Coordena três camadas, sem timer próprio (é dirigido pelo RAF do
// engine via tick(now) — nada a cancelar no destroy além de soltar a
// classe CSS):
//   1. Canvas: revela via CSS (opacity/scale) — classe `.wfx-intro` no host.
//   2. Saudação: revela via CSS (fade+slide) — mesma classe no host.
//   3. "Momento herói": RAMPA de densidade (0.15→1) que o engine aplica
//      em env.densityScale — os efeitos de partícula (chuva/neve/estrelas)
//      leem densityScale AO VIVO e ASSUMEM a população progressivamente
//      (gotas/flocos/estrelas surgindo até assentar). Estados não-partícula
//      (sol/nuvem/névoa) ficam com a revelação de canvas/saudação.
//
// reduced-motion: SEM rampa (fator 1) e janela curta — o CSS neutraliza
// as animações; nunca deixa a saudação/canvas presos invisíveis.
//
// Contrato anti-leak: single-run por instância; destroy() é idempotente
// e só remove a classe. Não aloca listeners/timers.
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.intro.intro-controller';
export const VERSION = '1.0.0-INTRO';

const INTRO_CLASS = 'wfx-intro';
const BUILD_MS = 1800;        // rampa de densidade (herói) — 0.15→1 ease-out
const TOTAL_MS = 3000;        // fim da sequência (solta a classe → DOM limpo)
const TOTAL_RM_MS = 500;      // reduced-motion: janela curta
const START_DENSITY = 0.15;   // densidade inicial da rampa (build-up)

// cubic ease-out
function easeOut(t: number): number {
  const c = 1 - t;
  return 1 - c * c * c;
}

export class IntroController {
  private host: HTMLElement | null;
  private readonly reduced: boolean;
  private startTs = -1;
  private _mult = 1;           // multiplicador de densidade lido pelo engine
  private _done = false;

  constructor(host: HTMLElement, reducedMotion: boolean) {
    this.host = host;
    this.reduced = reducedMotion;
  }

  // Arma a sequência: marca t0 e liga a classe que dispara o CSS. Uma vez só.
  start(nowMs: number): void {
    if (this.startTs >= 0 || !this.host) return;
    this.startTs = nowMs;
    this._mult = this.reduced ? 1 : START_DENSITY;
    this.host.classList.add(INTRO_CLASS);
  }

  // Avança pelo relógio do RAF do engine. Atualiza a rampa e finaliza no fim.
  tick(nowMs: number): void {
    if (this._done || this.startTs < 0) return;
    const elapsed = nowMs - this.startTs;
    const total = this.reduced ? TOTAL_RM_MS : TOTAL_MS;

    if (!this.reduced) {
      const k = elapsed <= 0 ? 0 : (elapsed >= BUILD_MS ? 1 : elapsed / BUILD_MS);
      this._mult = START_DENSITY + (1 - START_DENSITY) * easeOut(k);
    }
    if (elapsed >= total) this.finish();
  }

  // Multiplicador aplicado a env.densityScale (1 = sem efeito). Nunca 0.
  get densityMultiplier(): number { return this._done ? 1 : this._mult; }
  get isDone(): boolean { return this._done; }

  private finish(): void {
    this._done = true;
    this._mult = 1;
    if (this.host) this.host.classList.remove(INTRO_CLASS);
  }

  // Idempotente — solta a classe e trava em "pronto". Sem timers/listeners.
  destroy(): void {
    this._done = true;
    this._mult = 1;
    if (this.host) { this.host.classList.remove(INTRO_CLASS); this.host = null; }
  }
}
export default IntroController;
