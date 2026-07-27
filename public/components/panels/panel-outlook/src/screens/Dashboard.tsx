// screens/Dashboard.tsx — Dashboard gerencial de e-mails (§24).
// @version 1.0.0  @created 2026-07-21
//
// Big numbers + gráficos SVG próprios (leves, tema-aware, sem lib externa).
// Fonte: GET /dashboard/summary. No modo real (graph) as séries dependem da
// sincronização (Fase 2) → mostra placeholder; no mock, dados completos.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { DashboardSummary, DashboardDay, DashboardHour, DashboardContact, DashboardStatus } from '../shell/types';
import { iniciais, corDeterministica } from '../lib/format';

const PERIODOS: { id: string; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
];

function dur(s: number): string {
  if (!s || s < 60) return '—';
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
function diaCurto(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function Dashboard({ accountId }: { accountId: number | null }) {
  const [periodo, setPeriodo] = useState('7d');

  const q = useQuery<DashboardSummary>({
    queryKey: [...chaves.dashboard(periodo), accountId ?? 0],
    queryFn: ({ signal }) => apiGet<DashboardSummary>('/dashboard/summary',
      { period: periodo, account_id: accountId ?? undefined }, signal),
  });

  return (
    <div className="ol-page ol-dash">
      <header className="ol-page-head">
        <div>
          <h1 className="ol-h1">Dashboard</h1>
          <p className="ol-sub">Indicadores gerenciais dos seus e-mails.</p>
        </div>
        <div className="ol-periodos">
          {PERIODOS.map((p) => (
            <button key={p.id} className={`ol-chip${periodo === p.id ? ' is-on' : ''}`}
              onClick={() => setPeriodo(p.id)}>{p.label}</button>
          ))}
        </div>
      </header>

      {q.isLoading ? (
        <div className="ol-skel-page"><div className="ol-spinner" /> Calculando indicadores…</div>
      ) : q.isError ? (
        <div className="ol-indisp">
          <div className="ol-empty-icon" aria-hidden>☁️</div>
          <h3 className="ol-empty-title">Não foi possível carregar o dashboard</h3>
          <button className="ol-btn ol-btn-ghost" onClick={() => q.refetch()}>Tentar novamente</button>
        </div>
      ) : !q.data?.available ? (
        <div className="ol-empty">
          <div className="ol-empty-icon" aria-hidden>📊</div>
          <h2 className="ol-empty-title">Dashboard em preparação</h2>
          <p className="ol-empty-desc">{q.data?.message ?? 'Os indicadores usam métricas da sincronização (Fase 2).'}</p>
          <span className="ol-badge-fase">Fase 2</span>
        </div>
      ) : (
        <Conteudo data={q.data} />
      )}
    </div>
  );
}

function Conteudo({ data }: { data: DashboardSummary }) {
  const b = data.big!;
  const cards = [
    { label: 'Recebidos hoje', valor: b.received_today, icon: '📥', cor: 'var(--ol-primary)' },
    { label: 'Enviados hoje', valor: b.sent_today, icon: '📤', cor: 'var(--ol-ok)' },
    { label: 'Não lidos', valor: b.unread, icon: '✉️', cor: 'var(--ol-warn)' },
    { label: 'Importantes', valor: b.important, icon: '❗', cor: 'var(--ol-danger)' },
    { label: 'Com anexo', valor: b.with_attachments, icon: '📎', cor: 'var(--ol-purple)' },
    { label: 'Total no período', valor: b.total_period, icon: '📨', cor: 'var(--ol-primary)' },
    { label: 'Média por dia', valor: b.avg_per_day, icon: '📈', cor: 'var(--ol-ok)' },
    { label: 'Tempo médio resp.', valor: dur(b.avg_response_seconds), icon: '⏱️', cor: 'var(--ol-sync, var(--ol-primary))' },
  ];

  return (
    <>
      <div className="ol-bignum-grid">
        {cards.map((c) => (
          <div key={c.label} className="ol-bignum">
            <div className="ol-bignum-top"><span className="ol-bignum-ic" aria-hidden>{c.icon}</span></div>
            <div className="ol-bignum-val" style={{ color: c.cor }}>{c.valor}</div>
            <div className="ol-bignum-lbl">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="ol-dash-grid">
        <Cartao titulo="Evolução por período">
          <BarrasDia data={data.by_day ?? []} />
          <Legenda itens={[{ cor: 'var(--ol-primary)', txt: 'Recebidos' }, { cor: 'var(--ol-ok)', txt: 'Enviados' }]} />
        </Cartao>

        <Cartao titulo="Volume por horário">
          <BarrasHora data={data.by_hour ?? []} />
        </Cartao>

        <Cartao titulo="Principais contatos">
          <TopContatos data={data.top_contacts ?? []} />
        </Cartao>

        <Cartao titulo="Status das mensagens">
          <StatusBarras status={data.status} />
        </Cartao>
      </div>
    </>
  );
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="ol-dash-card">
      <h3 className="ol-dash-card-tit">{titulo}</h3>
      {children}
    </div>
  );
}

function Legenda({ itens }: { itens: { cor: string; txt: string }[] }) {
  return (
    <div className="ol-legenda">
      {itens.map((i) => (
        <span key={i.txt} className="ol-legenda-item"><span className="ol-legenda-dot" style={{ background: i.cor }} />{i.txt}</span>
      ))}
    </div>
  );
}

// ── Gráfico de barras agrupadas (recebidos x enviados por dia) ────────────
function BarrasDia({ data }: { data: DashboardDay[] }) {
  if (data.length === 0) return <Vazio />;
  const max = Math.max(1, ...data.flatMap((d) => [d.received, d.sent]));
  const chartH = 116;
  const step = 100 / data.length;
  const denso = data.length > 12;
  const bw = denso ? step * 0.7 : step * 0.32;
  return (
    <div className="ol-chartwrap">
      <svg className="ol-svg" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={120 - chartH * g} y2={120 - chartH * g} className="ol-grid" />
        ))}
        {data.map((d, i) => {
          const x = i * step;
          const rH = (d.received / max) * chartH, sH = (d.sent / max) * chartH;
          return denso ? (
            <rect key={d.date} x={x + step * 0.15} y={120 - rH} width={bw} height={rH} className="ol-bar-a" />
          ) : (
            <g key={d.date}>
              <rect x={x + step * 0.16} y={120 - rH} width={bw} height={rH} className="ol-bar-a" />
              <rect x={x + step * 0.52} y={120 - sH} width={bw} height={sH} className="ol-bar-b" />
            </g>
          );
        })}
      </svg>
      <div className="ol-chart-axis">
        {data.map((d, i) => <span key={d.date}>{(data.length <= 8 || i % 5 === 0) ? diaCurto(d.date) : ''}</span>)}
      </div>
    </div>
  );
}

// ── Volume por horário (24 barras) ────────────────────────────────────────
function BarrasHora({ data }: { data: DashboardHour[] }) {
  if (data.length === 0) return <Vazio />;
  const max = Math.max(1, ...data.map((d) => d.count));
  const chartH = 116;
  const step = 100 / 24;
  return (
    <div className="ol-chartwrap">
      <svg className="ol-svg" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden>
        {[0.5, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={120 - chartH * g} y2={120 - chartH * g} className="ol-grid" />
        ))}
        {data.map((d) => {
          const h = (d.count / max) * chartH;
          return <rect key={d.hour} x={d.hour * step + step * 0.18} y={120 - h} width={step * 0.64} height={h} className="ol-bar-a" />;
        })}
      </svg>
      <div className="ol-chart-axis">
        {data.map((d) => <span key={d.hour}>{[0, 6, 12, 18, 23].includes(d.hour) ? `${d.hour}h` : ''}</span>)}
      </div>
    </div>
  );
}

