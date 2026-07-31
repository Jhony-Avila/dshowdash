// services/types.ts — contrato de dados do módulo Google Calendar.
// @version 1.0.0  @created 2026-07-29
//
// Espelha o §52 do briefing. O front NUNCA fala com fetch direto: fala com
// GoogleCalendarService. Trocar mock por real (Fase 4) muda a implementação,
// não a tela — que é a promessa do §87.

/** Instante ISO-8601 COM offset (2026-07-30T09:00:00-03:00) ou data pura em dia inteiro. */
export type IsoInstante = string;

export type RespostaConvite = 'accepted' | 'declined' | 'tentative' | 'needsAction';
export type PapelAcesso = 'owner' | 'writer' | 'reader' | 'freeBusyReader';
export type TipoEvento = 'default' | 'focusTime' | 'outOfOffice' | 'workingLocation';
export type Transparencia = 'opaque' | 'transparent';
export type Visibilidade = 'default' | 'public' | 'private' | 'confidential';
export type EscopoSerie = 'this' | 'following' | 'all';

export interface Participante {
  name: string;
  email: string;
  response: RespostaConvite;
  optional?: boolean;
  organizer?: boolean;
  external?: boolean;
  self?: boolean;
}

export interface Conferencia {
  platform: string;
  uri: string;
  code?: string;
  phone?: string;
  pin?: string;
}

/** Vínculo com uma entidade interna do Dshow Dash (§57). */
export interface VinculoInterno {
  entity_type: 'pipedrive_deal' | 'cliente' | 'fornecedor' | 'proposta' | 'pedido' | 'projeto' | 'colaborador' | string;
  entity_id: string;
  label: string;
  relation: string;
  extra?: Record<string, string>;
}

export interface Recorrencia {
  rrule: string;
  human: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  ical_uid: string;
  recurring_event_id: string | null;
  original_start_time: string | null;
  etag: string;
  sequence: number;
  status: 'confirmed' | 'tentative' | 'cancelled';
  summary: string;
  description: string | null;
  location: string | null;
  all_day: boolean;
  start: IsoInstante;
  end: IsoInstante;
  time_zone: string;
  transparency: Transparencia;
  visibility: Visibilidade;
  event_type: TipoEvento;
  organizer: { name: string; email: string; self: boolean };
  attendees: Participante[];
  conference: Conferencia | null;
  reminders: Array<{ method: string; minutes: number }>;
  recurrence: Recorrencia | null;
  links: VinculoInterno[];
  color: string | null;
  is_organizer: boolean;
  my_response: RespostaConvite;
  created: string;
  updated: string;
  /** Preenchidos pelo backend na listagem. */
  calendar_color?: string;
  calendar_summary?: string;
  duration_min?: number;
  has_conflict?: boolean;
  /** true quando o calendário só concede livre/ocupado — conteúdo omitido (§75.1). */
  redacted?: boolean;
  categoria?: string;
  response_comment?: string;
}

export interface CalendarSummary {
  id: string;
  account_id: number;
  summary: string;
  description: string | null;
  time_zone: string;
  color: string;
  access_role: PapelAcesso;
  primary: boolean;
  selected: boolean;
  favorite: boolean;
  kind: 'personal' | 'team' | 'resource' | 'holiday' | string;
  owner: string;
  capacity?: number;
  resource_location?: string;
}

export interface ContaGoogle {
  id: number;
  google_account_id: string;
  email: string;
  display_name: string;
  account_type: 'workspace' | 'personal' | string;
  organization: string | null;
  is_default: boolean;
  is_active: boolean;
  connection_status: 'connected' | 'reauth_required' | 'revoked' | string;
  scopes: string;
  token_expires_at: string | null;
  last_sync_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
}

/**
 * Um passo do go-live. Vem de api/google-calendar/lib/GcalGoLive.php, que é a
 * ÚNICA fonte da checklist — a tela desenha, não decide o que falta.
 */
export interface PassoGoLive {
  id: string;
  titulo: string;
  ok: boolean;
  detalhe: string;
  resolver: string;
  /** Falso = passo informativo; não impede ligar. */
  bloqueia: boolean;
}

export interface ResumoGoLive {
  pronto: boolean;
  concluidos: number;
  total: number;
  redirect_uri: string;
  escopos: string[];
  etapa_oauth: string;
  itens: PassoGoLive[];
}

export interface StatusIntegracao {
  provider: string;
  mock: boolean;
  configured: boolean;
  connected: boolean;
  accounts: number;
  accounts_with_problem: number;
  calendars: number;
  scopes: string[];
  oauth_stage: string | null;
  last_sync_at: string | null;
  stale_calendars: number;
  pendencias?: string[];
  golive?: ResumoGoLive;
  message: string;
}

