// app/routes/Descoberta.tsx — Descoberta e reconciliação de bancos (brief §11).
// @version 1.0.0  @created 2026-07-21
// Audita TODOS os schemas visíveis a cada credencial, cruza com config/.env e a
// lista conhecida (§32) e classifica cada banco (§8) com confiança (§9).
// REGRA CRÍTICA (§35): "o usuário só viu N bancos" ≠ "só existem N". Por isso o
// banner de VISÃO PARCIAL e a distinção acessível × catalogado × referenciado.
import { useMemo, useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtInt, fmtRelativo } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import type { ColunaDef } from '../../components/grid/tipos';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { Revelar } from '../../components/ui/Revelar';
import { ErrorState, SkeletonCartoes, EmptyState } from '../../components/ui/Estados';
import { DescobertaDrawer } from './drawers/DescobertaDrawer';
import { ConexaoForm } from './forms/ConexaoForm';
import css from './Descoberta.module.css';

export interface Descoberto {
  id: number; db_key: string; name: string; host: string | null; port: number | null;
  server_context: string | null; environment: string | null; situation: string; confidence: string;
  is_accessible: boolean; is_system: boolean; is_empty: boolean; catalogued: boolean;
  catalog_database_id: number | null; table_count: number | null; size_bytes: number | null;
  application: string | null; seen_mysql: boolean; seen_config: boolean; seen_known: boolean; seen_catalog: boolean;
  seen_code: boolean; seen_cron: boolean; seen_container: boolean; seen_log: boolean; seen_backup: boolean;
  is_present: boolean; disappeared_at: string | null; server_uuid: string | null;
  reason: string | null; first_seen_at: string; last_seen_at: string;
  user_status: string | null; user_note: string | null; user_updated_by: string | null; user_updated_at: string | null;
  collision_with: string | null;
}
interface HostAudit { host: string; status: string; schemas: number | null }
interface LayerCov { layer: string; rotulo: string; status: string; note: string; scanned: number; hits: number }
interface Etapa { rotulo: string; status: string; n: number; unidade: string }
interface RunInfo {
  id: number; status: string; hosts_probed: number; hosts_failed: number;
  databases_found: number; databases_catalogued: number; databases_pending: number;
  stats: { hosts_parciais?: number; hosts_parciais_labels?: string[]; erros?: string[]; hosts?: HostAudit[]; layers?: LayerCov[]; etapas?: Etapa[]; alerts_raised?: number } | null;
  started_at: string; finished_at: string | null;
}
interface Big {
  total: number; acessiveis: number; catalogados: number; nao_catalogados: number;
  referenciados: number; sem_permissao: number; vazios: number; sistema: number; desaparecidos: number; triados: number;
}
interface Dados { run: RunInfo | null; big: Big; databases: Descoberto[] }
interface ServidorSemAcesso { host: string; status: string; motivo: string }
interface Relatorio {
  resumo: Record<string, number>;
  pendencias: { servidores_sem_acesso: ServidorSemAcesso[]; producao_nao_monitorada: unknown[];
    referencias_quebradas: unknown[]; sem_permissao: unknown[]; sem_aplicacao: unknown[]; duplicidades: unknown[] };
  recomendacoes: { cadastrar_conexao: number; ampliar_permissao: number; revisar_referencia: number;
    resolver_colisao: number; associar_aplicacao: number };
}