// ── Top contatos (barras horizontais) ─────────────────────────────────────
function TopContatos({ data }: { data: DashboardContact[] }) {
  if (data.length === 0) return <Vazio />;
  const max = Math.max(1, ...data.map((c) => c.count));
  return (
    <ul className="ol-topc">
      {data.map((c) => (
        <li key={c.address} className="ol-topc-item">
          <span className="ol-topc-av" style={{ background: corDeterministica(c.address) }}>{iniciais({ name: c.name, address: c.address })}</span>
          <div className="ol-topc-body">
            <div className="ol-topc-l1"><span className="ol-topc-nome" title={c.address}>{c.name || c.address}</span><span className="ol-topc-num">{c.count}</span></div>
            <div className="ol-topc-track"><div className="ol-topc-fill" style={{ width: `${(c.count / max) * 100}%` }} /></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Status (barras proporcionais) ─────────────────────────────────────────
function StatusBarras({ status }: { status?: DashboardStatus }) {
  if (!status) return <Vazio />;
  const linhas = [
    { txt: 'Lidas', v: status.read, cor: 'var(--ol-ok)' },
    { txt: 'Não lidas', v: status.unread, cor: 'var(--ol-warn)' },
    { txt: 'Importantes', v: status.important, cor: 'var(--ol-danger)' },
    { txt: 'Arquivadas', v: status.archived, cor: 'var(--ol-purple)' },
  ];
  const max = Math.max(1, ...linhas.map((l) => l.v));
  return (
    <ul className="ol-statusbars">
      {linhas.map((l) => (
        <li key={l.txt} className="ol-statusbar">
          <span className="ol-statusbar-lbl">{l.txt}</span>
          <span className="ol-statusbar-track"><span className="ol-statusbar-fill" style={{ width: `${(l.v / max) * 100}%`, background: l.cor }} /></span>
          <span className="ol-statusbar-num">{l.v}</span>
        </li>
      ))}
    </ul>
  );
}

function Vazio() {
  return <div className="ol-dash-vazio">Sem dados no período.</div>;
}
