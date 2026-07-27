// app/routes/Servidores.tsx — Servidores como DataGrid robusto (§38.4 / §37.1).
// @version 2.0.0  @updated 2026-07-21
// Cards -> DataGrid: colunas ordenáveis/ocultáveis, densidade, ⋮ por linha e
// clique abre o drawer. IP mascarado por padrão (§10.1). Ambiente com a cor real.
import { useMemo, useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtBytes, fmtInt, fmtRelativo } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import { useOrdenacaoLocal } from '../../components/grid/useOrdenacaoLocal';
import type { ColunaDef, ItemMenuLinha } from '../../components/grid/tipos';
import { ServidorForm } from './forms/ServidorForm';
import { ServidorDrawer } from './drawers/ServidorDrawer';
import { AplicacoesSecao } from './AplicacoesSecao';
import css from './Servidores.module.css';

interface Servidor {
  id: number; name: string; hostname: string | null; ip_masked?: string; provider: string | null;
  environment_label: string | null; environment_color: string | null;
  connection_count: number; conn_online: number; conn_offline: number;
  database_count: number; total_size: number | null; last_check_at: string | null;
}

export function Servidores(): JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ id: number | null } | null>(null);
  const [drawer, setDrawer] = useState<Servidor | null>(null);
  const [busca, setBusca] = useState('');
  const [soProblema, setSoProblema] = useState(false);

  const q = useQuery({
    queryKey: ['dt', 'servers'],
    queryFn: ({ signal }) => apiGet<Servidor[]>('/servers', undefined, signal),
  });

  const excluir = useMutation({
    mutationFn: (id: number) => apiWrite(`/servers/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dt'] }),
  });

  const filtrados = useMemo(() => {
    const lista = q.data ?? [];
    const t = busca.trim().toLowerCase();
    return lista.filter((s) =>
      (!soProblema || s.conn_offline > 0) &&
      (!t || s.name.toLowerCase().includes(t)
        || (s.hostname ?? '').toLowerCase().includes(t)
        || (s.provider ?? '').toLowerCase().includes(t)),
    );
  }, [q.data, busca, soProblema]);

  const colunas: ColunaDef<Servidor>[] = useMemo(() => [
    { id: 'name', cabecalho: 'Servidor', icone: 'Server', largura: 'minmax(190px, 1.5fr)', obrigatoria: true, ordenavel: true,
      valor: (s) => s.name,
      celula: (s) => (
        <span className={css.celServidor}>
          <span className={css.icone}><Icone nome="Server" size={15} /></span>
          <span className={css.ident}>
            <strong className={css.nome}>{s.name}</strong>
            {s.hostname && <span className={css.host}>{s.hostname}</span>}
          </span>
        </span>
      ) },
    { id: 'environment_label', cabecalho: 'Ambiente', icone: 'Network', largura: '130px', ordenavel: true,
      valor: (s) => s.environment_label ?? '',
      celula: (s) => s.environment_label
        ? <span className={css.env} style={{ ['--env' as string]: s.environment_color ?? 'var(--dt-neutral)' }}>{s.environment_label}</span>
        : <span className={css.discreto}>—</span> },
    { id: 'ip_masked', cabecalho: 'IP', icone: 'Globe', largura: '120px', ocultaPorPadrao: true,
      valor: (s) => s.ip_masked ?? '', celula: (s) => <span className={css.mono}>{s.ip_masked ?? '—'}</span> },
    { id: 'provider', cabecalho: 'Provedor', icone: 'Boxes', largura: 'minmax(120px, 1fr)', ordenavel: true,
      valor: (s) => s.provider ?? '', celula: (s) => <span className={css.discreto}>{s.provider ?? '—'}</span> },
    { id: 'connection_count', cabecalho: 'Conexões', icone: 'Cable', largura: '160px', ordenavel: true,
      valor: (s) => s.connection_count,
      celula: (s) => (
        <span className={css.celConex}>
          <span className={css.num}>{fmtInt(s.connection_count)}</span>
          {s.conn_offline > 0
            ? <Badge texto={`${s.conn_offline} fora`} tom="alerta" icone="CircleX" fraco />
            : <Badge texto="online" tom="ok" icone="CircleCheck" fraco />}
        </span>
      ) },
    { id: 'database_count', cabecalho: 'Bancos', icone: 'Database', largura: '96px', alinhamento: 'fim', ordenavel: true,
      valor: (s) => s.database_count, celula: (s) => <span className={css.num}>{fmtInt(s.database_count)}</span> },
    { id: 'total_size', cabecalho: 'Volume', icone: 'HardDrive', largura: '120px', alinhamento: 'fim', ordenavel: true,
      valor: (s) => s.total_size ?? 0, celula: (s) => <span className={css.num}>{fmtBytes(s.total_size)}</span> },
    { id: 'last_check_at', cabecalho: 'Verificação', icone: 'Clock', largura: '130px', ordenavel: true,
      valor: (s) => s.last_check_at ?? '', celula: (s) => <span className={css.discreto}>{fmtRelativo(s.last_check_at)}</span> },
  ], []);

  const grid = useOrdenacaoLocal(filtrados, colunas, { coluna: 'name', direcao: 'asc' });

  // Gráfico "Volume por servidor": barra horizontal do tamanho somado dos bancos.
  // Usa a cor do ambiente QUANDO houver (hoje o ambiente é por-conexão e vem nulo
  // no nível do servidor → cai no accent primário; future-proof se for atribuído).
  // Hook ANTES dos early returns (regra dos hooks / React #310); guarda de ≥2
  // servidores COM volume (1 barra não é gráfico). Maiores no topo.
  const palette = usePaletaGrafico();
  const opcaoVolume = useMemo(() => {
    const comVolume = (q.data ?? []).filter((s) => (s.total_size ?? 0) > 0);
    if (comVolume.length < 2) return null;
    const ord = [...comVolume].sort((a, b) => (a.total_size ?? 0) - (b.total_size ?? 0)).slice(-12);
    const bb = baseGrafico(palette);
    return {
      ...bb,
      grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...(bb.tooltip as object), trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: Array<{ name: string; value: number }>) => `${p[0].name}: ${fmtBytes(p[0].value)}` },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: palette.grade } },
        axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => fmtBytes(v) } },
      yAxis: { type: 'category', data: ord.map((s) => s.name),
        axisLine: { lineStyle: { color: palette.grade } }, axisTick: { show: false },
        axisLabel: { color: palette.texto, fontSize: 11 } },
      series: [{ type: 'bar', barWidth: '58%',
        data: ord.map((s) => ({ value: s.total_size ?? 0,
          itemStyle: { color: s.environment_color ?? palette.primary, borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: palette.muted, fontSize: 10,
          formatter: (p: { value: number }) => fmtBytes(p.value) } }],
    };
  }, [q.data, palette]);

  const menu = (s: Servidor): ItemMenuLinha<Servidor>[] => [
    { rotulo: 'Detalhes', icone: 'Eye', aoClicar: () => setDrawer(s) },
    { rotulo: 'Editar', icone: 'SlidersHorizontal', aoClicar: () => setForm({ id: s.id }) },
    { rotulo: 'Excluir', icone: 'Trash2', perigo: true,
      aoClicar: () => { if (confirm(`Excluir o servidor "${s.name}"? As conexões são desvinculadas (voltam a "Sem servidor").`)) excluir.mutate(s.id); } },
  ];

  if (q.isPending) return <SkeletonCartoes n={3} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar os servidores." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const servidores = q.data;
  const totConn = servidores.reduce((s, x) => s + x.connection_count, 0);
  const totOff = servidores.reduce((s, x) => s + x.conn_offline, 0);
  const totSize = servidores.reduce((s, x) => s + (x.total_size ?? 0), 0);

  return (
    <div className={css.raiz}>
      <Revelar>
        <section className={css.cards}>
          <MetricCard icone="Server" rotulo="Servidores" valor={servidores.length} contexto="máquinas ativas" />
          <MetricCard icone="Cable" rotulo="Conexões" valor={totConn}
            contexto={`${totConn - totOff} online`} tom={totOff > 0 ? 'atencao' : 'ok'} />
          <MetricCard icone="Database" rotulo="Bancos" valor={servidores.reduce((s, x) => s + x.database_count, 0)} />
          <MetricCard icone="HardDrive" rotulo="Volume total" valor={fmtBytes(totSize)} contexto="somando os bancos" />
        </section>
      </Revelar>

      {opcaoVolume && (
        <Revelar atraso={60}>
          <section className={css.bloco}>
            <div className={css.blocoTopo}>
              <h2 className={css.blocoTitulo}>Volume por servidor</h2>
              <span className={css.blocoSub}>tamanho somado dos bancos de cada servidor</span>
            </div>
            <Grafico opcao={opcaoVolume}
              altura={Math.max(180, servidores.filter((s) => (s.total_size ?? 0) > 0).length * 40)}
              aria="Volume de dados por servidor" />
          </section>
        </Revelar>
      )}

      <DataGrid<Servidor>
        rotulo="Servidores" chaveEstado="servidores" colunas={colunas} linhas={grid.linhas} idLinha={(s) => s.id}
        ordenacao={grid.ordenacao} aoOrdenar={grid.aoOrdenar}
        aoClicarLinha={(s) => setDrawer(s)}
        menuLinha={menu}
        aoAtualizar={() => q.refetch()}
        ferramentas={
          <div className={css.ferramentas}>
            <FilterBar
              busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar servidor, host ou provedor…' }}
              chips={[{ ativo: soProblema, aoClicar: () => setSoProblema((v) => !v), icone: 'CircleX', texto: 'Com conexão fora' }]}
              aoLimpar={() => { setBusca(''); setSoProblema(false); }}
              algumAtivo={!!busca || soProblema} />
            <button type="button" className={css.novo} onClick={() => setForm({ id: null })}>
              <Icone nome="Server" size={14} /> Novo servidor
            </button>
          </div>
        }
        vazio={{ titulo: (busca || soProblema) ? 'Nenhum servidor corresponde ao filtro' : 'Nenhum servidor cadastrado',
                 descricao: (busca || soProblema) ? 'Ajuste a busca ou remova o filtro “Com conexão fora”.' : 'Cadastre servidores e VPSs para agrupar as conexões monitoradas por máquina.' }}
      />

      <AplicacoesSecao />

      {form && <ServidorForm servidorId={form.id} aberto aoFechar={() => setForm(null)} />}
      <ServidorDrawer servidor={drawer} aoFechar={() => setDrawer(null)} />
    </div>
  );
}
