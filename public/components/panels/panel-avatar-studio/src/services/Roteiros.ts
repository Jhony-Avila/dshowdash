// services/Roteiros.ts — EDITOR DE SHOWCASE (lote 221–230 · §175/§175.1).
// @version 1.0.0  @created 2026-08-05
//
// Um ROTEIRO é a sequência configurável do showcase 3D (§175): clipes,
// duração por clipe, câmera, luz/fundo opcionais (aplicados SÓ durante a
// apresentação) e encerramento. Molde do Cenas3d: localStorage versionado,
// limite explícito, sanitização estrita, fail-safe por construção.
// O modo AUTOMÁTICO (§175.1) é DETERMINÍSTICO por regras — coerente com
// raridade/aura/clipes do personagem; nunca rotulado de IA (§232–§240).
import { FUNDOS_3D, LUZES_3D } from './Cenas3d';

export const CHAVE_ROTEIROS = 'dshow.avst5.p3d.roteiros.v1';
const LIMITE = 6;

export const CAMERAS_SHOWCASE = ['cinematica', 'orbita'] as const;
export const ENCERRAMENTOS_SHOWCASE = ['Idle', 'Wave'] as const;

export interface RoteiroShowcase {
  id: string;
  nome: string;
  criadoEm: string; // ISO
  /** 1–4 clipes na ordem de exibição (validados contra o personagem na hora) */
  clipes: string[];
  /** 1200–5000ms por clipe */
  duracaoClipeMs: number;
  camera: (typeof CAMERAS_SHOWCASE)[number];
  /** ausentes = herdam o palco (e o palco NUNCA muda de forma permanente) */
  luz?: (typeof LUZES_3D)[number];
  fundo?: (typeof FUNDOS_3D)[number];
  encerramento: (typeof ENCERRAMENTOS_SHOWCASE)[number];
}

/** Campos editáveis (sem id/nome/criadoEm) — o rascunho da UI. */
export type RascunhoRoteiro = Omit<RoteiroShowcase, 'id' | 'nome' | 'criadoEm'>;

export function sanitizarRoteiro(bruto: unknown): RoteiroShowcase | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const r = bruto as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.nome !== 'string' || !r.nome.trim()) return null;
  const clipes = Array.isArray(r.clipes)
    ? r.clipes.filter((c): c is string => typeof c === 'string' && !!c.trim()).map((c) => c.slice(0, 48)).slice(0, 4)
    : [];
  if (clipes.length === 0) return null;
  const dominio = <T extends readonly string[]>(v: unknown, lista: T, padrao: T[number]): T[number] =>
    (typeof v === 'string' && (lista as readonly string[]).includes(v) ? v as T[number] : padrao);
  const dur = typeof r.duracaoClipeMs === 'number' && Number.isFinite(r.duracaoClipeMs)
    ? Math.round(Math.max(1200, Math.min(5000, r.duracaoClipeMs)))
    : 2600;
  const saida: RoteiroShowcase = {
    id: r.id.slice(0, 40),
    nome: r.nome.trim().slice(0, 32),
    criadoEm: typeof r.criadoEm === 'string' ? r.criadoEm : new Date(0).toISOString(),
    clipes,
    duracaoClipeMs: dur,
    camera: dominio(r.camera, CAMERAS_SHOWCASE, 'cinematica'),
    encerramento: dominio(r.encerramento, ENCERRAMENTOS_SHOWCASE, 'Idle'),
  };
  if (typeof r.luz === 'string' && (LUZES_3D as readonly string[]).includes(r.luz)) {
    saida.luz = r.luz as RoteiroShowcase['luz'];
  }
  if (typeof r.fundo === 'string' && (FUNDOS_3D as readonly string[]).includes(r.fundo)) {
    saida.fundo = r.fundo as RoteiroShowcase['fundo'];
  }
  return saida;
}

function lerTudo(): RoteiroShowcase[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_ROTEIROS) ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto.map(sanitizarRoteiro).filter((r): r is RoteiroShowcase => r !== null).slice(0, LIMITE);
  } catch { return []; }
}

function gravar(lista: RoteiroShowcase[]): void {
  try { localStorage.setItem(CHAVE_ROTEIROS, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* sem storage */ }
}

export function listarRoteiros(): RoteiroShowcase[] {
  return lerTudo();
}

/** Salva um rascunho como roteiro nomeado ("Roteiro N"). null = teto. */
export function salvarRoteiro(rascunho: RascunhoRoteiro): RoteiroShowcase | null {
  const lista = lerTudo();
  if (lista.length >= LIMITE) return null;
  const bruto: RoteiroShowcase = {
    ...rascunho,
    id: `rot_${Date.now().toString(36)}_${lista.length}`,
    nome: `Roteiro ${lista.length + 1}`,
    criadoEm: new Date().toISOString(),
  };
  const limpo = sanitizarRoteiro(bruto);
  if (!limpo) return null;
  gravar([...lista, limpo]);
  return limpo;
}

export function excluirRoteiro(id: string): void {
  gravar(lerTudo().filter((r) => r.id !== id));
}

// ── §175.1: MODO AUTOMÁTICO — determinístico por regras ─────────────
// Coerência com o avatar (mesma filosofia do consultor §232–§240): título
// raro/épico ou aura equipada = apresentação ENÉRGICA (dança/vitória, luz
// neon, palco de grade); caso contrário = apresentação SÓBRIA (aceno/
// caminhada, luz de estúdio). Só clipes que o personagem TEM entram.
const CLIPES_ENERGICOS = ['Dance', 'Victory', 'Jump', 'Running'];
const CLIPES_SOBRIOS = ['Wave', 'Walking', 'Walk', 'Idle_Neutral'];

export function montarRoteiroAutomatico(entrada: {
  /** raridade do título equipado (ex.: 'lendario') ou null */
  raridadeTitulo: string | null;
  temAura: boolean;
  /** clipes disponíveis do personagem atual */
  animacoes: string[];
}): RascunhoRoteiro {
  const energico = entrada.temAura
    || entrada.raridadeTitulo === 'lendario' || entrada.raridadeTitulo === 'epico';
  const preferidos = energico ? CLIPES_ENERGICOS : CLIPES_SOBRIOS;
  const reservas = energico ? CLIPES_SOBRIOS : CLIPES_ENERGICOS;
  const clipes = [...preferidos, ...reservas].filter((c) => entrada.animacoes.includes(c)).slice(0, energico ? 3 : 2);
  const saida: RascunhoRoteiro = {
    clipes: clipes.length ? clipes : ['Idle'],
    duracaoClipeMs: energico ? 2400 : 3200,
    camera: 'cinematica',
    encerramento: entrada.animacoes.includes('Wave') ? 'Wave' : 'Idle',
  };
  if (energico) { saida.luz = 'neon'; saida.fundo = 'grade'; } else { saida.luz = 'estudio'; }
  return saida;
}
