// panel-atributos/src/lib/tipos.ts — contrato das rotas GET vitrine e GET ficha_produto (api/atributos/ProdutosLeitura.php).

export interface KitResumo { codigo: string; nome: string; tamanho: number }

export interface ProdutoVitrine {
  id: number;
  nome: string;
  categoria: string;
  subcategoria: string | null;
  ativo: boolean;
  fotos: number;
  capa_id: number | null;
  capa_cor: string | null;
  precifica: string[];
  preenchidos: number;
  universo: number;
  legado: { kit: string | null; kit_nome: string | null; atribuidos: number; com_valor: number } | null;
  modelo: number;
}

export interface Faceta { categoria: string; subcategoria: string | null; produtos: number; ativos: number }

export interface Vitrine { produtos: ProdutoVitrine[]; facetas: Faceta[]; kits: KitResumo[] }

export interface Foto { id: number; capa: boolean; posicao: number; cor: string | null; largura: number; altura: number }

export interface ValorPreenchido {
  estado: 'informado' | 'nao_se_aplica' | 'desconhecido';
  texto: string | null;
  numero: string | null;
  booleano: boolean | null;
  data: string | null;
  opcoes: string[];
  casas: number | null;
  origem: 'importado' | 'manual';
  criado_em: string;
  atualizado_em: string;
  lote_id: number | null;
  versao: number;
  legado_bruto: string | null;
}

export interface ItemAtributo {
  atributo_id: number;
  codigo: string | null;
  rotulo: string;
  tipo: string | null;
  unidade: string | null;
  atributo_ativo: boolean;
  importancia: string | null;
  no_modelo: boolean;
  grupo: string | null;
  obrigatorio: boolean;
  posicao: number | null;
  no_legado: boolean;
  kit_origem: string | null;
  legado: { tp_unit: string | null; atualizado_legado: string | null } | null;
  precifica: { chave: string; valor: unknown } | null;
  valor?: ValorPreenchido;
}

export type Camada = 'preenchidos' | 'legado_sem_valor' | 'modelo_vazio';

export interface FichaProduto {
  produto: { id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean; catalogo_sincronizado_em: string | null };
  fotos: Foto[];
  legado: { item: number; kit: string | null; kit_nome: string | null; atribuidos: number; com_valor: number } | null;
  precifica: { familias: string[]; ficha: Record<string, Record<string, unknown>>; disponivel: boolean };
  camadas: Record<Camada, ItemAtributo[]>;
  contagens: { preenchidos: number; legado_sem_valor: number; modelo_vazio: number; preenchidos_ativos: number; legado_sem_valor_ativos: number; modelo: number };
  completude: unknown;
}
