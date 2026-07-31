// screens/Calendarios.tsx — "Meus Calendários" (§27, §28) e "Recursos e Salas" (§29).
// @version 1.0.0  @created 2026-07-29
import { useQuery } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type { CalendarEvent, CalendarSummary } from '../services/types';
import type { Preferencias } from '../shell/types';
import { Cartao, LinhaEvento } from '../shell/ui';
import { rotuloAcesso } from '../shell/HeaderInterno';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { hojeYmd, somaDias } from '../lib/tz';

const ROTULO_KIND: Record<string, string> = {
  personal: 'Pessoal', team: 'Equipe', resource: 'Recurso', holiday: 'Feriados',
};

export function Calendarios({ calendarios, ocultos, carregando, erro, onToggle, onRetry }: {
  calendarios: CalendarSummary[];
  ocultos: string[];
  carregando: boolean;
  erro: unknown;
  onToggle: (id: string) => void;
  onRetry: () => void;
}) {
  if (erro) return <EstadoErro erro={erro} onRetry={onRetry} />;
  if (carregando) return <div className="gc-tela"><SkeletonBloco linhas={7} altura={54} /></div>;

  const grupos = ['personal', 'team', 'resource', 'holiday'] as const;

  return (
    <div className="gc-tela">
      <p className="gc-nota gc-nota-destaque">
        <Icone nome="info" tamanho={13} />
        O nível de acesso vem do Google e não pode ser ampliado por aqui. Calendários de
        livre/ocupado mostram os horários ocupados, mas nunca o conteúdo dos eventos.
      </p>

      {grupos.map((g) => {
        const itens = calendarios.filter((c) => c.kind === g);
        if (!itens.length) return null;
        return (
          <Cartao key={g} titulo={ROTULO_KIND[g]}>
            <ul className="gc-cal-lista">
              {itens.map((c) => {
                const visivel = !ocultos.includes(c.id);
                return (
                  <li key={c.id} className="gc-cal-item">
                    <label className="gc-cal-toggle">
                      <input type="checkbox" checked={visivel} onChange={() => onToggle(c.id)} />
                      <span className="gc-cal-cor-grande" style={{ background: c.color }}
                            aria-hidden="true" />
                      <span className="gc-cal-nome">
                        <strong>{c.summary}</strong>
                        {c.primary && <span className="gc-tag">principal</span>}
                        {c.favorite && <Icone nome="star" tamanho={13} />}
                        <span className="gc-cal-desc">{c.description}</span>
                      </span>
                    </label>
                    <div className="gc-cal-meta">
                      <span className={`gc-tag gc-acesso-${c.access_role}`}>
                        {rotuloAcesso(c.access_role)}
                      </span>
                      <span className="gc-td-fraco">{c.owner}</span>
                      <span className="gc-td-fraco">{c.time_zone}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Cartao>
        );
      })}
    </div>
  );
}

export function Recursos({ prefs, tz, onAbrirEvento }: {
  prefs: Preferencias; tz: string; onAbrirEvento: (e: CalendarEvent) => void;
}) {
  const de = hojeYmd(tz);
  const ate = somaDias(de, 14);

  const qr = useQuery({ queryKey: chaves.recursos, queryFn: () => servico.getResources() });
  const qe = useQuery({
    queryKey: chaves.eventos({ de, ate, tz, recursos: true }),
    queryFn: () => servico.getEvents({
      de, ate, tz, calendars: (qr.data ?? []).map((c) => c.id),
    }),
    enabled: (qr.data?.length ?? 0) > 0,
  });

  if (qr.isError) return <EstadoErro erro={qr.error} onRetry={() => void qr.refetch()} />;
  if (qr.isLoading) return <div className="gc-tela"><SkeletonBloco linhas={4} altura={80} /></div>;

  const recursos = qr.data ?? [];
  if (!recursos.length) {
    return (
      <div className="gc-tela">
        <EstadoVazio titulo="Nenhum recurso cadastrado"
                     mensagem="Salas, showroom e veículos aparecem aqui quando existirem como calendários de recurso." />
      </div>
    );
  }

  const porRecurso = new Map<string, CalendarEvent[]>();
  for (const e of qe.data?.eventos ?? []) {
    const l = porRecurso.get(e.calendar_id) ?? [];
    l.push(e);
    porRecurso.set(e.calendar_id, l);
  }

  return (
    <div className="gc-tela">
      <div className="gc-recursos">
        {recursos.map((r) => {
          const reservas = porRecurso.get(r.id) ?? [];
          const conflitos = reservas.filter((e) => e.has_conflict).length;
          return (
            <Cartao key={r.id} titulo={r.summary}
                    acao={conflitos > 0
                      ? <span className="gc-tag gc-tag-conflito">
                          <Icone nome="triangle-alert" tamanho={12} /> {conflitos} conflito(s)
                        </span>
                      : <span className="gc-tag">{reservas.length} reserva(s)</span>}>
              <dl className="gc-defs">
                {r.capacity && <div><dt>Capacidade</dt><dd>{r.capacity} pessoas</dd></div>}
                {r.resource_location && <div><dt>Local</dt><dd>{r.resource_location}</dd></div>}
                <div><dt>Responsável</dt><dd>{r.owner}</dd></div>
                <div><dt>Acesso</dt><dd>{rotuloAcesso(r.access_role)}</dd></div>
              </dl>

              <h4 className="gc-sub">Próximas reservas (14 dias)</h4>
              {qe.isLoading && <SkeletonBloco linhas={3} altura={26} />}
              {!qe.isLoading && reservas.length === 0 && (
                <p className="gc-td-fraco">Livre em todo o período.</p>
              )}
              <ul className="gc-lista-simples">
                {reservas.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <LinhaEvento e={e} tz={tz}
                                 onAbrir={prefs.calendariosOcultos.includes(e.calendar_id) ? undefined : onAbrirEvento}
                                 mostrarData />
                  </li>
                ))}
              </ul>
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}
