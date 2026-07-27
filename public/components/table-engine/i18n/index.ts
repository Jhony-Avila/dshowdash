// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:i18n
// PURPOSE: Table Engine - Internationalization
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getI18n() — exported function
//   t() — exported function
//   setLocale() — exported function
//   getLocale() — exported function
//   addTranslations() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:i18n';

const translations = {
  'pt-BR': {
    'pagination.showing': 'Mostrando',
    'pagination.of': 'de',
    'pagination.records': 'registros',
    'pagination.perPage': 'por página',
    'pagination.first': 'Primeira',
    'pagination.last': 'Última',
    'pagination.next': 'Próxima',
    'pagination.previous': 'Anterior',
    'selection.selected': 'selecionado(s)',
    'selection.selectAll': 'Selecionar todos',
    'selection.clearSelection': 'Limpar seleção',
    'search.placeholder': 'Buscar...',
    'search.clear': 'Limpar busca',
    'search.noResults': 'Nenhum resultado para',
    'filter.title': 'Filtros',
    'filter.apply': 'Aplicar',
    'filter.clear': 'Limpar',
    'filter.clearAll': 'Limpar todos',
    'state.loading': 'Carregando...',
    'state.empty': 'Nenhum registro encontrado',
    'state.error': 'Erro ao carregar dados',
    'state.retry': 'Tentar novamente',
    'action.view': 'Ver',
    'action.edit': 'Editar',
    'action.delete': 'Excluir',
    'action.copy': 'Copiar',
    'action.refresh': 'Atualizar',
    'action.add': 'Adicionar',
    'action.save': 'Salvar',
    'action.cancel': 'Cancelar',
    'action.undo': 'Desfazer',
    'action.redo': 'Refazer',
    'edit.unsavedChanges': 'alteracoes nao salvas',
    'edit.saveAll': 'Salvar todas',
    'edit.discardAll': 'Descartar todas',
    'edit.addRow': 'Adicionar registro',
    'export.title': 'Exportar',
    'export.csv': 'CSV',
    'export.excel': 'Excel',
    'export.pdf': 'PDF',
    'export.cancel': 'Cancelar',
    'export.confirm': 'Exportar',
    'boolean.true': 'Sim',
    'boolean.false': 'Nao',
    'clipboard.copied': 'Copiado!'
  },
  'en-US': {
    'pagination.showing': 'Showing',
    'pagination.of': 'of',
    'pagination.records': 'records',
    'search.placeholder': 'Search...',
    'state.loading': 'Loading...',
    'state.empty': 'No records found',
    'action.view': 'View',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'boolean.true': 'Yes',
    'boolean.false': 'No'
  }
};

class I18n {
  [key: string]: any;
  constructor(options: { locale?: string; fallbackLocale?: string } = {}) {
    this._locale = options.locale || 'pt-BR';
    this._fallback = options.fallbackLocale || 'pt-BR';
    this._translations = { ...translations };
  }
  setLocale(locale: string) { this._locale = locale; }
  getLocale() { return this._locale; }
  addTranslations(locale: string, trans: Record<string, string>) {
    if (!this._translations[locale]) this._translations[locale] = {};
    Object.assign(this._translations[locale], trans);
  }
  t(key: string, params: Record<string, string> = {}) {
    let text = this._translations[this._locale]?.[key] || this._translations[this._fallback]?.[key] || key;
    Object.entries(params).forEach(([k, v], i) => { text = text.replace(`{${i}}`, v).replace(`{${k}}`, v); });
    return text;
  }
  has(key: string) { return !!this._translations[this._locale]?.[key]; }
  getAvailableLocales() { return Object.keys(this._translations); }
  info() { return { moduleId: MODULE_ID, version: VERSION, locale: this._locale }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
}

let _instance: I18n | null = null;
export function getI18n(opts: { locale?: string; fallbackLocale?: string } = {}) { if (!_instance) _instance = new I18n(opts); return _instance; }
export function t(key: string, params: Record<string, string> = {}) { return getI18n().t(key, params); }
export function setLocale(locale: string) { return getI18n().setLocale(locale); }
export function getLocale() { return getI18n().getLocale(); }
export function addTranslations(locale: string, trans: Record<string, string>) { return getI18n().addTranslations(locale, trans); }
export function info() { return getI18n().info(); }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { getI18n, t, setLocale, getLocale, addTranslations, info, healthCheck, VERSION, MODULE_ID };
