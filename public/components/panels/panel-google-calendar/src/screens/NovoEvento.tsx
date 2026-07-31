// screens/NovoEvento.tsx — criação de evento (§17) com validação do §17.3.
// @version 1.0.0  @created 2026-07-29
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { servico } from '../services';
import { ApiError } from '../lib/api';
import type { CalendarSummary, Participante, Recorrencia } from '../services/types';
import { Icone } from '../shell/Icone';
import { paraIsoComOffset, rotuloFuso } from '../lib/tz';

interface Props {
  calendarios: CalendarSummary[];
  tz: string;
  /** Pré-preenchimento vindo de um clique na grade ou numa sugestão de horário. */
  inicioSugerido?: string | null;
  /** O que já foi digitado na criação rápida — "Mais opções" não pode perder isso. */
  tituloInicial?: string;
  emailsIniciais?: string;
  onFechar: () => void;
}

/** Só entram calendários em que o usuário realmente pode escrever (§17.3). */
function graváveis(cals: CalendarSummary[]): CalendarSummary[] {
  return cals.filter((c) => c.access_role === 'owner' || c.access_role === 'writer');
}

const RECORRENCIAS: Array<{ id: string; label: string; regra: Recorrencia | null }> = [
  { id: 'nao',      label: 'Não se repete', regra: null },
  { id: 'diario',   label: 'Todos os dias',
    regra: { rrule: 'RRULE:FREQ=DAILY', human: 'Todos os dias' } },
  { id: 'uteis',    label: 'Todos os dias úteis',
    regra: { rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', human: 'Todos os dias úteis' } },
  { id: 'semanal',  label: 'Toda semana',
    regra: { rrule: 'RRULE:FREQ=WEEKLY', human: 'Toda semana' } },
  { id: 'quinzenal', label: 'A cada 2 semanas',
    regra: { rrule: 'RRULE:FREQ=WEEKLY;INTERVAL=2', human: 'A cada 2 semanas' } },
  { id: 'mensal',   label: 'Todo mês',
    regra: { rrule: 'RRULE:FREQ=MONTHLY', human: 'Todo mês' } },
];

export function NovoEvento({ calendarios, tz, inicioSugerido, tituloInicial, emailsIniciais, onFechar }: Props) {
  const cals = graváveis(calendarios);
  const qc = useQueryClient();

  const base = inicioSugerido ? new Date(inicioSugerido) : proximaHoraCheia();
  const fim = new Date(base.getTime() + 60 * 60 * 1000);

  const [calendarId, setCalendarId] = useState(cals[0]?.id ?? '');
  const [titulo, setTitulo] = useState(tituloInicial ?? '');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [data, setData] = useState(isoData(base));
  const [horaIni, setHoraIni] = useState(isoHora(base));
  const [dataFim, setDataFim] = useState(isoData(fim));
  const [horaFim, setHoraFim] = useState(isoHora(fim));
  const [ocupado, setOcupado] = useState(true);
  const [visibilidade, setVisibilidade] = useState<'default' | 'private' | 'public'>('default');
  const [recorrencia, setRecorrencia] = useState('nao');
  const [comMeet, setComMeet] = useState(false);
  const [emails, setEmails] = useState(emailsIniciais ?? '');
  const [lembrete, setLembrete] = useState(10);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const criar = useMutation({
    mutationFn: () => {
      const attendees: Participante[] = emails
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({
          name: email.split('@')[0], email, response: 'needsAction' as const,
          external: !email.endsWith('@dshow.com.br'),
        }));

      const inicio = diaInteiro ? data : paraIsoComOffset(data, horaIni, tz);
      const termino = diaInteiro
        ? somaUmDia(dataFim)
        : paraIsoComOffset(dataFim, horaFim, tz);

      return servico.createEvent({
        calendar_id: calendarId,
        summary: titulo,
        description: descricao || null,
        location: local || null,
        all_day: diaInteiro,
        start: inicio,
        end: termino,
        time_zone: tz,
        transparency: ocupado ? 'opaque' : 'transparent',
        visibility: visibilidade,
        attendees,
        conference: comMeet
          ? { platform: 'meet', uri: 'https://meet.google.com/novo', code: 'novo' }
          : null,
        reminders: [{ method: 'popup', minutes: lembrete }],
        recurrence: RECORRENCIAS.find((r) => r.id === recorrencia)?.regra ?? null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['gcal'] });
      onFechar();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.meta?.campos) {
        setErros(e.meta.campos as Record<string, string>);
        setErroGeral(e.message);
      } else {
        setErroGeral(e instanceof ApiError ? e.message : 'Não foi possível criar o evento.');
      }
    },
  });

  /** Validação local: o servidor revalida, mas errar duas vezes ida-e-volta irrita. */
  function validarLocal(): boolean {
    const e: Record<string, string> = {};
    if (!titulo.trim()) e.summary = 'Informe um título.';
    if (!calendarId) e.calendar_id = 'Escolha um calendário com permissão de escrita.';
    if (!diaInteiro) {
      const i = new Date(`${data}T${horaIni}`);
      const f = new Date(`${dataFim}T${horaFim}`);
      if (f <= i) e.end = 'O término deve ser posterior ao início.';
    } else if (dataFim < data) {
      e.end = 'A data final deve ser igual ou posterior à inicial.';
    }
    for (const em of emails.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean)) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { e.attendees = `E-mail inválido: ${em}`; break; }
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  if (cals.length === 0) {
    return (
      <div className="gc-modal-fundo" role="presentation" onClick={onFechar}>
        <div className="gc-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h3>Nenhum calendário com permissão de escrita</h3>
          <p className="gc-nota">
            Todos os calendários conectados são de leitura ou apenas livre/ocupado.
          </p>
          <div className="gc-modal-acoes">
            <button type="button" className="gc-btn gc-btn-fantasma" onClick={onFechar}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gc-modal-fundo" role="presentation" onClick={onFechar}>
      <div className="gc-modal gc-modal-largo" role="dialog" aria-modal="true"
           aria-label="Novo evento" onClick={(e) => e.stopPropagation()}>
        <header className="gc-modal-head">
          <h3>Novo evento</h3>
          <button type="button" className="gc-btn gc-btn-icone" onClick={onFechar}
                  aria-label="Fechar"><Icone nome="x" tamanho={16} /></button>
        </header>

        <form className="gc-form" onSubmit={(ev) => {
          ev.preventDefault();
          setErroGeral(null);
          if (validarLocal()) criar.mutate();
        }}>
          <label className="gc-campo">
            <span>Título *</span>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
                   placeholder="Ex.: Reunião comercial — Cliente XYZ"
                   aria-invalid={!!erros.summary} autoFocus />
            {erros.summary && <em className="gc-erro-campo">{erros.summary}</em>}
          </label>

          <div className="gc-form-linha">
            <label className="gc-campo">
              <span>Calendário</span>
              <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
                {cals.map((c) => <option key={c.id} value={c.id}>{c.summary}</option>)}
              </select>
              {erros.calendar_id && <em className="gc-erro-campo">{erros.calendar_id}</em>}
            </label>

            <label className="gc-check">
              <input type="checkbox" checked={diaInteiro}
                     onChange={(e) => setDiaInteiro(e.target.checked)} />
              <span>Dia inteiro</span>
            </label>
          </div>

          <div className="gc-form-linha">
            <label className="gc-campo">
              <span>{diaInteiro ? 'De' : 'Início'}</span>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </label>
            {!diaInteiro && (
              <label className="gc-campo gc-campo-hora">
                <span className="gc-sr">Hora de início</span>
                <input type="time" value={horaIni} onChange={(e) => setHoraIni(e.target.value)} />
              </label>
            )}
            <label className="gc-campo">
              <span>{diaInteiro ? 'Até' : 'Término'}</span>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                     aria-invalid={!!erros.end} />
            </label>
            {!diaInteiro && (
              <label className="gc-campo gc-campo-hora">
                <span className="gc-sr">Hora de término</span>
                <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)}
                       aria-invalid={!!erros.end} />
              </label>
            )}
          </div>
          {erros.end && <em className="gc-erro-campo">{erros.end}</em>}

          <p className="gc-nota">
            Horários no fuso <strong>{rotuloFuso(tz)}</strong>.
            {diaInteiro && ' Evento de dia inteiro não tem hora nem fuso — é um intervalo de datas.'}
          </p>

          <div className="gc-form-linha">
            <label className="gc-campo">
              <span>Local</span>
              <input value={local} onChange={(e) => setLocal(e.target.value)}
                     placeholder="Sala, endereço ou 'Google Meet'" />
            </label>
            <label className="gc-check">
              <input type="checkbox" checked={comMeet} onChange={(e) => setComMeet(e.target.checked)} />
              <span>Adicionar link do Google Meet</span>
            </label>
          </div>

          <label className="gc-campo">
            <span>Participantes</span>
            <input value={emails} onChange={(e) => setEmails(e.target.value)}
                   placeholder="email@empresa.com, outro@cliente.com"
                   aria-invalid={!!erros.attendees} />
            {erros.attendees && <em className="gc-erro-campo">{erros.attendees}</em>}
          </label>

          <label className="gc-campo">
            <span>Descrição</span>
            <textarea value={descricao} rows={3}
                      onChange={(e) => setDescricao(e.target.value)} />
          </label>

          <div className="gc-form-linha">
            <label className="gc-campo">
              <span>Repetição</span>
              <select value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)}>
                {RECORRENCIAS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <label className="gc-campo">
              <span>Mostrar como</span>
              <select value={ocupado ? '1' : '0'} onChange={(e) => setOcupado(e.target.value === '1')}>
                <option value="1">Ocupado</option>
                <option value="0">Disponível</option>
              </select>
            </label>
            <label className="gc-campo">
              <span>Visibilidade</span>
              <select value={visibilidade}
                      onChange={(e) => setVisibilidade(e.target.value as 'default' | 'private' | 'public')}>
                <option value="default">Padrão do calendário</option>
                <option value="private">Privado</option>
                <option value="public">Público</option>
              </select>
            </label>
            <label className="gc-campo">
              <span>Lembrete</span>
              <select value={lembrete} onChange={(e) => setLembrete(Number(e.target.value))}>
                {[5, 10, 15, 30, 60, 1440].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min antes` : m === 60 ? '1 h antes' : '1 dia antes'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {erroGeral && <p className="gc-aviso gc-aviso-erro" role="alert">{erroGeral}</p>}

          <div className="gc-modal-acoes">
            <button type="submit" className="gc-btn gc-btn-primario" disabled={criar.isPending}>
              {criar.isPending ? 'Salvando…' : emails.trim() ? 'Salvar e enviar convites' : 'Salvar'}
            </button>
            <button type="button" className="gc-btn gc-btn-fantasma" onClick={onFechar}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function proximaHoraCheia(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  return d;
}
function isoData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isoHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
/** Dia inteiro no Google é [início, fim) — o fim é exclusivo. */
function somaUmDia(ymdStr: string): string {
  const [a, m, d] = ymdStr.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}
