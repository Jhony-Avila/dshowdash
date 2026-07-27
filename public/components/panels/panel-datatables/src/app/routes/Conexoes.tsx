// app/routes/Conexoes.tsx — Conexões como DataGrid robusto (§24 / §37.1).
// @version 2.0.0  @updated 2026-07-21
// Cards -> DataGrid: colunas ordenáveis/ocultáveis, densidade, export, ações no
// menu ⋮ da linha e clique na linha abre o drawer de detalhe. O pulso do online
// (§24.3) é preservado como ponto pulsante dentro da coluna Status.
import { useState, useMemo, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtRelativo } from '../../lib/format';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import { useOrdenacaoLocal } from '../../components/grid/useOrdenacaoLocal';
import type { ColunaDef, ItemMenuLinha } from '../../components/grid/tipos';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { ConexaoForm } from './forms/ConexaoForm';
import { ConexaoDrawer } from './drawers/ConexaoDrawer';
import css from './Conexoes.module.css';

interface Conexao {
  id: number; name: string; source_type: string; host: string; port: number;
  db_name: string | null; status: string; environment_label: string | null;
  has_password: boolean; is_active: boolean; monitoring_enabled: boolean;
  last_check_at: string | null; last_success_at: string | null;
  last_inventory_at: string | null; last_error: string | null;
}

