// panel-atributos/src/app/contexto.tsx — estado de navegação do módulo (aba, produto aberto, seleção para Vincular/Preencher) e avisos.
import React from 'react';

export type Aba = 'visao' | 'produtos' | 'vincular' | 'preencher' | 'kits' | 'atributos' | 'unidades' | 'conferencia';
export const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'visao', rotulo: 'Visão geral' }, { id: 'produtos', rotulo: 'Produtos' }, { id: 'vincular', rotulo: 'Vincular' }, { id: 'preencher', rotulo: 'Preencher' },
  { id: 'kits', rotulo: 'Kits' }, { id: 'atributos', rotulo: 'Atributos' }, { id: 'unidades', rotulo: 'Unidades' }, { id: 'conferencia', rotulo: 'Conferência' },
];

export interface FiltroProdutos { busca?: string; subcategoria?: string; kit?: string; semFoto?: boolean; semKit?: boolean; obrigatoriosVazios?: boolean; foraDaFicha?: boolean; comPrecifica?: boolean;
  /** Visão geral (DIREITA §25): */ categoria?: string; semSubcategoria?: boolean; essencialIncompleto?: boolean; ordem?: 'preenchimento' | 'nome' | 'id' }
export interface Navegar {
  aba: Aba; produto: number | null; kit: number | null;
  ir: (aba: Aba, opc?: { produto?: number | null; kit?: number | null; filtro?: FiltroProdutos; selecao?: number[]; preencher?: { kit?: number; subcategoria?: string }; intencao?: 'kit' | 'atributo' }) => void;
  /** UX-1: ação escolhida na seleção de Produtos ('kit' | 'atributo'), para o Vincular abrir o controle certo (Vincular é da ESQUERDA) */ intencaoVincular: 'kit' | 'atributo' | null;
  /** UX-1: { atributo } abre a ficha já nesse atributo (Conferência). Sem ele, como antes. */
  abrirProduto: (id: number, opc?: { atributo?: number }) => void; fecharProduto: () => void;
  /** UX-1: atributo pedido ao abrir a ficha (consumido pela Ficha) */ atributoFoco: number | null; limparAtributoFoco: () => void;
  filtroInicial: FiltroProdutos; selecao: number[]; setSelecao: (ids: number[]) => void;
  preencher: { kit?: number; subcategoria?: string }; aviso: (texto: string, tom?: 'sucesso' | 'erro' | 'info') => void;
  versao: number; recarregar: () => void;
  /** UX-1b: onde a <FaixaFixa> desenha (área fixa do módulo) e quem rola o conteúdo (.at-conteudo, ou .at-raiz quando tudo rola junto). */
  faixaFixa: HTMLElement | null; rolador: HTMLElement | null; tudoRola: boolean;
  /** "foi salvo ou não" (item 4): anuncia na região role="status" (aria-live polite), sem mover o foco. Ex.: "Produto 550, Comprimento salvo". */
  anunciar: (texto: string) => void;
}
export const Contexto = React.createContext<Navegar | null>(null);
export function useModulo(): Navegar { const c = React.useContext(Contexto); if (!c) throw new Error('fora do módulo'); return c; }
