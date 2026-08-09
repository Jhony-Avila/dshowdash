// workspace/contexto.ts — WORKSPACE CONTEXT ENGINE (AS6 §323–§325,
// lote 951–960, decisão #97, flag as6.contexto).
// @version 1.0.0  @created 2026-08-09
//
// "Uma ação prepara todo o ambiente" (§325): trocar de categoria é UMA
// mudança de contexto coordenada, não seis ajustes manuais. O engine é
// uma camada DECLARATIVA (§324): cada categoria descreve seu contexto
// (grupo default do Inspector, dica anunciada) e um único evento
// sincroniza os módulos que reagem — a grade limpa a busca antiga, o
// Inspector abre o grupo relevante, o aria-live anuncia. O que JÁ era
// contextual por construção (câmera R2/§52, dock por categoria,
// filtros §68.3, Color Studio por slots ativos) continua nos módulos
// de origem — o engine não duplica, coordena.
// Quem DISPARA o evento é o shell, e só com a flag ligada (§651):
// listeners registrados são inertes com a flag off.
import type { CategoriaId } from '../domain/types';
import type { GrupoInspectorId } from './inspectorSchema';

export const EVENTO_CONTEXTO = 'avst6:contexto';

export interface ContextoCategoria {
  /** grupo do Inspector que faz sentido chegar aberto (§323) */
  grupoInspector: GrupoInspectorId;
  /** anúncio curto no aria-live do shell (previsibilidade §322) */
  dica: string;
}

export const CONTEXTOS: Record<CategoriaId, ContextoCategoria> = {
  base: { grupoInspector: 'identidade', dica: 'Contexto: Rosto — câmera no rosto, catálogo de bases.' },
  cabelo: { grupoInspector: 'cores', dica: 'Contexto: Cabelo — câmera aproximada, cores de cabelo à mão.' },
  olhos: { grupoInspector: 'propriedades', dica: 'Contexto: Olhos — câmera nos olhos, propriedades da camada.' },
  boca: { grupoInspector: 'propriedades', dica: 'Contexto: Boca — câmera na boca, propriedades da camada.' },
  roupa: { grupoInspector: 'cores', dica: 'Contexto: Roupa — cores e canais da peça em primeiro.' },
  roupa_sobre: { grupoInspector: 'compatibilidade', dica: 'Contexto: Sobrepeça — compatibilidade com o conjunto.' },
  acessorio: { grupoInspector: 'compatibilidade', dica: 'Contexto: Acessórios — slots e conflitos visíveis.' },
  fundo: { grupoInspector: 'identidade', dica: 'Contexto: Fundo — cenário do avatar.' },
  moldura: { grupoInspector: 'propriedades', dica: 'Contexto: Moldura — propriedades da moldura.' },
  efeito: { grupoInspector: 'propriedades', dica: 'Contexto: Efeito — intensidade e propriedades.' },
  aura: { grupoInspector: 'propriedades', dica: 'Contexto: Aura — presets e propriedades.' },
  banner: { grupoInspector: 'identidade', dica: 'Contexto: Banner — plano de fundo do perfil.' },
  emblema: { grupoInspector: 'propriedades', dica: 'Contexto: Emblema — propriedades do emblema.' },
};

/** Dispara a mudança de contexto coordenada (§324) + anúncio aria-live. */
export function aplicarContexto(categoria: CategoriaId): void {
  const ctx = CONTEXTOS[categoria];
  window.dispatchEvent(new CustomEvent(EVENTO_CONTEXTO, { detail: { categoria, grupoInspector: ctx.grupoInspector } }));
  window.dispatchEvent(new CustomEvent('avst5:anuncio', { detail: ctx.dica }));
}
