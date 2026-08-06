// services/Som.ts — trilha sonora do estúdio, sintetizada via WebAudio.
// @version 1.0.0  @created 2026-07-29  (AS3 §20 / decisão #22)
//
// Nenhum arquivo de áudio: tudo é sintetizado (osciladores + envelopes),
// leve e com timbre suave. DESLIGADO por padrão; preferência persistida.
// Volume mestre baixo de propósito — som de jogo premium sussurra.
import type { Raridade } from '../domain/types';
import { flag } from '../nucleo/flags';

const CHAVE = 'dshow.avatar.som.v1';
// megas 587–589 (§299, flag as5.infra_v3): chave no namespace avst5 — a
// antiga permanece (modo clássico lê dela); leitura dual, escrita nas duas
const CHAVE_V2 = 'dshow.avst5.som.v1';
const VOLUME_MESTRE = 0.11;

let _ctx: AudioContext | null = null;
let _mestre: GainNode | null = null;

export function somAtivo(): boolean {
  try {
    if (flag('as5.infra_v3')) {
      const novo = localStorage.getItem(CHAVE_V2);
      if (novo !== null) return novo === '1';
    }
    return localStorage.getItem(CHAVE) === '1';
  } catch { return false; }
}

export function definirSom(ligado: boolean): void {
  try {
    localStorage.setItem(CHAVE, ligado ? '1' : '0');
    if (flag('as5.infra_v3')) localStorage.setItem(CHAVE_V2, ligado ? '1' : '0');
  } catch { /* sem storage */ }
  if (ligado) contexto(); // desbloqueia o AudioContext no gesto do usuário
}

// ── megas 574–577 (§178.2, flag as5.palco_v3): PREFERÊNCIAS POR CATEGORIA ──
// Volume geral + liga/desliga independente de efeitos/ambiente/celebrações.
// Neutro (tudo ligado, volume 1) = chave AUSENTE no storage; flag OFF =
// prefs IGNORADAS (comportamento legado byte a byte — §651).
const CHAVE_PREFS = 'dshow.avst5.som.prefs.v1';

export interface PrefsSom {
  volume: number;        // 0–1 multiplica o mestre (1 = neutro)
  efeitos: boolean;      // equipar/salvar/capturar/poder
  ambiente: boolean;     // pad contínuo §178.1
  celebracoes: boolean;  // arpejos de raridade
}

const PREFS_NEUTRAS: PrefsSom = { volume: 1, efeitos: true, ambiente: true, celebracoes: true };

export function prefsSom(): PrefsSom {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_PREFS) ?? '{}') as Partial<PrefsSom>;
    const v = Number(bruto.volume);
    return {
      volume: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1,
      efeitos: bruto.efeitos !== false,
      ambiente: bruto.ambiente !== false,
      celebracoes: bruto.celebracoes !== false,
    };
  } catch { return { ...PREFS_NEUTRAS }; }
}

export function definirPrefSom(patch: Partial<PrefsSom>): void {
  const p = { ...prefsSom(), ...patch };
  const salvo: Partial<PrefsSom> = {};
  if (p.volume !== 1) salvo.volume = Math.round(p.volume * 100) / 100;
  if (!p.efeitos) salvo.efeitos = false;
  if (!p.ambiente) salvo.ambiente = false;
  if (!p.celebracoes) salvo.celebracoes = false;
  try {
    if (Object.keys(salvo).length) localStorage.setItem(CHAVE_PREFS, JSON.stringify(salvo));
    else localStorage.removeItem(CHAVE_PREFS); // neutro = chave some
  } catch { /* sem storage */ }
  aplicarVolume();
}

function aplicarVolume(): void {
  if (!_mestre) return;
  const fator = flag('as5.palco_v3') ? prefsSom().volume : 1;
  _mestre.gain.value = VOLUME_MESTRE * fator;
}

function categoriaLigada(cat: 'efeitos' | 'ambiente' | 'celebracoes'): boolean {
  if (!flag('as5.palco_v3')) return true; // §651: flag off = legado
  return prefsSom()[cat];
}

/** §178.2 "preview": nota de teste — responde só ao liga/desliga geral
 *  (é o botão de conferir o timbre; categorias não o silenciam). */
export function tocarPreview(): void {
  if (!somAtivo()) return;
  nota(523.25, 0, 0.22, 0.7);
  nota(659.25, 0.07, 0.26, 0.5);
}