export interface CalendarOverview {
  time_zone: string;
  hoje: {
    compromissos: number;
    reunioes: number;
    convites_pendentes: number;
    cancelados: number;
    participantes_externos: number;
    ocupado_min: number;
    livre_min: number;
    conflitos: number;
    proxima_reuniao: CalendarEvent | null;
  };
  carga: {
    serie_28d: Array<{ dia: string; minutos: number; reunioes: number }>;
    horas_total: number;
    reunioes_total: number;
    media_reunioes_dia: number;
    duracao_media_min: number;
  };
  aviso: string;
}

export type EstadoSlot = 'free' | 'busy' | 'focus' | 'ooo' | 'off_hours' | 'lunch';

export interface FreeBusyResult {
  pessoas: string[];
  duracao_min: number;
  time_zone: string;
  matriz: Array<{ slot: IsoInstante; estados: Record<string, EstadoSlot> }>;
  sugestoes: Array<{ inicio: IsoInstante; fim: IsoInstante; todos_livres: boolean }>;
}

export interface CalendarConflict {
  id: string;
  tipo: 'sobreposicao' | 'deslocamento' | 'foco' | 'ausencia' | 'recurso' | string;
  severidade: 'alta' | 'media' | 'baixa';
  mensagem: string;
  event_ids: string[];
  eventos: Array<{
    id: string; calendar_id: string; summary: string;
    start: IsoInstante; end: IsoInstante;
    location: string | null; attendees_count: number;
  }>;
}

export interface CalendarAlert {
  id: string;
  categoria: 'agenda' | 'organizacao' | 'tecnico';
  severidade: 'alta' | 'media' | 'baixa';
  titulo: string;
  mensagem: string;
  ref: { id: string; tipo: string; calendar_id?: string } | null;
}

export interface EstadoSync {
  calendar_id: string;
  calendar_summary?: string;
  /** `pending` = descoberto e ainda não sincronizado; NÃO é erro. */
  status: 'ok' | 'stale' | 'error' | 'pending' | 'full_resync_required' | string;
  nunca_sincronizado?: boolean;
  last_sync_at: string;
  next_sync_at: string;
  duration_ms: number;
  processed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  sync_token: string;
  channel_id: string;
  channel_expires_at: string;
  attempt: number;
}

/** Uma linha do resumo da fila: contagem por (status, tipo). */
export interface LinhaFila {
  status: 'pending' | 'running' | 'dead' | string;
  kind: 'incremental' | 'full' | 'watch_renew' | 'reconcile' | string;
  n: number;
  proxima: string | null;
}

export interface CanalPush {
  channel_id: string;
  calendar_id: string;
  expiration: string;
  created_at: string;
}

export interface EstadoSincronizacao {
  calendarios: EstadoSync[];
  comProblema: number;
  /** Vazios em mock: não há fila nem canal rodando (Fase 5). */
  fila: LinhaFila[];
  canais: CanalPush[];
  pushConfigurado: boolean;
}

/** Relatórios (§64) — contrato único, para a tela ser genérica. */
export type TipoColuna = 'texto' | 'numero' | 'duracao' | 'data' | 'datahora' | 'percentual';

export interface ColunaRelatorio {
  id: string;
  rotulo: string;
  tipo: TipoColuna;
  /** Quando presente, a coluna entra na linha de totais. */
  total?: 'soma' | 'media';
  alinhar?: 'direita';
}

export type LinhaRelatorio = Record<string, string | number | null>;

export interface Relatorio {
  tipo: string;
  titulo: string;
  descricao: string;
  grupo: string;
  de: string;
  ate: string;
  time_zone: string;
  colunas: ColunaRelatorio[];
  linhas: LinhaRelatorio[];
  totais: Record<string, number>;
  serie: Array<{ rotulo: string; valor: number }>;
  serie_titulo?: string;
  serie_unidade?: string;
}

export interface TipoRelatorio {
  id: string;
  titulo: string;
  grupo: string;
  descricao: string;
}

export interface FluxoReunioes {
  links: Array<{ de: string; para: string; valor: number }>;
  total: number;
  suficiente: boolean;
  motivo: string | null;
}

export interface RedeReunioes {
  nos: Array<{ id: string; nome: string; peso: number; externo: boolean }>;
  arestas: Array<{ origem: string; destino: string; peso: number }>;
  total_pessoas: number;
  omitidos: number;
  suficiente: boolean;
  motivo: string | null;
}

/** Vínculos internos (§32, §57) — entidades reais de Pipedrive e Koala. */
export interface TipoVinculo { id: string; rotulo: string; fonte: string }

export interface ResultadoVinculo {
  entity_type: string;
  entity_id: string;
  label: string;
  sublabel: string;
  fonte: string;
  status?: string;
  /** Só em pessoa: permite convidar direto para o evento. */
  email?: string | null;
  url?: string | null;
  extra: Record<string, string>;
}

