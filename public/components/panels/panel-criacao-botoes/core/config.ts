/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/config.ts
 * @version 1.0.0
 * Configuração de UI (labels, textos, defaults do form).
 * ═══════════════════════════════════════════════════════════════ */

export const CONFIG = {
  title: 'Criação de Botões',
  subtitle: 'Botões da sidebar — visão especializada',
  description:
    'Cria e edita os botões da barra lateral (ui_nav_items). Mesma fonte do Admin de Navegação.',
  labels: {
    new: 'Novo botão',
    edit: 'Editar botão',
    save: 'Salvar',
    cancel: 'Cancelar',
    activate: 'Ativar',
    deactivate: 'Desativar',
    preview: 'Pré-visualização',
    emptyGroup: 'Sem botões neste grupo',
    placeholderOption: 'Placeholder (em desenvolvimento)',
  },
  /** Defaults ao criar um botão novo. */
  defaults: {
    is_active: false,
    icon: 'circle',
  },
} as const;
