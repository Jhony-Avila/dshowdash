// panel-bling/src/app/estado.ts — rota, filtros e hooks de dados
// @version 1.0.0  @created 2026-07-30
//
// Sem Zustand (decisão 8.2): o estado deste painel é pequeno e vive no hash da
// URL, que já é uma fonte compartilhada — colocar uma store por cima só criaria
// duas verdades sobre a mesma coisa.
//
// A rota é `#/panel-bling/<grupo>/<tela>` e é a ÚNICA fonte da tela ativa.
// Isso garante o §8.1 ("abrir a última seção utilizada"), link compartilhável e
// o botão voltar do navegador funcionando de graça.

import React from 'react';
import { ErroApi, Resposta } from '../services/api';
import { TELAS_POR_ID, TELA_PADRAO, TelaSpec } from '../screens/catalog';

export const CHAVE_ULTIMA_TELA = 'dshow.bling.ultima-tela';
export const CHAVE_SIDEBAR = 'dshow.bling.sidebar.collapsed';

/* ── Rota ──────────────────────────────────────────────────── */

export function lerTelaDoHash(): string {
  const h = window.location.hash || '';
  // #/panel-bling/<grupo>/<tela>  |  #/panel-bling/<tela>  |  #/panel-bling
  const m = h.match(/#\/panel-bling(?:\/([^/?]+))?(?:\/([^/?]+))?/);
  const cand = m?.[2] || m?.[1] || '';
  if (cand && TELAS_POR_ID[cand]) return cand;
  return '';
}

export function irParaTela(id: string): void {
  const t = TELAS_POR_ID[id];
  if (!t) return;
  window.location.hash = `#/panel-bling/${t.grupo}/${t.id}`;
}

/** Tela inicial: hash > última usada > padrão. */
export function telaInicial(): string {
  const doHash = lerTelaDoHash();
  if (doHash) return doHash;
  try {
    const salva = localStorage.getItem(CHAVE_ULTIMA_TELA);
    if (salva && TELAS_POR_ID[salva]) return salva;
  } catch { /* localStorage bloqueado: usa o padrão */ }
  return TELA_PADRAO;
}

export function useTelaAtiva(): [TelaSpec, (id: string) => void] {
  const [id, setId] = React.useState<string>(() => telaInicial());

  React.useEffect(() => {
    const aoMudar = () => {
      const nova = lerTelaDoHash();
      if (nova) setId(nova);
    };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  // Grava a última tela para o ícone do header reabrir onde o usuário parou.
  React.useEffect(() => {
    try { localStorage.setItem(CHAVE_ULTIMA_TELA, id); } catch { /* ignora */ }
    // Sincroniza o hash quando a tela inicial veio do localStorage.
    if (lerTelaDoHash() !== id) irParaTela(id);
  }, [id]);

  return [TELAS_POR_ID[id] ?? TELAS_POR_ID[TELA_PADRAO], irParaTela];
}

/* ── Filtros ───────────────────────────────────────────────── */

export interface Filtros {
  periodo: string;
  situacao: string; canal: string; deposito: string;
  fornecedor: string; categoria: string; vendedor: string;
  // Chaves dinâmicas (facetas declaradas por tela) podem não existir ainda —
  // por isso `| undefined`. Sem isso, um spread parcial não tipa.
  [k: string]: string | undefined;
}

export const FILTROS_INICIAIS: Filtros = {
  periodo: '30d',
  situacao: '', canal: '', deposito: '',
  fornecedor: '', categoria: '', vendedor: '',
};

export const CHAVE_FILTROS = 'dshow.bling.filtros';

/**
 * ⚠️ POR QUE OS FILTROS PRECISAM SAIR DO ESTADO DO REACT
 *
 * O app-shell REMONTA o painel a cada mudança de hash. Medido em 2026-07-30:
 * abrir o painel = 1 montagem; um drill-down = 2; navegar pela sub-sidebar = 3.
 * Cada navegação interna descarta o React inteiro e recria do zero.
 *
 * Consequência: `useState` não atravessa navegação. O drill-down aplicava o
 * filtro, navegava, e a tela de destino montava com o estado inicial — abrindo
 * a lista completa como se nada tivesse sido pedido. A falha era silenciosa:
 * a tela certa abria, só sem o recorte.
 *
 * sessionStorage e não localStorage: isto é estado de uma sessão de análise.
 * Deve morrer quando a aba fecha, não voltar semanas depois.
 *
 * Mudar o comportamento do shell resolveria na raiz, mas afeta TODOS os painéis
 * e é decisão do dono — está reportado em docs/BLING/README.md.
 */
export function lerFiltrosSalvos(): Filtros {
  try {
    const cru = sessionStorage.getItem(CHAVE_FILTROS);
    if (!cru) return FILTROS_INICIAIS;
    const p = JSON.parse(cru);
    if (!p || typeof p !== 'object') return FILTROS_INICIAIS;
    // Mescla com o padrão: uma chave nova no código não pode ficar undefined
    // por causa de um valor salvo de uma versão anterior.
    return { ...FILTROS_INICIAIS, ...p };
  } catch {
    return FILTROS_INICIAIS;
  }
}

export function salvarFiltros(f: Filtros): void {
  try { sessionStorage.setItem(CHAVE_FILTROS, JSON.stringify(f)); } catch { /* cota: não é fatal */ }
}

/** Filtros que atravessam a remontagem do painel. */
export function useFiltros(): [Filtros, (p: Partial<Filtros>) => void, () => void] {
  const [filtros, setFiltros] = React.useState<Filtros>(lerFiltrosSalvos);

  const mudar = React.useCallback((p: Partial<Filtros>) => {
    setFiltros(f => {
      const novo = { ...f, ...p };
      salvarFiltros(novo);
      return novo;
    });
  }, []);

  const limpar = React.useCallback(() => {
    setFiltros(FILTROS_INICIAIS);
    salvarFiltros(FILTROS_INICIAIS);
  }, []);

  return [filtros, mudar, limpar];
}

/* ── Hook de carga ─────────────────────────────────────────── */

export interface EstadoCarga<T> {
  dados: T | null;
  meta: Resposta<T>['meta'] | null;
  carregando: boolean;
  erro: ErroApi | null;
  recarregar: () => void;
}

/**
 * Carrega dados com cancelamento e preservação do último valor válido (§59:
 * "preservação do último dado válido"). Trocar de filtro não pisca a tela em
 * branco — o dado anterior continua visível enquanto o novo não chega.
 */
export function useCarga<T>(
  buscar: (sinal: AbortSignal) => Promise<Resposta<T>>,
  deps: unknown[],
): EstadoCarga<T> {
  const [dados, setDados] = React.useState<T | null>(null);
  const [meta, setMeta] = React.useState<Resposta<T>['meta'] | null>(null);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<ErroApi | null>(null);
  const [gatilho, setGatilho] = React.useState(0);

  const refBuscar = React.useRef(buscar);
  refBuscar.current = buscar;

  React.useEffect(() => {
    const ctrl = new AbortController();
    let vivo = true;
    setCarregando(true);

    refBuscar.current(ctrl.signal)
      .then(r => {
        if (!vivo) return;
        setDados(r.dados);
        setMeta(r.meta);
        setErro(null);
      })
      .catch((e: unknown) => {
        if (!vivo || ctrl.signal.aborted) return;
        setErro(e instanceof ErroApi ? e : new ErroApi(
          'FALHA_DESCONHECIDA', 0, null, null, String((e as Error)?.message ?? e),
        ));
      })
      .finally(() => { if (vivo) setCarregando(false); });

    return () => { vivo = false; ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, gatilho]);

  return { dados, meta, carregando, erro, recarregar: () => setGatilho(g => g + 1) };
}

/** Debounce para a caixa de busca — evita uma requisição por tecla. */
export function useDebounce<T>(valor: T, ms = 320): T {
  const [v, setV] = React.useState(valor);
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(valor), ms);
    return () => window.clearTimeout(t);
  }, [valor, ms]);
  return v;
}