type Tom = 'ok' | 'atencao' | 'alerta' | 'neutro' | 'info';
const SIT: Record<string, { rotulo: string; tom: Tom; icone: string }> = {
  encontrado_acessivel:        { rotulo: 'Acessível',      tom: 'ok',      icone: 'CircleCheck' },
  referenciado_nao_encontrado: { rotulo: 'Referenciado',   tom: 'info',    icone: 'FileSearch' },
  sem_permissao:               { rotulo: 'Sem permissão',  tom: 'alerta',  icone: 'Lock' },
  vazio:                       { rotulo: 'Vazio',          tom: 'neutro',  icone: 'CircleDashed' },
  sistema:                     { rotulo: 'Sistema',        tom: 'neutro',  icone: 'Cog' },
};
const CONF: Record<string, Tom> = { alta: 'ok', media: 'atencao', baixa: 'neutro' };
const USTATUS: Record<string, { rotulo: string; tom: Tom; icone: string }> = {
  legado:         { rotulo: 'Legado',         tom: 'neutro', icone: 'Archive' },
  falso_positivo: { rotulo: 'Falso positivo', tom: 'neutro', icone: 'Ban' },
  ignorado:       { rotulo: 'Ignorado',       tom: 'neutro', icone: 'EyeOff' },
};
const HOST_STATUS: Record<string, { rotulo: string; tom: Tom; icone: string }> = {
  total:              { rotulo: 'visão total',   tom: 'ok',      icone: 'CircleCheck' },
  parcial:            { rotulo: 'visão parcial', tom: 'atencao', icone: 'ShieldAlert' },
  offline:            { rotulo: 'offline',       tom: 'alerta',  icone: 'PlugZap' },
  credential_expired: { rotulo: 'credencial',    tom: 'alerta',  icone: 'Lock' },
};
// Camadas 5-9 (§7.5–§7.9): origem por filesystem/host, reconciliada por nome.
const ORIGENS: { chave: keyof Descoberto; rotulo: string; tom: Tom; icone: string }[] = [
  { chave: 'seen_mysql',     rotulo: 'MySQL',     tom: 'ok',     icone: 'Database' },
  { chave: 'seen_config',    rotulo: 'Config',    tom: 'info',   icone: 'FileCog' },
  { chave: 'seen_code',      rotulo: 'Código',    tom: 'info',   icone: 'FileCode2' },
  { chave: 'seen_cron',      rotulo: 'Cron',      tom: 'info',   icone: 'CalendarClock' },
  { chave: 'seen_container', rotulo: 'Container', tom: 'info',   icone: 'Container' },
  { chave: 'seen_log',       rotulo: 'Log',       tom: 'info',   icone: 'ScrollText' },
  { chave: 'seen_backup',    rotulo: 'Backup',    tom: 'neutro', icone: 'Archive' },
  { chave: 'seen_known',     rotulo: 'Conhecido', tom: 'neutro', icone: 'BookMarked' },
  { chave: 'seen_catalog',   rotulo: 'Catálogo',  tom: 'ok',     icone: 'Boxes' },
];
const LAYER_STATUS: Record<string, { rotulo: string; tom: Tom; icone: string }> = {
  completa:     { rotulo: 'completa',      tom: 'ok',      icone: 'CircleCheck' },
  parcial:      { rotulo: 'parcial',       tom: 'atencao', icone: 'ShieldAlert' },
  indisponivel: { rotulo: 'indisponível',  tom: 'neutro',  icone: 'Ban' },
};
// Etapas da rodada (§29/§30): cor do ponto na timeline.
const ETAPA_TOM: Record<string, Tom> = { ok: 'ok', parcial: 'atencao', indisponivel: 'neutro', vazio: 'neutro' };

