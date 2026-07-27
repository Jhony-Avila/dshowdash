// app/routes/drawers/DescobertaDrawer.tsx — evidências de um banco descoberto (§12).
// @version 1.0.0  @created 2026-07-21
// Abre ao clicar numa linha de Descoberta. Resumo + motivo + evidências agrupadas
// por fonte (mysql/config/lista/catálogo) + recomendação (§31). Usuário MASCARADO.
import { useState, useEffect, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite } from '../../../lib/api';
import { fmtInt, fmtBytes, fmtRelativo } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { Icone } from '../../../components/ui/Icone';
import { Skeleton, EmptyState } from '../../../components/ui/Estados';
import type { Descoberto } from '../Descoberta';
import css from './TabelaDrawer.module.css';

interface Evidencia {
  source_type: string; host: string | null; port: number | null;
  username_masked: string | null; detail: string | null; confidence: string; created_at: string;
}
interface Resp { db_key: string; evidences: Evidencia[] }

const FONTE: Record<string, { rotulo: string; icone: string }> = {
  mysql:      { rotulo: 'MySQL · information_schema', icone: 'Database' },
  config:     { rotulo: 'Configuração (.env)',        icone: 'FileCog' },
  code:       { rotulo: 'Código-fonte (§7.5)',        icone: 'FileCode2' },
  cron:       { rotulo: 'Crons e rotinas (§7.6)',     icone: 'CalendarClock' },
  container:  { rotulo: 'Containers (§7.7)',          icone: 'Container' },
  log:        { rotulo: 'Logs (§7.8)',                icone: 'ScrollText' },
  backup:     { rotulo: 'Backups (§7.9)',             icone: 'Archive' },
  known_list: { rotulo: 'Lista conhecida (§32)',      icone: 'BookMarked' },
  catalog:    { rotulo: 'Catálogo DataTables',        icone: 'Boxes' },
};
const USTATUS_ROTULO: Record<string, string> = { legado: 'Legado', falso_positivo: 'Falso positivo', ignorado: 'Ignorado' };

function BotaoClass({ ativo, onClick, icone, texto, disabled }: {
  ativo?: boolean; onClick: () => void; icone: string; texto: string; disabled?: boolean;
}): JSX.Element {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px',
        border: `1px solid ${ativo ? 'var(--dt-primary)' : 'var(--dt-border)'}`, borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
        background: ativo ? 'color-mix(in srgb, var(--dt-primary) 16%, transparent)' : 'var(--dt-bg-canvas)',
        color: ativo ? 'var(--dt-primary)' : 'var(--dt-text-secondary)', font: 'inherit', fontSize: 12, fontWeight: 600 }}>
      <Icone nome={icone} size={12} /> {texto}
    </button>
  );
}

function recomendacao(d: Descoberto): string {
  if (d.catalogued) return 'Já monitorado no DataTables — nenhuma ação necessária.';
  switch (d.situation) {
    case 'encontrado_acessivel': return 'Acessível e fora do catálogo: cadastre a conexão e rode o inventário para monitorá-lo.';
    case 'sem_permissao':        return 'Existe, mas a credencial não acessa: solicite ampliação de permissão (SHOW DATABASES / SELECT).';
    case 'referenciado_nao_encontrado': return d.seen_backup && !d.seen_config && !d.seen_code
      ? 'Presente apenas em backup (§7.9): banco histórico/inativo. Confirme se deve ser restaurado ou marque como legado.'
      : 'Citado em config/código/cron/backup, mas não localizado em host ativo: encontre o host/credencial correto ou marque como legado.';
    case 'vazio':                return 'Schema sem tabelas: confirme se é provisão futura ou resíduo a remover.';
    case 'sistema':              return 'Banco de sistema — separado do negócio, sem ação.';
    default:                     return 'Revisar evidências.';
  }
}

