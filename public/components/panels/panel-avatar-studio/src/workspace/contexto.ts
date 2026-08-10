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
import { flag } from '../nucleo/flags';

export const EVENTO_CONTEXTO = 'avst6:contexto';

export interface ContextoCategoria {
  /** grupo do Inspector que faz sentido chegar aberto (§323) */
  grupoInspector: GrupoInspectorId;
  /** anúncio curto no aria-live do shell (previsibilidade §322) */
  dica: string;
  /** onda 1291 (decisão #134, as6.ctx_barra): título curto da barra */
  titulo: string;
  /** onda 1291 (#134): explicação orientada à AÇÃO — o que fazer e por
   *  que o enquadramento pode mudar (briefing UX 2026-08-10 §14) */
  texto: string;
}

export const CONTEXTOS: Record<CategoriaId, ContextoCategoria> = {
  // `dica` INALTERADA: é o caminho com a flag as6.ctx_barra OFF (§651)
  base: {
    grupoInspector: 'identidade', dica: 'Contexto: Rosto — câmera no rosto, catálogo de bases.',
    titulo: 'Rosto', texto: 'Escolha a base do personagem. A câmera aproxima do rosto para facilitar a comparação.',
  },
  cabelo: {
    grupoInspector: 'cores', dica: 'Contexto: Cabelo — câmera aproximada, cores de cabelo à mão.',
    titulo: 'Cabelo', texto: 'Escolha um estilo e ajuste as cores sem perder a visão do rosto.',
  },
  olhos: {
    grupoInspector: 'propriedades', dica: 'Contexto: Olhos — câmera nos olhos, propriedades da camada.',
    titulo: 'Olhos', texto: 'Compare formatos e estilos. O preview foi aproximado para facilitar a escolha.',
  },
  boca: {
    grupoInspector: 'propriedades', dica: 'Contexto: Boca — câmera na boca, propriedades da camada.',
    titulo: 'Boca', texto: 'Compare expressões de perto — a câmera acompanha a boca enquanto você escolhe.',
  },
  roupa: {
    grupoInspector: 'cores', dica: 'Contexto: Roupa — cores e canais da peça em primeiro.',
    titulo: 'Roupa', texto: 'Vista a peça e ajuste as cores dela — o corpo inteiro fica visível no preview.',
  },
  roupa_sobre: {
    grupoInspector: 'compatibilidade', dica: 'Contexto: Sobrepeça — compatibilidade com o conjunto.',
    titulo: 'Sobrepeça', texto: 'Adicione uma camada por cima da roupa e veja na hora como combina com o conjunto.',
  },
  acessorio: {
    grupoInspector: 'compatibilidade', dica: 'Contexto: Acessórios — slots e conflitos visíveis.',
    titulo: 'Acessórios', texto: 'Até 3 ao mesmo tempo (cabeça, rosto e pescoço) — conflitos de slot aparecem antes de equipar.',
  },
  fundo: {
    grupoInspector: 'identidade', dica: 'Contexto: Fundo — cenário do avatar.',
    titulo: 'Fundo', texto: 'Altere o cenário mantendo o avatar visível no centro.',
  },
  moldura: {
    grupoInspector: 'propriedades', dica: 'Contexto: Moldura — propriedades da moldura.',
    titulo: 'Moldura', texto: 'Compare molduras ao redor do avatar e visualize o resultado imediatamente.',
  },
  efeito: {
    grupoInspector: 'propriedades', dica: 'Contexto: Efeito — intensidade e propriedades.',
    titulo: 'Efeito', texto: 'Equipe um efeito e regule a intensidade — ative o poder no modo Studio para vê-lo em ação.',
  },
  aura: {
    grupoInspector: 'propriedades', dica: 'Contexto: Aura — presets e propriedades.',
    titulo: 'Aura', texto: 'Envolva o avatar com uma aura e ajuste os presets vendo o resultado ao vivo.',
  },
  banner: {
    grupoInspector: 'identidade', dica: 'Contexto: Banner — plano de fundo do perfil.',
    titulo: 'Banner', texto: 'Escolha o plano de fundo do seu perfil — ele aparece atrás do avatar nas vitrines.',
  },
  emblema: {
    grupoInspector: 'propriedades', dica: 'Contexto: Emblema — propriedades do emblema.',
    titulo: 'Emblema', texto: 'Posicione seu emblema e ajuste as propriedades — o zoom aproxima do canto onde ele vive.',
  },
};

/** Dispara a mudança de contexto coordenada (§324) + anúncio aria-live.
 *  Onda 1291 (#134): com as6.ctx_barra a dica vive na BARRA contextual
 *  (que tem aria-live próprio) — o anúncio-pill não duplica a mensagem;
 *  flag off = comportamento anterior byte a byte. */
export function aplicarContexto(categoria: CategoriaId): void {
  const ctx = CONTEXTOS[categoria];
  window.dispatchEvent(new CustomEvent(EVENTO_CONTEXTO, { detail: { categoria, grupoInspector: ctx.grupoInspector } }));
  if (!flag('as6.ctx_barra')) {
    window.dispatchEvent(new CustomEvent('avst5:anuncio', { detail: ctx.dica }));
  }
}
