// screens/ContatoDrawers.tsx — drawers de Pessoa e Organizacao, agora EM ABAS.
// @version 2.0.0  @created 2026-07-21
// v2.0.0 (Elevacao visual — Fase 3): Resumo / Dados / Relacionamentos / Atividades / Notas /
//        Campos personalizados. `notes` (pessoa e org) e `activities` (org) vieram do backend
//        nesta mesma rodada — antes o drawer nao tinha o que mostrar nessas abas.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleGauge, Database, Link2, CalendarCheck2, NotebookPen, ListPlus } from 'lucide-react';
import { apiGet, ApiError } from '../lib/api';
import { fmtBRL, fmtData, fmtNum } from '../lib/format';
import {
  DrawerShell, MiniDeals, CamposPersonalizados, AbrirNoPipedrive, Linha, ListaNotas,
  ListaAtividades, rotuloTipoAtividade, type DrawerAba,
} from './DrawerShell';
import { EstadoErro, SkeletonBloco } from './Estados';
import { DealDrawer } from './DealDrawer';
import type { PipePersonDetail, PipeOrgDetail } from '../shell/types';

// ── Pessoa ───────────────────────────────────────────────────
export function PersonDrawer({ personId, onClose }: { personId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipePersonDetail>({
    queryKey: ['pipe', 'person', personId],
    queryFn: ({ signal }) => apiGet<PipePersonDetail>(`/persons/${personId}`, undefined, signal),
  });
  const [dealAberto, setDealAberto] = useState<number | null>(null);
  const p = data?.person;
  const sub = p?.job_title
    ? <span className="pp-drawer-sub2">{p.job_title}{p.org ? ` · ${p.org}` : ''}</span>
    : (p?.org ? <span className="pp-drawer-sub2">{p.org}</span> : undefined);

  if (error instanceof ApiError || isLoading || !data || !p) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : (p?.name ?? 'Pessoa')} subtitle={sub} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Pessoa não encontrada' : 'Não foi possível carregar'} />
          : <SkeletonBloco linhas={6} />}
      </DrawerShell>
    );
  }

  const notas = data.notes ?? [];
  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <Linha k="E-mail" v={p.email ?? '—'} />
          <Linha k="Telefone" v={p.phone ?? '—'} />
          <Linha k="Organização" v={p.org ?? '—'} />
          <Linha k="Dono" v={p.owner ?? '—'} />
          <AbrirNoPipedrive kind="person" id={p.id} />
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={p.id} />
          <Linha k="Cargo" v={p.job_title ?? '—'} />
          <Linha k="Criado" v={fmtData(p.add_time)} />
          <Linha k="Atualizado" v={fmtData(p.update_time)} />
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2, contagem: data.deals.length,
      conteudo: (
        <>
          <h4>Negócios ({data.deals.length})</h4>
          <MiniDeals deals={data.deals} fmtBRL={fmtBRL} onOpenDeal={setDealAberto} />
        </>
      ),
    },
    {
      id: 'atividades', label: 'Atividades', Icon: CalendarCheck2, contagem: data.activities.length,
      conteudo: <ListaAtividades atividades={data.activities} rotuloTipo={rotuloTipoAtividade} fmtData={fmtData} />,
    },
    {
      id: 'notas', label: 'Notas', Icon: NotebookPen, contagem: notas.length,
      conteudo: <ListaNotas notas={notas} fmtData={fmtData} />,
    },
    {
      id: 'campos', label: 'Campos', Icon: ListPlus, contagem: p.custom_fields.length,
      conteudo: <CamposPersonalizados campos={p.custom_fields} comTitulo={false} />,
    },
  ];

  return (
    <>
      <DrawerShell title={p.name ?? 'Pessoa'} subtitle={sub} onClose={onClose} abas={abas} lembrarComo="person" />
      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </>
  );
}

