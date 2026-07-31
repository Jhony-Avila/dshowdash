// screens/Listas.tsx — "Próximos" (grade de eventos) e "Visão da Equipe".
// @version 1.0.0  @created 2026-07-29
//
// §41: grade com colunas, ordenação, filtros e densidade. Usa @tanstack/react-table
// + @tanstack/react-virtual, que é o padrão da casa (o DataGrid v2 do
// panel-datatables segue o mesmo caminho) — não AG Grid, que traria licença
// própria e duplicaria o componente de grade do produto.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type { CalendarEvent, CalendarSummary } from '../services/types';
import type { Preferencias } from '../shell/types';
import { Cartao, Chip, LinhaEvento, Pilula, PontoCalendario } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { dataHora, duracao, hojeYmd, somaDias } from '../lib/tz';

interface BaseProps {
  prefs: Preferencias;
  tz: string;
  busca: string;
  calendarios: CalendarSummary[];
  onAbrirEvento: (e: CalendarEvent) => void;
}

const PERIODOS = [
  { id: 7,  label: '7 dias' },
  { id: 15, label: '15 dias' },
  { id: 30, label: '30 dias' },
  { id: 90, label: '90 dias' },
];

export function Proximos({ prefs, tz, busca, onAbrirEvento }: BaseProps) {
  const [dias, setDias] = useState(15);
  const [densidade, setDensidade] = useState<'confortavel' | 'compacta'>('confortavel');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'start', desc: false }]);
  const [soConflito, setSoConflito] = useState(false);
  const [soPendente, setSoPendente] = useState(false);

  const de = hojeYmd(tz);
  const ate = somaDias(de, dias);

  const q = useQuery({
    queryKey: chaves.eventos({ de, ate, tz, busca, lista: true }),
    queryFn: () => servico.getEvents({ de, ate, tz, q: busca || null }),
  });

  const linhas = useMemo(() => {
    let l = (q.data?.eventos ?? []).filter((e) => !prefs.calendariosOcultos.includes(e.calendar_id));
    if (soConflito) l = l.filter((e) => e.has_conflict);
    if (soPendente) l = l.filter((e) => e.my_response === 'needsAction');
    return l;
  }, [q.data, prefs.calendariosOcultos, soConflito, soPendente]);

  const colunas = useMemo<ColumnDef<CalendarEvent>[]>(() => [
    {
      id: 'start', accessorKey: 'start', header: 'Início',
      cell: (c) => {
        const e = c.row.original;
        return <span className="gc-td-forte">
          {e.all_day ? `${e.start} · dia inteiro` : dataHora(e.start, tz)}
        </span>;
      },
    },
    {
      id: 'duracao', header: 'Duração', accessorFn: (e) => e.duration_min ?? 0,
      cell: (c) => (c.row.original.all_day ? '—' : duracao(c.row.original.duration_min ?? 0)),
    },
    {
      id: 'summary', accessorKey: 'summary', header: 'Título',
      cell: (c) => {
        const e = c.row.original;
        return (
          <button type="button" className="gc-td-link" onClick={() => onAbrirEvento(e)}>
            <PontoCalendario cor={e.calendar_color} nome={e.calendar_summary} />
            <span className={e.status === 'cancelled' ? 'gc-riscado' : undefined}>{e.summary}</span>
            {e.has_conflict && <Icone nome="triangle-alert" tamanho={13} />}
            {e.redacted && <span className="gc-tag gc-tag-privado">privado</span>}
          </button>
        );
      },
    },
    { id: 'calendario', header: 'Calendário', accessorFn: (e) => e.calendar_summary ?? e.calendar_id },
    { id: 'organizador', header: 'Organizador', accessorFn: (e) => e.organizer.name },
    {
      id: 'participantes', header: 'Part.', accessorFn: (e) => e.attendees.length,
      cell: (c) => c.row.original.attendees.length || '—',
    },
    {
      id: 'resposta', header: 'Resposta', accessorFn: (e) => e.my_response,
      cell: (c) => (c.row.original.is_organizer
        ? <span className="gc-td-fraco">organizador</span>
        : <Pilula resposta={c.row.original.my_response} />),
    },
    {
      id: 'recorrencia', header: 'Repetição',
      accessorFn: (e) => e.recurrence?.human ?? '',
      cell: (c) => c.row.original.recurrence?.human ?? <span className="gc-td-fraco">—</span>,
    },
    {
      id: 'vinculo', header: 'Relacionado',
      accessorFn: (e) => e.links[0]?.label ?? '',
      cell: (c) => {
        const l = c.row.original.links[0];
        return l ? <span className="gc-td-vinculo"><Icone nome="link" tamanho={12} /> {l.label}</span>
                 : <span className="gc-td-fraco">—</span>;
      },
    },
  ], [tz, onAbrirEvento]);

  const tabela = useReactTable({
    data: linhas, columns: colunas, state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          {PERIODOS.map((p) => (
            <Chip key={p.id} texto={p.label} ativo={dias === p.id} onClick={() => setDias(p.id)} />
          ))}
        </div>
        <div className="gc-chips">
          <Chip texto="Só com conflito" ativo={soConflito} onClick={() => setSoConflito((v) => !v)} />
          <Chip texto="Só sem resposta" ativo={soPendente} onClick={() => setSoPendente((v) => !v)} />
          {(soConflito || soPendente) && (
            <button type="button" className="gc-btn gc-btn-fantasma"
                    onClick={() => { setSoConflito(false); setSoPendente(false); }}>
              Limpar seleção
            </button>
          )}
        </div>
        <div className="gc-chips gc-chips-fim">
          <Chip texto="Confortável" ativo={densidade === 'confortavel'}
                onClick={() => setDensidade('confortavel')} />
          <Chip texto="Compacta" ativo={densidade === 'compacta'}
                onClick={() => setDensidade('compacta')} />
        </div>
      </div>

      <Cartao>
        {q.isLoading && <SkeletonBloco linhas={10} altura={22} />}
        {!q.isLoading && linhas.length === 0 && (
          <EstadoVazio titulo="Nenhum evento no período"
                       mensagem="Ajuste o período ou limpe os filtros aplicados." />
        )}
        {linhas.length > 0 && (
          <>
            <div className="gc-grid-wrap">
              <table className={`gc-grid gc-grid-${densidade}`}>
                <thead>
                  {tabela.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id}
                            onClick={h.column.getToggleSortingHandler()}
                            className={h.column.getCanSort() ? 'is-ordenavel' : undefined}
                            aria-sort={h.column.getIsSorted() === 'asc' ? 'ascending'
                                     : h.column.getIsSorted() === 'desc' ? 'descending' : 'none'}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() && (
                            <Icone nome={h.column.getIsSorted() === 'asc' ? 'chevron-down' : 'chevron-down'}
                                   tamanho={12} />
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {tabela.getRowModel().rows.map((r) => (
                    <tr key={r.id}>
                      {r.getVisibleCells().map((c) => (
                        <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="gc-nota">{linhas.length.toLocaleString('pt-BR')} evento(s) · período de {dias} dias</p>
          </>
        )}
      </Cartao>
    </div>
  );
}

/**
 * Visão da Equipe (§37).
 *
 * Mostra APENAS os calendários de equipe aos quais o usuário já tem acesso, e
 * respeita o nível concedido: calendário de livre/ocupado aparece como bloco
 * sem conteúdo. O §37 pede explicitamente que esta área não vire vigilância
 * individual — por isso não há ranking de pessoas nem detalhe de agenda alheia
 * além do que o Google já autorizou.
 */
export function Equipe({ prefs, tz, busca, calendarios, onAbrirEvento }: BaseProps) {
  const [dias, setDias] = useState(7);
  const de = hojeYmd(tz);
  const ate = somaDias(de, dias);

  const equipes = calendarios.filter((c) => c.kind === 'team');

  const q = useQuery({
    queryKey: chaves.eventos({ de, ate, tz, busca, equipe: true }),
    queryFn: () => servico.getEvents({
      de, ate, tz, q: busca || null,
      calendars: equipes.map((c) => c.id),
    }),
    enabled: equipes.length > 0,
  });

  if (equipes.length === 0) {
    return (
      <div className="gc-tela">
        <EstadoVazio titulo="Nenhum calendário de equipe"
                     mensagem="Você ainda não tem acesso a calendários compartilhados de equipe." />
      </div>
    );
  }
  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const porCalendario = new Map<string, CalendarEvent[]>();
  for (const e of q.data?.eventos ?? []) {
    if (prefs.calendariosOcultos.includes(e.calendar_id)) continue;
    const l = porCalendario.get(e.calendar_id) ?? [];
    l.push(e);
    porCalendario.set(e.calendar_id, l);
  }

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          {[7, 15, 30].map((d) => (
            <Chip key={d} texto={`${d} dias`} ativo={dias === d} onClick={() => setDias(d)} />
          ))}
        </div>
      </div>

      <p className="gc-nota gc-nota-destaque">
        <Icone nome="info" tamanho={13} />
        Coordenação de agenda: mostra apenas os calendários de equipe a que você já tem acesso,
        no nível concedido por cada um.
      </p>

      <div className="gc-colunas-equipe">
        {equipes.map((c) => {
          const lista = porCalendario.get(c.id) ?? [];
          return (
            <Cartao key={c.id} titulo={c.summary}
                    acao={<span className="gc-tag">{lista.length} evento(s)</span>}>
              {q.isLoading && <SkeletonBloco linhas={4} altura={30} />}
              {!q.isLoading && lista.length === 0 && (
                <p className="gc-td-fraco">Sem compromissos no período.</p>
              )}
              <ul className="gc-lista-simples">
                {lista.slice(0, 25).map((e) => (
                  <li key={`${e.calendar_id}:${e.id}`}>
                    <LinhaEvento e={e} tz={tz} onAbrir={onAbrirEvento} mostrarData />
                  </li>
                ))}
              </ul>
              {lista.length > 25 && (
                <p className="gc-nota">Mostrando 25 de {lista.length}.</p>
              )}
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}
