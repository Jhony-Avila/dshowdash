// services/Som.ts — trilha sonora do estúdio, sintetizada via WebAudio.
// @version 1.0.0  @created 2026-07-29  (AS3 §20 / decisão #22)
//
// Nenhum arquivo de áudio: tudo é sintetizado (osciladores + envelopes),
// leve e com timbre suave. DESLIGADO por padrão; preferência persistida.
// Volume mestre baixo de propósito — som de jogo premium sussurra.
import type { Raridade } from '../domain/types';

const CHAVE = 'dshow.avatar.som.v1';
const VOLUME_MESTRE = 0.11;

let _ctx: AudioContext | null = null;
let _mestre: GainNode | null = null;

export function somAtivo(): boolean {
  try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
}

export function definirSom(ligado: boolean): void {
  try { localStorage.setItem(CHAVE, ligado ? '1' : '0'); } catch { /* sem storage */ }
  if (ligado) contexto(); // desbloqueia o AudioContext no gesto do usuário
}

function contexto(): AudioContext | null {
  try {
    if (!_ctx) {
      _ctx = new AudioContext();
      _mestre = _ctx.createGain();
      _mestre.gain.value = VOLUME_MESTRE;
      _mestre.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch { return null; }
}

/** Nota suave: seno + parcial a quinta, ataque rápido, cauda exponencial. */
function nota(freq: number, inicio: number, dur: number, ganho = 1): void {
  const ctx = contexto();
  if (!ctx || !_mestre) return;
  const t = ctx.currentTime + inicio;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(ganho, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  env.connect(_mestre);

  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = freq;
  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = freq * 2.001; // oitava levemente desafinada = brilho
  const g2 = ctx.createGain();
  g2.gain.value = 0.28;
  o1.connect(env);
  o2.connect(g2).connect(env);
  o1.start(t); o2.start(t);
  o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}

const TOM_POR_NIVEL = [392, 440, 494, 554, 622, 698, 740]; // sol→fá# (sobe com a raridade)

/** Clique de equipar — afina com a raridade do item. */
export function tocarEquipar(nivel: number): void {
  if (!somAtivo()) return;
  const f = TOM_POR_NIVEL[Math.min(nivel, TOM_POR_NIVEL.length - 1)];
  nota(f, 0, 0.16, 0.8);
}

/** Salvamento — terça maior suave. */
export function tocarSalvar(): void {
  if (!somAtivo()) return;
  nota(523.25, 0, 0.32, 0.7);      // dó
  nota(659.25, 0.06, 0.34, 0.55);  // mi
}

/** Celebração lendário/mítico/exclusivo — arpejo ascendente com brilho. */
export function tocarCelebracao(raridade: Raridade): void {
  if (!somAtivo()) return;
  const base = raridade === 'exclusivo' ? 587.33 : raridade === 'mitico' ? 554.37 : 523.25;
  const acorde = [1, 1.25, 1.5, 2];
  acorde.forEach((m, i) => nota(base * m, i * 0.07, 0.5, 0.6 - i * 0.08));
  nota(base * 3, 0.3, 0.6, 0.18);  // harmônico de fecho
}