function contexto(): AudioContext | null {
  try {
    if (!_ctx) {
      _ctx = new AudioContext();
      _mestre = _ctx.createGain();
      _mestre.gain.value = VOLUME_MESTRE;
      _mestre.connect(_ctx.destination);
      aplicarVolume(); // §178.2: volume geral persistido
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
  if (!somAtivo() || !categoriaLigada('efeitos')) return; // §178.2
  const f = TOM_POR_NIVEL[Math.min(nivel, TOM_POR_NIVEL.length - 1)];
  nota(f, 0, 0.16, 0.8);
}

/** Salvamento — terça maior suave. */
export function tocarSalvar(): void {
  if (!somAtivo() || !categoriaLigada('efeitos')) return; // §178.2
  nota(523.25, 0, 0.32, 0.7);      // dó
  nota(659.25, 0.06, 0.34, 0.55);  // mi
}

/** mega 89 (§584): CLIQUE de captura — obturador (nota curta grave+aguda). */
export function tocarCapturar(): void {
  if (!somAtivo() || !categoriaLigada('efeitos')) return; // §178.2
  nota(220, 0, 0.05, 0.5);
  nota(880, 0.045, 0.09, 0.4);
}

/** mega 89 (§584): PODER ativado — quinta ascendente com brilho. */
export function tocarPoder(): void {
  if (!somAtivo() || !categoriaLigada('efeitos')) return; // §178.2
  nota(392, 0, 0.22, 0.55);      // sol
  nota(587.33, 0.08, 0.3, 0.5);  // ré
  nota(783.99, 0.16, 0.4, 0.35); // sol agudo
}

/** Celebração lendário/mítico/exclusivo — arpejo ascendente com brilho. */
export function tocarCelebracao(raridade: Raridade): void {
  if (!somAtivo() || !categoriaLigada('celebracoes')) return; // §178.2
  const base = raridade === 'exclusivo' ? 587.33 : raridade === 'mitico' ? 554.37 : 523.25;
  const acorde = [1, 1.25, 1.5, 2];
  acorde.forEach((m, i) => nota(base * m, i * 0.07, 0.5, 0.6 - i * 0.08));
  nota(base * 3, 0.3, 0.6, 0.18);  // harmônico de fecho
}

// ── lote 321–330 (§161/§178, flag as5.palco_sensorial): SOM AMBIENTE ──
// Pad contínuo sintetizado POR CENÁRIO (§178.1 categoria "ambiente") —
// dois osciladores detunados + filtro passa-baixa + LFO lento no ganho.
// Regras §178.3: só toca com o som do estúdio LIGADO; parar é imediato;
// volume abaixo dos efeitos (ambiente sussurra por baixo).
let _amb: { osc: OscillatorNode[]; ganho: GainNode; lfo: OscillatorNode } | null = null;

/** Acordes-base por cenário (fundamental em Hz + cor do filtro). */
const AMBIENTES: Record<string, { freq: number; corte: number }> = {
  estudio: { freq: 110, corte: 520 },      // acolhedor
  grade: { freq: 98, corte: 900 },         // eletrônico
  dojo: { freq: 116.5, corte: 380 },       // orgânico
  neon: { freq: 92.5, corte: 1000 },
  galaxia: { freq: 73.4, corte: 1300 },    // sci-fi
  showroom: { freq: 87.3, corte: 700 },    // Dshow
  escritorio: { freq: 130.8, corte: 420 }, // corporativo calmo
  arena: { freq: 82.4, corte: 1100 },      // gamer
  cyberpunk: { freq: 78, corte: 1200 },
};

export function pararAmbiente(): void {
  if (!_amb) return;
  try {
    const agora = _ctx?.currentTime ?? 0;
    _amb.ganho.gain.setTargetAtTime(0.0001, agora, 0.12);
    const antigo = _amb;
    setTimeout(() => {
      try { antigo.osc.forEach((o) => o.stop()); antigo.lfo.stop(); } catch { /* já parado */ }
    }, 500);
  } catch { /* melhor esforço */ }
  _amb = null;
}

/** Liga (ou troca) o pad ambiente do cenário; null/desconhecido = para. */
export function tocarAmbiente(fundo: string | null): void {
  pararAmbiente();
  if (!fundo || !somAtivo() || !categoriaLigada('ambiente')) return; // §178.2
  const def = AMBIENTES[fundo] ?? null;
  if (!def) return;
  const ctx = contexto();
  if (!ctx || !_mestre) return;
  try {
    const ganho = ctx.createGain();
    ganho.gain.value = 0;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = def.corte;
    ganho.connect(filtro);
    filtro.connect(_mestre);
    const osc = [0, 7.02].map((detune) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = def.freq;
      o.detune.value = detune * 2; // batimento lento
      o.connect(ganho);
      o.start();
      return o;
    });
    // LFO ~0.1Hz respira o ganho (0.10–0.16 do mestre)
    const lfo = ctx.createOscillator();
    const lfoGanho = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGanho.gain.value = 0.03;
    lfo.connect(lfoGanho);
    lfoGanho.connect(ganho.gain);
    lfo.start();
    ganho.gain.setTargetAtTime(0.13, ctx.currentTime, 0.8); // fade-in suave
    _amb = { osc, ganho, lfo };
  } catch { /* sem áudio */ }
}
