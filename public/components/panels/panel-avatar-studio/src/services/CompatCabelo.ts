// services/CompatCabelo.ts — onda 1413 (MEGA_BRIEFING_01 §897; decisão
// #159): FACHADA de compatibilidade cabelo × headwear para UI/testes/QA.
// A lógica pura vive no motor (engine/compat-cabelo.ts — o render usa o
// recorte diretamente); aqui só reexportamos com o nome do runbook.
// @version 1.0.0  @created 2026-08-21
export {
  resolverEstadoCabelo,
  profundidadeRecorte,
  PERFIL_HEADWEAR,
  PERFIL_CABELO_PX,
} from '../engine/compat-cabelo';
export type { EstadoCabelo } from '../engine/compat-cabelo';
