// services/index.ts — implementação do contrato GoogleCalendarService.
// @version 1.0.0  @created 2026-07-29
//
// Há UMA implementação no front porque o switch mock/real vive no BACKEND
// (GCAL_PROVIDER). Isso é melhor do que duplicar o mock aqui: o mock do PHP já
// aplica permissão, privacidade e detecção de conflito, então a tela é exercida
// contra as MESMAS regras que valerão em produção — um mock só de front deixaria
// esses caminhos sem teste até a Fase 4.
import { apiGet, apiWrite, seg } from '../lib/api';
import type {
  GoogleCalendarService, StatusIntegracao, CalendarOverview, ContaGoogle,
  CalendarSummary, CalendarEvent, FiltrosJanela, PayloadEvento, EscopoSerie,
  FreeBusyResult, CalendarConflict, CalendarAlert, EstadoSync, RespostaConvite,
  Relatorio, TipoRelatorio, FluxoReunioes, RedeReunioes,
  TipoVinculo, BuscaVinculos, FichaEntidade, ResumoGoLive, ResultadoSync,
  EstadoSincronizacao, LinhaFila, CanalPush,
} from './types';

function janela(f: FiltrosJanela): Record<string, string | undefined> {
  return {
    de: f.de,
    ate: f.ate,
    tz: f.tz,
    calendars: f.calendars?.length ? f.calendars.join(',') : undefined,
    q: f.q ?? undefined,
    tipo: f.tipo ?? undefined,
    resposta: f.resposta ?? undefined,
    incluir_cancelados: f.incluir_cancelados ? '1' : undefined,
  };
}

export class ApiGoogleCalendarService implements GoogleCalendarService {
  getStatus(): Promise<StatusIntegracao> {
    return apiGet<StatusIntegracao>('/status');
  }

  getOverview(tz: string): Promise<CalendarOverview> {
    return apiGet<CalendarOverview>('/overview', { tz });
  }

  getAccounts(): Promise<{ contas: ContaGoogle[]; golive?: ResumoGoLive }> {
    return apiGet<{ contas: ContaGoogle[]; golive?: ResumoGoLive }>('/accounts');
  }

  conectarConta(redirect?: string): Promise<{ authorize_url: string }> {
    return apiWrite<{ authorize_url: string }>('/accounts/connect', 'POST',
      redirect ? { redirect } : undefined);
  }

  async desconectarConta(accountId: number): Promise<void> {
    await apiWrite<{ desconectada: number }>(`/accounts/${accountId}`, 'DELETE');
  }

  async getCalendars(): Promise<CalendarSummary[]> {
    const d = await apiGet<{ calendarios: CalendarSummary[] }>('/calendars');
    return d.calendarios;
  }

  async getResources(): Promise<CalendarSummary[]> {
    const d = await apiGet<{ recursos: CalendarSummary[] }>('/calendars/resources');
    return d.recursos;
  }

