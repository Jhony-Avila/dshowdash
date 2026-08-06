// services/EfeitosFuncionais.ts — CATEGORIAS FUNCIONAIS de efeito
// (megas 351–353 · §157.1–.5, lote 351–360, flag as5.efeitos_v2).
// @version 1.0.0  @created 2026-08-06
//
// Classificação DETERMINÍSTICA dos efe_* nas 5 categorias do briefing:
// override por id + fallback por tema — item novo nunca fica órfão.
import { itemPorId } from './AvatarCatalog';

export type CategoriaFuncional = 'ambiental' | 'distorcao' | 'celebracao' | 'transicao' | 'presenca';

export const ROTULO_FUNCIONAL: Record<CategoriaFuncional, string> = {
  ambiental: 'Ambiental',      // §157.1
  distorcao: 'Distorção',      // §157.2
  celebracao: 'Celebração',    // §157.3
  transicao: 'Transição',      // §157.4
  presenca: 'Presença',        // §157.5
};

const POR_ID: Record<string, CategoriaFuncional> = {
  efe_chuva: 'ambiental', efe_neve: 'ambiental', efe_nevoa: 'ambiental',
  efe_poeira: 'ambiental', efe_folhas: 'ambiental', efe_vagalumes: 'ambiental',
  efe_veu_aurora: 'ambiental', efe_sakura: 'ambiental', efe_tempestade: 'ambiental',
  efe_borboletas: 'ambiental', efe_bolhas: 'ambiental',
  efe_glitch: 'distorcao', efe_scanlines: 'distorcao', efe_holo_interf: 'distorcao',
  efe_descarga: 'distorcao',
  efe_confete: 'celebracao', efe_moedas: 'celebracao', efe_faiscas: 'celebracao',
  efe_fogo: 'celebracao',
  efe_portal: 'transicao',
  efe_aura: 'presenca', efe_raio: 'presenca', efe_metricas: 'presenca',
  efe_particulas: 'presenca',
};

const POR_TEMA: Record<string, CategoriaFuncional> = {
  clima: 'ambiental', natureza: 'ambiental',
  cyberpunk: 'distorcao', 'retrô': 'distorcao', tecnologia: 'distorcao',
  conquista: 'celebracao', executivo: 'celebracao', casual: 'celebracao',
  'sci-fi': 'transicao',
  fantasia: 'presenca', dshow: 'presenca',
};

export function categoriaFuncional(id: string): CategoriaFuncional {
  const porId = POR_ID[id];
  if (porId) return porId;
  return POR_TEMA[itemPorId(id)?.tema ?? ''] ?? 'presenca';
}
