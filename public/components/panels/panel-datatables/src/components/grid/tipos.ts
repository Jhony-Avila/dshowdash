// components/grid/tipos.ts — contrato do DataGrid do design system.
// @version 1.0.0  @created 2026-07-20
//
// API INTERNA PADRONIZADA (exigência do dono): Bancos, Tabelas, Qualidade,
// Alertas e Conexões usam ESTE grid. Nenhuma tela implementa o seu.
import type { ReactNode } from 'react';

export type Alinhamento = 'inicio' | 'fim' | 'centro';

export interface ColunaDef<T> {
  id: string;
  cabecalho: string;
  /** Ícone Lucide exibido antes do rótulo no cabeçalho (Elevação visual §3). */
  icone?: string;
  /** Largura CSS: '120px' | 'minmax(160px,1.4fr)'. */
  largura?: string;
  alinhamento?: Alinhamento;
  /** Ausente = coluna não ordenável. */
  ordenavel?: boolean;
  /** Fixa à esquerda/direita ao rolar. */
  fixa?: 'inicio' | 'fim';
  /** Não pode ser ocultada pelo usuário. */
  obrigatoria?: boolean;
  /** Oculta por padrão (usuário liga no seletor de colunas). */
  ocultaPorPadrao?: boolean;
  /** Renderização da célula. */
  celula: (linha: T) => ReactNode;
  /** Valor bruto — usado por filtro e exportação futura. */
  valor?: (linha: T) => string | number | null;
  /** Dica no cabeçalho. */
  dica?: string;
}

/** Item do menu de contexto (⋮) por linha (Elevação visual §3). */
export interface ItemMenuLinha<T> {
  rotulo: string;
  icone?: string;
  aoClicar: (linha: T) => void;
  perigo?: boolean;
}

export interface OrdenacaoEstado { coluna: string; direcao: 'asc' | 'desc' }

export type Densidade = 'compacta' | 'normal' | 'confortavel';

export interface DataGridProps<T> {
  colunas: ColunaDef<T>[];
  linhas: T[];
  idLinha: (linha: T) => string | number;

  /** Chave de persistência das preferências (colunas, densidade, ordenação). */
  chaveEstado?: string;

  /** Paginação NO SERVIDOR: o grid só reporta a intenção. */
  paginacao?: {
    pagina: number; porPagina: number; total: number;
    aoMudarPagina: (p: number) => void;
    aoMudarPorPagina: (n: number) => void;
  };

  ordenacao?: OrdenacaoEstado | null;
  aoOrdenar?: (o: OrdenacaoEstado) => void;

  /** Expansão de linha — genérica: campos, índices, problemas, métricas… */
  expansao?: (linha: T) => ReactNode;

  /** Ações do menu de contexto (Radix seria o passo seguinte). */
  acoes?: (linha: T) => ReactNode;

  aoClicarLinha?: (linha: T) => void;

  /** Virtualização: liga automaticamente acima deste número de linhas. */
  limiteVirtualizacao?: number;

  carregando?: boolean;
  erro?: { mensagem: string; codigo?: string; aoTentar?: () => void } | null;
  vazio?: { titulo: string; descricao: string; acao?: ReactNode };

  densidadeInicial?: Densidade;
  /** Barra superior: filtros, busca, presets. */
  ferramentas?: ReactNode;
  /** Menu de contexto (⋮) padronizado por linha. */
  menuLinha?: (linha: T) => ItemMenuLinha<T>[];
  /** Botão Atualizar na barra do grid. */
  aoAtualizar?: () => void;
  /** Habilita o botão Exportar (por ora sempre desabilitado — §5). */
  exportavel?: boolean;
  rotulo: string;
}
