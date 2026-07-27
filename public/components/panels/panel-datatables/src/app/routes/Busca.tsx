// app/routes/Busca.tsx — Busca global com resultados em DataGrid (§38.9 / §37.1).
// @version 2.0.0  @updated 2026-07-21
// Busca no CATÁLOGO (metadado), não nos dados. Mín. 2 caracteres. Cada um dos 4
// grupos (campos/tabelas/bancos/servidores) é um DataGrid compacto e ordenável.
import { useMemo, useState, useDeferredValue, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../lib/api';
import { fmtBytes, fmtInt } from '../../lib/format';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, EmptyState, Skeleton } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { DataGrid } from '../../components/grid/DataGrid';
import { useOrdenacaoLocal } from '../../components/grid/useOrdenacaoLocal';
import type { ColunaDef } from '../../components/grid/tipos';
import css from './Busca.module.css';

interface CampoR { id: number; name: string; data_type: string; is_pk: number; is_fk: number; sensitivity: string | null; table_name: string; database_name: string; server_name: string | null; environment_label: string | null }
interface TabelaR { id: number; name: string; classification: string; field_count: number; size_bytes: number | null; database_name: string; environment_label: string | null }
interface BancoR { id: number; name: string; table_count: number; size_bytes: number | null; status: string; environment_label: string | null; server_name: string | null }
interface ServidorR { id: number; name: string; identifier: string; hostname: string | null; status: string; provider: string | null }
interface Resultado { fields: CampoR[]; tables: TabelaR[]; databases: BancoR[]; servers: ServidorR[] }

