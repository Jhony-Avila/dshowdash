// panel-atributos/src/app/contexto.tsx — estado de navegação do módulo (aba, produto aberto, seleção para Vincular/Preencher) e avisos.
import React from 'react';

export type Aba = 'visao' | 'produtos' | 'vincular' | 'preencher' | 'kits' | 'atributos' | 'unidades' | 'conferencia';
export const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'visao', rotulo: 'Visão geral' }, { id: 'produtos', rotulo: 'Produtos' }, { id: 'vincular', rotulo: 'Vincular' }, { id: 'preencher', rotulo: 'Preencher' },
  { id: 'kits', rotulo: 'Kits' }, { id: 'atributos', rotulo: 'Atributos' }, { id: 'unidades', rotulo: 'Unidades' }, { id: 'conferencia', rotulo: 'Conferência' },
];

export interface FiltroProdutos { busca?: string; subcategoria?: string; kit?: string; semFoto?: boolean; semKit?: boolean; obrigatoriosVazios?: boolean; foraDaFicha?: boolean; comPrecifica?: boolean }
export interface Navegar {
  aba: Aba; produto: number | null; kit: number | null;
  ir: (aba: Aba, opc?: { produto?: number | null; kit?: number | null; filtro?: FiltroProdutos; selecao?: number[]; preencher?: { kit?: number; subcategoria?: string } }) => void;
  abrirProduto: (id: number) => void; fecharProduto: () => void;
  filtroInicial: FiltroProdutos; selecao: number[]; setSelecao: (ids: number[]) => void;
  preencher: { kit?: number; subcategoria?: string }; aviso: (texto: string, tom?: 'sucesso' | 'erro' | 'info') => void;
  versao: number; recarregar: () => void;
}
export const Contexto = React.createContext<Navegar | null>(null);
export function useModulo(): Navegar { const c = React.useContext(Contexto); if (!c) throw new Error('fora do módulo'); return c; }
