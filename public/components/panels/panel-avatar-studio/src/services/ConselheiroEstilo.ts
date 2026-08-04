// services/ConselheiroEstilo.ts — CONSULTOR DE ESTILO (lote 121–130 ·
// §232–§240). @version 1.0.0  @created 2026-08-04
//
// IMPORTANTE (honestidade §238): isto NÃO é IA — é um motor de REGRAS
// determinístico sobre o catálogo (mesma entrada → mesmas sugestões).
// Quando a chave de IA chegar (P13), o Copilot usa ESTE motor como
// ferramenta de grounding. Toda sugestão sai com o PORQUÊ (§238), com
// config VALIDADO pelo catálogo (§636-like: ID inventado não existe aqui
// por construção) e nunca é aplicada sem o usuário mandar (§239).
import type { AvatarConfig, CategoriaId } from '../domain/types';
import {
  COLECOES, CORES_SUGERIDAS, aplicarColecao, itensDe, progressoColecao, validarConfig,
} from './AvatarCatalog';

export type ObjetivoEstilo = 'profissional' | 'gamer' | 'evento' | 'zen';

export interface SugestaoEstilo {
  id: string;
  titulo: string;
  /** §238: a REGRA que gerou a sugestão, em linguagem de gente */
  porQue: string;
  origem: 'objetivo' | 'cor' | 'colecao' | 'evento';
  config: AvatarConfig;
}

// palavras-chave por objetivo — casadas contra nome+tema dos itens
const CHAVES: Record<ObjetivoEstilo, { rotulo: string; termos: string[] }> = {
  profissional: { rotulo: 'Profissional', termos: ['terno', 'executiv', 'seri', 'classic', 'oculos', 'estudio'] },
  gamer: { rotulo: 'Gamer', termos: ['neon', 'cyber', 'tech', 'led', 'circuito', 'pixel', 'chama'] },
  evento: { rotulo: 'Evento', termos: ['coroa', 'ouro', 'gala', 'lend', 'estrela', 'brilho'] },
  zen: { rotulo: 'Zen', termos: ['dojo', 'kimono', 'seren', 'calm', 'coque', 'natur'] },
};

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Melhor item da categoria p/ um conjunto de termos (0 pontos = nada). */
function melhorItem(categoria: CategoriaId, termos: string[], desbloqueados: Set<string>): string | null {
  let melhor: { id: string; pontos: number } | null = null;
  for (const i of itensDe(categoria)) {
    if (i.bloqueadoPor && !desbloqueados.has(i.id)) continue;
    const alvo = norm(`${i.nome} ${i.tema}`);
    let pontos = 0;
    for (const t of termos) if (alvo.includes(t)) pontos += 2;
    if (pontos === 0) continue;
    // desempate DETERMINÍSTICO: mais pontos → id lexicográfico
    if (!melhor || pontos > melhor.pontos || (pontos === melhor.pontos && i.id < melhor.id)) {
      melhor = { id: i.id, pontos };
    }
  }
  return melhor?.id ?? null;
}

/** §233: look completo por OBJETIVO (só troca o que tem match). */
export function sugerirPorObjetivo(
  atual: AvatarConfig, objetivo: ObjetivoEstilo, desbloqueados: Set<string>,
): SugestaoEstilo | null {
  const { rotulo, termos } = CHAVES[objetivo];
  const camadas = { ...atual.camadas };
  const trocas: string[] = [];
  for (const cat of ['roupa', 'olhos', 'boca', 'fundo', 'moldura', 'efeito'] as const) {
    const id = melhorItem(cat, termos, desbloqueados);
    if (id && camadas[cat] !== id) { camadas[cat] = id; trocas.push(cat); }
  }
  if (trocas.length < 2) return null; // sugestão fraca não aparece (§238)
  return {
    id: `obj_${objetivo}`,
    titulo: `Look ${rotulo}`,
    porQue: `Peças do catálogo com tema ${rotulo.toLowerCase()} (${trocas.length} trocas: ${trocas.join(', ')}).`,
    origem: 'objetivo',
    config: validarConfig({ ...atual, camadas }),
  };
}

/** §235: harmonia de COR — complementar e análoga da paleta sugerida. */
export function sugerirPorCor(atual: AvatarConfig): SugestaoEstilo[] {
  const hex2hue = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255; const g = ((n >> 8) & 255) / 255; const b = (n & 255) / 255;
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h;
  };
  const atualHue = hex2hue(atual.cores.destaque);
  const alvo = (desloc: number) => {
    const alvoHue = (atualHue + desloc + 360) % 360;
    let melhor = CORES_SUGERIDAS.destaque[0];
    let dist = 361;
    for (const c of CORES_SUGERIDAS.destaque) {
      const d = Math.min(Math.abs(hex2hue(c) - alvoHue), 360 - Math.abs(hex2hue(c) - alvoHue));
      if (d < dist || (d === dist && c < melhor)) { dist = d; melhor = c; }
    }
    return melhor;
  };
  const saida: SugestaoEstilo[] = [];
  for (const [nome, desloc] of [['complementar', 180], ['análoga', 40]] as const) {
    const cor = alvo(desloc);
    if (cor.toLowerCase() === atual.cores.destaque.toLowerCase()) continue;
    saida.push({
      id: `cor_${nome}`,
      titulo: `Destaque ${nome}`,
      porQue: `Harmonia ${nome} do seu destaque atual (${atual.cores.destaque} → ${cor}).`,
      origem: 'cor',
      config: validarConfig({ ...atual, cores: { ...atual.cores, destaque: cor } }),
    });
  }
  return saida;
}