export function Descoberta(): JSX.Element {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<string>('destaque');
  const [busca, setBusca] = useState('');
  const [alvo, setAlvo] = useState<Descoberto | null>(null);
  const [cadastro, setCadastro] = useState<{ d: Descoberto; nota: string } | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'discovery'],
    queryFn: ({ signal }) => apiGet<Dados>('/discovery', undefined, signal),
  });
  const executar = useMutation({
    mutationFn: () => apiWrite('/discovery/run', 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dt'] }),
  });
  // Relatório final §31 (resumo + pendências + recomendações).
  const rel = useQuery({
    queryKey: ['dt', 'discovery', 'report'],
    queryFn: ({ signal }) => apiGet<Relatorio>('/discovery/report', undefined, signal),
  });
  const [baixando, setBaixando] = useState(false);
  const baixarCsv = async (): Promise<void> => {
    setBaixando(true);
    try {
      const res = await fetch('/api/datatables/discovery/export', { credentials: 'same-origin' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `descoberta-bancos.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally { setBaixando(false); }
  };

  const filtradas = useMemo(() => {
    const lista = q.data?.databases ?? [];
    const t = busca.trim().toLowerCase();
    return lista.filter((d) => {
      if (t && !(d.name.toLowerCase().includes(t)
        || (d.host ?? '').toLowerCase().includes(t)
        || (d.application ?? '').toLowerCase().includes(t))) return false;
      const triado = !!d.user_status;
      switch (filtro) {
        case 'destaque':     return !triado && ((d.situation === 'encontrado_acessivel' && !d.catalogued)
                                    || d.situation === 'referenciado_nao_encontrado' || d.situation === 'sem_permissao');
        case 'acessivel':    return !triado && d.situation === 'encontrado_acessivel';
        case 'referenciado': return !triado && (d.situation === 'referenciado_nao_encontrado' || d.situation === 'sem_permissao');
        case 'vazio':        return !triado && d.situation === 'vazio';
        case 'sistema':      return d.situation === 'sistema';
        case 'triado':       return triado;
        case 'desaparecido': return !triado && !d.is_present;
        case 'colisao':      return !!d.collision_with;
        default:             return d.situation !== 'sistema';
      }
    });
  }, [q.data, busca, filtro]);

  if (q.isPending) return <SkeletonCartoes n={4} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar a descoberta." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const { run, big, databases } = q.data;
  const rodando = executar.isPending;
  const parciais = run?.stats?.hosts_parciais_labels ?? [];
  const hostsAuditados = run?.stats?.hosts ?? [];
  const camadas = run?.stats?.layers ?? [];
  const etapas = run?.stats?.etapas ?? [];
  const alertas = run?.stats?.alerts_raised ?? 0;
  const colisoes = databases.filter((d) => d.collision_with).length;

  const botaoExec = (
    <button type="button" className={css.exec} onClick={() => executar.mutate()} disabled={rodando}>
      <Icone nome={rodando ? 'Loader' : 'Radar'} size={14} /> {rodando ? 'Executando…' : 'Executar descoberta'}
    </button>
  );

  if (!run || databases.length === 0) {
    return (
      <div className={css.raiz}>
        <EmptyState icone="Radar" titulo="Nenhuma descoberta executada ainda"
          descricao="Rode a auditoria para enumerar todos os schemas visíveis, cruzar com as configurações e a lista conhecida, e explicar cada ausência."
          acao={botaoExec} />
      </div>
    );
  }

  const colunas: ColunaDef<Descoberto>[] = [
    { id: 'situation', cabecalho: 'Situação', icone: 'Compass', largura: '160px', obrigatoria: true,
      celula: (d) => {
        if (d.user_status && USTATUS[d.user_status]) {
          const u = USTATUS[d.user_status];
          return <Badge texto={u.rotulo} tom={u.tom} icone={u.icone} />;
        }
        if (!d.is_present) {
          return <Badge texto="Desapareceu" tom="alerta" icone="CircleX" dica={d.disappeared_at ? `desde ${d.disappeared_at}` : undefined} />;
        }
        const s = SIT[d.situation] ?? SIT.referenciado_nao_encontrado;
        return <Badge texto={s.rotulo} tom={s.tom} icone={s.icone} />;
      } },
    { id: 'name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(200px, 1.4fr)',
      celula: (d) => (
        <span className={css.bancoCel}>
          <span className={css.mono}>{d.name}</span>
          {d.catalogued
            ? <Badge texto="catalogado" tom="ok" icone="Check" fraco />
            : d.situation === 'encontrado_acessivel' ? <Badge texto="não catalogado" tom="atencao" fraco /> : null}
          {d.collision_with && <Badge texto="colisão" tom="alerta" icone="TriangleAlert" fraco dica={`Nome quase idêntico a: ${d.collision_with}`} />}
        </span>
      ) },
    { id: 'origem', cabecalho: 'Origem', icone: 'Layers', largura: 'minmax(200px, 1.2fr)',
      celula: (d) => (
        <span className={css.origem}>
          {ORIGENS.filter((o) => d[o.chave]).map((o) => (
            <Badge key={o.chave} texto={o.rotulo} tom={o.tom} icone={o.icone} fraco />
          ))}
        </span>
      ) },
    { id: 'server_context', cabecalho: 'Servidor', icone: 'Server', largura: 'minmax(160px, 1fr)',
      celula: (d) => <span className={css.discreto}>{d.server_context ?? (d.host ? `${d.host}:${d.port ?? 3306}` : '—')}</span> },
    { id: 'table_count', cabecalho: 'Tabelas', icone: 'TableProperties', largura: '90px', alinhamento: 'fim',
      celula: (d) => <span className={css.num}>{d.table_count !== null ? fmtInt(d.table_count) : '—'}</span> },
    { id: 'confidence', cabecalho: 'Confiança', icone: 'Gauge', largura: '110px',
      celula: (d) => <Badge texto={d.confidence} tom={CONF[d.confidence] ?? 'neutro'} fraco /> },
    { id: 'reason', cabecalho: 'Motivo', icone: 'Info', largura: 'minmax(200px, 1.6fr)', ocultaPorPadrao: true,
      celula: (d) => <span className={css.discreto} title={d.reason ?? ''}>{d.reason ?? '—'}</span> },
  ];

  const chips = [
    { ativo: filtro === 'destaque', aoClicar: () => setFiltro('destaque'), icone: 'Sparkles',
      texto: `Pendentes (${fmtInt(big.nao_catalogados + big.referenciados + big.sem_permissao)})` },
    { ativo: filtro === 'acessivel', aoClicar: () => setFiltro('acessivel'), icone: 'CircleCheck', texto: `Acessíveis (${fmtInt(big.acessiveis)})` },
    { ativo: filtro === 'referenciado', aoClicar: () => setFiltro('referenciado'), icone: 'FileSearch', texto: `Referenciados (${fmtInt(big.referenciados + big.sem_permissao)})` },
    { ativo: filtro === 'vazio', aoClicar: () => setFiltro('vazio'), icone: 'CircleDashed', texto: `Vazios (${fmtInt(big.vazios)})` },
    { ativo: filtro === 'sistema', aoClicar: () => setFiltro('sistema'), icone: 'Cog', texto: `Sistema (${fmtInt(big.sistema)})` },
    { ativo: filtro === 'triado', aoClicar: () => setFiltro('triado'), icone: 'Tag', texto: `Triados (${fmtInt(big.triados)})` },
    ...(big.desaparecidos > 0 ? [{ ativo: filtro === 'desaparecido', aoClicar: () => setFiltro('desaparecido'), icone: 'CircleX', texto: `Desaparecidos (${fmtInt(big.desaparecidos)})` }] : []),
    ...(colisoes > 0 ? [{ ativo: filtro === 'colisao', aoClicar: () => setFiltro('colisao'), icone: 'TriangleAlert', texto: `Colisões (${fmtInt(colisoes)})` }] : []),
    { ativo: filtro === '', aoClicar: () => setFiltro(''), icone: 'Layers', texto: 'Todos' },
  ];

  return (
    <div className={css.raiz}>
      <div className={css.topoBarra}>
        <div className={css.runInfo}>
          {run.finished_at
            ? <><Icone nome="Clock" size={13} /> última auditoria {fmtRelativo(run.finished_at)} · {run.hosts_probed} host(s)
                {run.hosts_failed > 0 && <> · <span className={css.warn}>{run.hosts_failed} com falha</span></>}
                {alertas > 0 && <> · <span className={css.alertas}><Icone nome="BellRing" size={12} /> {fmtInt(alertas)} alerta(s) na aba Alertas</span></>}</>
            : <><Icone nome="Loader" size={13} /> auditoria em andamento…</>}
        </div>
        <div className={css.topoAcoes}>
          <button type="button" className={css.exportar} onClick={baixarCsv} disabled={baixando}
            title="Exportar a lista reconciliada em CSV (§31) — ex.: entregar ao DBA">
            <Icone nome={baixando ? 'Loader' : 'Download'} size={14} /> {baixando ? 'Exportando…' : 'Exportar CSV'}
          </button>
          {botaoExec}
        </div>
      </div>

      <Revelar>
        <section className={css.cards}>
          <MetricCard icone="Database" rotulo="Acessíveis" valor={big.acessiveis} contexto="schemas com tabelas, lidos" />
          <MetricCard icone="Boxes" rotulo="Catalogados" valor={big.catalogados} tom="ok" contexto="já no DataTables" />
          <MetricCard icone="DatabaseZap" rotulo="Não catalogados" valor={big.nao_catalogados}
            tom={big.nao_catalogados > 0 ? 'atencao' : 'ok'} contexto="acessíveis, fora do catálogo"
            onClick={() => setFiltro('destaque')} />
          <MetricCard icone="FileSearch" rotulo="Referenciados" valor={big.referenciados}
            tom={big.referenciados > 0 ? 'info' : 'ok'} contexto="citados, não encontrados"
            onClick={() => setFiltro('referenciado')} />
          <MetricCard icone="CircleDashed" rotulo="Vazios" valor={big.vazios} contexto="schema sem tabelas" />
          <MetricCard icone="Cog" rotulo="Sistema" valor={big.sistema} contexto="separados do negócio (§16)"
            onClick={() => setFiltro('sistema')} />
          <MetricCard icone="Tag" rotulo="Triados" valor={big.triados} contexto="classificados pela equipe"
            onClick={() => setFiltro('triado')} />
          {big.desaparecidos > 0 && (
            <MetricCard icone="CircleX" rotulo="Desaparecidos" valor={big.desaparecidos} tom="alerta"
              contexto="não vieram na última rodada" onClick={() => setFiltro('desaparecido')} />
          )}
        </section>
      </Revelar>

      {hostsAuditados.length > 0 && (
        <div className={css.hostsPanel}>
          <span className={css.hostsTitulo}><Icone nome="Server" size={13} /> Servidores auditados</span>
          {hostsAuditados.map((h) => {
            const st = HOST_STATUS[h.status] ?? HOST_STATUS.offline;
            return (
              <span key={h.host} className={css.hostItem}>
                <span className={css.mono}>{h.host}</span>
                <Badge texto={st.rotulo} tom={st.tom} icone={st.icone} fraco />
                {h.schemas !== null && <span className={css.discreto}>{h.schemas} schemas</span>}
              </span>
            );
          })}
        </div>
      )}

      {etapas.length > 0 && (
        <div className={css.etapasPanel}>
          <span className={css.hostsTitulo}><Icone nome="ListChecks" size={13} /> Etapas da rodada</span>
          <ol className={css.etapasTrilha}>
            {etapas.map((e, i) => (
              <li key={e.rotulo} className={css.etapaNo} title={`${e.n} ${e.unidade}`}>
                <Badge texto={String(i + 1)} tom={ETAPA_TOM[e.status] ?? 'neutro'} fraco />
                <span className={css.etapaRotulo}>{e.rotulo}</span>
                <span className={css.etapaNum}>{fmtInt(e.n)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {camadas.length > 0 && (
        <div className={css.camadasPanel}>
          <span className={css.hostsTitulo}><Icone nome="Layers" size={13} /> Camadas de descoberta (§7.5–§7.9)</span>
          <div className={css.camadasGrid}>
            {camadas.map((c) => {
              const st = LAYER_STATUS[c.status] ?? LAYER_STATUS.parcial;
              return (
                <div key={c.layer} className={css.camadaItem} title={c.note}>
                  <div className={css.camadaTopo}>
                    <span className={css.camadaRotulo}>{c.rotulo}</span>
                    <Badge texto={st.rotulo} tom={st.tom} icone={st.icone} fraco />
                  </div>
                  <span className={css.camadaMeta}>
                    {c.hits > 0 ? `${fmtInt(c.hits)} banco(s)` : 'nada citado'}
                    {c.scanned > 0 && <span className={css.discreto}> · {fmtInt(c.scanned)} lido(s)</span>}
                  </span>
                  <span className={css.camadaNota}>{c.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {parciais.length > 0 && (
        <div className={css.avisoCritico}>
          <Icone nome="ShieldAlert" size={15} />
          <div>
            <strong>Visão parcial detectada (§35).</strong> {parciais.length} host respondeu com credencial de
            permissão restrita — <em>{parciais.slice(0, 2).join(', ')}</em>. O número de bancos “acessíveis” é um
            <strong> piso</strong>, não o total: pode haver bancos que a credencial atual não enxerga. Ampliar a
            permissão (SHOW DATABASES / SELECT) revelaria o que falta.
          </div>
        </div>
      )}

      {rel.data && (
        <div className={css.relatorioPanel}>
          <span className={css.hostsTitulo}><Icone nome="FileText" size={13} /> Relatório final (§31) — recomendações</span>
          <div className={css.relGrid}>
            {[
              { n: rel.data.recomendacoes.cadastrar_conexao, r: 'Cadastrar conexão', i: 'PlugZap', tom: 'atencao' as Tom },
              { n: rel.data.recomendacoes.ampliar_permissao, r: 'Ampliar permissão (credencial)', i: 'ShieldAlert', tom: 'alerta' as Tom },
              { n: rel.data.recomendacoes.revisar_referencia, r: 'Revisar referência / legado', i: 'FileSearch', tom: 'info' as Tom },
              { n: rel.data.recomendacoes.resolver_colisao, r: 'Resolver colisão de nome', i: 'TriangleAlert', tom: 'alerta' as Tom },
              { n: rel.data.recomendacoes.associar_aplicacao, r: 'Associar aplicação', i: 'Boxes', tom: 'neutro' as Tom },
            ].filter((x) => x.n > 0).map((x) => (
              <span key={x.r} className={css.relItem}>
                <Badge texto={fmtInt(x.n)} tom={x.tom} icone={x.i} /> <span className={css.discreto}>{x.r}</span>
              </span>
            ))}
          </div>
          {rel.data.pendencias.servidores_sem_acesso.length > 0 && (
            <span className={css.relServidores}>
              <Icone nome="Server" size={12} /> Servidores sem acesso pleno:{' '}
              {rel.data.pendencias.servidores_sem_acesso.map((s) => `${s.host} (${s.status})`).join(', ')}
              {' '}— o CSV lista os bancos referenciados a entregar ao DBA.
            </span>
          )}
        </div>
      )}

      <DataGrid<Descoberto> rotulo="Bancos descobertos" chaveEstado="descoberta"
        colunas={colunas} linhas={filtradas} idLinha={(d) => d.db_key}
        aoClicarLinha={(d) => setAlvo(d)} aoAtualizar={() => q.refetch()}
        ferramentas={<FilterBar busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar banco, host ou aplicação…' }} chips={chips} />}
        vazio={{ titulo: 'Nada neste filtro', descricao: 'Ajuste os chips acima ou a busca para ver outros bancos.' }} />

      <DescobertaDrawer alvo={alvo} aoFechar={() => setAlvo(null)}
        aoCadastrar={(d, nota) => { setAlvo(null); setCadastro({ d, nota }); }} />

      {cadastro && (
        <ConexaoForm conexaoId={null} aberto aoFechar={() => setCadastro(null)}
          nota={cadastro.nota}
          prefill={{
            name: cadastro.d.name,
            source_type: 'mysql',
            host: cadastro.d.host ?? '',
            port: cadastro.d.port ?? 3306,
            db_name: cadastro.d.name,
            username: null,
            environment_id: null,
            monitoring_enabled: true,
          }} />
      )}
    </div>
  );
}
