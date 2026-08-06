// services/Temporadas.ts — TEMPORADAS, DESAFIOS e RECORDES locais
// (lote 361–370 · §245/§248/§251/§252, flag as5.temporadas).
// @version 1.0.0  @created 2026-08-06
//
// Tudo DERIVADO e local: temporada §248 vem do calendário (derivação
// pura — sem servidor, sem promessa falsa de evento); desafios §251 são
// semanais e DETERMINÍSTICOS (semente = semana ISO — todo mundo vê os
// mesmos, sem backend); recordes §252 são máximos HISTÓRICOS dos
// contadores locais (ranking social de verdade segue bloqueado em P14 —
// registrado). Nada aqui pune: desafio não cumprido simplesmente troca
// na semana seguinte (§634).
import { lerContadores } from './Contadores';
import { listarPresets } from './PresetsPessoais';
import { marcosEvolucao } from './Evolucao';

// ── §248: TEMPORADAS pelo calendário ─────────────────────────────────
export interface Temporada {
  id: string;
  nome: string;
  /** mês 1–12 de início e fim (inclusive) */
  cor: string;
}

const TEMPORADAS: Array<Temporada & { meses: number[] }> = [
  { id: 'aurora', nome: 'Temporada Aurora', cor: '#7cd9ff', meses: [1, 2, 3] },
  { id: 'forja', nome: 'Temporada Forja', cor: '#ff8c32', meses: [4, 5, 6] },
  { id: 'neon', nome: 'Temporada Neon', cor: '#7c5cff', meses: [7, 8, 9] },
  { id: 'lenda', nome: 'Temporada Lenda', cor: '#e8b64c', meses: [10, 11, 12] },
];

export function temporadaAtual(agora = new Date()): Temporada {
  const mes = agora.getMonth() + 1;
  const t = TEMPORADAS.find((x) => x.meses.includes(mes)) ?? TEMPORADAS[0];
  return { id: t.id, nome: t.nome, cor: t.cor };
}

// ── §251: DESAFIOS semanais determinísticos ──────────────────────────
export interface Desafio {
  id: string;
  nome: string;
  descricao: string;
  /** §216: tipo do desafio */
  tipo: 'studio' | 'colecao' | 'social' | 'dshow';
  /** medido em contadores/derivados LOCAIS — progresso honesto */
  alvo: number;
  atual: number;
}

/** Semana ISO 8601 (mesma do resto do estúdio). */
export function semanaIso(agora = new Date()): number {
  const d = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - inicioAno.getTime()) / 86400000) + 1) / 7);
}

/** Catálogo FIXO de desafios possíveis — a semana escolhe 3 (rotação). */
const POSSIVEIS: Array<Omit<Desafio, 'atual'>> = [
  { id: 'des_poderes', nome: 'Mostre seu poder', descricao: 'Ative poderes no palco 3 vezes', tipo: 'studio', alvo: 3 },
  { id: 'des_capturas', nome: 'Fotógrafo da casa', descricao: 'Capture 2 PNGs do palco', tipo: 'studio', alvo: 2 },
  { id: 'des_apresentacoes', nome: 'Showman', descricao: 'Rode 2 apresentações (showcase)', tipo: 'social', alvo: 2 },
  { id: 'des_presets', nome: 'Colecionador de looks', descricao: 'Tenha 3 presets salvos', tipo: 'colecao', alvo: 3 },
  { id: 'des_marcos', nome: 'Evolução visível', descricao: 'Registre 2 marcos de evolução', tipo: 'dshow', alvo: 2 },
];

function progressoDe(id: string): number {
  const c = lerContadores();
  switch (id) {
    case 'des_poderes': return c.poderes ?? 0;
    case 'des_capturas': return c.capturas ?? 0;
    case 'des_apresentacoes': return c.apresentacoes ?? 0;
    case 'des_presets': return listarPresets().length;
    case 'des_marcos': return marcosEvolucao().length;
    default: return 0;
  }
}

/** Os 3 desafios da semana — rotação determinística pela semana ISO. */
export function desafiosDaSemana(agora = new Date()): Desafio[] {
  const semana = semanaIso(agora);
  return Array.from({ length: 3 }, (_, i) => {
    const base = POSSIVEIS[(semana + i * 2) % POSSIVEIS.length];
    return { ...base, atual: Math.min(base.alvo, progressoDe(base.id)) };
  }).filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);
}

// ── §252: RECORDES pessoais (máximos históricos, local) ──────────────
const CHAVE_RECORDES = 'dshow.avst5.recordes.v1';

export interface Recordes {
  poderes: number;
  capturas: number;
  apresentacoes: number;
  presets: number;
  marcos: number;
}

export function lerRecordes(): Recordes {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_RECORDES) ?? '{}') as Partial<Recordes>;
    return {
      poderes: b.poderes ?? 0, capturas: b.capturas ?? 0,
      apresentacoes: b.apresentacoes ?? 0, presets: b.presets ?? 0, marcos: b.marcos ?? 0,
    };
  } catch { return { poderes: 0, capturas: 0, apresentacoes: 0, presets: 0, marcos: 0 }; }
}

/** Recalcula e persiste os máximos (recorde NUNCA diminui — §634). */
export function atualizarRecordes(): Recordes {
  const c = lerContadores();
  const antigos = lerRecordes();
  const novos: Recordes = {
    poderes: Math.max(antigos.poderes, c.poderes ?? 0),
    capturas: Math.max(antigos.capturas, c.capturas ?? 0),
    apresentacoes: Math.max(antigos.apresentacoes, c.apresentacoes ?? 0),
    presets: Math.max(antigos.presets, listarPresets().length),
    marcos: Math.max(antigos.marcos, marcosEvolucao().length),
  };
  try { localStorage.setItem(CHAVE_RECORDES, JSON.stringify(novos)); } catch { /* sem storage */ }
  return novos;
}

// ── §245 v2: DIÁRIO — um dia por linha, agregando os marcos ──────────
export interface DiaDiario {
  dia: string;          // YYYY-MM-DD
  marcos: number;
  origens: string[];    // origens únicas do dia
}

export function diarioDoAvatar(): DiaDiario[] {
  const porDia = new Map<string, { marcos: number; origens: Set<string> }>();
  for (const m of marcosEvolucao()) {
    const dia = new Date(m.quando).toISOString().slice(0, 10);
    const e = porDia.get(dia) ?? { marcos: 0, origens: new Set<string>() };
    e.marcos += 1;
    e.origens.add(m.origem);
    porDia.set(dia, e);
  }
  return [...porDia.entries()]
    .map(([dia, e]) => ({ dia, marcos: e.marcos, origens: [...e.origens] }))
    .sort((a, b) => b.dia.localeCompare(a.dia))
    .slice(0, 14);
}