/** §234: completar COLEÇÕES a caminho (40–99% exploradas). */
export function sugerirPorColecao(atual: AvatarConfig, usados: Set<string>): SugestaoEstilo[] {
  const saida: SugestaoEstilo[] = [];
  for (const col of COLECOES) {
    const prog = progressoColecao(col, usados);
    const pct = prog.total > 0 ? prog.usados / prog.total : 0;
    if (pct < 0.4 || pct >= 1) continue;
    saida.push({
      id: `col_${col.id}`,
      titulo: `Completar ${col.nome}`,
      porQue: `Você já explorou ${prog.usados}/${prog.total} desta coleção — faltam ${prog.total - prog.usados}.`,
      origem: 'colecao',
      config: aplicarColecao(atual, col),
    });
  }
  return saida.sort((a, b) => a.id.localeCompare(b.id)).slice(0, 2);
}

/** §236: itens de EVENTO ativo (a UI injeta os eventos da Vida). */
export function sugerirPorEvento(
  atual: AvatarConfig,
  eventos: Array<{ id: string; nome: string; ativo: boolean; itens: string[] }>,
  desbloqueados: Set<string>,
): SugestaoEstilo[] {
  const saida: SugestaoEstilo[] = [];
  for (const ev of eventos.filter((e) => e.ativo)) {
    const cfg = validarConfig({ ...atual });
    let usaveis = 0;
    for (const id of ev.itens) {
      const item = itensDe('efeito').concat(itensDe('fundo'), itensDe('moldura'), itensDe('aura'), itensDe('emblema'))
        .find((x) => x.id === id);
      if (!item || (item.bloqueadoPor && !desbloqueados.has(item.id))) continue;
      (cfg.camadas as Record<string, string>)[item.categoria] = item.id;
      usaveis += 1;
    }
    if (usaveis === 0) continue;
    saida.push({
      id: `ev_${ev.id}`,
      titulo: `Clima de ${ev.nome}`,
      porQue: `O evento "${ev.nome}" está ATIVO — ${usaveis} item(ns) dele já estão liberados p/ você.`,
      origem: 'evento',
      config: validarConfig(cfg),
    });
  }
  return saida;
}

/** Agregador: até 8 sugestões, ordem estável (§232 — determinístico). */
export function sugestoesDeEstilo(
  atual: AvatarConfig,
  ctx: {
    desbloqueados: Set<string>;
    usados: Set<string>;
    eventos?: Array<{ id: string; nome: string; ativo: boolean; itens: string[] }>;
  },
): SugestaoEstilo[] {
  const todas: SugestaoEstilo[] = [];
  for (const obj of ['profissional', 'gamer', 'evento', 'zen'] as ObjetivoEstilo[]) {
    const s = sugerirPorObjetivo(atual, obj, ctx.desbloqueados);
    if (s) todas.push(s);
  }
  todas.push(...sugerirPorCor(atual));
  todas.push(...sugerirPorColecao(atual, ctx.usados));
  todas.push(...sugerirPorEvento(atual, ctx.eventos ?? [], ctx.desbloqueados));
  return todas.slice(0, 8);
}

// ── §240: biblioteca de sugestões GUARDADAS ─────────────────────────
const CHAVE_BIBLIOTECA = 'dshow.avst5.consultor.v1';

export function guardadasDoConsultor(): SugestaoEstilo[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_BIBLIOTECA) ?? '[]');
    return Array.isArray(b)
      ? b.filter((s): s is SugestaoEstilo => !!s && typeof s.id === 'string' && !!s.config)
        .map((s) => ({ ...s, config: validarConfig(s.config) })).slice(0, 8)
      : [];
  } catch { return []; }
}

export function guardarSugestao(s: SugestaoEstilo): void {
  try {
    const atuais = guardadasDoConsultor().filter((x) => x.id !== s.id);
    localStorage.setItem(CHAVE_BIBLIOTECA, JSON.stringify([s, ...atuais].slice(0, 8)));
  } catch { /* sem storage */ }
}

export function esquecerSugestao(id: string): void {
  try {
    localStorage.setItem(CHAVE_BIBLIOTECA, JSON.stringify(guardadasDoConsultor().filter((x) => x.id !== id)));
  } catch { /* sem storage */ }
}
