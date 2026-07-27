// app/routes/drawers/TabelaDrawer.tsx — detalhe da tabela em DRAWER (§12/§19).
// @version 1.0.0  @created 2026-07-21
// Abre ao clicar numa linha de Tabelas. Campos, índices, FKs, dependências
// inversas e problemas — sem sair da listagem, sem tabela HTML.
import { type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../../lib/api';
import { fmtInt, fmtBytes, fmtData } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge, AnelScore } from '../../../components/ui/Badge';
import { Icone } from '../../../components/ui/Icone';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/Estados';
import css from './TabelaDrawer.module.css';

interface Campo { id: number; name: string; data_type: string; column_type: string; is_nullable: number; is_pk: number; is_fk: number; is_unique: number; sensitivity: string | null; column_comment: string | null; labels: string[] | null }
interface Indice { id: number; name: string; is_unique: number; index_type: string; columns_csv: string }
interface Fk { id: number; constraint_name: string; column_name: string | null; ref_table: string | null; ref_column: string | null; is_broken: number }
interface RefBy { table_id: number; table_name: string; database_name: string }
interface Issue { id: number; severity: string; rule_label: string | null; dimension: string | null; detail: string | null }
interface Detalhe {
  table: { id: number; name: string; database_name: string; table_type: string; engine: string | null;
           row_count_approx: number | null; size_bytes: number | null; field_count: number; index_count: number;
           fk_count: number; has_pk: number; health_score: number | null; table_comment: string | null;
           update_time: string | null; environment_label: string | null; is_orphan: number };
  fields: Campo[]; indexes: Indice[]; foreign_keys: Fk[]; referenced_by: RefBy[]; quality_issues: Issue[];
}
const SEV_TOM: Record<string, 'alerta' | 'atencao' | 'neutro'> = { critico: 'alerta', atencao: 'atencao', informativo: 'neutro' };

