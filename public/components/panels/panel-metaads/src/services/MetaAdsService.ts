// services/MetaAdsService.ts — contrato da camada de dados (briefing §41).
// @version 1.0.0  @created 2026-07-28
//
// As telas consomem SOMENTE esta interface; o ApiMetaAdsService futuro
// implementa o mesmo contrato sem tocar em nenhuma tela.

import type {
  Alerta, Anuncio, Campanha, CenarioId, Conjunto, Conta, Criativo,
  FiltrosGlobais, Lead, Overview, PixelInfo, Posicionamento, Publico,
  ResumoOrcamento, SyncJob,
} from '../domain/types';

export interface MetaAdsService {
  readonly origem: 'mock' | 'api';

  getContas(): Promise<Conta[]>;
  getOverview(f: FiltrosGlobais): Promise<Overview>;
  getCampanhas(f: FiltrosGlobais): Promise<Campanha[]>;
  getConjuntos(f: FiltrosGlobais, campanhaId?: string): Promise<Conjunto[]>;
  getAnuncios(f: FiltrosGlobais, conjuntoId?: string): Promise<Anuncio[]>;
  getCriativos(f: FiltrosGlobais): Promise<Criativo[]>;
  getPublicos(f: FiltrosGlobais): Promise<Publico[]>;
  getPosicionamentos(f: FiltrosGlobais): Promise<Posicionamento[]>;
  getLeads(f: FiltrosGlobais): Promise<Lead[]>;
  getPixel(f: FiltrosGlobais): Promise<PixelInfo>;
  getResumoOrcamento(f: FiltrosGlobais): Promise<ResumoOrcamento>;
  getAlertas(f: FiltrosGlobais): Promise<Alerta[]>;
  getSyncJobs(): Promise<SyncJob[]>;
}

import { MockMetaAdsService } from './mock/MockMetaAdsService';

let _instancia: MetaAdsService | null = null;
let _cenario: CenarioId = 'saudavel';

export function getCenario(): CenarioId {
  return _cenario;
}

export function setCenario(cenario: CenarioId): void {
  _cenario = cenario;
  _instancia = null;
}

export function getService(): MetaAdsService {
  if (!_instancia) {
    _instancia = new MockMetaAdsService(_cenario);
  }
  return _instancia;
}
