// panel-atributos/src/lib/tipos.ts — contrato das rotas de /api/atributos (ProdutosLeitura, KitsService, AtributosService).

export type Importancia = 'obrigatorio' | 'importante' | 'basico' | 'complementar' | 'opcional' | 'sem_importancia';
export type Estado = 'informado' | 'nao_se_aplica' | 'desconhecido';
export type TipoAtributo = 'texto' | 'numero' | 'inteiro' | 'booleano' | 'opcao' | 'multiopcao' | 'data';
export interface Contagem { feitos: number; total: number }

export interface ProdutoResumo {
  id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean;
  fotos: number; capa_id: number | null; capa_cor: string | null; precifica: string[];
  kits: { id: number; nome: string; motivos: string[] }[]; kits_especificos: number;
  essencial: Contagem; completo: Contagem; geral: Contagem; obrigatorios_vazios: number; fora_da_ficha: number; sugestoes: number;
  legado: { kit: string | null; kit_nome: string | null; atribuidos: number; com_valor: number } | null;
}
export interface Faceta { categoria: string; subcategoria: string | null; produtos: number; ativos: number }
export interface Vitrine { produtos: ProdutoResumo[]; facetas: Faceta[]; kits: { id: number; nome: string }[]; pode_vincular: boolean }

export interface VisaoGeral {
  cartoes: { ativos: number; com_kit: number; essencial_medio: number | null; sem_foto: number; pendencias: number; sugestoes: number; fora_da_ficha: number; obrigatorios_vazios: number; sem_kit: number };
  cobertura: { categoria: string; subcategoria: string | null; ativos: number; com_kit: number; essencial_medio: number | null }[];
  obrigatorios_mais_vazios: { atributo_id: number; rotulo: string; produtos: number }[];
}

export interface Unidade { id: number; simbolo: string; nome: string; grandeza: string | null; fator_base: string | null; ativo: number | boolean; padrao?: boolean; atributos?: number; valores?: number }
export interface Opcao { id: number; rotulo: string; posicao: number; ativo: boolean }
export interface Sugestao { id: number; fonte: 'legado_2025' | 'nome_produto' | 'precifica'; tipo: 'valor' | 'conferencia'; valor_proposto: string | null; opcao_id: number | null; unidade_id: number | null; confianca: string; evidencia: string | null; atributo_alternativo_id: number | null; versao: number }
export interface Valor {
  estado: Estado; texto: string | null; numero: string | null; booleano: boolean | null; data: string | null; opcao_ids: number[]; opcoes: string[];
  unidade_id: number | null; origem: 'importado' | 'manual'; lote_id: number | null; atualizado_em: string; atualizado_por: string | null; versao: number; legado_bruto: string | null;
}
export interface Origem { tipo: 'kit' | 'avulso'; grupo_id?: number; grupo_nome?: string; motivos?: { tipo: 'escopo' | 'todos' | 'direto'; categoria?: string; subcategoria?: string }[] }
export interface ItemFicha {
  atributo_id: number; codigo: string | null; rotulo: string; tipo: TipoAtributo; descricao: string | null; casas: number | null; minimo: string | null; maximo: string | null;
  aceita_nao_se_aplica: boolean; autoridade: string; atributo_ativo: boolean; grupo_atributos: string | null;
  kit_id: number | null; kit: string | null; posicao: number | null; obrigatorio: boolean; visivel_app: boolean; destaque: boolean; importancia: Importancia | null;
  origens: Origem[]; unidade_efetiva: { id: number; simbolo: string } | null; unidade_produto_id: number | null; unidades: Unidade[]; opcoes: Opcao[];
  valor: Valor | null; precifica: { chave: string; valor: unknown } | null; sugestoes: Sugestao[];
  legado: { kit_origem: string | null; tp_unit: string | null; valor: string | null; atualizado_legado: string | null } | null;
}
export interface Foto { id: number; capa: boolean; posicao: number; cor: string | null; largura: number; altura: number; miniatura: boolean }
export interface Ficha {
  produto: { id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean };
  fotos: Foto[]; kits: { id: number; nome: string; motivos: { tipo: string; categoria?: string; subcategoria?: string }[] }[];
  itens: ItemFicha[]; fora_da_ficha: ItemFicha[]; legado_nao_vinculado: ItemFicha[]; excecoes: { atributo_id: number; rotulo: string; motivo: string | null; kits: number[] }[];
  completude: { essencial: Contagem; completo: Contagem; geral: Contagem; obrigatorios_vazios: number[] };
  legado: { item: number; kit: string | null; kit_nome: string | null; atribuidos: number } | null;
  precifica: { familias: string[]; ficha: Record<string, Record<string, unknown>>; disponivel: boolean };
  pode_editar: boolean; pode_vincular: boolean;
}
export interface EventoHistorico { id: number; quando: string; quem: string; acao: string; entidade: string; atributo: string | null; atributo_id: number | null; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null; motivo: string | null }

