// screens/CriacaoRapida.tsx — popover compacto de criação (§18).
// @version 1.0.0  @created 2026-07-30
//
// Aparece ao arrastar uma faixa vazia na agenda. A ideia do §18 é criar sem
// ABANDONAR a agenda: título, horário, calendário, participantes e pronto —
// "Mais opções" leva ao formulário completo com o que já foi digitado.
//
// Posicionado com @floating-ui/react (já instalado): sozinho, um popover em
// `position:absolute` sai da tela quando o clique é na última coluna da semana.
import { useEffect, useRef, useState } from 'react';
import {
  useFloating, autoUpdate, offset, flip, shift, FloatingFocusManager,
  useDismiss, useRole, useInteractions,
} from '@floating-ui/react';
import type { CalendarSummary, PayloadEvento } from '../services/types';
import { Icone } from '../shell/Icone';
import { hora, diaCurto } from '../lib/tz';

interface Props {
  ancora: { x: number; y: number };
  inicio: string;
  fim: string;
  diaInteiro: boolean;
  tz: string;
  calendarios: CalendarSummary[];
  salvando: boolean;
  onSalvar: (p: PayloadEvento) => void;
  onMaisOpcoes: (parcial: { titulo: string; emails: string }) => void;
  onFechar: () => void;
}

export function CriacaoRapida({
  ancora, inicio, fim, diaInteiro, tz, calendarios, salvando,
  onSalvar, onMaisOpcoes, onFechar,
}: Props) {
  const graváveis = calendarios.filter((c) => c.access_role === 'owner' || c.access_role === 'writer');
  const [titulo, setTitulo] = useState('');
  const [calendarId, setCalendarId] = useState(graváveis[0]?.id ?? '');
  const [emails, setEmails] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: true,
    onOpenChange: (aberto) => { if (!aberto) onFechar(); },
    placement: 'right-start',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  // Âncora virtual: o clique não tem elemento, tem coordenada.
  useEffect(() => {
    refs.setPositionReference({
      getBoundingClientRect: () => ({
        width: 0, height: 0,
        x: ancora.x, y: ancora.y,
        top: ancora.y, left: ancora.x, right: ancora.x, bottom: ancora.y,
      }),
    });
  }, [ancora, refs]);

  const dismiss = useDismiss(context, { outsidePress: true, escapeKey: true });
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function salvar() {
    if (!titulo.trim() || !calendarId) return;
    const attendees = emails.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean)
      .map((email) => ({
        name: email.split('@')[0], email, response: 'needsAction' as const,
        external: !email.endsWith('@dshow.com.br'),
      }));
    onSalvar({
      calendar_id: calendarId, summary: titulo.trim(),
      start: inicio, end: fim, all_day: diaInteiro, time_zone: tz,
      attendees, reminders: [{ method: 'popup', minutes: 10 }],
    });
  }

  const quando = diaInteiro
    ? `${diaCurto(inicio, tz)} · dia inteiro`
    : `${diaCurto(inicio, tz)} · ${hora(inicio, tz)} — ${hora(fim, tz)}`;

  return (
    <FloatingFocusManager context={context} modal={false}>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="gc-popover gc-criacao"
        aria-label="Criação rápida de evento"
        {...getFloatingProps()}
      >
        <div className="gc-popover-seta" aria-hidden="true" />

        <form onSubmit={(e) => { e.preventDefault(); salvar(); }}>
          <input
            ref={inputRef}
            className="gc-criacao-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Adicionar título"
            aria-label="Título do evento"
          />

          <p className="gc-criacao-quando">
            <Icone nome="clock" tamanho={13} /> {quando}
          </p>

          <label className="gc-criacao-linha">
            <Icone nome="layers" tamanho={13} />
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}
                    aria-label="Calendário">
              {graváveis.map((c) => <option key={c.id} value={c.id}>{c.summary}</option>)}
            </select>
          </label>

          <label className="gc-criacao-linha">
            <Icone nome="users" tamanho={13} />
            <input value={emails} onChange={(e) => setEmails(e.target.value)}
                   placeholder="Convidar (e-mails)" aria-label="Participantes" />
          </label>

          <div className="gc-criacao-acoes">
            <button type="submit" className="gc-btn gc-btn-primario"
                    disabled={!titulo.trim() || salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="gc-btn gc-btn-fantasma"
                    onClick={() => onMaisOpcoes({ titulo, emails })}>
              Mais opções
            </button>
            <button type="button" className="gc-btn gc-btn-icone" onClick={onFechar}
                    aria-label="Cancelar"><Icone nome="x" tamanho={14} /></button>
          </div>
        </form>
      </div>
    </FloatingFocusManager>
  );
}
