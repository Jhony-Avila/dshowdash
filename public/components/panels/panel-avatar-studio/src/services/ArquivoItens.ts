// services/ArquivoItens.ts — ESTADO "arquivado" do asset (mega 248 · §228).
// @version 1.0.0  @created 2026-08-05
//
// §228: além de disponível/bloqueado/equipado/favorito, o item pode ser
// ARQUIVADO — some da grade padrão (menos ruído) sem perder nada: é uma
// preferência LOCAL reversível; nunca toca config/servidor.
const CHAVE = 'dshow.avst5.arquivados.v1';
const TETO = 300;

export function arquivados(): Set<string> {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return new Set(Array.isArray(b) ? b.filter((x): x is string => typeof x === 'string').slice(0, TETO) : []);
  } catch { return new Set(); }
}

export function alternarArquivado(id: string): Set<string> {
  const atual = arquivados();
  if (atual.has(id)) atual.delete(id);
  else atual.add(id);
  try { localStorage.setItem(CHAVE, JSON.stringify([...atual].slice(0, TETO))); } catch { /* sem storage */ }
  // a grade re-lê na hora (drawer §67 e grade vivem em árvores separadas)
  try { window.dispatchEvent(new Event('avst:arquivados')); } catch { /* SSR/teste */ }
  return atual;
}
