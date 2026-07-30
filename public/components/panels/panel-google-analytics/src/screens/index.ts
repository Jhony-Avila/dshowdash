// screens/index.ts — mapa TelaId → componente.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ Este mapa e o `GRUPOS` de `shell/types.ts` têm de andar juntos: uma tela marcada
// `disponivel: true` lá sem entrada aqui vira item de menu que abre o estado vazio genérico.
// O smoke test (`scripts/ga-smoke-all.sh`) confere exatamente essa correspondência.
import type { ComponentType } from 'react';
import type { PropsTela } from '../app/App';
import type { TelaId } from '../shell/types';

import VisaoGeral from './VisaoGeral';
import TempoReal from './TempoReal';
import Jornada from './Jornada';
import { AquisicaoGeral, Canais, Campanhas } from './Aquisicao';
import { Paginas, LandingPages } from './Comportamento';
import { Eventos, Conversoes, Funis } from './Conversoes';
import { Ecommerce, Produtos } from './Ecommerce';
import { Usuarios, Dispositivos, Localizacoes, Retencao } from './Usuarios';
import { Qualidade, Tagging } from './Qualidade';
import { Alertas, Propriedades, Quotas } from './Admin';
import { Insights, Diretoria } from './Inteligencia';
import { OrigemMidia, Referencias, Engajamento, Saidas, Leads, Streams } from './Complementares';

export const Telas: Partial<Record<TelaId, ComponentType<PropsTela>>> = {
  'visao-geral': VisaoGeral,
  'tempo-real': TempoReal,
  diretoria: Diretoria,
  aquisicao: AquisicaoGeral,
  canais: Canais,
  campanhas: Campanhas,
  'origem-midia': OrigemMidia,
  referencias: Referencias,
  jornada: Jornada,
  paginas: Paginas,
  'landing-pages': LandingPages,
  engajamento: Engajamento,
  saidas: Saidas,
  eventos: Eventos,
  conversoes: Conversoes,
  funis: Funis,
  leads: Leads,
  ecommerce: Ecommerce,
  produtos: Produtos,
  usuarios: Usuarios,
  dispositivos: Dispositivos,
  localizacoes: Localizacoes,
  retencao: Retencao,
  qualidade: Qualidade,
  tagging: Tagging,
  streams: Streams,
  alertas: Alertas,
  insights: Insights,
  propriedades: Propriedades,
  quotas: Quotas,
};