export interface KitResumo { id: number; nome: string; descricao: string | null; ativo: boolean; aplica_a_todos: boolean; ordem: number; versao: number; itens: number; escopos: { categoria: string; subcategoria: string; produtos: number }[]; diretos: number; alcance: number }
export interface ItemKit { atributo_id: number; rotulo: string; codigo: string; tipo: TipoAtributo; atributo_ativo: number; posicao: number; obrigatorio: number; visivel: number; destaque: number; importancia: Importancia | null; unidade_id: number | null; unidade: string | null; unidade_padrao: string | null; unidade_padrao_id: number | null; importancia_padrao: Importancia | null; legado_id: string | null; versao: number }
export interface KitDetalhe {
  kit: { id: number; nome: string; descricao: string | null; ordem: number; aplica_a_todos: boolean; ativo: boolean; versao: number; escopos: { categoria: string; subcategoria: string; produtos: number }[]; atributos: ItemKit[] };
  produtos_diretos: { id: number; nome: string; subcategoria: string | null }[];
  alcance: { id: number; nome: string; subcategoria: string | null; ativo: boolean; motivos: string[] }[];
  subcategorias: { categoria: string; subcategoria: string; ativos: number }[]; unidades: Unidade[]; pode_editar: boolean;
}
export interface AtributoDicionario {
  id: number; legado_id: number | null; codigo: string; rotulo: string; tipo: TipoAtributo; unidade_id: number | null; unidade: string | null; casas: number | null; minimo: string | null; maximo: string | null;
  descricao: string | null; ativo: number; versao: number; autoridade: string; aceita_nao_se_aplica: number; importancia_padrao: Importancia | null; importancia_legado: string | null;
  grupo_atributos: string | null; em_kits: number; produtos_com_valor: number; unidades_extras: number[];
}
export interface ItemConferencia { id: number; product_id: number; produto: string; atributo_id: number; atributo: string | null; tipo_atributo: TipoAtributo | null; atributo_alternativo_id: number | null; atributo_alternativo: string | null; fonte: string; tipo: string; valor_proposto: string | null; unidade_id: number | null; unidade: string | null; confianca: string; evidencia: string | null; versao: number; ja_tem_valor: boolean; alternativo_ja_tem_valor: boolean }
export interface Conferencia {
  filas: { legado: ItemConferencia[]; nome: ItemConferencia[]; fora_da_ficha: { product_id: number; produto: string; atributo_id: number; atributo: string; estado: string }[];
    obrigatorios_vazios: { product_id: number; produto: string; atributo_id: number; atributo: string }[]; sem_kit: { product_id: number; produto: string; subcategoria: string | null; legado: string | null }[] };
  totais: { obrigatorios_vazios: number }; pode_decidir: boolean; pode_vincular: boolean;
}
export interface Previa { resumo: { produtos: number; produtos_afetados: number; atributos_acrescentados: number; atributos_removidos: number; ja_tinham: number; kits_ja_aplicados: number }; produtos: { product_id: number; nome: string; acrescenta: number; remove: number; antes: number; depois: number }[] }