// ── Organizacao ──────────────────────────────────────────────
export function OrgDrawer({ orgId, onClose }: { orgId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<PipeOrgDetail>({
    queryKey: ['pipe', 'org', orgId],
    queryFn: ({ signal }) => apiGet<PipeOrgDetail>(`/organizations/${orgId}`, undefined, signal),
  });
  const [dealAberto, setDealAberto] = useState<number | null>(null);
  const o = data?.organization;
  const sub = o?.cnpj ? <span className="pp-drawer-sub2">CNPJ {o.cnpj}</span> : undefined;

  if (error instanceof ApiError || isLoading || !data || !o) {
    return (
      <DrawerShell title={isLoading ? 'Carregando…' : (o?.name ?? 'Organização')} subtitle={sub} onClose={onClose}>
        {error instanceof ApiError
          ? <EstadoErro titulo={error.status === 404 ? 'Organização não encontrada' : 'Não foi possível carregar'} />
          : <SkeletonBloco linhas={6} />}
      </DrawerShell>
    );
  }

  const notas = data.notes ?? [];
  const atividades = data.activities ?? [];
  const abas: DrawerAba[] = [
    {
      id: 'resumo', label: 'Resumo', Icon: CircleGauge,
      conteudo: (
        <>
          <div className="pp-drawer-kpis">
            <div className="pp-dkpi"><span className="pp-dkpi-n">{fmtNum(data.summary.total)}</span><span className="pp-dkpi-l">Negócios</span></div>
            <div className="pp-dkpi"><span className="pp-dkpi-n" style={{ color: 'var(--pp-ok)' }}>{fmtNum(data.summary.ganhos)}</span><span className="pp-dkpi-l">Ganhos</span></div>
            <div className="pp-dkpi"><span className="pp-dkpi-n" style={{ color: 'var(--pp-ok)', fontSize: 16 }}>{fmtBRL(data.summary.valor_ganho)}</span><span className="pp-dkpi-l">Valor ganho</span></div>
          </div>
          {(o.city || o.state) && <Linha k="Local" v={`${o.city ?? ''}${o.state ? '/' + o.state : ''}`} />}
          <Linha k="Dono" v={o.owner ?? '—'} />
          <AbrirNoPipedrive kind="organization" id={o.id} />
        </>
      ),
    },
    {
      id: 'dados', label: 'Dados', Icon: Database,
      conteudo: (
        <>
          <Linha k="ID no Pipedrive" v={o.id} />
          <Linha k="CNPJ" v={o.cnpj ?? '—'} />
          <Linha k="Endereço" v={o.address ?? '—'} />
          <Linha k="País" v={o.country ?? '—'} />
          <Linha k="Criado" v={fmtData(o.add_time)} />
          <Linha k="Atualizado" v={fmtData(o.update_time)} />
        </>
      ),
    },
    {
      id: 'relacionamentos', label: 'Relacionamentos', Icon: Link2, contagem: data.people.length + data.deals.length,
      conteudo: (
        <>
          <h4>Pessoas ({data.people.length})</h4>
          {data.people.length === 0 ? <p className="pp-placeholder">Nenhuma pessoa.</p> : (
            data.people.map((pe) => (
              <div className="pp-row" key={pe.id}><span className="pp-k">{pe.name ?? '—'}</span><span className="pp-v">{pe.email ?? '—'}</span></div>
            ))
          )}
          <h4>Negócios ({data.deals.length})</h4>
          <MiniDeals deals={data.deals} fmtBRL={fmtBRL} onOpenDeal={setDealAberto} />
        </>
      ),
    },
    {
      id: 'atividades', label: 'Atividades', Icon: CalendarCheck2, contagem: atividades.length,
      conteudo: <ListaAtividades atividades={atividades} rotuloTipo={rotuloTipoAtividade} fmtData={fmtData} />,
    },
    {
      id: 'notas', label: 'Notas', Icon: NotebookPen, contagem: notas.length,
      conteudo: <ListaNotas notas={notas} fmtData={fmtData} />,
    },
    {
      id: 'campos', label: 'Campos', Icon: ListPlus, contagem: o.custom_fields.length,
      conteudo: <CamposPersonalizados campos={o.custom_fields} comTitulo={false} />,
    },
  ];

  return (
    <>
      <DrawerShell title={o.name ?? 'Organização'} subtitle={sub} onClose={onClose} abas={abas} lembrarComo="org" />
      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </>
  );
}
