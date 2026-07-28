// components/ui.tsx — blocos visuais compartilhados do módulo Meta Ads.
// @version 1.0.0  @created 2026-07-28
import { type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, X } from 'lucide-react';
import type { Kpi, Tendencia } from '../domain/types';

// ── Formatadores (padrão brasileiro) ────────────────────────────────
export const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v >= 10000 ? 0 : 2 });
export const fmtNumero = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : v >= 10000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  : v.toLocaleString('pt-BR');
export const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
export const fmtDec = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export const fmtData = (isoStr: string) => new Date(isoStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
export const fmtDataHora = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
export const fmtKpi = (k: Kpi) =>
  k.formato === 'moeda' ? fmtMoeda(k.valor)
  : k.formato === 'percentual' ? fmtPct(k.valor)
  : k.formato === 'decimal' ? fmtDec(k.valor)
  : fmtNumero(k.valor);

// ── Sparkline ───────────────────────────────────────────────────────
export function Sparkline({ dados }: { dados: number[] }) {
  if (dados.length < 2) return null;
  const max = Math.max(...dados, 1);
  const pontos = dados.map((v, i) => `${(i / (dados.length - 1)) * 100},${28 - (v / max) * 26}`).join(' ');
  return (
    <svg className="mads-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── KPI ─────────────────────────────────────────────────────────────
function IconeTendencia({ t }: { t: Tendencia }) {
  if (t === 'positiva') return <ArrowUpRight size={13} aria-label="tendência positiva" />;
  if (t === 'negativa') return <ArrowDownRight size={13} aria-label="tendência negativa" />;
  return <Minus size={13} aria-label="estável" />;
}

export function KpiCard({ kpi, onDrill }: { kpi: Kpi; onDrill?: (secao: string) => void }) {
  const clicavel = !!(kpi.drill && onDrill);
  return (
    <button className={`mads-kpi${clicavel ? ' is-click' : ''}`}
      onClick={() => clicavel && onDrill!(kpi.drill!)} disabled={!clicavel}
      title={kpi.dica ?? (clicavel ? 'Clique para detalhar' : undefined)}>
      <span className="mads-kpi-rotulo">{kpi.rotulo}</span>
      <span className="mads-kpi-valor">{fmtKpi(kpi)}</span>
      <span className="mads-kpi-meta">
        {kpi.variacaoPct !== null && (
          <span className={`mads-kpi-var mads-var-${kpi.tendencia}`}>
            <IconeTendencia t={kpi.tendencia} />
            {`${kpi.variacaoPct > 0 ? '+' : ''}${kpi.variacaoPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          </span>
        )}
        {kpi.sparkline.length > 1 && <Sparkline dados={kpi.sparkline} />}
      </span>
    </button>
  );
}

// ── Status badges (domínio Meta) ────────────────────────────────────
const CORES: Record<string, string> = {
  ativa: 'ok', pausada: 'warn', encerrada: 'dim', em_analise: 'info',
  reprovada: 'bad', aprendizado: 'info', aprendizado_limitado: 'warn', sem_entrega: 'bad',
  novo: 'info', em_contato: 'warn', qualificado: 'ok', desqualificado: 'dim', convertido: 'ok',
  baixa: 'ok', media: 'warn', alta: 'bad',
  ok: 'ok', queda: 'warn', sem_atividade: 'bad', erro: 'bad', executando: 'warn',
  acima_media: 'ok', abaixo_media: 'bad',
  imagem: 'info', video: 'roxo', carrossel: 'dim',
  leads: 'ok', conversao: 'roxo', trafego: 'info', engajamento: 'dim', alcance: 'dim',
  automatico: 'info', manual: 'dim', ativo: 'ok', inativo: 'bad',
};

const ROTULOS: Record<string, string> = {
  ativa: 'Ativa', pausada: 'Pausada', encerrada: 'Encerrada', em_analise: 'Em análise',
  reprovada: 'Reprovada', aprendizado: 'Aprendizado', aprendizado_limitado: 'Aprend. limitado', sem_entrega: 'Sem entrega',
  novo: 'Novo', em_contato: 'Em contato', qualificado: 'Qualificado', desqualificado: 'Desqualificado', convertido: 'Convertido',
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
  ok: 'OK', queda: 'Queda', sem_atividade: 'Sem atividade', erro: 'Erro', executando: 'Executando',
  acima_media: 'Acima da média', abaixo_media: 'Abaixo da média',
  imagem: 'Imagem', video: 'Vídeo', carrossel: 'Carrossel',
  leads: 'Leads', conversao: 'Conversão', trafego: 'Tráfego', engajamento: 'Engajamento', alcance: 'Alcance',
  automatico: 'Automático', manual: 'Manual', ativo: 'Ativo', inativo: 'Inativo',
};

export function StatusBadge({ valor }: { valor: string }) {
  return (
    <span className={`mads-status mads-status-${CORES[valor] ?? 'dim'}`}>
      {ROTULOS[valor] ?? valor}
    </span>
  );
}

// ── Estados de tela ─────────────────────────────────────────────────
export function Carregando({ altura = 200 }: { altura?: number }) {
  return (
    <div className="mads-skel" style={{ height: altura }} aria-label="Carregando">
      <span className="mads-spinner" /> Carregando…
    </div>
  );
}

export function EstadoVazio({ titulo, detalhe }: { titulo: string; detalhe?: string }) {
  return (
    <div className="mads-vazio">
      <strong>{titulo}</strong>
      {detalhe && <span>{detalhe}</span>}
    </div>
  );
}

export function EmPreparacao({ secao, detalhe }: { secao: string; detalhe: string }) {
  return (
    <div className="mads-vazio mads-preparacao">
      <span className="mads-prep-selo">Em preparação</span>
      <strong>{secao}</strong>
      <span>{detalhe}</span>
    </div>
  );
}

// ── Drawer ──────────────────────────────────────────────────────────
export function Drawer({ titulo, aberto, onFechar, children }: {
  titulo: ReactNode; aberto: boolean; onFechar: () => void; children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <>
      <div className="mads-overlay" onClick={onFechar} aria-hidden />
      <aside className="mads-drawer" role="dialog" aria-label={typeof titulo === 'string' ? titulo : 'Detalhes'}>
        <div className="mads-drawer-head">
          <span className="mads-drawer-titulo">{titulo}</span>
          <button className="mads-icbtn" onClick={onFechar} title="Fechar"><X size={15} /></button>
        </div>
        <div className="mads-drawer-body">{children}</div>
      </aside>
    </>
  );
}

// ── Seção / abas / barras ───────────────────────────────────────────
export function Secao({ titulo, sub, acoes, children }: {
  titulo: string; sub?: string; acoes?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="mads-sec">
      <div className="mads-sec-head">
        <div>
          <h3>{titulo}</h3>
          {sub && <span className="mads-sec-sub">{sub}</span>}
        </div>
        {acoes && <div className="mads-sec-acoes">{acoes}</div>}
      </div>
      {children}
    </section>
  );
}

export function Abas<T extends string>({ abas, ativa, onTrocar }: {
  abas: { id: T; rotulo: string }[]; ativa: T; onTrocar: (id: T) => void;
}) {
  return (
    <div className="mads-abas" role="tablist">
      {abas.map((a) => (
        <button key={a.id} role="tab" aria-selected={ativa === a.id}
          className={`mads-aba${ativa === a.id ? ' is-on' : ''}`}
          onClick={() => onTrocar(a.id)}>{a.rotulo}</button>
      ))}
    </div>
  );
}

export function Barras({ dados, formato = 'moeda', max = 10 }: {
  dados: { rotulo: string; valor: number }[]; formato?: 'moeda' | 'numero'; max?: number;
}) {
  const top = dados.slice(0, max);
  const maior = Math.max(...top.map((d) => d.valor), 1);
  return (
    <div className="mads-barras">
      {top.map((d) => (
        <div key={d.rotulo} className="mads-barra-row">
          <span className="mads-barra-rotulo" title={d.rotulo}>{d.rotulo}</span>
          <span className="mads-barra-track" aria-hidden>
            <span className="mads-barra-fill" style={{ width: `${Math.max(2, (d.valor / maior) * 100)}%` }} />
          </span>
          <span className="mads-barra-valor">{formato === 'moeda' ? fmtMoeda(d.valor) : fmtNumero(d.valor)}</span>
        </div>
      ))}
    </div>
  );
}