export function DescobertaDrawer({ alvo, aoFechar, aoCadastrar }: {
  alvo: Descoberto | null; aoFechar: () => void;
  aoCadastrar?: (d: Descoberto, nota: string) => void;
}): JSX.Element {
  const key = alvo?.db_key ?? null;
  const q = useQuery({
    queryKey: ['dt', 'discovery', 'evidences', key],
    queryFn: ({ signal }) => apiGet<Resp>('/discovery/evidences', { key: key as string }, signal),
    enabled: key !== null,
  });

  const qc = useQueryClient();
  const [nota, setNota] = useState('');
  // `alvo` é um snapshot da linha no clique; `statusLocal` dá feedback imediato
  // ao classificar (a lista do grid atualiza no refetch).
  const [statusLocal, setStatusLocal] = useState<string | null>(null);
  useEffect(() => {
    setNota(alvo?.user_note ?? '');
    setStatusLocal(alvo?.user_status ?? null);
  }, [alvo?.id, alvo?.user_status, alvo?.user_note]);
  const classificarMut = useMutation({
    mutationFn: (p: { status: string; note: string }) => apiWrite(`/discovery/${alvo!.id}/classify`, 'POST', p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dt'] }),
  });
  const classificar = (status: string): void => {
    if (!alvo) return;
    setStatusLocal(status || null);
    classificarMut.mutate({ status, note: nota });
  };

  const evs = q.data?.evidences ?? [];
  const grupos = evs.reduce<Record<string, Evidencia[]>>((acc, e) => {
    (acc[e.source_type] ??= []).push(e); return acc;
  }, {});

  // §13: pode CADASTRAR quando é acessível/referenciado e ainda não catalogado
  // (bancos de sistema não). A nota informa onde a credencial foi identificada —
  // a senha nunca é copiada de arquivo.
  const podeCadastrar = !!alvo && !alvo.catalogued && !alvo.is_system;
  const abrirCadastro = (): void => {
    if (!alvo) return;
    const cfg = evs.find((e) => e.source_type === 'config');
    const my = evs.find((e) => e.source_type === 'mysql');
    const user = cfg?.username_masked ?? my?.username_masked ?? null;
    const origem = cfg?.detail ?? (my ? 'servidor MySQL acessível' : 'lista/evidências');
    const nota = `Credencial identificada${user ? `: usuário ${user}` : ''} — origem: ${origem}. `
      + 'A senha nunca é copiada de arquivos: informe usuário e senha para validar e monitorar (§13).';
    aoCadastrar?.(alvo, nota);
  };

  return (
    <Drawer aberto={key !== null} aoFechar={aoFechar}
      titulo={alvo?.name ?? 'Banco'} subtitulo={alvo ? (alvo.server_context ?? alvo.host ?? 'origem desconhecida') : undefined}
      icone="Radar" largura={640}>
      {alvo && (
        <>
          <div className={css.resumo}>
            <Resumo icone="Compass" rotulo="Situação" valor={alvo.situation.replace(/_/g, ' ')} />
            <Resumo icone="TableProperties" rotulo="Tabelas" valor={alvo.table_count !== null ? fmtInt(alvo.table_count) : '—'} />
            <Resumo icone="HardDrive" rotulo="Tamanho" valor={alvo.size_bytes !== null ? fmtBytes(alvo.size_bytes) : '—'} />
            <Resumo icone="Gauge" rotulo="Confiança" valor={alvo.confidence} />
          </div>

          <div className={css.tags}>
            {alvo.host && <Badge texto={`${alvo.host}:${alvo.port ?? 3306}`} tom="neutro" icone="Server" fraco />}
            {alvo.application && <Badge texto={alvo.application} tom="info" icone="Boxes" fraco />}
            {alvo.catalogued && <Badge texto="catalogado" tom="ok" icone="Check" fraco />}
            {!alvo.is_present && <Badge texto={alvo.disappeared_at ? `sumiu ${fmtRelativo(alvo.disappeared_at)}` : 'desapareceu'} tom="alerta" icone="CircleX" fraco />}
            {alvo.server_uuid && <Badge texto={`instância ${alvo.server_uuid.replace(/^sig:/, '').slice(0, 8)}…`} tom="neutro" icone="Fingerprint" fraco dica={`§19/§20 server_uuid: ${alvo.server_uuid}`} />}
          </div>

          {podeCadastrar && aoCadastrar && (
            <button type="button" onClick={abrirCadastro}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '11px 14px', border: 'none', borderRadius: 'var(--dt-radius-md)',
                cursor: 'pointer', background: 'var(--dt-primary)', color: '#fff', font: 'inherit',
                fontSize: 13, fontWeight: 600, boxShadow: 'var(--dt-shadow-1)' }}>
              <Icone nome="PlugZap" size={15} /> Cadastrar como conexão monitorada
            </button>
          )}

          {alvo.reason && (
            <div className={css.comentario}><Icone nome="Info" size={13} /> {alvo.reason}</div>
          )}

          <DrawerSecao titulo="Recomendação" icone="Lightbulb">
            <p className={css.comentario} style={{ margin: 0 }}>{recomendacao(alvo)}</p>
          </DrawerSecao>

          <DrawerSecao titulo="Classificação da equipe" icone="Tag">
            {statusLocal && USTATUS_ROTULO[statusLocal] && (
              <p className={css.comentario} style={{ marginTop: 0, marginBottom: 8 }}>
                <Icone nome="Tag" size={12} /> Classificado como <strong>{USTATUS_ROTULO[statusLocal]}</strong>
                {alvo.user_updated_by ? ` por ${alvo.user_updated_by}` : ''}. Sai da lista de pendências e sobrevive às próximas auditorias.
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <BotaoClass ativo={statusLocal === 'legado'} onClick={() => classificar('legado')} icone="Archive" texto="Legado" disabled={classificarMut.isPending} />
              <BotaoClass ativo={statusLocal === 'falso_positivo'} onClick={() => classificar('falso_positivo')} icone="Ban" texto="Falso positivo" disabled={classificarMut.isPending} />
              <BotaoClass ativo={statusLocal === 'ignorado'} onClick={() => classificar('ignorado')} icone="EyeOff" texto="Ignorar" disabled={classificarMut.isPending} />
              {statusLocal && <BotaoClass onClick={() => classificar('')} icone="X" texto="Limpar" disabled={classificarMut.isPending} />}
            </div>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
              placeholder="Observação (opcional) — por que legado, ignorado ou falso positivo?"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--dt-border)',
                borderRadius: 'var(--dt-radius-sm)', background: 'var(--dt-bg-canvas)', color: 'var(--dt-text-primary)',
                font: 'inherit', fontSize: 12.5, resize: 'vertical' }} />
            <button type="button" onClick={() => classificar(statusLocal ?? '')} disabled={classificarMut.isPending}
              style={{ marginTop: 6, padding: '6px 12px', border: '1px solid var(--dt-border)', borderRadius: 'var(--dt-radius-sm)',
                cursor: 'pointer', background: 'var(--dt-bg-surface)', color: 'var(--dt-text-primary)', font: 'inherit',
                fontSize: 12.5, fontWeight: 600 }}>
              Salvar observação
            </button>
          </DrawerSecao>

          <DrawerSecao titulo="Evidências" icone="Search" contagem={q.data?.evidences.length}>
            {q.isPending ? <Skeleton linhas={4} altura={20} />
              : (q.data?.evidences.length ?? 0) === 0
                ? <EmptyState icone="SearchX" titulo="Sem evidências" descricao="Nenhuma fonte registrou este banco nesta rodada." />
                : (
                  <div className={css.evGrupos}>
                    {Object.entries(grupos).map(([fonte, evs]) => {
                      const f = FONTE[fonte] ?? { rotulo: fonte, icone: 'Dot' };
                      return (
                        <div key={fonte} className={css.evGrupo}>
                          <h5 className={css.evTitulo}><Icone nome={f.icone} size={13} /> {f.rotulo}</h5>
                          {evs.map((e, i) => (
                            <div key={i} className={css.evItem}>
                              <span className={css.evDetalhe}>{e.detail}</span>
                              <span className={css.evMeta}>
                                {e.username_masked && <span className={css.mono}>user {e.username_masked}</span>}
                                <Badge texto={e.confidence} tom={e.confidence === 'alta' ? 'ok' : e.confidence === 'media' ? 'atencao' : 'neutro'} fraco />
                                <span className={css.discreto}>{fmtRelativo(e.created_at)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
          </DrawerSecao>
        </>
      )}
    </Drawer>
  );
}

function Resumo({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.resumoItem}>
      <span className={css.resumoIcone}><Icone nome={icone} size={14} /></span>
      <span className={css.resumoValor}>{valor}</span>
      <span className={css.resumoRotulo}>{rotulo}</span>
    </div>
  );
}
