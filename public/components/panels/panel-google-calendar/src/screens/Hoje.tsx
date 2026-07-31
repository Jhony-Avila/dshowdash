// screens/Hoje.tsx — dashboard do dia (§15).
// @version 1.0.0  @created 2026-07-29
import { useQuery } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type { CalendarEvent } from '../services/types';
import type { Preferencias, TelaId } from '../shell/types';
import { Cartao, Kpi, LinhaEvento, PontoCalendario } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco, SkeletonCards } from './Estados';
import { hora, duracao, faltam, horaSecundaria, rotuloFuso, hojeYmd } from '../lib/tz';

interface Props {
  prefs: Preferencias;
  tz: string;
  onAbrirEvento: (e: CalendarEvent) => void;
  onIrPara: (t: TelaId) => void;
  onNovoEvento: () => void;
}

export function Hoje({ prefs, tz, onAbrirEvento, onIrPara, onNovoEvento }: Props) {
  const hoje = hojeYmd(tz);

  const ov = useQuery({
    queryKey: chaves.overview(tz),
    queryFn: () => servico.getOverview(tz),
  });

  const evs = useQuery({
    queryKey: chaves.eventos({ de: hoje, ate: hoje, tz, ocultos: prefs.calendariosOcultos }),
    queryFn: ({ signal }) => servico.getEvents({ de: hoje, ate: hoje, tz, incluir_cancelados: true })
      .then((r) => { void signal; return r; }),
  });

  if (ov.isError) return <EstadoErro erro={ov.error} onRetry={() => void ov.refetch()} />;

  const h = ov.data?.hoje;
  const proxima = h?.proxima_reuniao ?? null;
  const eventos = (evs.data?.eventos ?? [])
    .filter((e) => !prefs.calendariosOcultos.includes(e.calendar_id));

  return (
    <div className="gc-tela gc-tela-hoje">
      {ov.isLoading ? <SkeletonCards n={6} /> : (
        <div className="gc-kpis">
          <Kpi rotulo="Compromissos hoje" valor={h?.compromissos ?? 0} icone="calendar-check"
               onClick={() => onIrPara('agenda')} />
          <Kpi rotulo="Reuniões" valor={h?.reunioes ?? 0} icone="video" />
          <Kpi rotulo="Tempo ocupado" valor={duracao(h?.ocupado_min ?? 0)} icone="clock"
               tom={(h?.ocupado_min ?? 0) > 360 ? 'atencao' : 'neutro'}
               dica="Considera apenas eventos marcados como ocupado." />
          <Kpi rotulo="Tempo livre" valor={duracao(h?.livre_min ?? 0)} icone="focus" tom="ok"
               dica="Dentro do expediente configurado." />
          <Kpi rotulo="Convites pendentes" valor={h?.convites_pendentes ?? 0} icone="mail-question"
               tom={(h?.convites_pendentes ?? 0) > 0 ? 'atencao' : 'neutro'}
               onClick={() => onIrPara('convites')} />
          <Kpi rotulo="Conflitos" valor={h?.conflitos ?? 0} icone="triangle-alert"
               tom={(h?.conflitos ?? 0) > 0 ? 'alerta' : 'ok'}
               onClick={() => onIrPara('conflitos')} />
        </div>
      )}

      <div className="gc-hoje-grade">
        <Cartao titulo="Linha do tempo de hoje"
                acao={<button type="button" className="gc-btn gc-btn-fantasma" onClick={onNovoEvento}>
                        <Icone nome="plus" tamanho={14} /> Novo
                      </button>}>
          {evs.isLoading && <SkeletonBloco linhas={7} altura={40} />}
          {evs.isError && <EstadoErro erro={evs.error} onRetry={() => void evs.refetch()} />}
          {!evs.isLoading && !evs.isError && eventos.length === 0 && (
            <EstadoVazio
              titulo="Nenhum compromisso hoje"
              mensagem="Sua agenda está livre. Que tal reservar um bloco de foco?"
              acao={<button type="button" className="gc-btn gc-btn-primario" onClick={onNovoEvento}>
                      Criar evento
                    </button>}
            />
          )}
          {eventos.length > 0 && (
            <ol className="gc-timeline">
              {eventos.map((e) => (
                <li key={`${e.calendar_id}:${e.id}`} className="gc-timeline-item">
                  <LinhaEvento e={e} tz={tz} onAbrir={onAbrirEvento} />
                </li>
              ))}
            </ol>
          )}
        </Cartao>

        <div className="gc-hoje-coluna">
          <Cartao titulo="Próximo compromisso">
            {ov.isLoading && <SkeletonBloco linhas={4} />}
            {!ov.isLoading && !proxima && (
              <EstadoVazio titulo="Nada à frente hoje"
                           mensagem="Não há mais compromissos com horário marcado para hoje." />
            )}
            {proxima && <ProximoBloco e={proxima} tz={tz} prefs={prefs} onAbrir={onAbrirEvento} />}
          </Cartao>

          <Cartao titulo="Carga de reuniões · 28 dias">
            {ov.isLoading ? <SkeletonBloco linhas={3} /> : (
              <>
                <dl className="gc-defs">
                  <div><dt>Horas em reunião</dt><dd>{ov.data?.carga.horas_total ?? 0} h</dd></div>
                  <div><dt>Reuniões</dt><dd>{ov.data?.carga.reunioes_total ?? 0}</dd></div>
                  <div><dt>Média por dia</dt><dd>{ov.data?.carga.media_reunioes_dia ?? 0}</dd></div>
                  <div><dt>Duração média</dt><dd>{duracao(ov.data?.carga.duracao_media_min ?? 0)}</dd></div>
                </dl>
                <button type="button" className="gc-btn gc-btn-fantasma gc-btn-bloco"
                        onClick={() => onIrPara('carga')}>
                  Ver análise completa <Icone nome="chevron-right" tamanho={14} />
                </button>
                <p className="gc-nota">{ov.data?.aviso}</p>
              </>
            )}
          </Cartao>
        </div>
      </div>
    </div>
  );
}

