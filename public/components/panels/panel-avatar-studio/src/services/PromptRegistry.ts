// services/PromptRegistry.ts — PROMPT REGISTRY da IA (AS6 Parte 12,
// lote 1041–1050, decisão #106, flag as6.ia_registry).
// @version 1.0.0  @created 2026-08-09
//
// Prompts da IA são DADO VERSIONADO, não string solta no código: cada
// prompt tem id, versão, descrição e template com placeholders {{...}}.
// A FONTE ÚNICA do servidor é api/avatar/ia/prompts.json (o
// ProvedorAnthropic monta dali, com fallback embutido); este módulo é o
// ESPELHO tipado no front — o teste ia-registry.mjs prova que os dois
// são idênticos byte a byte (mesma doutrina do espelho PHP de config).
// Sem chave aqui, sem chamada daqui: só ESTRUTURA — quem fala com o
// provedor continua sendo o servidor (segredos nunca no front).
export interface PromptIA {
  id: string;
  versao: number;
  descricao: string;
  /** template com {{placeholders}} — substituição PURA, sem eval */
  template: string;
}

export const PROMPTS_IA: Record<string, PromptIA> = {
  criar_avatar: {
    id: 'criar_avatar',
    versao: 2,
    descricao: 'Monta um personagem SÓ com ids do catálogo (decisão #24: IA nunca gera assets); resposta JSON estrita validada pelo §636 no cliente e re-validada no servidor.',
    template: 'Você monta personagens para o Avatar Studio do Dshow Dash usando SOMENTE ids do catálogo abaixo.\n'
      + 'Catálogo (categoria: id|nome|tema|raridade):\n{{catalogo}}\n\n'
      + 'Pedido do usuário: "{{pedido}}"\n\n'
      + 'Responda APENAS com JSON válido no formato: {"base":"id","camadas":{"cabelo":"id|nenhum","olhos":"id","boca":"id","roupa":"id","acessorio":"id|nenhum","fundo":"id","moldura":"id|nenhum","efeito":"id|nenhum"},"cores":{"pele":"#hex","cabelo":"#hex","roupa":"#hex","destaque":"#hex"},"nome":"nome curto do personagem","historia":"1 frase de lore em pt-BR"}',
  },
};

export function promptDe(id: string): PromptIA | undefined {
  return PROMPTS_IA[id];
}

export function versaoPrompt(id: string): number {
  return PROMPTS_IA[id]?.versao ?? 0;
}

/** Substituição PURA de placeholders (auditável; nunca eval). */
export function renderizarPrompt(id: string, vars: Record<string, string>): string | null {
  const p = PROMPTS_IA[id];
  if (!p) return null;
  return p.template.replace(/\{\{(\w+)\}\}/g, (tudo, chave: string) => (chave in vars ? vars[chave] : tudo));
}
