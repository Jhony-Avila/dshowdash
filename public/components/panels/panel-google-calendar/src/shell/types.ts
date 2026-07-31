// shell/types.ts — identidade das telas e config vinda do app-shell.
// @version 1.0.0  @created 2026-07-29
//
// Esta é a FONTE DA VERDADE das telas do módulo. Documento não conta: quem
// quiser saber o que existe olha TELAS aqui e o router em api/google-calendar/
// index.php — foi a lição que o Pipedrive deixou.

export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

export type TelaId =
  | 'hoje' | 'agenda' | 'proximos' | 'equipe'
  | 'calendarios' | 'recursos'
  | 'convites' | 'disponibilidade' | 'conflitos'
  | 'carga' | 'relatorios' | 'alertas'
  | 'contas' | 'sincronizacao' | 'configuracoes';

export interface Tela {
  id: TelaId;
  rota: string;
  label: string;
  icone: string;
  grupo: GrupoId;
  /** Aparece no badge da sub-sidebar quando > 0. */
  badge?: 'convites' | 'conflitos' | 'alertas' | 'sync';
  descricao: string;
}

export type GrupoId = 'visao' | 'calendarios' | 'inteligencia' | 'administracao';

export const GRUPOS: Array<{ id: GrupoId; label: string }> = [
  { id: 'visao',           label: 'Visão' },
  { id: 'calendarios',     label: 'Calendários' },
  { id: 'inteligencia',    label: 'Inteligência' },
  { id: 'administracao',   label: 'Administração' },
];

/**
 * As telas da Fase 2.
 *
 * O §10 do briefing lista 36 itens. Entregar 36 cascas vazias seria pior do que
 * entregar 14 telas que funcionam: o §87 pede que a primeira versão "já pareça
 * próxima de produção". Os itens que faltam (Foco, Fora do Escritório, Local de
 * Trabalho, Pipedrive, Clientes, Fornecedores, Projetos, E-mails, Produtividade,
 * Relatórios, Notificações, Permissões, Logs, Auditoria) estão mapeados no
 * 05-plano-fases.md com a fase em que entram — nenhum foi esquecido.
 */
export const TELAS: Tela[] = [
  { id: 'hoje',            rota: 'hoje',            label: 'Hoje',              icone: 'calendar-check',  grupo: 'visao',
    descricao: 'Resumo do dia, próxima reunião e linha do tempo.' },
  { id: 'agenda',          rota: 'agenda',          label: 'Minha Agenda',      icone: 'calendar-days',   grupo: 'visao',
    descricao: 'Dia, semana e mês em calendário.' },
  { id: 'proximos',        rota: 'proximos',        label: 'Próximos',          icone: 'list',            grupo: 'visao',
    descricao: 'Lista de compromissos com filtros e colunas.' },
  { id: 'equipe',          rota: 'equipe',          label: 'Visão da Equipe',   icone: 'users',           grupo: 'visao',
    descricao: 'Agenda consolidada dos calendários de equipe.' },

  { id: 'calendarios',     rota: 'calendarios',     label: 'Meus Calendários',  icone: 'layers',          grupo: 'calendarios',
    descricao: 'Ativar, ocultar, favoritar e ver o nível de acesso.' },
  { id: 'recursos',        rota: 'recursos',        label: 'Recursos e Salas',  icone: 'building',        grupo: 'calendarios',
    descricao: 'Showroom, salas e veículos com disponibilidade.' },

  { id: 'convites',        rota: 'convites',        label: 'Convites',          icone: 'mail-question',   grupo: 'inteligencia', badge: 'convites',
    descricao: 'Aceitar, recusar ou marcar como talvez.' },
  { id: 'disponibilidade', rota: 'disponibilidade', label: 'Disponibilidade',   icone: 'clock',           grupo: 'inteligencia',
    descricao: 'Matriz de livre/ocupado e melhores horários.' },
  { id: 'conflitos',       rota: 'conflitos',       label: 'Conflitos',         icone: 'triangle-alert',  grupo: 'inteligencia', badge: 'conflitos',
    descricao: 'Sobreposições, deslocamento e recursos duplicados.' },
  { id: 'carga',           rota: 'carga',           label: 'Carga de Reuniões', icone: 'bar-chart',       grupo: 'inteligencia',
    descricao: 'Horas ocupadas e distribuição ao longo de 28 dias.' },
  { id: 'relatorios',      rota: 'relatorios',      label: 'Relatórios',        icone: 'file-text',       grupo: 'inteligencia',
    descricao: 'Onze relatórios com totalizadores, exportação e visualizações.' },
  { id: 'alertas',         rota: 'alertas',         label: 'Alertas',           icone: 'bell-ring',       grupo: 'inteligencia', badge: 'alertas',
    descricao: 'Agenda, organização e problemas técnicos.' },

  { id: 'contas',          rota: 'contas',          label: 'Contas Conectadas', icone: 'user-cog',        grupo: 'administracao',
    descricao: 'Contas Google, escopos e estado da conexão.' },
  { id: 'sincronizacao',   rota: 'sincronizacao',   label: 'Sincronização',     icone: 'refresh',         grupo: 'administracao', badge: 'sync',
    descricao: 'Estado por calendário, canais e tokens.' },
  { id: 'configuracoes',   rota: 'configuracoes',   label: 'Configurações',     icone: 'settings',        grupo: 'administracao',
    descricao: 'Expediente, fuso, exibição dupla e preferências.' },
];

export const TELA_PADRAO: TelaId = 'hoje';

export function telaPorRota(rota: string | undefined): TelaId {
  const t = TELAS.find((x) => x.rota === rota);
  return t ? t.id : TELA_PADRAO;
}

/** Preferências locais do módulo (§11.3, §13.3, §47). */
export interface Preferencias {
  sidebarColapsada: boolean;
  calendariosOcultos: string[];
  fuso: string;
  fusoSecundario: string | null;
  expedienteInicio: number;
  expedienteFim: number;
  evitarAlmoco: boolean;
  visaoAgenda: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
}

export const PREFS_PADRAO: Preferencias = {
  sidebarColapsada: false,
  calendariosOcultos: [],
  fuso: '',
  fusoSecundario: null,
  expedienteInicio: 9,
  expedienteFim: 18,
  evitarAlmoco: true,
  visaoAgenda: 'timeGridWeek',
};

export const CHAVE_PREFS = 'dshow.google-calendar.prefs';
export const CHAVE_SIDEBAR = 'dshow.google-calendar.sidebar.collapsed';
