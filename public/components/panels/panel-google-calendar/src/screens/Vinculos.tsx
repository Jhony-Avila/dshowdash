// screens/Vinculos.tsx — seletor de vínculo e ficha lateral (§32, §32.2, §34, §57).
// @version 1.0.0  @created 2026-07-30
//
// Estes dois componentes são o ponto onde a agenda encosta no resto do Dshow
// Dash. O evento é simulado (Fase 2), mas o NEGÓCIO, a PESSOA e a PROPOSTA que
// ele referencia são registros REAIS de PIPE_DSHOW e do Koala — por isso a UI
// diz de onde cada resultado veio, em vez de misturar tudo numa lista só.
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves, ApiError } from '../lib/api';
import type { CalendarEvent, FichaEntidade, ResultadoVinculo, VinculoInterno } from '../services/types';
import { Icone } from '../shell/Icone';
import { useToast } from '../shell/Toasts';
import { EstadoVazio, SkeletonBloco } from './Estados';

const ROTULO_TIPO: Record<string, string> = {
  pipedrive_deal: 'Negócio', pessoa: 'Pessoa', organizacao: 'Organização',
  proposta: 'Proposta', cliente: 'Cliente', fornecedor: 'Fornecedor',
  pedido: 'Pedido', projeto: 'Projeto', colaborador: 'Colaborador',
};

const ICONE_TIPO: Record<string, string> = {
  pipedrive_deal: 'briefcase', pessoa: 'users', organizacao: 'building',
  proposta: 'file-text', cliente: 'users', fornecedor: 'briefcase',
};

export function rotuloTipoVinculo(t: string): string {
  return ROTULO_TIPO[t] ?? t;
}

/* ══════════════════════════════════════════════════════════════════════
   Seletor: busca em Pipedrive/Koala e anexa ao evento
   ══════════════════════════════════════════════════════════════════════ */

