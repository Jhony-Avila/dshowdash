// screens/Agenda.tsx — Atividades em AGENDA (FullCalendar) — Elevação visual, Fase 3.
// @version 1.0.0  @created 2026-07-24
//
// Carregada por import dinamico (React.lazy) na tela de Atividades: o FullCalendar so
// entra no navegador de quem abre a agenda; quem fica na grade nao paga o download.
// Busca SO a janela visivel (`due_from`/`due_to`, filtros novos do backend) — nao
// dava para reusar a paginacao da grade, que ordena e corta por pagina.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import ptBr from '@fullcalendar/core/locales/pt-br';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { apiGet } from '../lib/api';
import { EstadoErro, SkeletonBloco } from './Estados';
import type { PipePage, PipeActivityRow } from '../shell/types';

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const PAGINA = 500;    // teto do backend por consulta
const TETO = 3000;     // teto da agenda (6 consultas) — acima disso a visao ja nao ajuda

export function Agenda({ onAbrir }: { onAbrir: (id: number) => void }) {
  // Janela inicial: mes corrente. O FullCalendar avisa a janela real em `datesSet`.
  const hoje = new Date();
  const [janela, setJanela] = useState<{ from: string; to: string }>(() => ({
    from: iso(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
    to: iso(new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)),
  }));

  // A janela visivel passa de 500 atividades com folga (um mes cheio tem ~2 mil nesta base),
  // e o backend limita per_page a 500 — entao a agenda PAGINA a janela inteira, com teto.
  const { data, isLoading, error, refetch } = useQuery<{ rows: PipeActivityRow[]; total: number; truncado: boolean }>({
    queryKey: ['pipe', 'agenda', janela],
    queryFn: async ({ signal }) => {
      const base = { due_from: janela.from, due_to: janela.to, per_page: PAGINA, sort: 'due_date', dir: 'asc' };
      let rows: PipeActivityRow[] = []; let pagina = 1; let paginas = 1; let total = 0;
      do {
        const d = await apiGet<PipePage<PipeActivityRow>>('/activities', { ...base, page: pagina }, signal);
        rows = rows.concat(d.rows ?? []);
        paginas = d.pages || 1; total = d.total ?? rows.length; pagina++;
      } while (pagina <= paginas && rows.length < TETO);
      return { rows, total, truncado: rows.length < total };
    },
    staleTime: 60_000,
  });

  const eventos = (data?.rows ?? [])
    .filter((a) => a.due_date)
    .map((a) => {
      const dia = String(a.due_date).slice(0, 10);
      const hora = a.due_time ? String(a.due_time).slice(0, 8) : null;
      return {
        id: String(a.id),
        title: a.subject && a.subject.trim() !== '' ? a.subject : '(sem assunto)',
        start: hora ? `${dia}T${hora}` : dia,
        allDay: !hora,
        classNames: [a.done ? 'pp-ev-ok' : (a.overdue ? 'pp-ev-late' : 'pp-ev-open')],
      };
    });

  function aoTrocarJanela(arg: DatesSetArg) {
    const from = iso(arg.start); const to = iso(arg.end);
    setJanela((j) => (j.from === from && j.to === to ? j : { from, to }));
  }
  function aoClicar(arg: EventClickArg) {
    const id = Number(arg.event.id);
    if (Number.isFinite(id)) onAbrir(id);
  }

  if (error) {
    return <div className="pp-card" style={{ maxWidth: 'none' }}>
      <EstadoErro detalhe="Falha ao carregar as atividades do período." onRetry={() => void refetch()} />
    </div>;
  }

  return (
    <div className="pp-card pp-agenda" style={{ maxWidth: 'none' }}>
      <div className="pp-agenda-legenda">
        <span><i className="pp-ev-dot is-open" /> Pendente</span>
        <span><i className="pp-ev-dot is-late" /> Atrasada</span>
        <span><i className="pp-ev-dot is-ok" /> Concluída</span>
        <span className="pp-agenda-meta">
          {isLoading ? 'carregando…' : `${eventos.length.toLocaleString('pt-BR')} atividade(s) no período`}
          {data?.truncado && ` · período tem ${data.total.toLocaleString('pt-BR')}; mostrando as ${TETO.toLocaleString('pt-BR')} primeiras`}
        </span>
      </div>
      {isLoading && eventos.length === 0 ? <SkeletonBloco linhas={8} altura={22} /> : null}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        locale={ptBr}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
        buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana' }}
        events={eventos}
        datesSet={aoTrocarJanela}
        eventClick={aoClicar}
        height="auto"
        dayMaxEvents={4}
        firstDay={0}
        nowIndicator
      />
    </div>
  );
}
