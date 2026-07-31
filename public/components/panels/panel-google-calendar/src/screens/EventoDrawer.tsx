// screens/EventoDrawer.tsx — detalhe do evento, resposta a convite e exclusão.
// @version 1.0.0  @created 2026-07-29
//
// §19 (editar), §21 (participantes), §32.2 (ficha lateral do CRM),
// §45/§46 (visibilidade e ocupado/disponível), §59 (notificar ao cancelar).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servico } from '../services';
import type { CalendarEvent, EscopoSerie, RespostaConvite } from '../services/types';
import type { Preferencias } from '../shell/types';
import { Icone } from '../shell/Icone';
import { Pilula, PontoCalendario } from '../shell/ui';
import { rotuloAcesso } from '../shell/HeaderInterno';
import { dataHora, hora, duracao, horaSecundaria, rotuloFuso } from '../lib/tz';
import { ApiError, chaves } from '../lib/api';
import { SeletorVinculo, FichaVinculo } from './Vinculos';

interface Props {
  evento: CalendarEvent;
  tz: string;
  prefs: Preferencias;
  podeEscrever: boolean;
  papelCalendario: string;
  onFechar: () => void;
}

export function EventoDrawer({ evento: inicial, tz, prefs, podeEscrever, papelCalendario, onFechar }: Props) {
  const qc = useQueryClient();

  /**
     O drawer LÊ o evento da cache, não do snapshot que abriu a gaveta.

     Bug que isto corrige (existia desde a Fase 2 e só apareceu ao vincular):
     `eventoAberto` é um objeto congelado no clique. Depois de responder a um
     convite ou anexar um vínculo, o servidor respondia 201, as listas atrás
     atualizavam — e a gaveta continuava mostrando o estado velho, como se a
     ação não tivesse acontecido. Com `initialData`, abre instantâneo (sem
     piscar) e passa a refletir o servidor a cada `invalidateQueries`.
   */
  const q = useQuery({
    queryKey: chaves.evento(inicial.calendar_id, inicial.id),
    queryFn: () => servico.getEvent(inicial.calendar_id, inicial.id),
    initialData: inicial,
    staleTime: 0,
  });
  const evento = q.data ?? inicial;
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [notificar, setNotificar] = useState(false);
  const [escopo, setEscopo] = useState<EscopoSerie>('this');
  const [erro, setErro] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ['gcal'] });
  };

  const responder = useMutation({
    mutationFn: (r: RespostaConvite) =>
      servico.respondInvitation(evento.calendar_id, evento.id, r),
    onSuccess: () => { setErro(null); invalidar(); },
    onError: (e) => setErro(e instanceof ApiError ? e.message : 'Falha ao responder o convite.'),
  });

  const excluir = useMutation({
    mutationFn: () => servico.deleteEvent(evento.calendar_id, evento.id, notificar, escopo),
    onSuccess: () => { invalidar(); onFechar(); },
    onError: (e) => setErro(e instanceof ApiError ? e.message : 'Falha ao excluir o evento.'),
  });

  const segunda = prefs.fusoSecundario ? horaSecundaria(evento.start, tz, prefs.fusoSecundario) : null;
  const ehSerie = evento.recurring_event_id !== null;

  return (
    <aside className="gc-drawer" role="dialog" aria-modal="true"
           aria-label={`Detalhes de ${evento.summary}`}>
      <header className="gc-drawer-head">
        <div className="gc-drawer-id">
          <PontoCalendario cor={evento.calendar_color} nome={evento.calendar_summary} />
          <h3>{evento.summary}</h3>
        </div>
        <button type="button" className="gc-btn gc-btn-icone" onClick={onFechar}
                aria-label="Fechar detalhes"><Icone nome="x" tamanho={16} /></button>
      </header>

      <div className="gc-drawer-body">
        {evento.redacted && (
          <p className="gc-aviso gc-aviso-privado">
            <Icone nome="eye-off" tamanho={14} />
            Este calendário concede apenas livre/ocupado. Os detalhes do evento não são visíveis.
          </p>
        )}
        {evento.status === 'cancelled' && (
          <p className="gc-aviso gc-aviso-cancelado">
            <Icone nome="alerta" tamanho={14} /> Este evento foi cancelado.
          </p>
        )}

        <dl className="gc-drawer-defs">
          <div>
            <dt>Quando</dt>
            <dd>
              {evento.all_day
                ? `${evento.start} · dia inteiro`
                : `${dataHora(evento.start, tz)} — ${hora(evento.end, tz)}`}
              {!evento.all_day && <span className="gc-dur">{duracao(evento.duration_min ?? 0)}</span>}
            </dd>
          </div>

          {segunda && (
            <div>
              <dt>Fuso</dt>
              <dd className="gc-fuso-duplo">
                <span>{hora(evento.start, tz)} {rotuloFuso(tz)}</span>
                <span>{segunda} {rotuloFuso(prefs.fusoSecundario as string)}</span>
              </dd>
            </div>
          )}

          <div>
            <dt>Calendário</dt>
            <dd>{evento.calendar_summary ?? evento.calendar_id}
              <span className="gc-tag">{rotuloAcesso(papelCalendario)}</span></dd>
          </div>

          {evento.location && <div><dt>Local</dt><dd>{evento.location}</dd></div>}

          {evento.description && (
            <div><dt>Descrição</dt><dd className="gc-desc">{evento.description}</dd></div>
          )}

          <div>
            <dt>Mostrar como</dt>
            <dd>{evento.transparency === 'opaque' ? 'Ocupado' : 'Disponível'}</dd>
          </div>

          <div>
            <dt>Visibilidade</dt>
            <dd>{({ default: 'Padrão', public: 'Público', private: 'Privado',
                    confidential: 'Confidencial' } as Record<string, string>)[evento.visibility]}</dd>
          </div>

          {evento.recurrence && (
            <div><dt>Repetição</dt><dd>{evento.recurrence.human}</dd></div>
          )}

          <div>
            <dt>Organizador</dt>
            <dd>{evento.organizer.name}{evento.organizer.self && ' (você)'}</dd>
          </div>
        </dl>

        {evento.conference && (
          <div className="gc-conf">
            <div className="gc-conf-topo">
              <Icone nome="video" tamanho={15} />
              <strong>Google Meet</strong>
            </div>
            <a className="gc-btn gc-btn-primario" href={evento.conference.uri}
               target="_blank" rel="noopener noreferrer">Entrar na reunião</a>
            <button type="button" className="gc-btn gc-btn-fantasma"
                    onClick={() => void navigator.clipboard?.writeText(evento.conference!.uri)}>
              <Icone nome="copy" tamanho={13} /> Copiar link
            </button>
            {evento.conference.phone && (
              <p className="gc-conf-tel">Telefone: {evento.conference.phone}
                {evento.conference.pin && ` · PIN ${evento.conference.pin}`}</p>
            )}
          </div>
        )}

        {evento.attendees.length > 0 && (
          <section className="gc-drawer-sec">
            <h4>Participantes ({evento.attendees.length})</h4>
            <ul className="gc-participantes">
              {evento.attendees.map((a) => (
                <li key={a.email}>
                  <span className="gc-part-nome">
                    {a.name || a.email}
                    {a.self && <span className="gc-tag">você</span>}
                    {a.organizer && <span className="gc-tag">organizador</span>}
                    {a.optional && <span className="gc-tag">opcional</span>}
                    {a.external && <span className="gc-tag gc-tag-externo">externo</span>}
                  </span>
                  <Pilula resposta={a.response} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* §32.2 — ficha lateral: cada vínculo abre os dados vivos da origem
            (Pipedrive/Koala), sem sair do drawer. */}
        <section className="gc-drawer-sec">
          <h4>
            Relacionado
            {podeEscrever && (
              <button type="button" className="gc-btn gc-btn-fantasma gc-drawer-sec-acao"
                      onClick={() => setVinculando(true)}>
                <Icone nome="plus" tamanho={13} /> Vincular
              </button>
            )}
          </h4>
          {evento.links.length === 0 ? (
            <p className="gc-nota">
              Nenhum registro vinculado.
              {podeEscrever && ' Ligue este compromisso a um negócio, pessoa, organização ou proposta.'}
            </p>
          ) : (
            <ul className="gc-fichas">
              {evento.links.map((l) => (
                <FichaVinculo
                  key={`${l.entity_type}:${l.entity_id}`}
                  link={l}
                  evento={evento}
                  podeEditar={podeEscrever}
                  onNavegar={(rota) => { window.location.hash = rota; onFechar(); }}
                />
              ))}
            </ul>
          )}
        </section>

        {erro && <p className="gc-aviso gc-aviso-erro" role="alert">{erro}</p>}
      </div>

      <footer className="gc-drawer-foot">
        {!evento.is_organizer && evento.status !== 'cancelled' && (
          <div className="gc-resposta">
            <span className="gc-resposta-rot">Sua resposta:</span>
            <div className="gc-resposta-btns">
              {(['accepted', 'tentative', 'declined'] as RespostaConvite[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`gc-btn gc-btn-resp${evento.my_response === r ? ' is-ativo' : ''}`}
                  disabled={responder.isPending}
                  onClick={() => responder.mutate(r)}
                >
                  {({ accepted: 'Aceitar', tentative: 'Talvez', declined: 'Recusar' } as Record<string, string>)[r]}
                </button>
              ))}
            </div>
          </div>
        )}

        {podeEscrever && evento.status !== 'cancelled' && (
          <>
            {!confirmandoExclusao ? (
              <button type="button" className="gc-btn gc-btn-perigo"
                      onClick={() => setConfirmandoExclusao(true)}>
                <Icone nome="trash" tamanho={14} /> Excluir
              </button>
            ) : (
              <div className="gc-confirma">
                <p><strong>Excluir este evento?</strong></p>

                {ehSerie && (
                  <label className="gc-campo">
                    <span>Alcance</span>
                    <select value={escopo} onChange={(e) => setEscopo(e.target.value as EscopoSerie)}>
                      <option value="this">Somente este evento</option>
                      <option value="following">Este e os seguintes</option>
                      <option value="all">Toda a série</option>
                    </select>
                  </label>
                )}

                {evento.attendees.length > 0 && (
                  <label className="gc-check">
                    <input type="checkbox" checked={notificar}
                           onChange={(e) => setNotificar(e.target.checked)} />
                    <span>
                      Notificar os {evento.attendees.length} participantes sobre o cancelamento
                    </span>
                  </label>
                )}
                <p className="gc-nota">
                  {notificar
                    ? 'Todos os participantes receberão um e-mail de cancelamento.'
                    : 'Ninguém será avisado — o evento apenas sai das agendas.'}
                </p>

                <div className="gc-confirma-btns">
                  <button type="button" className="gc-btn gc-btn-perigo"
                          disabled={excluir.isPending} onClick={() => excluir.mutate()}>
                    {excluir.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
                  </button>
                  <button type="button" className="gc-btn gc-btn-fantasma"
                          onClick={() => setConfirmandoExclusao(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {!podeEscrever && (
          <p className="gc-nota">
            Você tem acesso de {rotuloAcesso(papelCalendario)} neste calendário — edição indisponível.
          </p>
        )}
      </footer>
      {vinculando && (
        <SeletorVinculo evento={evento} onFechar={() => setVinculando(false)} />
      )}
    </aside>
  );
}