function ProximoBloco({ e, tz, prefs, onAbrir }: {
  e: CalendarEvent; tz: string; prefs: Preferencias; onAbrir: (e: CalendarEvent) => void;
}) {
  const segunda = prefs.fusoSecundario
    ? horaSecundaria(e.start, tz, prefs.fusoSecundario)
    : null;
  const pendentes = e.attendees.filter((a) => a.response === 'needsAction').length;

  return (
    <div className="gc-proximo">
      <div className="gc-proximo-topo">
        <PontoCalendario cor={e.calendar_color} nome={e.calendar_summary} />
        <strong className="gc-proximo-titulo">{e.summary}</strong>
      </div>

      <div className="gc-proximo-hora">
        <span className="gc-proximo-h">{hora(e.start, tz)}</span>
        <span className="gc-proximo-ate">até {hora(e.end, tz)}</span>
        <span className="gc-proximo-contagem">{faltam(e.start)}</span>
      </div>

      {segunda && (
        <div className="gc-fuso-duplo">
          <span>{hora(e.start, tz)} {rotuloFuso(tz)}</span>
          <span>{segunda} {rotuloFuso(prefs.fusoSecundario as string)}</span>
        </div>
      )}

      {e.location && <p className="gc-proximo-local"><Icone nome="map-pin" tamanho={13} /> {e.location}</p>}

      {e.attendees.length > 0 && (
        <p className="gc-proximo-part">
          <Icone nome="users" tamanho={13} /> {e.attendees.length} participante(s)
          {pendentes > 0 && <span className="gc-tag gc-tag-atencao">{pendentes} sem resposta</span>}
        </p>
      )}

      {e.links.length > 0 && (
        <ul className="gc-vinculos">
          {e.links.map((l) => (
            <li key={`${l.entity_type}:${l.entity_id}`}>
              <Icone nome="link" tamanho={12} /> {l.label}
              {l.extra?.valor && <span className="gc-vinculo-extra">{l.extra.valor}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="gc-proximo-acoes">
        {e.conference && (
          <a className="gc-btn gc-btn-primario" href={e.conference.uri}
             target="_blank" rel="noopener noreferrer">
            <Icone nome="video" tamanho={14} /> Entrar
          </a>
        )}
        <button type="button" className="gc-btn gc-btn-fantasma" onClick={() => onAbrir(e)}>
          Detalhes
        </button>
      </div>
    </div>
  );
}
