// screens/EntidadeDrawers.tsx — drawers de Atividade (#18), Lead (#19) e Produto (#20).
// @version 2.0.0  @created 2026-07-22
// v2.0.0 (Elevacao visual — Fase 3): drawers EM ABAS (Resumo / Dados / Relacionamentos),
//        estados padronizados e rotulo legivel do tipo de atividade.
//
// Detalhe + vinculos clicaveis (abrem DealDrawer/PersonDrawer/OrgDrawer empilhados) +
// botao "Abrir no Pipedrive" (#22). Le GET /activities|leads|products/{id} (base local).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../lib/api';
import { fmtBRL, fmtData, fmtNum } from '../lib/format';
import { CircleGauge, Database, Link2 } from 'lucide-react';
import { DrawerShell, AbrirNoPipedrive, LinhaLink, Linha, rotuloTipoAtividade, type DrawerAba } from './DrawerShell';
import { EstadoErro, SkeletonBloco } from './Estados';
import { DealDrawer } from './DealDrawer';
import { PersonDrawer, OrgDrawer } from './ContatoDrawers';
import type { PipeActivityDetail, PipeLeadDetail, PipeProductDetail } from '../shell/types';

const badge = (texto: string, cor: string) => (
  <span className="pp-badge" style={{ background: 'var(--pp-surface-2)', marginTop: 4 }}><span className="pp-dot" style={{ background: cor }} />{texto}</span>
);
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Hook local: estado dos drawers empilhados (negocio/pessoa/organizacao).
function useVinculos() {
  const [deal, setDeal] = useState<number | null>(null);
  const [person, setPerson] = useState<number | null>(null);
  const [org, setOrg] = useState<number | null>(null);
  const drawers = (
    <>
      {deal != null && <DealDrawer dealId={deal} onClose={() => setDeal(null)} />}
      {person != null && <PersonDrawer personId={person} onClose={() => setPerson(null)} />}
      {org != null && <OrgDrawer orgId={org} onClose={() => setOrg(null)} />}
    </>
  );
  return { setDeal, setPerson, setOrg, drawers };
}

// ── Atividade (#18) ──────────────────────────────────────────
export function ActivityDrawer({ activityId, onClose }: { activityId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipeActivityDetail>({
    queryKey: ['pipe', 'activity', activityId],
    queryFn: ({ signal }) => apiGet<PipeActivityDetail>(`/activities/${activityId}`, undefined, signal),
  });
  const v = useVinculos();
  const a = data?.activity;
  const titulo = a?.subject && a.subject.trim() !== '' ? a.subject : 'Atividade';
  const sub = a ? (a.done ? badge('Concluída', 'var(--pp-ok)') : a.overdue ? badge('Atrasada', 'var(--pp-danger)') : badge('Pendente', 'var(--pp-sync)')) : undefined;

  if (error instanceof ApiError || isLoading || !data || !a) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : titulo} subtitle={sub} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Atividade não encontrada' : 'Não foi possível carregar'} />
          : <SkeletonBloco linhas={5} />}
      </DrawerShell>
    );
  }

  const vinculos = (data.deal ? 1 : 0) + (data.person ? 1 : 0) + (data.organization ? 1 : 0);
  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <Linha k="Tipo" v={rotuloTipoAtividade(a.type)} />
          <Linha k="Vencimento" v={a.due_date ? `${fmtData(a.due_date).slice(0, 10)}${a.due_time ? ' ' + a.due_time.slice(0, 5) : ''}` : '—'} />
          {a.duration && a.duration !== '00:00' && <Linha k="Duração" v={a.duration} />}
          {a.location && <Linha k="Local" v={a.location} />}
          <Linha k="Dono" v={a.owner ?? '—'} />
          {a.done > 0 && a.marked_done_time && <Linha k="Concluída em" v={fmtData(a.marked_done_time)} />}
          {a.note && stripHtml(a.note) !== '' && (
            <><h4>Anotação</h4><p className="pp-placeholder" style={{ whiteSpace: 'normal' }}>{stripHtml(a.note)}</p></>
          )}
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={a.id} />
          <Linha k="Tipo (bruto)" v={a.type ?? '—'} />
          <Linha k="Situação" v={a.done ? 'Concluída' : (a.overdue ? 'Atrasada' : 'Pendente')} />
          <Linha k="Criada" v={fmtData(a.add_time)} />
          <Linha k="Atualizada" v={fmtData(a.update_time)} />
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2, contagem: vinculos,
      conteudo: vinculos === 0 ? <p className="pp-placeholder">Nenhum vínculo.</p> : (
        <>
          {data.deal && <LinhaLink k="Negócio" texto={data.deal.title ?? '—'} onClick={() => v.setDeal(data.deal!.id)} />}
          {data.person && <LinhaLink k="Pessoa" texto={data.person.name ?? '—'} onClick={() => v.setPerson(data.person!.id)} />}
          {data.organization && <LinhaLink k="Organização" texto={data.organization.name ?? '—'} onClick={() => v.setOrg(data.organization!.id)} />}
          {/* Atividade nao tem deep-link estavel; oferecemos o negocio vinculado. */}
          {data.deal && <AbrirNoPipedrive kind="deal" id={data.deal.id} label="Abrir negócio no Pipedrive" />}
        </>
      ),
    },
  ];

  return (
    <>
      <DrawerShell title={titulo} subtitle={sub} onClose={onClose} abas={abas} lembrarComo="activity" />
      {v.drawers}
    </>
  );
}

