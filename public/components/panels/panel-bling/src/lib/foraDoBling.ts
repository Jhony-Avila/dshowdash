// lib/foraDoBling.ts — pedidos apagados no Bling (detalhe 404) ficam FORA das vendas (coleta bacbde86 / pacote B da ACIMA_DIREITA)
// e são declarados em `meta.pedidos_fora_do_bling {pedidos, valor}`. A tela nunca deixa isso sumir em silêncio: toda resposta
// registra o meta aqui e o painel mostra uma faixa enquanto houver pedidos fora. Ausência do campo = nada a dizer (não é zero).
import React from 'react';

export interface ForaDoBling { pedidos: number; valor: number | null }
let atual: ForaDoBling | null = null;
const ouvintes = new Set<() => void>();

export function registrarMetaForaDoBling(meta: unknown): void {
  const f = (meta as { pedidos_fora_do_bling?: { pedidos?: unknown; valor?: unknown } } | null)?.pedidos_fora_do_bling;
  if (!f || typeof f.pedidos !== 'number') return;   // resposta sem o campo não apaga o aviso de outra
  const novo: ForaDoBling | null = f.pedidos > 0 ? { pedidos: f.pedidos, valor: typeof f.valor === 'number' ? f.valor : null } : null;
  if (JSON.stringify(novo) === JSON.stringify(atual)) return;
  atual = novo; ouvintes.forEach((o) => o());
}

export function useForaDoBling(): ForaDoBling | null {
  return React.useSyncExternalStore((o) => { ouvintes.add(o); return () => { ouvintes.delete(o); }; }, () => atual, () => atual);
}
