// app/routes/Manutencoes.tsx — Manutenções como DataGrid robusto (§38.13/§27).
// @version 2.0.0  @updated 2026-07-21
// Lista -> DataGrid ordenável. Janela de manutenção sai do denominador da
// disponibilidade (§27). "Encerrar" (escrita) fica no menu ⋮ das janelas abertas.
import { useMemo, useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtData, fmtDuracao } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import { useOrdenacaoLocal } from '../../components/grid/useOrdenacaoLocal';
import type { ColunaDef, ItemMenuLinha } from '../../components/grid/tipos';
import { ManutencaoForm } from './forms/ManutencaoForm';
import css from './Manutencoes.module.css';

interface Janela {
  id: number; target_type: string; target_id: number | null; connection_name: string | null;
  reason: string | null; started_at: string; ended_at: string | null;
  elapsed_sec: number; created_by: string | null;
}

export function Manutencoes(): JSX.Element {
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [soAbertas, setSoAbertas] = useState(false);

  const q = useQuery({
    queryKey: ['dt', 'maintenance'],
    queryFn: ({ signal }) => apiGet<Janela[]>('/maintenance', undefined, signal),
  });

  const encerrar = useMutation({
    mutationFn: (id: number) => apiWrite(`/maintenance/${id}/close`, 'POST'),
    onSuccess: () => { setAviso('Janela encerrada.'); qc.invalidateQueries({ queryKey: ['dt'] }); },
    onError: (e: ApiError) => setAviso(`Falha ao encerrar: ${e.message}`),
  });

  const filtradas = useMemo(() => {
    const lista = q.data ?? [];
    const t = busca.trim().toLowerCase();
    return lista.filter((j) =>
      (!soAbertas || j.ended_at === null) &&
      (!t || (j.connection_name ?? '').toLowerCase().includes(t)
        || (j.reason ?? '').toLowerCase().includes(t)),
    );
  }, [q.data, busca, soAbertas]);

  const alvoNome = (j: Janela): string => j.connection_name ?? `${j.target_type} #${j.target_id ?? '—'}`;

  const colunas: ColunaDef<Janela>[] = useMemo(() => [
    { id: 'estado', cabecalho: 'Estado', icone: 'Wrench', largura: '140px', obrigatoria: true, ordenavel: true,
      valor: (j) => (j.ended_at === null ? 0 : 1),
      celula: (j) => j.ended_at === null
        ? <Badge texto="em andamento" tom="atencao" icone="Wrench" />
        : <Badge texto="encerrada" tom="neutro" icone="Check" fraco /> },
    { id: 'alvo', cabecalho: 'Alvo', icone: 'Cable', largura: 'minmax(160px, 1.2fr)', obrigatoria: true, ordenavel: true,
      valor: (j) => alvoNome(j), celula: (j) => <strong className={css.alvo}>{alvoNome(j)}</strong> },
    { id: 'reason', cabecalho: 'Motivo', icone: 'FileText', largura: 'minmax(160px, 1.5fr)',
      valor: (j) => j.reason ?? '', celula: (j) => <span className={css.motivo} title={j.reason ?? ''}>{j.reason ?? '—'}</span> },
    { id: 'started_at', cabecalho: 'Início', icone: 'Clock', largura: '160px', ordenavel: true,
      valor: (j) => j.started_at, celula: (j) => <span className={css.discreto}>{fmtData(j.started_at)}</span> },
    { id: 'elapsed_sec', cabecalho: 'Duração', icone: 'Activity', largura: '120px', alinhamento: 'fim', ordenavel: true,
      valor: (j) => j.elapsed_sec, celula: (j) => <span className={css.num}>{fmtDuracao(j.elapsed_sec)}</span> },
    { id: 'created_by', cabecalho: 'Por', icone: 'AtSign', largura: '120px', ocultaPorPadrao: true,
      valor: (j) => j.created_by ?? '', celula: (j) => <span className={css.discreto}>{j.created_by ?? '—'}</span> },
  ], []);

  const grid = useOrdenacaoLocal(filtradas, colunas, { coluna: 'started_at', direcao: 'desc' });

  const menu = (j: Janela): ItemMenuLinha<Janela>[] =>
    j.ended_at === null
      ? [{ rotulo: 'Encerrar janela', icone: 'Check', aoClicar: () => encerrar.mutate(j.id) }]
      : [];

  if (q.isPending) return <SkeletonCartoes n={3} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar as manutenções." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const janelas = q.data;
  const abertas = janelas.filter((j) => j.ended_at === null);

  return (
    <div className={css.raiz}>
      <Revelar>
        <section className={css.cards}>
          <MetricCard icone="Wrench" rotulo="Em andamento" valor={abertas.length}
            tom={abertas.length > 0 ? 'atencao' : 'ok'} contexto={abertas.length ? 'fora do cálculo de disponibilidade' : 'nenhuma janela aberta'} />
          <MetricCard icone="CalendarClock" rotulo="Últimos 30 dias" valor={janelas.length} contexto="janelas registradas" />
        </section>
      </Revelar>

      {aviso && <div className={css.aviso}><Icone nome="CircleCheck" size={14} />{aviso}</div>}

      <div className={css.nota}>
        <Icone nome="Wrench" size={13} />
        Período em manutenção não conta como indisponibilidade (§27) — a agregação de
        disponibilidade o remove do denominador.
      </div>

      <DataGrid<Janela>
        rotulo="Manutenções" chaveEstado="manutencoes" colunas={colunas} linhas={grid.linhas} idLinha={(j) => j.id}
        ordenacao={grid.ordenacao} aoOrdenar={grid.aoOrdenar}
        menuLinha={menu}
        aoAtualizar={() => q.refetch()}
        ferramentas={
          <div className={css.ferramentas}>
            <FilterBar
              busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar por conexão ou motivo…' }}
              chips={[{ ativo: soAbertas, aoClicar: () => setSoAbertas((v) => !v), icone: 'Wrench', texto: 'Só abertas' }]}
              aoLimpar={() => { setBusca(''); setSoAbertas(false); }}
              algumAtivo={!!busca || soAbertas} />
            <button type="button" className={css.novo} onClick={() => setFormAberto(true)}>
              <Icone nome="Wrench" size={14} /> Abrir janela
            </button>
          </div>
        }
        vazio={{ titulo: (busca || soAbertas) ? 'Nenhuma manutenção corresponde ao filtro' : 'Nenhuma manutenção registrada',
                 descricao: (busca || soAbertas) ? 'Ajuste a busca ou remova o filtro “Só abertas”.' : 'Abra uma janela antes de intervir numa conexão para não gerar alerta nem penalizar a disponibilidade.' }}
      />

      {formAberto && <ManutencaoForm aberto aoFechar={() => setFormAberto(false)} />}
    </div>
  );
}
