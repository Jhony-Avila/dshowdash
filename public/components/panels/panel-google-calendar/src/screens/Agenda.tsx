// screens/Agenda.tsx — visões dia / semana / mês em FullCalendar (§13, §14, §18, §60).
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30
//
// v2: @fullcalendar/interaction instalado (diff do lock verificado: só as 10
// linhas do pacote novo). Habilita arrastar, redimensionar e selecionar faixa.
//
// ARRASTAR SÓ ONDE PODE (§30): `editable` é decidido POR EVENTO, não global —
// calendário `reader`/`freeBusyReader`, evento cancelado e bloco redigido não
// se movem. Deixar arrastar e depois recusar no servidor seria pior do que não
// deixar: o evento pula de volta e o usuário não sabe por quê.
//
// ALTERNATIVA POR TECLADO (§80): arrastar não é acessível. Cada evento abre o
// drawer por Enter, e o drawer move pelo mesmo `updateEvent` que o arrasto usa.
// Ainda faltam os plugins de RECURSO (resource-timeline), que são licença
// comercial — decisão do dono.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBr from '@fullcalendar/core/locales/pt-br';
import type {
  EventClickArg, DatesSetArg, EventInput, EventDropArg, DateSelectArg,
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { servico } from '../services';
import { chaves } from '../lib/api';
import { useMoverEvento } from '../lib/mutations';
import { useToast } from '../shell/Toasts';
import type { CalendarEvent, CalendarSummary, PayloadEvento } from '../services/types';
import type { Preferencias } from '../shell/types';
import { EstadoErro, SkeletonBloco } from './Estados';
import { CriacaoRapida } from './CriacaoRapida';
import { useCriarEvento } from '../lib/mutations';
import { ymd } from '../lib/tz';

interface Props {
  prefs: Preferencias;
  tz: string;
  busca: string;
  calendarios: CalendarSummary[];
  onAbrirEvento: (e: CalendarEvent) => void;
  onVisaoMudou: (v: Preferencias['visaoAgenda']) => void;
  onMaisOpcoes: (inicio: string, parcial: { titulo: string; emails: string }) => void;
}

/** Teto de eventos na janela: acima disso a visão deixa de ajudar (§77). */
const TETO = 2000;

/** Só arrasta o que o usuário pode mesmo alterar. */
function podeEditar(e: CalendarEvent, papel: string | undefined): boolean {
  if (e.status === 'cancelled' || e.redacted) return false;
  return papel === 'owner' || papel === 'writer';
}

export function Agenda({
  prefs, tz, busca, calendarios, onAbrirEvento, onVisaoMudou, onMaisOpcoes,
}: Props) {
  const hoje = new Date();
  const [janela, setJanela] = useState(() => ({
    de: ymd(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), tz),
    ate: ymd(new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0), tz),
  }));
  const [criando, setCriando] = useState<{
    x: number; y: number; inicio: string; fim: string; diaInteiro: boolean;
  } | null>(null);

  const mover = useMoverEvento();
  const criar = useCriarEvento();
  const toast = useToast();

  const papelPorCal = useMemo(() => {
    const m = new Map<string, string>();
    calendarios.forEach((c) => m.set(c.id, c.access_role));
    return m;
  }, [calendarios]);

  const q = useQuery({
    queryKey: chaves.eventos({ ...janela, tz, busca, ocultos: prefs.calendariosOcultos }),
    queryFn: () => servico.getEvents({ de: janela.de, ate: janela.ate, tz, q: busca || null }),
    staleTime: 30_000,
  });

  const eventos = useMemo<EventInput[]>(() => {
    const lista = (q.data?.eventos ?? [])
      .filter((e) => !prefs.calendariosOcultos.includes(e.calendar_id))
      .slice(0, TETO);

    return lista.map((e) => {
      const editavel = podeEditar(e, papelPorCal.get(e.calendar_id));
      return {
        id: `${e.calendar_id}::${e.id}`,
        title: e.summary,
        start: e.start,
        end: e.end,
        allDay: e.all_day,
        editable: editavel,
        startEditable: editavel,
        durationEditable: editavel && !e.all_day,
        backgroundColor: e.color ?? e.calendar_color ?? undefined,
        borderColor: e.has_conflict ? 'var(--gc-alerta)' : (e.color ?? e.calendar_color ?? undefined),
        classNames: [
          'gc-ev',
          `gc-ev-${e.event_type}`,
          e.has_conflict ? 'gc-ev-conflito' : '',
          e.status === 'cancelled' ? 'gc-ev-cancelado' : '',
          e.transparency === 'transparent' ? 'gc-ev-livre' : '',
          e.redacted ? 'gc-ev-privado' : '',
          editavel ? 'gc-ev-editavel' : 'gc-ev-travado',
        ].filter(Boolean),
        extendedProps: { original: e },
      };
    });
  }, [q.data, prefs.calendariosOcultos, papelPorCal]);

  const truncado = (q.data?.eventos.length ?? 0) > TETO;

  function aoTrocarJanela(arg: DatesSetArg) {
    const de = ymd(arg.start, tz);
    const ate = ymd(arg.end, tz);
    setJanela((j) => (j.de === de && j.ate === ate ? j : { de, ate }));
    const v = arg.view.type as Preferencias['visaoAgenda'];
    if (v !== prefs.visaoAgenda) onVisaoMudou(v);
  }

  function aoClicar(arg: EventClickArg) {
    const original = arg.event.extendedProps.original as CalendarEvent | undefined;
    if (original) onAbrirEvento(original);
  }

  /** Arrastar: o FullCalendar já pintou; mandamos ao servidor e desfazemos se falhar. */
  function aoSoltar(arg: EventDropArg) {
    const original = arg.event.extendedProps.original as CalendarEvent | undefined;
    if (!original || !arg.event.start) { arg.revert(); return; }

    // Série recorrente: mover uma instância é o caso comum, então não
    // interrompemos com um diálogo — informamos e deixamos o drawer para quem
    // quiser mexer na série inteira.
    if (original.recurring_event_id) {
      toast.mostrar('info', 'Movida apenas esta ocorrência. Para toda a série, use os detalhes do evento.');
    }

    mover.mutate({
      evento: original,
      start: arg.event.start.toISOString(),
      end: (arg.event.end ?? arg.event.start).toISOString(),
      allDay: arg.event.allDay,
    }, {
      // O rollback do cache não desfaz o desenho do FullCalendar: ele mantém
      // estado próprio. `revert()` é o que devolve o bloco ao lugar na tela.
      onError: () => arg.revert(),
    });
  }

  function aoRedimensionar(arg: EventResizeDoneArg) {
    const original = arg.event.extendedProps.original as CalendarEvent | undefined;
    if (!original || !arg.event.start || !arg.event.end) { arg.revert(); return; }
    mover.mutate({
      evento: original,
      start: arg.event.start.toISOString(),
      end: arg.event.end.toISOString(),
      allDay: arg.event.allDay,
    }, { onError: () => arg.revert() });
  }

  /** Selecionar faixa vazia → popover de criação rápida ancorado no ponteiro. */
  function aoSelecionar(arg: DateSelectArg) {
    const ev = arg.jsEvent as MouseEvent | null;
    setCriando({
      x: ev?.clientX ?? window.innerWidth / 2,
      y: ev?.clientY ?? window.innerHeight / 2,
      inicio: arg.start.toISOString(),
      fim: arg.end.toISOString(),
      diaInteiro: arg.allDay,
    });
  }

  function salvarRapido(p: PayloadEvento) {
    criar.mutate(p, { onSuccess: () => setCriando(null) });
  }

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  return (
    <div className="gc-tela gc-tela-agenda">
      <div className="gc-legenda" role="list">
        <span role="listitem"><i className="gc-leg gc-leg-normal" /> Compromisso</span>
        <span role="listitem"><i className="gc-leg gc-leg-foco" /> Foco</span>
        <span role="listitem"><i className="gc-leg gc-leg-ooo" /> Fora do escritório</span>
        <span role="listitem"><i className="gc-leg gc-leg-livre" /> Disponível</span>
        <span role="listitem"><i className="gc-leg gc-leg-conflito" /> Conflito</span>
        <span className="gc-legenda-meta">
          {q.isLoading ? 'carregando…'
            : `${eventos.length.toLocaleString('pt-BR')} evento(s) no período`}
          {truncado && ` · período tem ${(q.data?.eventos.length ?? 0).toLocaleString('pt-BR')}; mostrando os ${TETO.toLocaleString('pt-BR')} primeiros`}
        </span>
      </div>

      <p className="gc-dica">
        Arraste para mover, puxe a borda para mudar a duração, ou selecione uma faixa vazia para criar.
        Eventos de calendários somente-leitura ficam fixos.
      </p>

      {q.isLoading && eventos.length === 0 && <SkeletonBloco linhas={10} altura={26} />}

      <div className="gc-fc-wrap">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={prefs.visaoAgenda}
          timeZone={tz}
          locale={ptBr}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
          events={eventos}
          datesSet={aoTrocarJanela}
          eventClick={aoClicar}
          editable
          eventStartEditable
          eventDurationEditable
          eventDrop={aoSoltar}
          eventResize={aoRedimensionar}
          selectable
          selectMirror
          select={aoSelecionar}
          unselectAuto={false}
          longPressDelay={300}
          eventLongPressDelay={300}
          selectLongPressDelay={300}
          height="auto"
          expandRows
          nowIndicator
          weekends
          firstDay={0}
          slotMinTime={`${String(Math.max(0, prefs.expedienteInicio - 2)).padStart(2, '0')}:00:00`}
          slotMaxTime={`${String(Math.min(24, prefs.expedienteFim + 3)).padStart(2, '0')}:00:00`}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: `${String(prefs.expedienteInicio).padStart(2, '0')}:00`,
            endTime: `${String(prefs.expedienteFim).padStart(2, '0')}:00`,
          }}
          dayMaxEvents={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {criando && (
        <CriacaoRapida
          ancora={{ x: criando.x, y: criando.y }}
          inicio={criando.inicio}
          fim={criando.fim}
          diaInteiro={criando.diaInteiro}
          tz={tz}
          calendarios={calendarios}
          salvando={criar.isPending}
          onSalvar={salvarRapido}
          onMaisOpcoes={(parcial) => { onMaisOpcoes(criando.inicio, parcial); setCriando(null); }}
          onFechar={() => setCriando(null)}
        />
      )}
    </div>
  );
}
