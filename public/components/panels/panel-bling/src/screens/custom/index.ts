// panel-bling/src/screens/custom/index.ts — registro das telas customizadas
// @version 1.0.0  @created 2026-07-30
//
// A chave é o campo `custom` do TelaSpec. Se uma tela declarar um custom que não
// exista aqui, o App cai numa tela de erro explícita em vez de renderizar vazio —
// e o smoke test do catálogo pega isso antes de chegar ao navegador.

import React from 'react';
import { VisaoGeral, CentralOperacional, Diretoria, Indicadores } from './Visao';
import { Precos, Estoque, Depositos } from './Produtos';
import { NotasFiscais, FluxoCaixa } from './FiscalFinanceiro';
import { Rentabilidade, CurvaAbc, Previsoes, Anomalias, Relatorios } from './Inteligencia';
import { Transportadoras } from './Logistica';
import { Integracoes, Sincronizacao, Configuracoes } from './Admin';

export const TELAS_CUSTOM: Record<string, React.ComponentType<any>> = {
  VisaoGeral, CentralOperacional, Diretoria, Indicadores,
  Precos, Estoque, Depositos,
  NotasFiscais, FluxoCaixa, Transportadoras,
  Rentabilidade, CurvaAbc, Previsoes, Anomalias, Relatorios,
  Integracoes, Sincronizacao, Configuracoes,
};
