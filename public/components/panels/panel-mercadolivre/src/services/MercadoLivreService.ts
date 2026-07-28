// services/MercadoLivreService.ts — contrato da camada de dados (briefing §36.3).
// @version 1.0.0  @created 2026-07-28
//
// As telas consomem SOMENTE esta interface. Hoje o factory devolve o
// MockMercadoLivreService; quando a integração real existir, basta o
// ApiMercadoLivreService implementar o mesmo contrato — nenhuma tela muda.

import type {
  Alerta, Anuncio, CenarioId, Conta, Envio, FiltrosGlobais,
  LancamentoFinanceiro, Ocorrencia, Overview, Pedido, PedidoDetalhe,
  Pergunta, Produto, RentabilidadeItem, ReputacaoSnapshot, ResumoFinanceiro,
  SyncJob,
} from '../domain/types';

export interface MercadoLivreService {
  /** Identifica a origem dos dados (exibido no selo do módulo). */
  readonly origem: 'mock' | 'api';

  getContas(): Promise<Conta[]>;
  getOverview(f: FiltrosGlobais): Promise<Overview>;
  getPedidos(f: FiltrosGlobais): Promise<Pedido[]>;
  getPedido(id: string): Promise<PedidoDetalhe | null>;
  getAnuncios(f: FiltrosGlobais): Promise<Anuncio[]>;
  getProdutos(f: FiltrosGlobais): Promise<Produto[]>;
  getPerguntas(f: FiltrosGlobais): Promise<Pergunta[]>;
  getOcorrencias(f: FiltrosGlobais): Promise<Ocorrencia[]>;
  getEnvios(f: FiltrosGlobais): Promise<Envio[]>;
  getResumoFinanceiro(f: FiltrosGlobais): Promise<ResumoFinanceiro>;
  getLancamentos(f: FiltrosGlobais): Promise<LancamentoFinanceiro[]>;
  getRentabilidade(f: FiltrosGlobais): Promise<RentabilidadeItem[]>;
  getReputacao(f: FiltrosGlobais): Promise<ReputacaoSnapshot>;
  getAlertas(f: FiltrosGlobais): Promise<Alerta[]>;
  getSyncJobs(): Promise<SyncJob[]>;
}

// ── Factory + cenário (o seletor de cenário é recurso da fase mock) ─

import { MockMercadoLivreService } from './mock/MockMercadoLivreService';

let _instancia: MercadoLivreService | null = null;
let _cenario: CenarioId = 'saudavel';

export function getCenario(): CenarioId {
  return _cenario;
}

/** Troca o cenário de demonstração e recria o serviço (dados novos). */
export function setCenario(cenario: CenarioId): void {
  _cenario = cenario;
  _instancia = null;
}

export function getService(): MercadoLivreService {
  if (!_instancia) {
    // Futuro: if (config.apiDisponivel) _instancia = new ApiMercadoLivreService()
    _instancia = new MockMercadoLivreService(_cenario);
  }
  return _instancia;
}