// ── Lead (#19) ───────────────────────────────────────────────
export function LeadDrawer({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipeLeadDetail>({
    queryKey: ['pipe', 'lead', leadId],
    queryFn: ({ signal }) => apiGet<PipeLeadDetail>(`/leads/${leadId}`, undefined, signal),
  });
  const v = useVinculos();
  const l = data?.lead;
  const sub = l ? (l.archived ? badge('Arquivado', 'var(--pp-text-dim)') : data?.converted ? badge('Convertido', 'var(--pp-ok)') : badge('Ativo', 'var(--pp-sync)')) : undefined;

  if (error instanceof ApiError || isLoading || !data || !l) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : (l?.title ?? 'Lead')} subtitle={sub} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Lead não encontrado' : 'Não foi possível carregar'} />
          : <SkeletonBloco linhas={5} />}
      </DrawerShell>
    );
  }

  const vinculos = (data.person ? 1 : 0) + (data.organization ? 1 : 0) + (data.converted ? 1 : 0);
  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <Linha k="Valor" v={l.value != null ? fmtBRL(l.value, l.currency ?? 'BRL') : '—'} />
          <Linha k="Origem" v={l.origin ?? '—'} />
          <Linha k="Dono" v={l.owner ?? '—'} />
          {l.next_activity_date && <Linha k="Próxima atividade" v={fmtData(l.next_activity_date).slice(0, 10)} />}
          <AbrirNoPipedrive kind="lead" id={l.id} />
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={l.id} />
          <Linha k="Moeda" v={l.currency ?? '—'} />
          <Linha k="Situação" v={l.archived ? 'Arquivado' : (data.converted ? 'Convertido' : 'Ativo')} />
          <Linha k="Criado" v={fmtData(l.add_time)} />
          <Linha k="Atualizado" v={fmtData(l.update_time)} />
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2, contagem: vinculos,
      conteudo: vinculos === 0 ? <p className="pp-placeholder">Nenhum vínculo.</p> : (
        <>
          {data.person && <LinhaLink k="Contato" texto={data.person.name ?? '—'} onClick={() => v.setPerson(data.person!.id)} />}
          {data.organization && <LinhaLink k="Organização" texto={data.organization.name ?? '—'} onClick={() => v.setOrg(data.organization!.id)} />}
          {data.converted && <LinhaLink k="Negócio convertido" texto={data.converted.title ?? '—'} onClick={() => v.setDeal(data.converted!.id)} />}
        </>
      ),
    },
  ];

  return (
    <>
      <DrawerShell title={l.title ?? 'Lead'} subtitle={sub} onClose={onClose} abas={abas} lembrarComo="lead" />
      {v.drawers}
    </>
  );
}

// ── Produto (#20) ────────────────────────────────────────────
const corStatus = (s?: string | null) => (s === 'won' ? 'var(--pp-ok)' : s === 'lost' ? 'var(--pp-danger)' : 'var(--pp-sync)');

export function ProductDrawer({ productId, onClose }: { productId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipeProductDetail>({
    queryKey: ['pipe', 'product', productId],
    queryFn: ({ signal }) => apiGet<PipeProductDetail>(`/products/${productId}`, undefined, signal),
  });
  const [dealAberto, setDealAberto] = useState<number | null>(null);
  const p = data?.product;
  const preco = data?.prices?.[0];
  const sub = p?.code ? <span className="pp-drawer-sub2">Código {p.code}</span> : undefined;

  if (error instanceof ApiError || isLoading || !data || !p) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : (p?.name ?? 'Produto')} subtitle={sub} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Produto não encontrado' : 'Não foi possível carregar'} />
          : <SkeletonBloco linhas={5} />}
      </DrawerShell>
    );
  }

  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <div className="pp-drawer-kpis">
            <div className="pp-dkpi"><span className="pp-dkpi-n">{fmtNum(data.summary.deals)}</span><span className="pp-dkpi-l">Negócios</span></div>
            <div className="pp-dkpi"><span className="pp-dkpi-n" style={{ color: 'var(--pp-ok)', fontSize: 16 }}>{fmtBRL(data.summary.valor_total)}</span><span className="pp-dkpi-l">Valor total</span></div>
          </div>
          {preco && <Linha k="Preço" v={preco.price != null ? fmtBRL(preco.price, preco.currency ?? 'BRL') : '—'} />}
          <Linha k="Categoria" v={p.category ?? '—'} />
          <Linha k="Situação" v={p.is_active ? 'Ativo' : 'Inativo'} />
          <AbrirNoPipedrive kind="product" id={p.id} />
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={p.id} />
          <Linha k="Código" v={p.code ?? '—'} />
          <Linha k="Unidade" v={p.unit ?? '—'} />
          {p.tax != null && p.tax > 0 && <Linha k="Imposto" v={`${p.tax}%`} />}
          <Linha k="Dono" v={p.owner ?? '—'} />
          {p.description && stripHtml(p.description) !== '' && (
            <><h4>Descrição</h4><p className="pp-placeholder" style={{ whiteSpace: 'normal' }}>{stripHtml(p.description)}</p></>
          )}
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2, contagem: data.deals.length,
      conteudo: (
        <>
          <h4>Negócios que utilizam ({data.summary.deals})</h4>
          {data.deals.length === 0 ? <p className="pp-placeholder">Nenhum negócio usa este produto.</p> : (
            data.deals.map((d) => (
              <div className="pp-row pp-clik" key={d.id} style={{ cursor: 'pointer' }} onClick={() => setDealAberto(d.id)}>
                <span className="pp-k" title={d.title ?? ''} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="pp-dot" style={{ background: corStatus(d.status), width: 7, height: 7, borderRadius: '50%' }} />
                  {d.title ?? '—'}
                </span>
                <span className="pp-v">{fmtNum(d.quantity)} × · {fmtBRL(d.sum)}</span>
              </div>
            ))
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <DrawerShell title={p.name ?? 'Produto'} subtitle={sub} onClose={onClose} abas={abas} lembrarComo="product" />
      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </>
  );
}