export function Conexoes(): JSX.Element {
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [busca, setBusca] = useState('');
  // null = fechado; { id: null } = criar; { id: n } = editar (carrega o registro).
  const [form, setForm] = useState<{ id: number | null } | null>(null);
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'connections'],
    queryFn: ({ signal }) => apiGet<Conexao[]>('/connections', { is_active: 1 }, signal),
  });

  const desativar = useMutation({
    mutationFn: (id: number) => apiWrite(`/connections/${id}`, 'DELETE'),
    onSuccess: () => { setAviso({ texto: 'Conexão desativada. O catálogo histórico foi preservado.' }); qc.invalidateQueries({ queryKey: ['dt'] }); },
    onError: (e: ApiError) => setAviso({ texto: `Falha ao desativar: ${e.message}`, erro: true }),
  });

  const verificar = useMutation({
    mutationFn: (id: number) => apiWrite<{ check: { status: string; latency_ms: number | null; error: string | null } }>(
      `/connections/${id}/check`, 'POST'),
    onSuccess: (r) => {
      const c = r.data.check;
      const ok = c.status === 'online' || c.status === 'slow';
      setAviso({
        texto: `Verificação: ${c.status}${c.latency_ms ? ` em ${c.latency_ms}ms` : ''}`
             + (c.error ? ` — ${c.error}` : ''),
        erro: !ok,
      });
      qc.invalidateQueries({ queryKey: ['dt'] });
    },
    onError: (e: ApiError) => setAviso({ texto: `Falha ao verificar: ${e.message}`, erro: true }),
  });

  const inventariar = useMutation({
    mutationFn: (id: number) => apiWrite<{ inventory: { status: string; databases: number; tables: number; fields: number; duration_ms: number; error?: string } }>(
      `/connections/${id}/inventory`, 'POST'),
    onSuccess: (r) => {
      const i = r.data.inventory;
      setAviso({
        texto: i.status === 'success'
          ? `Inventário: ${i.databases} banco(s), ${i.tables} tabela(s), ${i.fields} campo(s) em ${i.duration_ms}ms`
          : `Inventário falhou: ${i.error ?? 'erro desconhecido'}`,
        erro: i.status !== 'success',
      });
      qc.invalidateQueries({ queryKey: ['dt'] });
    },
    onError: (e: ApiError) => setAviso({ texto: `Falha no inventário: ${e.message}`, erro: true }),
  });

  // Hooks ANTES de qualquer early return (regra dos hooks; usa q.data ?? []).
  const conexoes = useMemo(() => {
    const arr = q.data ?? [];
    const t = busca.trim().toLowerCase();
    return t ? arr.filter((c) => c.name.toLowerCase().includes(t) || (c.host ?? '').toLowerCase().includes(t)) : arr;
  }, [q.data, busca]);

  const colunas: ColunaDef<Conexao>[] = useMemo(() => [
    { id: 'status', cabecalho: 'Status', icone: 'Activity', largura: '150px', obrigatoria: true, ordenavel: true,
      valor: (c) => c.status,
      celula: (c) => (
        <span className={css.celStatus}>
          <span className={c.status === 'online' ? css.pulso : css.pontoEstatico} aria-hidden="true" />
          <StatusBadge status={c.status} compacto />
        </span>
      ) },
    { id: 'name', cabecalho: 'Nome', icone: 'PlugZap', largura: 'minmax(160px, 1.3fr)', obrigatoria: true, ordenavel: true,
      valor: (c) => c.name, celula: (c) => <span className={css.nome}>{c.name}</span> },
    { id: 'host', cabecalho: 'Host', icone: 'Server', largura: 'minmax(150px, 1fr)', ordenavel: true,
      valor: (c) => `${c.host}:${c.port}`, celula: (c) => <span className={css.host}>{c.host}:{c.port}</span> },
    { id: 'db_name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(120px, 0.9fr)', ordenavel: true,
      valor: (c) => c.db_name ?? '', celula: (c) => <span className={css.valorMono}>{c.db_name ?? '(todos)'}</span> },
    { id: 'source_type', cabecalho: 'Tipo', icone: 'Layers', largura: '92px', ordenavel: true, ocultaPorPadrao: true,
      valor: (c) => c.source_type, celula: (c) => <span className={css.discreto}>{c.source_type}</span> },
    { id: 'environment_label', cabecalho: 'Ambiente', icone: 'Network', largura: '130px', ordenavel: true,
      valor: (c) => c.environment_label ?? '',
      celula: (c) => c.environment_label ? <Badge texto={c.environment_label} tom="info" icone="Network" /> : <span className={css.discreto}>—</span> },
    { id: 'monitoring_enabled', cabecalho: 'Monitor.', icone: 'RefreshCw', largura: '112px', alinhamento: 'centro', ordenavel: true,
      valor: (c) => (c.monitoring_enabled ? 1 : 0),
      celula: (c) => c.monitoring_enabled ? <Badge texto="ativo" tom="ok" fraco /> : <Badge texto="desligado" tom="atencao" icone="TriangleAlert" /> },
    { id: 'last_check_at', cabecalho: 'Verificação', icone: 'Clock', largura: '124px', ordenavel: true,
      valor: (c) => c.last_check_at ?? '', celula: (c) => <span className={css.discreto}>{fmtRelativo(c.last_check_at)}</span> },
    { id: 'last_inventory_at', cabecalho: 'Inventário', icone: 'Clock', largura: '124px', ordenavel: true, ocultaPorPadrao: true,
      valor: (c) => c.last_inventory_at ?? '', celula: (c) => <span className={css.discreto}>{fmtRelativo(c.last_inventory_at)}</span> },
  ], []);

  const grid = useOrdenacaoLocal(conexoes, colunas, { coluna: 'status', direcao: 'asc' });

  // Gráfico "Conexões por ambiente" (donut): composição da frota. Hook ANTES dos
  // early returns; guarda de ≥2 ambientes. Status não vira gráfico (todas online =
  // fatia única). `(sem ambiente)` fica explícito — é insight acionável (§10.1).
  // Cores categóricas da paleta (a lista de conexões não retorna a cor do ambiente).
  const palette = usePaletaGrafico();
  const opcaoAmbiente = useMemo(() => {
    const arr = q.data ?? [];
    if (!arr.length) return null;
    const mapa = new Map<string, number>();
    for (const c of arr) { const k = c.environment_label ?? '(sem ambiente)'; mapa.set(k, (mapa.get(k) ?? 0) + 1); }
    const dados = [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    if (dados.length < 2) return null;
    const cores = [palette.primary, palette.info, palette.success, palette.warning, palette.danger, palette.slow, palette.cred, palette.neutral];
    const bb = baseGrafico(palette);
    return {
      ...bb,
      tooltip: { ...(bb.tooltip as object), trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { type: 'scroll', orient: 'vertical', right: 4, top: 'middle', icon: 'circle',
        textStyle: { color: palette.texto, fontSize: 11 } },
      series: [{ type: 'pie', radius: ['46%', '72%'], center: ['32%', '50%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: palette.surface, borderWidth: 2, borderRadius: 4 },
        label: { show: false }, labelLine: { show: false },
        data: dados.map(([nome, n], i) => ({ name: nome, value: n, itemStyle: { color: cores[i % cores.length] } })) }],
    };
  }, [q.data, palette]);

  const menu = (c: Conexao): ItemMenuLinha<Conexao>[] => {
    const itens: ItemMenuLinha<Conexao>[] = [
      { rotulo: 'Detalhes', icone: 'Eye', aoClicar: () => setDrawerId(c.id) },
      { rotulo: 'Verificar', icone: 'Activity', aoClicar: () => verificar.mutate(c.id) },
    ];
    if (c.source_type === 'mysql') itens.push({ rotulo: 'Inventariar', icone: 'RefreshCw', aoClicar: () => inventariar.mutate(c.id) });
    itens.push({ rotulo: 'Editar', icone: 'SlidersHorizontal', aoClicar: () => setForm({ id: c.id }) });
    itens.push({ rotulo: 'Desativar', icone: 'X', perigo: true, aoClicar: () => { if (confirm(`Desativar a conexão "${c.name}"? O histórico é preservado.`)) desativar.mutate(c.id); } });
    return itens;
  };

  if (q.isPending) return <SkeletonCartoes n={3} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível listar as conexões." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const todas = q.data;
  const online = todas.filter((c) => c.status === 'online').length;
  const comProblema = todas.filter((c) => ['offline', 'credential_expired', 'unstable'].includes(c.status)).length;
  const monitoradas = todas.filter((c) => c.monitoring_enabled).length;

  return (
    <div className={css.raiz}>
      {aviso && (
        <div className={aviso.erro ? css.avisoErro : css.aviso} role="status">
          <Icone nome={aviso.erro ? 'TriangleAlert' : 'CircleCheck'} size={14} />
          {aviso.texto}
          <button type="button" className={css.fechar} onClick={() => setAviso(null)} aria-label="Fechar aviso">×</button>
        </div>
      )}

      <section className={css.cards}>
        <MetricCard icone="PlugZap" rotulo="Conexões" valor={todas.length} contexto="ativas" />
        <MetricCard icone="Activity" rotulo="Online" valor={online} tom={online === todas.length ? 'ok' : 'atencao'} contexto={`de ${todas.length}`} />
        <MetricCard icone="CircleX" rotulo="Com problema" valor={comProblema} tom={comProblema > 0 ? 'alerta' : 'ok'} contexto="offline / credencial / instável" />
        <MetricCard icone="RefreshCw" rotulo="Monitoradas" valor={monitoradas} contexto="a cada 5 min" />
      </section>

      {opcaoAmbiente && (
        <Revelar atraso={60}>
          <section className={css.bloco}>
            <div className={css.blocoTopo}>
              <h2 className={css.blocoTitulo}>Conexões por ambiente</h2>
              <span className={css.blocoSub}>distribuição das {todas.length} conexões monitoradas</span>
            </div>
            <Grafico opcao={opcaoAmbiente} altura={240} aria="Conexões por ambiente" />
          </section>
        </Revelar>
      )}

      <div className={css.nota}>
        <Icone nome="KeyRound" size={13} />
        Credenciais são cifradas em AES-256-GCM e <strong>nunca</strong> retornam ao navegador.
      </div>

      <DataGrid<Conexao>
        rotulo="Conexões" chaveEstado="conexoes" colunas={colunas} linhas={grid.linhas} idLinha={(c) => c.id}
        ordenacao={grid.ordenacao} aoOrdenar={grid.aoOrdenar}
        aoClicarLinha={(c) => setDrawerId(c.id)}
        menuLinha={menu}
        aoAtualizar={() => q.refetch()}
        ferramentas={
          <div className={css.ferramentas}>
            <FilterBar busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar por nome ou host…' }}
              aoLimpar={() => setBusca('')} algumAtivo={!!busca} />
            <button type="button" className={css.novo} onClick={() => setForm({ id: null })}>
              <Icone nome="PlugZap" size={14} /> Nova conexão
            </button>
          </div>
        }
        vazio={{ titulo: busca ? 'Nenhuma conexão corresponde ao filtro' : 'Nenhuma conexão cadastrada',
                 descricao: busca ? 'Limpe o filtro para ver todas.' : 'Cadastre uma fonte MySQL, API, arquivo ou cache para começar a monitorar a infraestrutura.' }}
      />

      {form && <ConexaoForm conexaoId={form.id} aberto aoFechar={() => setForm(null)} />}
      <ConexaoDrawer id={drawerId} aoFechar={() => setDrawerId(null)} />
    </div>
  );
}
