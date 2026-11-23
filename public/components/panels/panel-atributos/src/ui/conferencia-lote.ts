// DSHOW-105 (Codex, P1 · defeito D-3 em produção): "Aceitar as N visíveis" podia enviar itens FORA das linhas exibidas.
// Regra: UMA coleção — a página exibida — alimenta a tabela, o contador, a confirmação e o payload. Nenhum ID fora da página é enviado.
// IDs e versões são CONGELADOS no momento da confirmação (o que o diálogo mostra é exatamente o que vai no envio e em todo reenvio).
// A página tem o tamanho do lote do servidor (SugestoesService::MAX_LOTE = 200): os elegíveis da página nunca passam do limite.

export const PAGINA_SUGESTOES = 200;

export interface ItemSugestao { readonly id: number; readonly versao: number; readonly ja_tem_valor?: boolean | number | null; readonly atributo?: string | null }

/** A página exibida (filtrada pelo atributo, na ordem da lista) — a ÚNICA coleção usada pela tela. */
export function paginaExibida<T extends ItemSugestao>(todas: readonly T[], filtroAtributo: string, tamanho = PAGINA_SUGESTOES): readonly T[] {
  return Object.freeze(todas.filter((x) => !filtroAtributo || x.atributo === filtroAtributo).slice(0, tamanho));
}

/** Elegíveis do lote = itens DA PÁGINA sem valor no destino (a sugestão não sobrescreve). */
export function elegiveisDaPagina<T extends ItemSugestao>(pagina: readonly T[]): readonly T[] {
  return Object.freeze(pagina.filter((x) => !x.ja_tem_valor));
}

export interface ConfirmacaoLote { readonly ids: readonly number[]; readonly versoes: Readonly<Record<number, number>> }

/** Congela IDs e versões NA CONFIRMAÇÃO. Recusa (lança) se algum item não estiver na página exibida ou se passar do limite. */
export function congelarConfirmacao(pagina: readonly ItemSugestao[], escolhidos: readonly ItemSugestao[], limite = PAGINA_SUGESTOES): ConfirmacaoLote {
  const naPagina = new Set(pagina.map((x) => x.id));
  const fora = escolhidos.filter((x) => !naPagina.has(x.id));
  if (fora.length) throw new Error(`DSHOW-105: ${fora.length} item(ns) fora da página exibida não podem entrar no lote`);
  const ids = [...new Set(escolhidos.map((x) => x.id))];
  if (ids.length === 0 || ids.length > limite) throw new Error(`DSHOW-105: o lote precisa de 1 a ${limite} itens (veio ${ids.length})`);
  const versoes: Record<number, number> = {};
  for (const x of escolhidos) versoes[x.id] = x.versao;
  return Object.freeze({ ids: Object.freeze(ids), versoes: Object.freeze(versoes) });
}
