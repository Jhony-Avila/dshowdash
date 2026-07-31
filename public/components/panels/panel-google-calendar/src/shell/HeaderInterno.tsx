// shell/HeaderInterno.tsx — cabeçalho do módulo (§12).
// @version 1.0.0  @created 2026-07-29
import type { RefObject } from 'react';
import { Icone } from './Icone';
import type { StatusIntegracao, CalendarSummary } from '../services/types';
import { desde } from '../lib/tz';

interface Props {
  status?: StatusIntegracao;
  calendarios: CalendarSummary[];
  ocultos: string[];
  busca: string;
  buscaRef?: RefObject<HTMLInputElement | null>;
  atualizando: boolean;
  subtitulo: string;
  onBusca: (v: string) => void;
  onToggleCalendario: (id: string) => void;
  onAtualizar: () => void;
  onNovoEvento: () => void;
  onConfiguracoes: () => void;
}

export function HeaderInterno({
  status, calendarios, ocultos, busca, buscaRef, atualizando, subtitulo,
  onBusca, onToggleCalendario, onAtualizar, onNovoEvento, onConfiguracoes,
}: Props) {
  const visiveis = calendarios.filter((c) => !ocultos.includes(c.id));

  const tomStatus = !status
    ? 'neutro'
    : status.accounts_with_problem > 0 ? 'alerta'
    : status.stale_calendars > 0 ? 'atencao'
    : status.mock ? 'mock' : 'ok';

  const textoStatus = !status
    ? 'verificando…'
    : status.accounts_with_problem > 0 ? `${status.accounts_with_problem} conta(s) com problema`
    : status.stale_calendars > 0 ? `${status.stale_calendars} calendário(s) desatualizado(s)`
    : status.mock ? 'demonstração'
    : 'conectado';

  return (
    <header className="gc-header">
      <div className="gc-header-linha1">
        <div className="gc-header-id">
          <span className="gc-header-icone"><Icone nome="calendar-days" tamanho={20} /></span>
          <div>
            <h2 className="gc-header-titulo">Google Calendar</h2>
            <p className="gc-header-sub">{subtitulo}</p>
          </div>
        </div>

        <div className="gc-header-acoes">
          <label className="gc-busca">
            <Icone nome="search" tamanho={14} />
            <input
              ref={buscaRef}
              type="search"
              value={busca}
              placeholder="Buscar evento, participante, local…"
              onChange={(ev) => onBusca(ev.target.value)}
              aria-label="Buscar na agenda"
            />
            {busca && (
              <button type="button" className="gc-busca-limpar" onClick={() => onBusca('')}
                      aria-label="Limpar busca"><Icone nome="x" tamanho={13} /></button>
            )}
          </label>

          <button type="button" className="gc-btn gc-btn-fantasma" onClick={onAtualizar}
                  disabled={atualizando} title="Atualizar dados">
            <Icone nome="refresh" tamanho={15} className={atualizando ? 'gc-girando' : undefined} />
            <span className="gc-so-desktop">Atualizar</span>
          </button>

          <button type="button" className="gc-btn gc-btn-primario" onClick={onNovoEvento}>
            <Icone nome="plus" tamanho={15} /> Novo evento
          </button>

          <button type="button" className="gc-btn gc-btn-icone" onClick={onConfiguracoes}
                  title="Configurações do módulo" aria-label="Configurações do módulo">
            <Icone nome="settings" tamanho={16} />
          </button>
        </div>
      </div>

      <div className="gc-header-linha2">
        <div className="gc-cal-chips" role="group" aria-label="Calendários exibidos">
          {calendarios.map((c) => {
            const on = !ocultos.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`gc-cal-chip${on ? ' is-ativo' : ''}`}
                onClick={() => onToggleCalendario(c.id)}
                aria-pressed={on}
                title={`${c.summary} — ${rotuloAcesso(c.access_role)}`}
              >
                <span className="gc-cal-cor" style={{ background: on ? c.color : 'transparent',
                                                      borderColor: c.color }} />
                {c.summary}
                {!on && <span className="gc-sr"> (oculto)</span>}
              </button>
            );
          })}
        </div>

        <div className={`gc-status gc-status-${tomStatus}`} title={status?.message}>
          <span className="gc-status-ponto" aria-hidden="true" />
          <span>{textoStatus}</span>
          <span className="gc-status-sep" aria-hidden="true">·</span>
          <span>{visiveis.length}/{calendarios.length} calendários</span>
          {status?.last_sync_at && (
            <>
              <span className="gc-status-sep" aria-hidden="true">·</span>
              <span>atualizado {desde(status.last_sync_at)}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function rotuloAcesso(p: string): string {
  return ({
    owner: 'proprietário',
    writer: 'pode editar',
    reader: 'somente leitura',
    freeBusyReader: 'somente livre/ocupado',
  } as Record<string, string>)[p] ?? p;
}