export interface BuscaVinculos {
  itens: ResultadoVinculo[];
  fontes: string[];
  /** Fonte que não respondeu — a UI diz qual, em vez de fingir busca completa. */
  degradado: string[];
  aviso: string | null;
}

export interface FichaEntidade {
  entity_type: string;
  entity_id: string;
  titulo: string;
  subtitulo: string;
  fonte: string;
  campos: Array<{ rotulo: string; valor: string; destaque?: boolean }>;
  atividades: Array<{ titulo: string; tipo: string; quando: string; feita: boolean }>;
  rota: string;
  url?: string | null;
  convidar?: string | null;
}

export interface FiltrosJanela {
  de: string;
  ate: string;
  tz: string;
  calendars?: string[];
  q?: string | null;
  tipo?: string | null;
  resposta?: string | null;
  incluir_cancelados?: boolean;
}

export interface PayloadEvento {
  calendar_id: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  all_day?: boolean;
  start: IsoInstante;
  end: IsoInstante;
  time_zone?: string;
  transparency?: Transparencia;
  visibility?: Visibilidade;
  event_type?: TipoEvento;
  attendees?: Participante[];
  conference?: Conferencia | null;
  reminders?: Array<{ method: string; minutes: number }>;
  recurrence?: Recorrencia | null;
  links?: VinculoInterno[];
  color?: string | null;
}

/** Contrato do §52. */
export interface GoogleCalendarService {
  getStatus(): Promise<StatusIntegracao>;
  getOverview(tz: string): Promise<CalendarOverview>;
  getAccounts(): Promise<{ contas: ContaGoogle[]; golive?: ResumoGoLive }>;
  /** Devolve a URL de consentimento do Google; quem navega é a tela. */
  conectarConta(redirect?: string): Promise<{ authorize_url: string }>;
  desconectarConta(accountId: number): Promise<void>;
  getCalendars(): Promise<CalendarSummary[]>;
  getResources(): Promise<CalendarSummary[]>;
  getEvents(f: FiltrosJanela): Promise<{ eventos: CalendarEvent[]; total: number }>;
  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;
  createEvent(p: PayloadEvento): Promise<CalendarEvent>;
  updateEvent(calendarId: string, eventId: string, p: Partial<PayloadEvento>, escopo?: EscopoSerie): Promise<CalendarEvent>;
  deleteEvent(calendarId: string, eventId: string, notificar: boolean, escopo?: EscopoSerie): Promise<void>;
  getFreeBusy(f: FiltrosJanela & { pessoas: string[]; duracao: number }): Promise<FreeBusyResult>;
  getInvitations(f: FiltrosJanela & { categoria?: string | null }): Promise<{ convites: CalendarEvent[]; porCategoria: Record<string, number> }>;
  respondInvitation(calendarId: string, eventId: string, resposta: RespostaConvite, comentario?: string): Promise<CalendarEvent>;
  getConflicts(f: FiltrosJanela): Promise<{ conflitos: CalendarConflict[]; porTipo: Record<string, number> }>;
  getAlerts(categoria?: string | null): Promise<{ alertas: CalendarAlert[]; porSeveridade: Record<string, number> }>;
  getSync(): Promise<EstadoSincronizacao>;
  /** (Re)abre os canais push das contas do usuário. */
  religarCanais(): Promise<{ abertos: number; falhas: number; contas: number }>;
  getTiposVinculo(): Promise<TipoVinculo[]>;
  buscarVinculos(q: string, tipo?: string | null): Promise<BuscaVinculos>;
  getFichaEntidade(tipo: string, id: string): Promise<FichaEntidade>;
  vincular(calendarId: string, eventId: string, v: { entity_type: string; entity_id: string; relation?: string }): Promise<CalendarEvent>;
  desvincular(calendarId: string, eventId: string, tipo: string, id: string): Promise<CalendarEvent>;
  getTiposRelatorio(): Promise<TipoRelatorio[]>;
  getRelatorio(tipo: string, f: FiltrosJanela): Promise<Relatorio>;
  getFluxo(f: FiltrosJanela): Promise<FluxoReunioes>;
  getRede(f: FiltrosJanela): Promise<RedeReunioes>;
  runSync(opts?: { account_id?: number; completa?: boolean }): Promise<ResultadoSync>;
}

export interface ResultadoSync {
  disparado: boolean;
  simulado?: boolean;
  completa?: boolean;
  message?: string;
  com_falha?: number;
  contas?: Array<{
    account_id: number; email: string; ok: boolean; erro?: string;
    calendarios?: number; processed?: number; created?: number; updated?: number;
  }>;
}

/** Envelope padrão da API do Dshow Dash: {ok, data, error, meta}. NÃO é `success`. */
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error: string | null;
  meta?: { message?: string; total?: number; [k: string]: unknown };
}
