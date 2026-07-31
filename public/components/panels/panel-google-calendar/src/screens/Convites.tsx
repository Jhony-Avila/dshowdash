// screens/Convites.tsx — central de convites (§44).
// @version 1.0.0  @created 2026-07-29
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves, ApiError } from '../lib/api';
import type { CalendarEvent, RespostaConvite } from '../services/types';
import { Cartao, Chip, Pilula, PontoCalendario } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { dataHora, duracao, hojeYmd, somaDias } from '../lib/tz';

const CATEGORIAS = [
  { id: null,          label: 'Todos' },
  { id: 'aguardando',  label: 'Aguardando' },
  { id: 'aceitos',     label: 'Aceitos' },
  { id: 'talvez',      label: 'Talvez' },
  { id: 'recusados',   label: 'Recusados' },
  { id: 'cancelados',  label: 'Cancelados' },
] as const;

export function Convites({ tz, onAbrirEvento }: {
  tz: string; onAbrirEvento: (e: CalendarEvent) => void;
}) {
  const [categoria, setCategoria] = useState<string | null>('aguardando');
  const [confirmando, setConfirmando] = useState<{ e: CalendarEvent; r: RespostaConvite } | null>(null);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const qc = useQueryClient();

  const de = hojeYmd(tz);
  const ate = somaDias(de, 60);

  const q = useQuery({
    queryKey: chaves.convites({ de, ate, tz, categoria }),
    queryFn: () => servico.getInvitations({ de, ate, tz, categoria }),
  });

  const responder = useMutation({
    mutationFn: ({ e, r, c }: { e: CalendarEvent; r: RespostaConvite; c: string }) =>
      servico.respondInvitation(e.calendar_id, e.id, r, c || undefined),
    onSuccess: () => {
      setErro(null); setConfirmando(null); setComentario('');
      void qc.invalidateQueries({ queryKey: ['gcal'] });
    },
    onError: (e) => setErro(e instanceof ApiError ? e.message : 'Falha ao enviar a resposta.'),
  });

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const convites = q.data?.convites ?? [];
  const contagens = q.data?.porCategoria ?? {};

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          {CATEGORIAS.map((c) => (
            <Chip key={c.label} texto={c.label} ativo={categoria === c.id}
                  contagem={c.id ? contagens[c.id] ?? 0 : undefined}
                  onClick={() => setCategoria(c.id)} />
          ))}
        </div>
      </div>

      {erro && <p className="gc-aviso gc-aviso-erro" role="alert">{erro}</p>}

      <Cartao>
        {q.isLoading && <SkeletonBloco linhas={6} altura={54} />}
        {!q.isLoading && convites.length === 0 && (
          <EstadoVazio
            titulo="Nenhum convite nesta categoria"
            mensagem="Convites de outras pessoas para os próximos 60 dias aparecem aqui."
          />
        )}
        <ul className="gc-convites">
          {convites.map((e) => (
            <li key={`${e.calendar_id}:${e.id}`} className="gc-convite">
              <div className="gc-convite-info">
                <div className="gc-convite-titulo">
                  <PontoCalendario cor={e.calendar_color} nome={e.calendar_summary} />
                  <strong className={e.status === 'cancelled' ? 'gc-riscado' : undefined}>
                    {e.summary}
                  </strong>
                  <Pilula resposta={e.my_response} />
                  {e.has_conflict && (
                    <span className="gc-tag gc-tag-conflito">
                      <Icone nome="triangle-alert" tamanho={12} /> conflita
                    </span>
                  )}
                </div>
                <div className="gc-convite-meta">
                  <span>{e.all_day ? `${e.start} · dia inteiro` : dataHora(e.start, tz)}</span>
                  {!e.all_day && <span>· {duracao(e.duration_min ?? 0)}</span>}
                  <span>· organizado por {e.organizer.name}</span>
                  {e.attendees.length > 0 && <span>· {e.attendees.length} participante(s)</span>}
                </div>
                {e.links.length > 0 && (
                  <div className="gc-convite-vinculo">
                    <Icone nome="link" tamanho={12} /> {e.links[0].label}
                  </div>
                )}
              </div>

              <div className="gc-convite-acoes">
                {e.status !== 'cancelled' && (['accepted', 'tentative', 'declined'] as RespostaConvite[]).map((r) => (
                  <button
                    key={r} type="button"
                    className={`gc-btn gc-btn-resp${e.my_response === r ? ' is-ativo' : ''}`}
                    onClick={() => { setConfirmando({ e, r }); setComentario(''); }}
                  >
                    {({ accepted: 'Aceitar', tentative: 'Talvez', declined: 'Recusar' } as Record<string, string>)[r]}
                  </button>
                ))}
                <button type="button" className="gc-btn gc-btn-fantasma"
                        onClick={() => onAbrirEvento(e)}>Detalhes</button>
              </div>
            </li>
          ))}
        </ul>
      </Cartao>

      {confirmando && (
        <div className="gc-modal-fundo" role="presentation" onClick={() => setConfirmando(null)}>
          <div className="gc-modal" role="dialog" aria-modal="true" aria-label="Confirmar resposta"
               onClick={(ev) => ev.stopPropagation()}>
            <h3>Confirmar resposta</h3>

            {/* §44.3: mostrar consequências ANTES de enviar. Uma recusa dispara
                e-mail para o organizador — não é ação para acontecer por engano. */}
            <dl className="gc-defs">
              <div><dt>Evento</dt><dd>{confirmando.e.summary}</dd></div>
              <div><dt>Quando</dt><dd>{confirmando.e.all_day
                ? confirmando.e.start : dataHora(confirmando.e.start, tz)}</dd></div>
              <div><dt>Organizador</dt><dd>{confirmando.e.organizer.name}</dd></div>
              <div><dt>Participantes</dt><dd>{confirmando.e.attendees.length}</dd></div>
              <div><dt>Sua resposta</dt><dd>
                {({ accepted: 'Aceitar', tentative: 'Talvez', declined: 'Recusar' } as Record<string, string>)[confirmando.r]}
              </dd></div>
            </dl>

            <label className="gc-campo">
              <span>Comentário (opcional)</span>
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                        rows={3} maxLength={500}
                        placeholder="Ex.: consigo participar só na primeira meia hora." />
            </label>

            <p className="gc-nota">
              O organizador receberá sua resposta{comentario ? ' e o comentário acima' : ''}.
            </p>

            <div className="gc-modal-acoes">
              <button type="button" className="gc-btn gc-btn-primario"
                      disabled={responder.isPending}
                      onClick={() => responder.mutate({ e: confirmando.e, r: confirmando.r, c: comentario })}>
                {responder.isPending ? 'Enviando…' : 'Enviar resposta'}
              </button>
              <button type="button" className="gc-btn gc-btn-fantasma"
                      onClick={() => setConfirmando(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
