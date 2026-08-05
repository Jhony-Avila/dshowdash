// services/Missoes.ts — MISSÕES determinísticas (lote 191–195 · §250–§251).
// @version 1.0.0  @created 2026-08-05
//
// §250: "Monte um avatar corporativo → ganhe badge". Cada missão é uma
// REGRA verificável sobre o estado local (config atual + dados que o
// usuário já vê) — nada de servidor, nada de aleatório. Concluir uma
// missão grava o badge §224 (visual, separado dos títulos) para sempre.
// §251: o DESAFIO DA SEMANA é a rotação determinística da lista pela
// semana ISO — todo mundo vê o mesmo desafio na mesma semana.
// Gamificação responsável (§634): sem punição, sem perda, sem ranking.
import type { AvatarConfig } from '../domain/types';
import { itemPorId } from './AvatarCatalog';
import { itensUsados } from './Progresso';
import { marcosEvolucao } from './Evolucao';
import { listarListas } from './Listas';
import { listarProjetosFoto } from './ProjetosFoto';

const CHAVE_FEITAS = 'dshow.avst5.missoes.v1';

export interface Missao {
  id: string;
  titulo: string;
  dica: string;
  /** emoji-badge §224 (visual, não é título) */
  badge: string;
  feita: (cfg: AvatarConfig) => boolean;
}

/** Quantos itens EQUIPADOS têm o tema pedido (base + camadas). */
function equipadosComTema(cfg: AvatarConfig, termo: string): number {
  const ids = [cfg.base, ...Object.values(cfg.camadas)].filter(Boolean) as string[];
  return ids.filter((id) => {
    const i = itemPorId(id);
    return i ? `${i.nome} ${i.tema}`.toLowerCase().includes(termo) : false;
  }).length;
}

export const MISSOES: Missao[] = [
  {
    id: 'corporativo', titulo: 'Monte um look corporativo', badge: '💼',
    dica: 'Equipe 2+ peças de tema executivo/social (roupa, acessório, fundo…).',
    feita: (cfg) => equipadosComTema(cfg, 'executivo') + equipadosComTema(cfg, 'social') >= 2,
  },
  {
    id: 'cyber', titulo: 'Vire um cyber', badge: '🤖',
    dica: 'Equipe 2+ peças de tema cyber/neon.',
    feita: (cfg) => equipadosComTema(cfg, 'cyber') + equipadosComTema(cfg, 'neon') >= 2,
  },
  {
    id: 'explorador', titulo: 'Explore 40 itens do catálogo', badge: '🧭',
    dica: 'Experimente peças novas — cada item equipado pela 1ª vez conta.',
    feita: () => itensUsados().size >= 40,
  },
  {
    id: 'fotografo', titulo: 'Guarde um projeto no Photo Studio', badge: '📷',
    dica: 'Estilize uma foto e use "Guardar projeto".',
    feita: () => listarProjetosFoto().length >= 1,
  },
  {
    id: 'memorialista', titulo: 'Anote uma memória na evolução', badge: '📖',
    dica: 'Abra a Evolução (ramo no topo) e escreva uma memória num marco (§246).',
    feita: () => marcosEvolucao().some((m) => !!m.nota),
  },
  {
    id: 'curador', titulo: 'Crie uma lista com 3+ itens', badge: '🗂️',
    dica: 'No detalhe de um item, crie uma lista (§230) e guarde 3 peças nela.',
    feita: () => listarListas().some((l) => l.itens.length >= 3),
  },
  {
    id: 'evolucionista', titulo: 'Chegue a 5 marcos de evolução', badge: '🌱',
    dica: 'Salve looks diferentes — cada salvamento com mudança real vira marco.',
    feita: () => marcosEvolucao().length >= 5,
  },
];

/** Badges já conquistados (persistem — missão desfeita não tira o badge). */
export function missoesFeitas(): Set<string> {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_FEITAS) ?? '[]');
    return new Set(Array.isArray(b) ? b.filter((x) => typeof x === 'string') : []);
  } catch { return new Set(); }
}

/** Reavalia tudo contra o config atual; devolve ids RECÉM-concluídos. */
export function avaliarMissoes(cfg: AvatarConfig): string[] {
  const feitas = missoesFeitas();
  const novas: string[] = [];
  for (const m of MISSOES) {
    if (feitas.has(m.id)) continue;
    try { if (m.feita(cfg)) { feitas.add(m.id); novas.push(m.id); } } catch { /* regra nunca derruba */ }
  }
  if (novas.length) {
    try { localStorage.setItem(CHAVE_FEITAS, JSON.stringify([...feitas])); } catch { /* sem storage */ }
  }
  return novas;
}

/** §251: semana ISO (UTC) — determinística p/ o desafio da semana. */
export function semanaIso(d = new Date()): number {
  const data = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = data.getUTCDay() || 7;
  data.setUTCDate(data.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(data.getUTCFullYear(), 0, 1));
  return Math.ceil((((data.getTime() - inicioAno.getTime()) / 86400000) + 1) / 7);
}

export function desafioDaSemana(agora = new Date()): Missao {
  return MISSOES[semanaIso(agora) % MISSOES.length];
}
