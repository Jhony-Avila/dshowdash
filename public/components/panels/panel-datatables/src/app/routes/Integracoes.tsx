// app/routes/Integracoes.tsx — Integrações / fontes externas como DataGrid (§34/§35).
// @version 2.0.0  @updated 2026-07-21
// Fontes NÃO-MySQL (APIs HTTP, arquivos, caches). Cards -> DataGrid ordenável.
// 401/403 vira `credential_expired`, nunca `offline`. Sem ações (tela de leitura).
import { useMemo, useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../lib/api';
import { fmtRelativo } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes, EmptyState } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import { useOrdenacaoLocal } from '../../components/grid/useOrdenacaoLocal';
import type { ColunaDef } from '../../components/grid/tipos';
import css from './Integracoes.module.css';

interface Fonte {
  connection_id: number; name: string; source_type: string; status: string; host: string | null;
  endpoint: string | null; http_method: string | null; auth_type: string | null;
  expected_status: number | null; last_status_code: number | null; last_response_ms: number | null;
  last_ok_at: string | null; since: string | null; status_duration_sec: number | null;
}

const TIPO_ICONE: Record<string, string> = {
  http_api: 'Globe', api: 'Globe', arquivo: 'FileText', file: 'FileText',
  redis: 'Radio', cache: 'Radio', mysql: 'Database',
};

export function Integracoes(): JSX.Element {
  const [busca, setBusca] = useState('');
  const [soProblema, setSoProblema] = useState(false);

  const q = useQuery({
    queryKey: ['dt', 'sources'],
    queryFn: ({ signal }) => apiGet<Fonte[]>('/sources', undefined, signal),
  });

  const filtradas = useMemo(() => {
    const lista = q.data ?? [];
    const t = busca.trim().toLowerCase();
    return lista.filter((f) =>
      (!soProblema || f.status !== 'online') &&
      (!t || f.name.toLowerCase().includes(t)
        || f.source_type.toLowerCase().includes(t)
        || (f.endpoint ?? '').toLowerCase().includes(t)
        || (f.host ?? '').toLowerCase().includes(t)),
    );
  }, [q.data, busca, soProblema]);

  const colunas: ColunaDef<Fonte>[] = useMemo(() => [
    { id: 'status', cabecalho: 'Status', icone: 'Activity', largura: '140px', obrigatoria: true, ordenavel: true,
      valor: (f) => f.status, celula: (f) => <StatusBadge status={f.status} compacto /> },
    { id: 'name', cabecalho: 'Fonte', icone: 'Unplug', largura: 'minmax(160px, 1.3fr)', obrigatoria: true, ordenavel: true,
      valor: (f) => f.name,
      celula: (f) => (
        <span className={css.celFonte}>
          <span className={css.icone}><Icone nome={TIPO_ICONE[f.source_type] ?? 'Cable'} size={14} /></span>
          <strong className={css.nome}>{f.name}</strong>
        </span>
      ) },
    { id: 'source_type', cabecalho: 'Tipo', icone: 'Boxes', largura: '110px', ordenavel: true,
      valor: (f) => f.source_type, celula: (f) => <span className={css.tipo}>{f.source_type}</span> },
    { id: 'endpoint', cabecalho: 'Endpoint', icone: 'Globe', largura: 'minmax(180px, 1.5fr)',
      valor: (f) => f.endpoint ?? f.host ?? '',
      celula: (f) => f.endpoint
        ? <span className={css.mono} title={f.endpoint}>{f.http_method ?? 'GET'} {f.endpoint}</span>
        : <span className={css.mono}>{f.host ?? '—'}</span> },
    { id: 'auth_type', cabecalho: 'Auth', icone: 'ShieldAlert', largura: '100px', ocultaPorPadrao: true,
      valor: (f) => f.auth_type ?? '', celula: (f) => <span className={css.discreto}>{f.auth_type ?? '—'}</span> },
    { id: 'last_status_code', cabecalho: 'Código', icone: 'Activity', largura: '130px', alinhamento: 'centro', ordenavel: true,
      valor: (f) => f.last_status_code,
      celula: (f) => f.last_status_code !== null
        ? <span className={f.expected_status && f.last_status_code === f.expected_status ? css.ok : css.warn}>
            {f.last_status_code}{f.expected_status ? ` (esp. ${f.expected_status})` : ''}
          </span>
        : <span className={css.discreto}>—</span> },
    { id: 'last_response_ms', cabecalho: 'Tempo', icone: 'Clock', largura: '96px', alinhamento: 'fim', ordenavel: true,
      valor: (f) => f.last_response_ms,
      celula: (f) => f.last_response_ms !== null ? <span className={css.num}>{f.last_response_ms} ms</span> : <span className={css.discreto}>—</span> },
    { id: 'last_ok_at', cabecalho: 'Último ok', icone: 'Clock', largura: '120px', ordenavel: true,
      valor: (f) => f.last_ok_at ?? '', celula: (f) => <span className={css.discreto}>{fmtRelativo(f.last_ok_at)}</span> },
  ], []);

  const grid = useOrdenacaoLocal(filtradas, colunas, { coluna: 'status', direcao: 'asc' });

  if (q.isPending) return <SkeletonCartoes n={3} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar as fontes externas." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const fontes = q.data;
  if (fontes.length === 0) {
    return (
      <div className={css.raiz}>
        <div className={css.nota}>
          <Icone nome="Unplug" size={13} />
          A sonda HTTP genérica cobre qualquer API (resolução, conectividade, auth, status e tempo).
          Conectores por fornecedor (Pipedrive/Asaas/Bling) mapeiam o payload de cada um — ainda não cadastrados.
        </div>
        <EmptyState icone="Unplug" titulo="Nenhuma fonte externa cadastrada"
          descricao="APIs, arquivos e caches monitorados aparecem aqui ao lado das conexões MySQL." />
      </div>
    );
  }

  const online = fontes.filter((f) => f.status === 'online').length;

  return (
    <div className={css.raiz}>
      <Revelar>
        <section className={css.cards}>
          <MetricCard icone="Unplug" rotulo="Fontes externas" valor={fontes.length} contexto="APIs, arquivos e caches" />
          <MetricCard icone="PlugZap" rotulo="Online" valor={online}
            tom={online === fontes.length ? 'ok' : 'atencao'} contexto={`${fontes.length - online} com problema`} />
        </section>
      </Revelar>

      <div className={css.nota}>
        <Icone nome="ShieldAlert" size={13} />
        401/403 de uma fonte é classificado como <strong>credencial expirada</strong>, não como
        indisponibilidade — evita alerta crítico falso quando a chave apenas venceu.
      </div>

      <DataGrid<Fonte>
        rotulo="Fontes externas" chaveEstado="integracoes" colunas={colunas} linhas={grid.linhas} idLinha={(f) => f.connection_id}
        ordenacao={grid.ordenacao} aoOrdenar={grid.aoOrdenar}
        aoAtualizar={() => q.refetch()}
        ferramentas={
          <div className={css.ferramentas}>
            <FilterBar
              busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar fonte, tipo ou endpoint…' }}
              chips={[{ ativo: soProblema, aoClicar: () => setSoProblema((v) => !v), icone: 'ShieldAlert', texto: 'Com problema' }]}
              aoLimpar={() => { setBusca(''); setSoProblema(false); }}
              algumAtivo={!!busca || soProblema} />
          </div>
        }
        vazio={{ titulo: 'Nenhuma fonte corresponde ao filtro',
                 descricao: 'Ajuste a busca ou remova o filtro “Com problema” para ver todas as fontes externas.' }}
      />
    </div>
  );
}
