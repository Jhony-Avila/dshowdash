// screens/DealDrawer.tsx — painel lateral com detalhe de um negocio, agora EM ABAS.
// @version 2.0.0  @created 2026-07-21  (v1.1.0: usa DrawerShell reutilizavel)
// v2.0.0 (Elevacao visual — Fase 3): Resumo / Dados / Relacionamentos / Atividades / Notas /
//        Campos personalizados. A timeline (que ja vinha do backend) e separada por tipo.
import { useQuery } from '@tanstack/react-query';
import { CircleGauge, Database, Link2, CalendarCheck2, NotebookPen, ListPlus } from 'lucide-react';
import { apiGet, ApiError } from '../lib/api';
import { fmtBRL, fmtData, fmtNum } from '../lib/format';
import {
  DrawerShell, CamposPersonalizados, AbrirNoPipedrive, Linha, ListaNotas,
  rotuloTipoAtividade, type DrawerAba,
} from './DrawerShell';
import { EstadoErro, SkeletonBloco } from './Estados';
import type { PipeDealDetail } from '../shell/types';

const ROTULO: Record<string, string> = { open: 'Aberto', won: 'Ganho', lost: 'Perdido', deleted: 'Excluído' };
function cor(s?: string | null): string {
  if (s === 'won') return 'var(--pp-ok)';
  if (s === 'lost' || s === 'deleted') return 'var(--pp-danger)';
  return 'var(--pp-sync)';
}

export function DealDrawer({ dealId, onClose }: { dealId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipeDealDetail>({
    queryKey: ['pipe', 'deal', dealId],
    queryFn: ({ signal }) => apiGet<PipeDealDetail>(`/deals/${dealId}`, undefined, signal),
  });

  const d = data?.deal;
  const badge = d ? (
    <span className="pp-badge" style={{ background: 'var(--pp-surface-2)', marginTop: 4 }}>
      <span className="pp-dot" style={{ background: cor(d.status) }} />{ROTULO[d.status ?? ''] ?? d.status ?? '—'}
    </span>
  ) : undefined;

  // Enquanto carrega (ou se falhar), o drawer nao tem abas — so o estado.
  if (error instanceof ApiError || isLoading || !data || !d) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : (d?.title ?? 'Negócio')} subtitle={badge} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Negócio não encontrado' : 'Não foi possível carregar'}
              detalhe={error.status === 404 ? 'O registro pode ter sido excluído no Pipedrive.' : undefined} />
          : <SkeletonBloco linhas={6} />}
      </DrawerShell>
    );
  }

  const atividades = data.timeline.filter((t) => t.kind === 'activity');
  const notas = data.timeline.filter((t) => t.kind === 'note');

  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <div className="pp-drawer-kpis">
            <div className="pp-dkpi"><span className="pp-dkpi-n">{d.value != null ? fmtBRL(d.value, d.currency ?? 'BRL') : '—'}</span><span className="pp-dkpi-l">Valor</span></div>
            <div className="pp-dkpi"><span className="pp-dkpi-n">{d.probability != null ? `${d.probability}%` : '—'}</span><span className="pp-dkpi-l">Probabilidade</span></div>
            <div className="pp-dkpi"><span className="pp-dkpi-n" style={{ fontSize: 15 }}>{d.stage ?? '—'}</span><span className="pp-dkpi-l">Etapa</span></div>
          </div>
          <Linha k="Funil" v={d.pipeline ?? '—'} />
          <Linha k="Dono" v={d.owner ?? '—'} />
          <Linha k="Previsão de fechamento" v={d.expected_close_date ? fmtData(d.expected_close_date).slice(0, 10) : '—'} />
          {d.won_time && <Linha k="Ganho em" v={fmtData(d.won_time)} />}
          {d.lost_time && <Linha k="Perdido em" v={`${fmtData(d.lost_time)}${d.lost_reason ? ' · ' + d.lost_reason : ''}`} />}
          <AbrirNoPipedrive kind="deal" id={d.id} />
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={d.id} />
          <Linha k="Status" v={ROTULO[d.status ?? ''] ?? d.status ?? '—'} />
          <Linha k="Moeda" v={d.currency ?? '—'} />
          <Linha k="Origem" v={d.origin ?? '—'} />
          <Linha k="Criado" v={fmtData(d.add_time)} />
          <Linha k="Atualizado" v={fmtData(d.update_time)} />
          <Linha k="Excluído" v={d.is_deleted ? 'Sim' : 'Não'} />
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2,
      contagem: (data.person ? 1 : 0) + (data.organization ? 1 : 0) + data.products.length,
      conteudo: (
        <>
          <h4>Contato</h4>
          {!data.person && !data.organization ? <p className="pp-placeholder">Sem pessoa ou organização vinculada.</p> : (
            <>
              {data.organization && <Linha k="Organização" v={data.organization.name ?? '—'} />}
              {data.person && <Linha k="Pessoa" v={data.person.name ?? '—'} />}
              {data.person?.email && <Linha k="E-mail" v={data.person.email} />}
              {data.person?.phone && <Linha k="Telefone" v={data.person.phone} />}
            </>
          )}
          <h4>Produtos ({data.products.length})</h4>
          {data.products.length === 0 ? <p className="pp-placeholder">Nenhum produto vinculado.</p> : (
            data.products.map((pr, i) => (
              <div className="pp-row" key={i}>
                <span className="pp-k" title={pr.name}>{pr.name}</span>
                <span className="pp-v">{fmtNum(pr.quantity)} × {fmtBRL(pr.item_price)} = {fmtBRL(pr.sum)}</span>
              </div>
            ))
          )}
        </>
      ),
    },
    {
      id: 'atividades', label: 'Atividades', Icon: CalendarCheck2, contagem: atividades.length,
      conteudo: atividades.length === 0 ? <p className="pp-placeholder">Nenhuma atividade vinculada.</p> : (
        <div className="pp-tl">
          {atividades.map((t, i) => (
            <div className="pp-tl-item" key={i}>
              <span className="pp-tl-ic">{t.done ? '✅' : '📌'}</span>
              <div className="pp-tl-body">
                <div className="pp-tl-title">{t.title && t.title.trim() !== '' ? t.title : '(sem assunto)'}</div>
                <div className="pp-tl-meta">{rotuloTipoAtividade(t.type)} · {fmtData(t.when)}{t.author ? ` · ${t.author}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'notas', label: 'Notas', Icon: NotebookPen, contagem: notas.length,
      conteudo: <ListaNotas fmtData={fmtData}
        notas={notas.map((n) => ({ content: n.title, add_time: n.when, author: n.author }))} />,
    },
    {
      id: 'campos', label: 'Campos', Icon: ListPlus, contagem: data.custom_fields.length,
      conteudo: <CamposPersonalizados campos={data.custom_fields} comTitulo={false} />,
    },
  ];

  return <DrawerShell title={d.title ?? 'Negócio'} subtitle={badge} onClose={onClose} abas={abas} lembrarComo="deal" />;
}
