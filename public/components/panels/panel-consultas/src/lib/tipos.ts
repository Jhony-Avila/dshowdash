// lib/tipos.ts — formato da prévia cadastral (C2) = CONTRATO C1 v1.1 da VINHO (ACIMA_ESQUERDA):
// /srv/dshow-docs/consultas-cadastrais/CONTRATO-C1-PREVIA-CADASTRAL.md · API /api/cadastro/previa.php (P65).
// Regras de exibição: desconhecido = null e aparece como "—" (nunca 0); a tela não grava nada no CRM (sem botão de aplicar nesta fase).

/** Origem de um valor: Precifica, legado (coluna) ou JSON do legado confirmado, ou outra ficha ATIVA do CRM com o mesmo CNPJ. */
export type Origem = 'precifica' | 'legado' | 'legado_json' | 'crm_outra_ficha';

export type Classe =
  | 'sugestao'                     // há valor proposto (uma fonte ou mais concordando; grafias só em caixa/espaços)
  | 'fontes_divergem'              // conteúdos distintos → escolha humana (proposto = null)
  | 'identidade_duvidosa'          // identidade ambígua bloqueia a sugestão
  | 'nome_para_razao_revisar'      // razão == nome de exibição e as fontes trazem outra: NUNCA pré-selecionada (v1.1)
  | 'sem_valor_legado_presente'    // sem valor interno; o CNPJ está no legado (fica em branco, sem recompra)
  | 'sem_valor_legado_ausente'     // sem valor interno; o CNPJ não está no legado (consulta paga opcional, nunca disparada)
  | 'fonte_indisponivel';          // uma fonte falhou: falha nunca conta como ausência

export type EstadoFonte = 'ok' | 'parcial' | 'indisponivel';
export interface Fontes {
  pipedrive: { estado: EstadoFonte; ultimo_sync: string | null };
  precifica: { estado: EstadoFonte; lido_em: string | null };
  legado: { estado: EstadoFonte; lido_em: string | null };
}

/** Resumo por fila ("ganhos", "sem_cnpj_id_precifica", depois "sem_cnpj_geral"): as chaves variam por fila; ausente = desconhecido. */
export interface ResumoFila { cnpjs_elegiveis?: number; cnpjs_no_lote?: number; fichas?: number; campos_vazios?: number; [k: string]: unknown }

export interface Lote {
  id: string; regras_versao: string; gerado_em: string; completa: boolean; fontes: Fontes;
  filas: Record<string, ResumoFila>;
  totais: { destinos: number; sugestoes: number; divergencias: number; revisar_nome_razao?: number; sem_valor: number };
  custo_opcional: { cnpjs_distintos: number; unitario: string; total: string; nota?: string };
}

export interface Doadora { tipo: string; id: string; consultado_em?: string | null }
export interface Grafia { valor: string; origem: Origem; doadora: Doadora }
export interface Decisao { decisao: 'aprovar' | 'adiar'; grafia: string | null; origem: string | null; operador: number; em: string; expirada: boolean }

export interface Linha {
  id: string; lote?: string; fila: string;
  org_id: number; empresa: string; cnpj: string; cnpj_compartilhado_com: number[];
  ultimo_ganho: string | null; campo: string; campo_rotulo: string;
  valor_anterior: string | null; classificacao: Classe;
  proposto: { valor: string; origem: Origem } | null;
  grafias: Grafia[]; precisa_escolha: boolean; pre_selecionada?: boolean;
  evidencia_versao: string; decisao: Decisao | null;
}

export interface PaginaLinhas { lote: string; total: number; pagina: number; por_pagina: number; itens: Linha[] }
export interface Previa { lote: Lote; linhas: Linha[] }

export const ROTULO_ORIGEM: Record<Origem, string> = { precifica: 'Precifica', legado: 'Legado', legado_json: 'Legado (JSON confirmado)', crm_outra_ficha: 'Outra ficha do CRM' };
export const ROTULO_DOADORA: Record<string, string> = {
  precifica: 'Organização ativa do Precifica', precifica_cliente: 'Cliente do Precifica', legado: 'Registro do legado (Consultar.IO)',
  legado_json: 'JSON do legado (CNPJ confirmado)', crm: 'Outra ficha ativa do CRM',
};
export const ROTULO_CLASSE: Record<Classe, string> = {
  sugestao: 'Com sugestão', fontes_divergem: 'Fontes divergem', identidade_duvidosa: 'Identidade duvidosa',
  nome_para_razao_revisar: 'Razão igual ao nome: revisar', sem_valor_legado_presente: 'Sem valor (CNPJ no legado)',
  sem_valor_legado_ausente: 'Sem valor (CNPJ fora do legado)', fonte_indisponivel: 'Fonte indisponível',
};
export const ROTULO_FONTE: Record<keyof Fontes, string> = { pipedrive: 'Pipedrive', precifica: 'Precifica', legado: 'Legado (Consultar.IO)' };
