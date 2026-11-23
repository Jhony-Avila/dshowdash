// PREENCHER V2 · ordenação da grade (pura; testada em scripts/atributos/testes/preencher-v2-puras.test.ts).
// Pelo TIPO do atributo: números comparados como número (convertidos pelo fator da unidade quando ele existe — a mesma regra de conversão
// que a aplicação já usa); texto e opções por texto (pt-BR, com números naturais); booleano Não < Sim. Vazio vai SEMPRE para o fim, depois
// dos estados gravados (Não se aplica / Desconhecido). Zero e falso são VALORES (não vão para o fim).
import type { ItemFicha } from './tipos';

export type Chave = { rank: 0 | 1 | 2; num?: number; txt?: string };
const col = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export function chaveOrdem(i: Pick<ItemFicha, 'tipo' | 'valor' | 'unidades' | 'opcoes'> | null | undefined): Chave {
  const v = i?.valor;
  if (!i || !v) return { rank: 2 };
  if (v.estado !== 'informado') return { rank: 1, txt: v.estado };
  switch (i.tipo) {
    case 'numero': case 'inteiro': {
      if (v.numero === null || v.numero === undefined || String(v.numero).trim() === '') return { rank: 2 };
      const u = i.unidades.find((x) => x.id === v.unidade_id); const f = u?.fator_base ? Number(u.fator_base) : 1;
      return { rank: 0, num: Number(v.numero) * (Number.isFinite(f) && f > 0 ? f : 1) };
    }
    case 'booleano': return v.booleano === null || v.booleano === undefined ? { rank: 2 } : { rank: 0, num: v.booleano ? 1 : 0 };
    case 'opcao': case 'multiopcao': {
      const r = (v.opcoes?.length ? v.opcoes : (v.opcao_ids ?? []).map((id) => i.opcoes.find((o) => o.id === id)?.rotulo ?? String(id))).join(', ');
      return r ? { rank: 0, txt: r } : { rank: 2 };
    }
    case 'data': return v.data ? { rank: 0, txt: v.data } : { rank: 2 };
    default: return v.texto && String(v.texto).trim() !== '' ? { rank: 0, txt: String(v.texto) } : { rank: 2 };
  }
}

/** Compara duas chaves; `dir` só inverte os valores (vazio e estados continuam no fim). */
export function compararChaves(a: Chave, b: Chave, dir: 1 | -1): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  if (a.rank === 2) return 0;
  if (a.num !== undefined && b.num !== undefined) return (a.num - b.num) * dir;
  return col.compare(a.txt ?? '', b.txt ?? '') * dir;
}
