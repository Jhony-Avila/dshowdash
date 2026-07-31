// screens/Conflitos.tsx — central de conflitos (§23) e alertas (§62).
// @version 1.0.0  @created 2026-07-29
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type { CalendarAlert } from '../services/types';
import { Cartao, Chip, Severidade } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { dataHora, hora, hojeYmd, somaDias } from '../lib/tz';

const ROTULO_TIPO: Record<string, string> = {
  sobreposicao: 'Sobreposição',
  deslocamento: 'Deslocamento insuficiente',
  foco: 'Invade bloco de foco',
  ausencia: 'Durante ausência',
  recurso: 'Recurso em duplicidade',
};

const SUGESTAO: Record<string, string> = {
  sobreposicao: 'Reagende um dos dois ou marque um como opcional.',
  deslocamento: 'Deixe pelo menos 15 min entre compromissos presenciais em locais diferentes.',
  foco: 'Mova a reunião para fora do bloco de foco, ou encurte o bloco.',
  ausencia: 'Recuse ou reagende — você estará fora do escritório.',
  recurso: 'Escolha outra sala ou ajuste o horário de uma das reservas.',
};

export function Conflitos({ tz, onAbrirPorId }: {
  tz: string; onAbrirPorId: (calendarId: string, eventId: string) => void;
}) {
  const [dias, setDias] = useState(14);
  const [severidade, setSeveridade] = useState<string | null>(null);

  const de = hojeYmd(tz);
  const ate = somaDias(de, dias);

  const q = useQuery({
    queryKey: chaves.conflitos({ de, ate, tz }),
    queryFn: () => servico.getConflicts({ de, ate, tz }),
  });

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const todos = q.data?.conflitos ?? [];
  const lista = severidade ? todos.filter((c) => c.severidade === severidade) : todos;
  const porTipo = q.data?.porTipo ?? {};

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          {[7, 14, 30].map((d) => (
            <Chip key={d} texto={`${d} dias`} ativo={dias === d} onClick={() => setDias(d)} />
          ))}
        </div>
        <div className="gc-chips">
          {(['alta', 'media', 'baixa'] as const).map((s) => (
            <Chip key={s} texto={{ alta: 'Alta', media: 'Média', baixa: 'Baixa' }[s]}
                  ativo={severidade === s}
                  onClick={() => setSeveridade((v) => (v === s ? null : s))} />
          ))}
          {severidade && (
            <button type="button" className="gc-btn gc-btn-fantasma"
                    onClick={() => setSeveridade(null)}>Limpar seleção</button>
          )}
        </div>
      </div>

      {Object.keys(porTipo).length > 0 && (
        <div className="gc-resumo-tipos">
          {Object.entries(porTipo).map(([t, n]) => (
            <span key={t} className="gc-tag">{ROTULO_TIPO[t] ?? t}: {n}</span>
          ))}
        </div>
      )}

      <Cartao>
        {q.isLoading && <SkeletonBloco linhas={5} altura={70} />}
        {!q.isLoading && lista.length === 0 && (
          <EstadoVazio titulo="Nenhum conflito no período"
                       mensagem="Sua agenda não tem sobreposições, deslocamentos apertados nem recursos duplicados." />
        )}
        <ul className="gc-conflitos">
          {lista.map((c) => (
            <li key={c.id} className={`gc-conflito gc-sev-borda-${c.severidade}`}>
              <div className="gc-conflito-topo">
                <Icone nome="triangle-alert" tamanho={15} />
                <strong>{ROTULO_TIPO[c.tipo] ?? c.tipo}</strong>
                <Severidade nivel={c.severidade} />
              </div>
              <p className="gc-conflito-msg">{c.mensagem}</p>

              <ul className="gc-conflito-eventos">
                {c.eventos.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="gc-td-link"
                            onClick={() => onAbrirPorId(e.calendar_id, e.id)}>
                      <span className="gc-conflito-hora">
                        {dataHora(e.start, tz)} — {hora(e.end, tz)}
                      </span>
                      <span>{e.summary}</span>
                      {e.location && <span className="gc-td-fraco">· {e.location}</span>}
                      {e.attendees_count > 0 && (
                        <span className="gc-td-fraco">· {e.attendees_count} participante(s)</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <p className="gc-conflito-sugestao">
                <Icone nome="info" tamanho={13} /> {SUGESTAO[c.tipo] ?? 'Revise os dois compromissos.'}
              </p>
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  );
}

const ROTULO_CATEGORIA: Record<string, string> = {
  agenda: 'Agenda', organizacao: 'Organização', tecnico: 'Técnico',
};

export function Alertas({ onIrParaSync, onIrParaContas }: {
  onIrParaSync: () => void; onIrParaContas: () => void;
}) {
  const [categoria, setCategoria] = useState<string | null>(null);

  const q = useQuery({
    queryKey: chaves.alertas(categoria),
    queryFn: () => servico.getAlerts(categoria),
  });

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const alertas = q.data?.alertas ?? [];
  const sev = q.data?.porSeveridade ?? {};

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          <Chip texto="Todos" ativo={categoria === null} onClick={() => setCategoria(null)} />
          {Object.entries(ROTULO_CATEGORIA).map(([id, label]) => (
            <Chip key={id} texto={label} ativo={categoria === id} onClick={() => setCategoria(id)} />
          ))}
        </div>
        <div className="gc-chips gc-chips-fim">
          <span className="gc-tag gc-sev-alta">Alta: {sev.alta ?? 0}</span>
          <span className="gc-tag gc-sev-media">Média: {sev.media ?? 0}</span>
          <span className="gc-tag gc-sev-baixa">Baixa: {sev.baixa ?? 0}</span>
        </div>
      </div>

      <Cartao>
        {q.isLoading && <SkeletonBloco linhas={6} altura={48} />}
        {!q.isLoading && alertas.length === 0 && (
          <EstadoVazio titulo="Nenhum alerta"
                       mensagem="Nada exigindo atenção na agenda, na organização ou na integração." />
        )}
        <ul className="gc-alertas">
          {alertas.map((a) => (
            <li key={a.id} className={`gc-alerta gc-sev-borda-${a.severidade}`}>
              <span className="gc-alerta-icone">
                <Icone nome={a.categoria === 'tecnico' ? 'refresh'
                           : a.categoria === 'agenda' ? 'calendar-days' : 'clock'} tamanho={15} />
              </span>
              <div className="gc-alerta-corpo">
                <div className="gc-alerta-topo">
                  <strong>{a.titulo}</strong>
                  <Severidade nivel={a.severidade} />
                  <span className="gc-tag">{ROTULO_CATEGORIA[a.categoria]}</span>
                </div>
                <p>{a.mensagem}</p>
              </div>
              {a.ref?.tipo === 'sync' && (
                <button type="button" className="gc-btn gc-btn-fantasma" onClick={onIrParaSync}>
                  Ver sincronização
                </button>
              )}
              {a.ref?.tipo === 'conta' && (
                <button type="button" className="gc-btn gc-btn-fantasma" onClick={onIrParaContas}>
                  Ver conta
                </button>
              )}
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  );
}

export type { CalendarAlert };