export function TabelaDrawer({ id, aoFechar }: { id: number | null; aoFechar: () => void }): JSX.Element {
  const q = useQuery({
    queryKey: ['dt', 'table', id],
    queryFn: ({ signal }) => apiGet<Detalhe>(`/tables/${id}`, undefined, signal),
    enabled: id !== null,
  });
  const d = q.data;
  const t = d?.table;

  return (
    <Drawer aberto={id !== null} aoFechar={aoFechar}
      titulo={t?.name ?? 'Tabela'} subtitulo={t ? `${t.database_name} · ${t.table_type}` : undefined}
      icone={t?.table_type === 'VIEW' ? 'Layers' : 'TableProperties'}
      acoes={t ? <AnelScore score={t.health_score} tamanho={34} /> : undefined} largura={620}>
      {q.isPending ? <Skeleton linhas={8} altura={22} />
        : q.isError ? <ErrorState mensagem="Não foi possível carregar o detalhe." codigo={(q.error as ApiError).code} onRetry={() => q.refetch()} />
        : d ? (
          <>
            <div className={css.resumo}>
              <Resumo icone="Columns3" rotulo="Campos" valor={fmtInt(t!.field_count)} />
              <Resumo icone="Hash" rotulo="Registros" valor={fmtInt(t!.row_count_approx)} />
              <Resumo icone="HardDrive" rotulo="Tamanho" valor={fmtBytes(t!.size_bytes)} />
              <Resumo icone="GitBranch" rotulo="FKs" valor={fmtInt(t!.fk_count)} />
            </div>
            <div className={css.tags}>
              {t!.engine && <Badge texto={t!.engine} fraco />}
              {t!.environment_label && <Badge texto={t!.environment_label} tom="info" icone="Network" />}
              {!t!.has_pk && t!.table_type === 'BASE TABLE' && <Badge texto="sem PK" tom="atencao" icone="TriangleAlert" />}
              {!!t!.is_orphan && <Badge texto="órfã" fraco icone="GitBranch" />}
              {!t!.table_comment && <Badge texto="sem doc" fraco />}
              <span className={css.alterada}><Icone nome="Clock" size={11} /> {fmtData(t!.update_time)}</span>
            </div>
            {t!.table_comment && <p className={css.comentario}>{t!.table_comment}</p>}

            <DrawerSecao titulo="Campos" icone="Columns3" contagem={d.fields.length}>
              <div className={css.lista}>
                {d.fields.map((f) => (
                  <div key={f.id} className={css.campo}>
                    <span className={css.campoNome}>{f.name}</span>
                    <span className={css.campoTipo}>{f.column_type || f.data_type}</span>
                    <span className={css.campoBadges}>
                      {!!f.is_pk && <Badge texto="PK" tom="info" fraco />}
                      {!!f.is_fk && <Badge texto="FK" tom="neutro" fraco />}
                      {!!f.is_unique && !f.is_pk && <Badge texto="unique" fraco />}
                      {!f.is_nullable && <Badge texto="not null" fraco />}
                      {f.sensitivity && <Badge texto={f.sensitivity} tom="atencao" icone="ShieldAlert" fraco />}
                    </span>
                  </div>
                ))}
              </div>
            </DrawerSecao>

            {d.indexes.length > 0 && (
              <DrawerSecao titulo="Índices" icone="ListChecks" contagem={d.indexes.length}>
                <div className={css.lista}>
                  {d.indexes.map((i) => (
                    <div key={i.id} className={css.linha}>
                      <span className={css.mono}>{i.name}</span>
                      <span className={css.cols}>{i.columns_csv}</span>
                      {!!i.is_unique && <Badge texto="unique" tom="info" fraco />}
                      <span className={css.discreto}>{i.index_type}</span>
                    </div>
                  ))}
                </div>
              </DrawerSecao>
            )}

            {d.foreign_keys.length > 0 && (
              <DrawerSecao titulo="Chaves estrangeiras" icone="GitBranch" contagem={d.foreign_keys.length}>
                <div className={css.lista}>
                  {d.foreign_keys.map((f) => (
                    <div key={f.id} className={css.linha}>
                      <span className={css.mono}>{f.column_name}</span>
                      <Icone nome="ArrowUpRight" size={12} />
                      <span className={css.mono}>{f.ref_table}.{f.ref_column}</span>
                      {!!f.is_broken && <Badge texto="quebrada" tom="alerta" icone="TriangleAlert" />}
                    </div>
                  ))}
                </div>
              </DrawerSecao>
            )}

            <DrawerSecao titulo="Referenciada por" icone="Network" contagem={d.referenced_by.length}>
              {d.referenced_by.length === 0
                ? <p className={css.vazio}>Nenhuma tabela referencia esta.</p>
                : <div className={css.chips}>{d.referenced_by.map((r) => <span key={r.table_id} className={css.refChip}><Icone nome="TableProperties" size={11} /> {r.table_name}</span>)}</div>}
            </DrawerSecao>

            <DrawerSecao titulo="Problemas de qualidade" icone="ShieldAlert" contagem={d.quality_issues.length}>
              {d.quality_issues.length === 0
                ? <EmptyState icone="CircleCheck" titulo="Sem problemas" descricao="Nenhum problema de qualidade em aberto nesta tabela." />
                : <div className={css.lista}>
                    {d.quality_issues.map((p) => (
                      <div key={p.id} className={css.issue}>
                        <Badge texto={p.severity} tom={SEV_TOM[p.severity] ?? 'neutro'} icone={p.severity === 'critico' ? 'CircleX' : 'TriangleAlert'} />
                        <span className={css.issueRegra}>{p.rule_label ?? '—'}</span>
                        {p.dimension && <span className={css.discreto}>{p.dimension}</span>}
                      </div>
                    ))}
                  </div>}
            </DrawerSecao>
          </>
        ) : null}
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
