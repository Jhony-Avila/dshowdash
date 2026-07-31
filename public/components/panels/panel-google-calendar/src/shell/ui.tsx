// shell/ui.tsx — peças visuais compartilhadas do módulo.
// @version 1.0.0  @created 2026-07-29
import type { ReactNode } from 'react';
import { Icone } from './Icone';
import type { CalendarEvent, RespostaConvite } from '../services/types';
import { hora, duracao, diaCurto } from '../lib/tz';

export function Cartao({ titulo, acao, children, className }: {
  titulo?: string; acao?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`gc-card${className ? ' ' + className : ''}`}>
      {(titulo || acao) && (
        <header className="gc-card-head">
          {titulo && <h3 className="gc-card-titulo">{titulo}</h3>}
          {acao && <div className="gc-card-acao">{acao}</div>}
        </header>
      )}
      <div className="gc-card-body">{children}</div>
    </section>
  );
}

export function Kpi({ rotulo, valor, sufixo, icone, tom, dica, onClick }: {
  rotulo: string; valor: string | number; sufixo?: string; icone: string;
  tom?: 'neutro' | 'ok' | 'atencao' | 'alerta'; dica?: string; onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`gc-kpi gc-tom-${tom ?? 'neutro'}${onClick ? ' is-clicavel' : ''}`}
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      title={dica}
    >
      <span className="gc-kpi-icone"><Icone nome={icone} tamanho={18} /></span>
      <span className="gc-kpi-valor">{valor}{sufixo && <small>{sufixo}</small>}</span>
      <span className="gc-kpi-rotulo">{rotulo}</span>
    </Tag>
  );
}

const ROTULO_RESPOSTA: Record<RespostaConvite, string> = {
  accepted: 'Aceito', declined: 'Recusado', tentative: 'Talvez', needsAction: 'Aguardando',
};

export function Pilula({ resposta }: { resposta: RespostaConvite }) {
  return <span className={`gc-pilula gc-resp-${resposta}`}>{ROTULO_RESPOSTA[resposta]}</span>;
}

export function Severidade({ nivel }: { nivel: 'alta' | 'media' | 'baixa' }) {
  const rot = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[nivel];
  return <span className={`gc-sev gc-sev-${nivel}`}>{rot}</span>;
}

/**
 * Ponto colorido do calendário.
 *
 * §70: nunca depender SÓ da cor. Vem sempre acompanhado do nome do calendário
 * no title e, nas listas, do rótulo textual ao lado.
 */
export function PontoCalendario({ cor, nome }: { cor?: string | null; nome?: string }) {
  return (
    <span className="gc-ponto" style={{ background: cor ?? 'var(--gc-borda)' }}
          title={nome} role="img" aria-label={nome ? `Calendário ${nome}` : 'Calendário'} />
  );
}

const ICONE_TIPO: Record<string, string> = {
  focusTime: 'focus', outOfOffice: 'plane', workingLocation: 'map-pin', default: 'calendar-days',
};

/** Linha de evento reutilizada na timeline, nas listas e nos drawers. */
export function LinhaEvento({ e, tz, onAbrir, mostrarData }: {
  e: CalendarEvent; tz: string; onAbrir?: (e: CalendarEvent) => void; mostrarData?: boolean;
}) {
  const cancelado = e.status === 'cancelled';
  const conteudo = (
    <>
      <span className="gc-lev-hora">
        {/* Em listas que cruzam vários dias, a hora sozinha é ambígua —
            "09:00" de qual dia? Por isso a data entra acima dela. */}
        {mostrarData && <small>{diaCurto(e.start, tz)}</small>}
        {e.all_day ? 'Dia inteiro' : hora(e.start, tz)}
        {!e.all_day && <small>{duracao(e.duration_min ?? 0)}</small>}
      </span>
      <span className="gc-lev-corpo">
        <span className="gc-lev-titulo">
          <PontoCalendario cor={e.calendar_color} nome={e.calendar_summary} />
          {e.event_type !== 'default' && (
            <Icone nome={ICONE_TIPO[e.event_type] ?? 'calendar-days'} tamanho={14} />
          )}
          <span className={cancelado ? 'gc-riscado' : undefined}>{e.summary}</span>
          {e.redacted && <span className="gc-tag gc-tag-privado">privado</span>}
          {e.has_conflict && (
            <span className="gc-tag gc-tag-conflito" title="Conflito de horário">
              <Icone nome="triangle-alert" tamanho={12} /> conflito
            </span>
          )}
        </span>
        <span className="gc-lev-meta">
          {e.calendar_summary && <span>{e.calendar_summary}</span>}
          {e.location && <span>· {e.location}</span>}
          {e.attendees.length > 0 && <span>· {e.attendees.length} participante(s)</span>}
          {e.links.length > 0 && (
            <span className="gc-lev-vinculo">
              · <Icone nome="link" tamanho={12} /> {e.links[0].label}
            </span>
          )}
        </span>
      </span>
      <span className="gc-lev-fim">
        {!e.is_organizer && <Pilula resposta={e.my_response} />}
        {e.conference && <Icone nome="video" tamanho={14} />}
      </span>
    </>
  );

  if (!onAbrir) return <div className="gc-lev">{conteudo}</div>;
  return (
    <button type="button" className="gc-lev is-clicavel" onClick={() => onAbrir(e)}>
      {conteudo}
    </button>
  );
}

export function Chip({ texto, ativo, onClick, contagem }: {
  texto: string; ativo?: boolean; onClick?: () => void; contagem?: number;
}) {
  return (
    <button type="button" className={`gc-chip${ativo ? ' is-ativo' : ''}`}
            onClick={onClick} aria-pressed={ativo}>
      {texto}
      {contagem !== undefined && <span className="gc-chip-n">{contagem}</span>}
    </button>
  );
}
