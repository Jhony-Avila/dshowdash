// components/ui.tsx — blocos visuais compartilhados do módulo Mercado Livre.
// @version 1.0.0  @created 2026-07-28
import { useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, X } from 'lucide-react';
import type { Kpi, Tendencia } from '../domain/types';

// ── Formatadores (padrão brasileiro — briefing §28.3) ───────────────
export const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v >= 10000 ? 0 : 2 });
export const fmtNumero = (v: number) => v.toLocaleString('pt-BR');
export const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
export const fmtData = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
export const fmtDataHora = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
export const fmtKpi = (k: Kpi) =>
  k.formato === 'moeda' ? fmtMoeda(k.valor) : k.formato === 'percentual' ? fmtPct(k.valor) : fmtNumero(k.valor);

// ── Sparkline SVG (sem dependências) ────────────────────────────────
export function Sparkline({ dados }: { dados: number[] }) {
  if (dados.length < 2) return null;
  const max = Math.max(...dados, 1);
  const pontos = dados.map((v, i) =>
    `${(i / (dados.length - 1)) * 100},${28 - (v / max) * 26}`).join(' ');
  return (
    <svg className="ml-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Card de KPI ─────────────────────────────────────────────────────
function IconeTendencia({ t }: { t: Tendencia }) {
  if (t === 'positiva') return <ArrowUpRight size={13} aria-label="tendência positiva" />;
  if (t === 'negativa') return <ArrowDownRight size={13} aria-label="tendência negativa" />;
  return <Minus size={13} aria-label="estável" />;
}

export function KpiCard({ kpi, onDrill }: { kpi: Kpi; onDrill?: (secao: string) => void }) {
  const clicavel = !!(kpi.drill && onDrill);
  return (
    <button className={`ml-kpi${clicavel ? ' is-click' : ''} ml-kpi-${kpi.tendencia}`}
      onClick={() => clicavel && onDrill!(kpi.drill!)} disabled={!clicavel}
      title={kpi.dica ?? (clicavel ? 'Clique para detalhar' : undefined)}>
      <span className="ml-kpi-rotulo">{kpi.rotulo}</span>
      <span className="ml-kpi-valor">{fmtKpi(kpi)}</span>
      <span className="ml-kpi-meta">
        {kpi.variacaoPct !== null && (
          <span className={`ml-kpi-var ml-var-${kpi.tendencia}`}>
            <IconeTendencia t={kpi.tendencia} />
            {`${kpi.variacaoPct > 0 ? '+' : ''}${kpi.variacaoPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          </span>
        )}
        {kpi.sparkline.length > 1 && <Sparkline dados={kpi.sparkline} />}
      </span>
    </button>
  );
}

// ── Badges de status ────────────────────────────────────────────────
const CORES_STATUS: Record<string, string> = {
  // pedidos / envios
  novo: 'info', pago: 'info', faturado: 'info', separacao: 'warn', enviado: 'info',
  entregue: 'ok', cancelado: 'bad', devolvido: 'bad', preparando: 'warn',
  em_transito: 'info', atrasado: 'bad',
  // anúncios
  ativo: 'ok', pausado: 'warn', encerrado: 'dim', em_revisao: 'warn', erro: 'bad',
  // ocorrências / financeiro / estoque
  aberta: 'bad', em_andamento: 'warn', resolvida: 'ok',
  recebido: 'ok', pendente: 'warn', divergente: 'bad',
  ok: 'ok', critico: 'bad', zerado: 'bad', excesso: 'warn', parado: 'dim',
  executando: 'warn',
};

const ROTULOS_STATUS: Record<string, string> = {
  novo: 'Novo', pago: 'Pago', faturado: 'Faturado', separacao: 'Separação',
  enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado', devolvido: 'Devolvido',
  preparando: 'Preparando', em_transito: 'Em trânsito', atrasado: 'Atrasado',
  ativo: 'Ativo', pausado: 'Pausado', encerrado: 'Encerrado', em_revisao: 'Em revisão', erro: 'Erro',
  aberta: 'Aberta', em_andamento: 'Em andamento', resolvida: 'Resolvida',
  recebido: 'Recebido', pendente: 'Pendente', divergente: 'Divergente',
  ok: 'OK', critico: 'Crítico', zerado: 'Zerado', excesso: 'Excesso', parado: 'Parado',
  executando: 'Executando', respondida: 'Respondida',
  reclamacao: 'Reclamação', mediacao: 'Mediação', cancelamento: 'Cancelamento', devolucao: 'Devolução',
  full: 'Full', flex: 'Flex', correios: 'Correios', coleta: 'Coleta',
  classico: 'Clássico', premium: 'Premium',
};

export function StatusBadge({ valor }: { valor: string }) {
  return (
    <span className={`ml-status ml-status-${CORES_STATUS[valor] ?? 'dim'}`}>
      {ROTULOS_STATUS[valor] ?? valor}
    </span>
  );
}

// ── Estados de tela ─────────────────────────────────────────────────
export function Carregando({ altura = 200 }: { altura?: number }) {
  return (
    <div className="ml-skel" style={{ height: altura }} aria-label="Carregando">
      <span className="ml-spinner" /> Carregando…
    </div>
  );
}

export function EstadoVazio({ titulo, detalhe }: { titulo: string; detalhe?: string }) {
  return (
    <div className="ml-vazio">
      <strong>{titulo}</strong>
      {detalhe && <span>{detalhe}</span>}
    </div>
  );
}

export function EmPreparacao({ secao, detalhe }: { secao: string; detalhe: string }) {
  return (
    <div className="ml-vazio ml-preparacao">
      <span className="ml-prep-selo">Em preparação</span>
      <strong>{secao}</strong>
      <span>{detalhe}</span>
      <span className="ml-prep-nota">Esta área faz parte do plano do módulo e será ativada nas próximas fases.</span>
    </div>
  );
}

// ── Drawer lateral genérico ─────────────────────────────────────────
export function Drawer({ titulo, aberto, onFechar, children }: {
  titulo: ReactNode; aberto: boolean; onFechar: () => void; children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <>
      <div className="ml-overlay" onClick={onFechar} aria-hidden />
      <aside className="ml-drawer" role="dialog" aria-label={typeof titulo === 'string' ? titulo : 'Detalhes'}>
        <div className="ml-drawer-head">
          <span className="ml-drawer-titulo">{titulo}</span>
          <button className="ml-icbtn" onClick={onFechar} title="Fechar (Esc)"><X size={15} /></button>
        </div>
        <div className="ml-drawer-body">{children}</div>
      </aside>
    </>
  );
}

// ── Seção padrão ────────────────────────────────────────────────────
export function Secao({ titulo, sub, acoes, children }: {
  titulo: string; sub?: string; acoes?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="ml-sec">
      <div className="ml-sec-head">
        <div>
          <h3>{titulo}</h3>
          {sub && <span className="ml-sec-sub">{sub}</span>}
        </div>
        {acoes && <div className="ml-sec-acoes">{acoes}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Barra simples de distribuição (série única) ─────────────────────
export function Barras({ dados, formato = 'moeda', max = 10 }: {
  dados: { rotulo: string; valor: number }[]; formato?: 'moeda' | 'numero'; max?: number;
}) {
  const top = dados.slice(0, max);
  const maior = Math.max(...top.map((d) => d.valor), 1);
  return (
    <div className="ml-barras">
      {top.map((d) => (
        <div key={d.rotulo} className="ml-barra-row">
          <span className="ml-barra-rotulo" title={d.rotulo}>{d.rotulo}</span>
          <span className="ml-barra-track" aria-hidden>
            <span className="ml-barra-fill" style={{ width: `${Math.max(2, (d.valor / maior) * 100)}%` }} />
          </span>
          <span className="ml-barra-valor">{formato === 'moeda' ? fmtMoeda(d.valor) : fmtNumero(d.valor)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Abas internas de uma seção ──────────────────────────────────────
export function Abas<T extends string>({ abas, ativa, onTrocar }: {
  abas: { id: T; rotulo: string }[]; ativa: T; onTrocar: (id: T) => void;
}) {
  return (
    <div className="ml-abas" role="tablist">
      {abas.map((a) => (
        <button key={a.id} role="tab" aria-selected={ativa === a.id}
          className={`ml-aba${ativa === a.id ? ' is-on' : ''}`}
          onClick={() => onTrocar(a.id)}>{a.rotulo}</button>
      ))}
    </div>
  );
}

// Estado local persistente simples (apenas memória da sessão do painel).
export function useLocal<T>(inicial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(inicial);
  return [v, setV];
}