export function SeletorVinculo({ evento, onFechar }: {
  evento: CalendarEvent; onFechar: () => void;
}) {
  const [termo, setTermo] = useState('');
  const [tipo, setTipo] = useState<string | null>(null);
  const [debounced, setDebounced] = useState('');
  const qc = useQueryClient();
  const toast = useToast();

  // Debounce: cada tecla dispararia um full scan de 19,9 mil negócios.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(termo.trim()), 320);
    return () => clearTimeout(t);
  }, [termo]);

  const qTipos = useQuery({
    queryKey: chaves.tiposVinculo,
    queryFn: () => servico.getTiposVinculo(),
    staleTime: 10 * 60_000,
  });

  const q = useQuery({
    queryKey: chaves.buscaVinculo(debounced, tipo),
    queryFn: () => servico.buscarVinculos(debounced, tipo),
    enabled: debounced.length >= 2,
  });

  const vincular = useMutation({
    mutationFn: (r: ResultadoVinculo) =>
      servico.vincular(evento.calendar_id, evento.id, {
        entity_type: r.entity_type, entity_id: r.entity_id,
      }),
    onSuccess: (_e, r) => {
      toast.mostrar('ok', `Vinculado a "${r.label}".`);
      void qc.invalidateQueries({ queryKey: ['gcal'] });
      onFechar();
    },
    onError: (e) => toast.mostrar('erro',
      e instanceof ApiError ? e.message : 'Não foi possível vincular.'),
  });

  const jaVinculados = useMemo(
    () => new Set((evento.links ?? []).map((l) => `${l.entity_type}:${l.entity_id}`)),
    [evento.links]
  );

  return (
    <div className="gc-modal-fundo" role="presentation" onClick={onFechar}>
      <div className="gc-modal" role="dialog" aria-modal="true"
           aria-label="Vincular a um registro interno" onClick={(e) => e.stopPropagation()}>
        <header className="gc-modal-head">
          <h3>Vincular a um registro</h3>
          <button type="button" className="gc-btn gc-btn-icone" onClick={onFechar}
                  aria-label="Fechar"><Icone nome="x" tamanho={16} /></button>
        </header>

        <label className="gc-campo">
          <span className="gc-sr">Buscar</span>
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar negócio, pessoa, organização ou proposta…"
            autoFocus
          />
        </label>

        <div className="gc-chips" style={{ marginTop: 8 }}>
          <button type="button" className={`gc-chip${tipo === null ? ' is-ativo' : ''}`}
                  onClick={() => setTipo(null)}>Tudo</button>
          {(qTipos.data ?? []).map((t) => (
            <button key={t.id} type="button"
                    className={`gc-chip${tipo === t.id ? ' is-ativo' : ''}`}
                    onClick={() => setTipo(t.id)}
                    title={`Fonte: ${t.fonte}`}>
              {t.rotulo}
            </button>
          ))}
        </div>

        <div className="gc-vinc-resultados">
          {debounced.length < 2 && (
            <p className="gc-nota">Digite pelo menos 2 caracteres. A busca consulta o Pipedrive e o Koala ao vivo.</p>
          )}
          {q.isLoading && <SkeletonBloco linhas={5} altura={38} />}

          {q.data?.degradado.map((d) => (
            <p key={d} className="gc-aviso gc-aviso-erro"><Icone nome="alerta" tamanho={13} /> {d}</p>
          ))}

          {q.data && q.data.itens.length === 0 && debounced.length >= 2 && !q.isLoading && (
            <EstadoVazio titulo="Nada encontrado"
                         mensagem="Tente outro termo ou troque o tipo de registro." />
          )}

          <ul className="gc-vinc-lista">
            {(q.data?.itens ?? []).map((r) => {
              const ja = jaVinculados.has(`${r.entity_type}:${r.entity_id}`);
              return (
                <li key={`${r.entity_type}:${r.entity_id}`}>
                  <button
                    type="button"
                    className="gc-vinc-item"
                    disabled={ja || vincular.isPending}
                    onClick={() => vincular.mutate(r)}
                  >
                    <span className="gc-vinc-ic"><Icone nome={ICONE_TIPO[r.entity_type] ?? 'link'} tamanho={15} /></span>
                    <span className="gc-vinc-corpo">
                      <span className="gc-vinc-label">
                        {r.label}
                        {r.status === 'won' && <span className="gc-tag gc-tag-ok">ganho</span>}
                        {r.status === 'lost' && <span className="gc-tag gc-tag-conflito">perdido</span>}
                      </span>
                      <span className="gc-vinc-sub">
                        {ROTULO_TIPO[r.entity_type] ?? r.entity_type}
                        {r.sublabel && ` · ${r.sublabel}`}
                      </span>
                      {Object.keys(r.extra).length > 0 && (
                        <span className="gc-vinc-extra">
                          {Object.entries(r.extra).map(([k, v]) => (
                            <span key={k}>{k}: {v}</span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="gc-vinc-fim">
                      <span className="gc-tag">{r.fonte}</span>
                      {ja ? <span className="gc-tag gc-tag-ok">vinculado</span>
                          : <Icone nome="plus" tamanho={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {q.data && q.data.fontes.length > 0 && (
            <p className="gc-nota">Fontes consultadas: {q.data.fontes.join(', ')}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Ficha lateral (§32.2)
   ══════════════════════════════════════════════════════════════════════ */

export function FichaVinculo({ link, evento, podeEditar, onNavegar }: {
  link: VinculoInterno;
  evento: CalendarEvent;
  podeEditar: boolean;
  onNavegar: (rota: string) => void;
}) {
  const [aberta, setAberta] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const q = useQuery<FichaEntidade>({
    queryKey: chaves.ficha(link.entity_type, link.entity_id),
    queryFn: () => servico.getFichaEntidade(link.entity_type, link.entity_id),
    enabled: aberta,
    retry: false,          // 404 aqui é resposta, não falha a repetir
  });

  const desvincular = useMutation({
    mutationFn: () => servico.desvincular(evento.calendar_id, evento.id,
                                          link.entity_type, link.entity_id),
    onSuccess: () => {
      toast.mostrar('ok', 'Vínculo removido.');
      void qc.invalidateQueries({ queryKey: ['gcal'] });
    },
    onError: (e) => toast.mostrar('erro',
      e instanceof ApiError ? e.message : 'Não foi possível remover o vínculo.'),
  });

  // 404 = a entidade sumiu na origem. O vínculo continua no evento; mostramos
  // o rótulo guardado e avisamos, em vez de esconder ou quebrar.
  const sumiu = q.error instanceof ApiError && q.error.status === 404;

  return (
    <li className="gc-ficha">
      <button type="button" className="gc-ficha-cabeca" onClick={() => setAberta((v) => !v)}
              aria-expanded={aberta}>
        <span className="gc-vinc-ic"><Icone nome={ICONE_TIPO[link.entity_type] ?? 'link'} tamanho={14} /></span>
        <span className="gc-ficha-id">
          <span className="gc-vinculo-tipo">{ROTULO_TIPO[link.entity_type] ?? link.entity_type}</span>
          <strong>{link.label}</strong>
          {link.extra && (
            <span className="gc-vinculo-extras">
              {Object.entries(link.extra).map(([k, v]) => <span key={k}>{k}: {v}</span>)}
            </span>
          )}
        </span>
        <Icone nome={aberta ? 'chevron-down' : 'chevron-right'} tamanho={14} />
      </button>

      {aberta && (
        <div className="gc-ficha-corpo">
          {q.isLoading && <SkeletonBloco linhas={4} altura={16} />}

          {sumiu && (
            <p className="gc-aviso gc-aviso-cancelado">
              <Icone nome="alerta" tamanho={13} />
              Este registro não existe mais na origem. O vínculo foi mantido para histórico.
            </p>
          )}

          {q.data && (
            <>
              <dl className="gc-defs">
                {q.data.campos.map((c) => (
                  <div key={c.rotulo}>
                    <dt>{c.rotulo}</dt>
                    <dd className={c.destaque ? 'gc-ficha-destaque' : undefined}>{c.valor}</dd>
                  </div>
                ))}
              </dl>

              {q.data.atividades.length > 0 && (
                <>
                  <h5 className="gc-ficha-sub">Últimas atividades</h5>
                  <ul className="gc-ficha-atividades">
                    {q.data.atividades.map((a, i) => (
                      <li key={i} className={a.feita ? 'is-feita' : undefined}>
                        <Icone nome={a.feita ? 'check' : 'clock'} tamanho={12} />
                        <span>{a.titulo}</span>
                        <span className="gc-td-fraco">{a.quando}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="gc-ficha-acoes">
                <button type="button" className="gc-btn gc-btn-fantasma"
                        onClick={() => onNavegar(q.data!.rota)}>
                  <Icone nome="external-link" tamanho={13} /> Abrir no {q.data.fonte}
                </button>
                {q.data.url && (
                  <a className="gc-btn gc-btn-fantasma" href={q.data.url}
                     target="_blank" rel="noopener noreferrer">
                    <Icone nome="globe" tamanho={13} /> Link público
                  </a>
                )}
              </div>
            </>
          )}

          {podeEditar && (
            <button type="button" className="gc-btn gc-btn-perigo gc-ficha-remover"
                    disabled={desvincular.isPending}
                    onClick={() => desvincular.mutate()}>
              <Icone nome="trash" tamanho={13} /> Remover vínculo
            </button>
          )}
        </div>
      )}
    </li>
  );
}