export function Busca(): JSX.Element {
  const [termo, setTermo] = useState('');
  const [exato, setExato] = useState(true);
  const termoDif = useDeferredValue(termo.trim());
  const ativo = termoDif.length >= 2;

  const q = useQuery({
    queryKey: ['dt', 'search', termoDif, exato],
    queryFn: ({ signal }) => apiGet<Resultado>('/search', { q: termoDif, exact: exato }, signal),
    enabled: ativo,
  });

  const colCampos: ColunaDef<CampoR>[] = useMemo(() => [
    { id: 'name', cabecalho: 'Campo', icone: 'Columns3', largura: 'minmax(140px, 1.2fr)', obrigatoria: true, ordenavel: true,
      valor: (f) => f.name, celula: (f) => <span className={css.mono}>{f.name}</span> },
    { id: 'loc', cabecalho: 'Localização', icone: 'FolderTree', largura: 'minmax(160px, 1.4fr)', ordenavel: true,
      valor: (f) => `${f.database_name}.${f.table_name}`, celula: (f) => <span className={css.caminho}>{f.database_name}.{f.table_name}</span> },
    { id: 'data_type', cabecalho: 'Tipo', icone: 'Type', largura: '120px', ordenavel: true,
      valor: (f) => f.data_type, celula: (f) => <span className={css.dt}>{f.data_type}</span> },
    { id: 'chaves', cabecalho: 'Chaves', icone: 'KeyRound', largura: '110px', alinhamento: 'centro',
      valor: (f) => f.is_pk * 2 + f.is_fk,
      celula: (f) => <span className={css.tags}>{f.is_pk === 1 && <Badge texto="PK" tom="info" fraco />}{f.is_fk === 1 && <Badge texto="FK" tom="neutro" fraco />}{f.is_pk === 0 && f.is_fk === 0 && <span className={css.discreto}>—</span>}</span> },
    { id: 'sensitivity', cabecalho: 'Sensível', icone: 'ShieldAlert', largura: '130px', ordenavel: true,
      valor: (f) => f.sensitivity ?? '', celula: (f) => f.sensitivity ? <Badge texto={f.sensitivity} tom="atencao" icone="ShieldAlert" fraco /> : <span className={css.discreto}>—</span> },
  ], []);

  const colTabelas: ColunaDef<TabelaR>[] = useMemo(() => [
    { id: 'name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(150px, 1.3fr)', obrigatoria: true, ordenavel: true,
      valor: (t) => t.name, celula: (t) => <span className={css.mono}>{t.name}</span> },
    { id: 'database_name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(130px, 1fr)', ordenavel: true,
      valor: (t) => t.database_name, celula: (t) => <span className={css.caminho}>{t.database_name}</span> },
    { id: 'classification', cabecalho: 'Classificação', icone: 'Tag', largura: '130px', ordenavel: true,
      valor: (t) => t.classification, celula: (t) => <Badge texto={t.classification} fraco /> },
    { id: 'field_count', cabecalho: 'Campos', icone: 'Columns3', largura: '96px', alinhamento: 'fim', ordenavel: true,
      valor: (t) => t.field_count, celula: (t) => <span className={css.num}>{fmtInt(t.field_count)}</span> },
    { id: 'size_bytes', cabecalho: 'Tamanho', icone: 'HardDrive', largura: '120px', alinhamento: 'fim', ordenavel: true,
      valor: (t) => t.size_bytes ?? 0, celula: (t) => <span className={css.num}>{fmtBytes(t.size_bytes)}</span> },
  ], []);

  const colBancos: ColunaDef<BancoR>[] = useMemo(() => [
    { id: 'name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(150px, 1.3fr)', obrigatoria: true, ordenavel: true,
      valor: (b) => b.name, celula: (b) => <span className={css.mono}>{b.name}</span> },
    { id: 'server_name', cabecalho: 'Servidor', icone: 'Server', largura: 'minmax(130px, 1fr)', ordenavel: true,
      valor: (b) => b.server_name ?? '', celula: (b) => <span className={css.caminho}>{b.server_name ?? '—'}</span> },
    { id: 'status', cabecalho: 'Status', icone: 'Activity', largura: '140px', ordenavel: true,
      valor: (b) => b.status, celula: (b) => <StatusBadge status={b.status} compacto /> },
    { id: 'table_count', cabecalho: 'Tabelas', icone: 'TableProperties', largura: '96px', alinhamento: 'fim', ordenavel: true,
      valor: (b) => b.table_count, celula: (b) => <span className={css.num}>{fmtInt(b.table_count)}</span> },
    { id: 'size_bytes', cabecalho: 'Tamanho', icone: 'HardDrive', largura: '120px', alinhamento: 'fim', ordenavel: true,
      valor: (b) => b.size_bytes ?? 0, celula: (b) => <span className={css.num}>{fmtBytes(b.size_bytes)}</span> },
  ], []);

  const colServidores: ColunaDef<ServidorR>[] = useMemo(() => [
    { id: 'name', cabecalho: 'Servidor', icone: 'Server', largura: 'minmax(150px, 1.3fr)', obrigatoria: true, ordenavel: true,
      valor: (s) => s.name, celula: (s) => <span className={css.mono}>{s.name}</span> },
    { id: 'host', cabecalho: 'Host', icone: 'Globe', largura: 'minmax(150px, 1fr)', ordenavel: true,
      valor: (s) => s.hostname ?? s.identifier, celula: (s) => <span className={css.caminho}>{s.hostname ?? s.identifier}</span> },
    { id: 'provider', cabecalho: 'Provedor', icone: 'Boxes', largura: '130px', ordenavel: true,
      valor: (s) => s.provider ?? '', celula: (s) => <span className={css.discreto}>{s.provider ?? '—'}</span> },
    { id: 'status', cabecalho: 'Status', icone: 'Activity', largura: '140px', ordenavel: true,
      valor: (s) => s.status, celula: (s) => <StatusBadge status={s.status} compacto /> },
  ], []);

  const gCampos = useOrdenacaoLocal(q.data?.fields ?? [], colCampos);
  const gTabelas = useOrdenacaoLocal(q.data?.tables ?? [], colTabelas);
  const gBancos = useOrdenacaoLocal(q.data?.databases ?? [], colBancos);
  const gServidores = useOrdenacaoLocal(q.data?.servers ?? [], colServidores);

  const total = q.data ? q.data.fields.length + q.data.tables.length + q.data.databases.length + q.data.servers.length : 0;

  return (
    <div className={css.raiz}>
      <div className={css.barra}>
        <span className={css.lupa}><Icone nome="Search" size={16} /></span>
        <input className={css.input} type="search" placeholder="Buscar campos, tabelas, bancos e servidores…"
          value={termo} onChange={(e) => setTermo(e.target.value)} autoFocus
          aria-label="Termo de busca no catálogo" />
        <label className={css.toggle}>
          <input type="checkbox" checked={!exato} onChange={(e) => setExato(!e.target.checked)} />
          <Icone nome="Filter" size={12} /> contém
        </label>
      </div>

      {!ativo ? (
        <EmptyState icone="Search" titulo="Busque no catálogo"
          descricao="Digite ao menos 2 caracteres. A busca cobre metadados — nomes de campos, tabelas, bancos e servidores — nunca o conteúdo dos dados." />
      ) : q.isPending ? (
        <Skeleton linhas={6} altura={22} />
      ) : q.isError ? (
        <ErrorState mensagem="Falha na busca." codigo={(q.error as ApiError).code} onRetry={() => q.refetch()} />
      ) : total === 0 ? (
        <EmptyState icone="SearchX" titulo={`Nada encontrado para “${termoDif}”`}
          descricao={exato ? 'Tente o modo “contém” para uma busca mais ampla.' : 'Nenhum objeto do catálogo bate com esse termo.'} />
      ) : (
        <div className={css.resultados}>
          <p className={css.contagem}>{fmtInt(total)} resultado(s) para <strong>{termoDif}</strong></p>

          {gCampos.linhas.length > 0 && (
            <GrupoGrid icone="Columns3" titulo="Campos" n={gCampos.linhas.length} atraso={0}>
              <DataGrid<CampoR> rotulo="Campos encontrados" densidadeInicial="compacta"
                colunas={colCampos} linhas={gCampos.linhas} idLinha={(f) => f.id}
                ordenacao={gCampos.ordenacao} aoOrdenar={gCampos.aoOrdenar} />
            </GrupoGrid>
          )}

          {gTabelas.linhas.length > 0 && (
            <GrupoGrid icone="TableProperties" titulo="Tabelas" n={gTabelas.linhas.length} atraso={60}>
              <DataGrid<TabelaR> rotulo="Tabelas encontradas" densidadeInicial="compacta"
                colunas={colTabelas} linhas={gTabelas.linhas} idLinha={(t) => t.id}
                ordenacao={gTabelas.ordenacao} aoOrdenar={gTabelas.aoOrdenar} />
            </GrupoGrid>
          )}

          {gBancos.linhas.length > 0 && (
            <GrupoGrid icone="Database" titulo="Bancos" n={gBancos.linhas.length} atraso={120}>
              <DataGrid<BancoR> rotulo="Bancos encontrados" densidadeInicial="compacta"
                colunas={colBancos} linhas={gBancos.linhas} idLinha={(b) => b.id}
                ordenacao={gBancos.ordenacao} aoOrdenar={gBancos.aoOrdenar} />
            </GrupoGrid>
          )}

          {gServidores.linhas.length > 0 && (
            <GrupoGrid icone="Server" titulo="Servidores" n={gServidores.linhas.length} atraso={180}>
              <DataGrid<ServidorR> rotulo="Servidores encontrados" densidadeInicial="compacta"
                colunas={colServidores} linhas={gServidores.linhas} idLinha={(s) => s.id}
                ordenacao={gServidores.ordenacao} aoOrdenar={gServidores.aoOrdenar} />
            </GrupoGrid>
          )}
        </div>
      )}
    </div>
  );
}

function GrupoGrid({ icone, titulo, n, atraso, children }: { icone: string; titulo: string; n: number; atraso: number; children: JSX.Element }): JSX.Element {
  return (
    <Revelar atraso={atraso}>
      <section className={css.grupo}>
        <h2 className={css.grupoTitulo}><Icone nome={icone} size={14} /> {titulo}<span className={css.grupoNum}>{n}</span></h2>
        {children}
      </section>
    </Revelar>
  );
}