  async getEvents(f: FiltrosJanela): Promise<{ eventos: CalendarEvent[]; total: number }> {
    const d = await apiGet<{ eventos: CalendarEvent[] }>('/events', janela(f));
    return { eventos: d.eventos, total: d.eventos.length };
  }

  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    return apiGet<CalendarEvent>(`/events/${seg(calendarId)}/${seg(eventId)}`);
  }

  createEvent(p: PayloadEvento): Promise<CalendarEvent> {
    return apiWrite<CalendarEvent>('/events', 'POST', p);
  }

  updateEvent(calendarId: string, eventId: string, p: Partial<PayloadEvento>,
              escopo: EscopoSerie = 'this'): Promise<CalendarEvent> {
    return apiWrite<CalendarEvent>(`/events/${seg(calendarId)}/${seg(eventId)}`, 'PATCH', p, { escopo });
  }

  async deleteEvent(calendarId: string, eventId: string, notificar: boolean,
                    escopo: EscopoSerie = 'this'): Promise<void> {
    await apiWrite(`/events/${seg(calendarId)}/${seg(eventId)}`, 'DELETE', undefined,
      { notificar: notificar ? '1' : '0', escopo });
  }

  getFreeBusy(f: FiltrosJanela & { pessoas: string[]; duracao: number }): Promise<FreeBusyResult> {
    return apiGet<FreeBusyResult>('/freebusy', {
      ...janela(f), pessoas: f.pessoas.join(','), duracao: f.duracao,
    });
  }

  async getInvitations(f: FiltrosJanela & { categoria?: string | null }) {
    const d = await apiGet<{ convites: CalendarEvent[]; por_categoria: Record<string, number> }>(
      '/invitations', { ...janela(f), categoria: f.categoria ?? undefined });
    return { convites: d.convites, porCategoria: d.por_categoria };
  }

  respondInvitation(calendarId: string, eventId: string, resposta: RespostaConvite,
                    comentario?: string): Promise<CalendarEvent> {
    return apiWrite<CalendarEvent>(
      `/invitations/${seg(calendarId)}/${seg(eventId)}/respond`, 'POST',
      { resposta, comentario: comentario ?? null });
  }

  async getConflicts(f: FiltrosJanela) {
    const d = await apiGet<{ conflitos: CalendarConflict[]; por_tipo: Record<string, number> }>(
      '/conflicts', janela(f));
    return { conflitos: d.conflitos, porTipo: d.por_tipo };
  }

  async getAlerts(categoria?: string | null) {
    const d = await apiGet<{ alertas: CalendarAlert[]; por_severidade: Record<string, number> }>(
      '/alerts', { categoria: categoria ?? undefined });
    return { alertas: d.alertas, porSeveridade: d.por_severidade };
  }

  async getSync(): Promise<EstadoSincronizacao> {
    const d = await apiGet<{
      calendarios: EstadoSync[]; com_problema: number;
      fila?: LinhaFila[]; canais?: CanalPush[]; push_configurado?: boolean;
    }>('/sync');
    return {
      calendarios: d.calendarios, comProblema: d.com_problema,
      fila: d.fila ?? [], canais: d.canais ?? [],
      pushConfigurado: d.push_configurado === true,
    };
  }

  religarCanais() {
    return apiWrite<{ abertos: number; falhas: number; contas: number }>('/sync/watch', 'POST');
  }

  async getTiposRelatorio(): Promise<TipoRelatorio[]> {
    const d = await apiGet<{ relatorios: TipoRelatorio[] }>('/reports');
    return d.relatorios;
  }

  getRelatorio(tipo: string, f: FiltrosJanela): Promise<Relatorio> {
    return apiGet<Relatorio>(`/reports/${seg(tipo)}`, janela(f));
  }

  getFluxo(f: FiltrosJanela): Promise<FluxoReunioes> {
    return apiGet<FluxoReunioes>('/reports/fluxo', janela(f));
  }

  getRede(f: FiltrosJanela): Promise<RedeReunioes> {
    return apiGet<RedeReunioes>('/reports/rede', janela(f));
  }

  async getTiposVinculo(): Promise<TipoVinculo[]> {
    const d = await apiGet<{ tipos: TipoVinculo[] }>('/links');
    return d.tipos;
  }

  buscarVinculos(q: string, tipo?: string | null): Promise<BuscaVinculos> {
    return apiGet<BuscaVinculos>('/links/search', { q, tipo: tipo ?? undefined });
  }

  getFichaEntidade(tipo: string, id: string): Promise<FichaEntidade> {
    return apiGet<FichaEntidade>(`/links/entity/${seg(tipo)}/${seg(id)}`);
  }

  vincular(calendarId: string, eventId: string,
           v: { entity_type: string; entity_id: string; relation?: string }): Promise<CalendarEvent> {
    return apiWrite<CalendarEvent>(`/events/${seg(calendarId)}/${seg(eventId)}/links`, 'POST', v);
  }

  desvincular(calendarId: string, eventId: string, tipo: string, id: string): Promise<CalendarEvent> {
    return apiWrite<CalendarEvent>(
      `/events/${seg(calendarId)}/${seg(eventId)}/links/${seg(tipo)}/${seg(id)}`, 'DELETE');
  }

  runSync(opts?: { account_id?: number; completa?: boolean }): Promise<ResultadoSync> {
    return apiWrite<ResultadoSync>('/sync/run', 'POST', opts);
  }
}

export const servico: GoogleCalendarService = new ApiGoogleCalendarService();
