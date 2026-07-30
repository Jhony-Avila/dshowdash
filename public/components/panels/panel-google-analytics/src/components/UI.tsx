// components/UI.tsx — peças reutilizáveis do módulo.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ Os ícones são importados NOMINALMENTE. `import * as Lucide` puxaria a biblioteca inteira
// para o bundle do painel (são centenas de ícones) — e o §68 pede uma família só, não a
// coleção toda. O mapa abaixo tem exatamente os ícones que as telas usam.
import {
  LayoutDashboard, Radio, Presentation, MousePointerClick, Share2, Megaphone, Route,
  Files, PanelsTopLeft, Zap, BadgeCheck, Filter, ShoppingCart, Package, Users,
  MonitorSmartphone, Map as MapIcon, Repeat2, ShieldCheck, Tags, BellRing, Lightbulb,
  Database, Gauge, PanelLeftClose, PanelLeftOpen, RefreshCw, AlertTriangle, Info,
  CircleAlert, ArrowRight, TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Kpi, MetaProcedencia } from '../shell/types';
import { fmtValor, fmtVariacao, sentidoVariacao, fmtDesde, fmtCompacto } from '../lib/fmt';

const ICONES: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Radio, Presentation, MousePointerClick, Share2, Megaphone, Route,
  Files, PanelsTopLeft, Zap, BadgeCheck, Filter, ShoppingCart, Package, Users,
  MonitorSmartphone, Map: MapIcon, Repeat2, ShieldCheck, Tags, BellRing, Lightbulb,
  Database, Gauge, PanelLeftClose, PanelLeftOpen, RefreshCw, AlertTriangle, Info,
  CircleAlert, ArrowRight, TriangleAlert,
};

export function Icone({ nome, tam = 16 }: { nome: string; tam?: number }) {
  const C = ICONES[nome] ?? Info;
  return <C size={tam} strokeWidth={1.9} aria-hidden />;
}

// ── Sparkline em SVG puro ────────────────────────────────────────────────
// Sem biblioteca: são 30–90 pontos numa faixa de 26px. Trazer um motor de gráfico para
// isto seria peso morto no primeiro paint.
export function Sparkline({ pontos, cor = 'var(--ga-laranja)' }: { pontos: number[]; cor?: string }) {
  if (!pontos || pontos.length < 2) return null;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const amp = max - min || 1;
  const larg = 100;
  const alt = 26;
  const d = pontos
    .map((p, i) => {
      const x = (i / (pontos.length - 1)) * larg;
      const y = alt - 2 - ((p - min) / amp) * (alt - 5);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg className="ga-spark" viewBox={`0 0 ${larg} ${alt}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={cor} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Card de KPI (§15.2) ──────────────────────────────────────────────────
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const s = sentidoVariacao(kpi.variacao_pct, kpi.maior_melhor);
  return (
    <div className="ga-kpi">
      <div className="ga-kpi__rot">{kpi.rotulo}</div>
      <div className="ga-kpi__val">{fmtValor(kpi.valor, kpi.unidade)}</div>
      <div className="ga-kpi__pe">
        <span className="ga-var" data-s={s} title={
          kpi.maior_melhor === false
            ? 'Nesta métrica, queda é o resultado desejado.'
            : 'Nesta métrica, alta é o resultado desejado.'
        }>
          {fmtVariacao(kpi.variacao_pct)}
        </span>
        {kpi.anterior !== null && kpi.anterior !== undefined && (
          <span className="ga-kpi__ant">vs {fmtValor(kpi.anterior, kpi.unidade)}</span>
        )}
      </div>
      {kpi.sparkline && kpi.sparkline.length > 1 && (
        <Sparkline pontos={kpi.sparkline} cor={s === 'ruim' ? 'var(--ga-ruim)' : 'var(--ga-laranja)'} />
      )}
    </div>
  );
}

export function Badge({ tipo, children }: { tipo: 'ok' | 'alerta' | 'erro' | 'info' | 'neutro' | 'marca'; children: ReactNode }) {
  return <span className="ga-badge" data-t={tipo}>{children}</span>;
}

export function Card({ titulo, nota, children, acao }: { titulo?: string; nota?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="ga-secao">
      {titulo && (
        <h3 className="ga-secao__titulo">
          {titulo}
          {nota && <span className="ga-secao__nota">{nota}</span>}
          {acao && <span style={{ marginLeft: 'auto' }}>{acao}</span>}
        </h3>
      )}
      {children}
    </section>
  );
}

// ── Estados (§69) ────────────────────────────────────────────────────────
export function Carregando({ linhas = 4 }: { linhas?: number }) {
  return (
    <div style={{ display: 'grid', gap: 8 }} aria-busy="true" aria-live="polite">
      <div className="ga-skel" style={{ height: 74 }} />
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="ga-skel" style={{ height: 30 }} />
      ))}
    </div>
  );
}

export function Vazio({ titulo, detalhe, acao }: { titulo: string; detalhe?: string; acao?: ReactNode }) {
  return (
    <div className="ga-vazio">
      <Icone nome="Info" tam={22} />
      <div className="ga-vazio__t">{titulo}</div>
      {detalhe && <div className="ga-vazio__d">{detalhe}</div>}
      {acao}
    </div>
  );
}

/**
 * Erro (§69.3). Mostra mensagem amigável, hora e — quando o backend manda — a lista de
 * pendências. ⚠️ É assim que o 503 do provedor real vira instrução em vez de beco sem saída.
 */
export function Erro({ erro, onTentar }: { erro: { message: string; status?: number; pendencias?: string[] }; onTentar?: () => void }) {
  return (
    <div className="ga-erro" role="alert">
      <div className="ga-erro__t">
        <Icone nome="TriangleAlert" tam={14} /> Não foi possível carregar
      </div>
      <div className="ga-erro__d">
        {erro.message}
        {erro.status ? ` (HTTP ${erro.status})` : ''} · {new Date().toLocaleString('pt-BR')}
      </div>
      {erro.pendencias && erro.pendencias.length > 0 && (
        <>
          <div className="ga-erro__d" style={{ marginTop: 8, fontWeight: 600 }}>O que falta para a integração real:</div>
          <ul>{erro.pendencias.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </>
      )}
      {onTentar && (
        <button className="ga-btn" style={{ marginTop: 10 }} onClick={onTentar}>
          <Icone nome="RefreshCw" tam={13} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

/**
 * Rodapé de procedência (§49). Não é enfeite: é o que impede o painel de apresentar número
 * sem dizer de onde veio. A §49 do briefing proíbe ocultar divergência com a interface do GA4.
 */
export function Procedencia({ meta }: { meta: MetaProcedencia | null }) {
  if (!meta) return null;
  const fonte = meta.fonte === 'mock' ? 'dados simulados' : meta.fonte ?? 'desconhecida';
  return (
    <div className="ga-proc">
      <span>Fonte: <b>{fonte}</b></span>
      {meta.categoria_quota && <><span className="ga-proc__sep">·</span><span>quota: {meta.categoria_quota}</span></>}
      {meta.filtros && <><span className="ga-proc__sep">·</span><span>{meta.filtros.inicio} a {meta.filtros.fim} ({meta.filtros.dias} dias)</span></>}
      {meta.property_id && <><span className="ga-proc__sep">·</span><span>propriedade {meta.property_id}</span></>}
      {meta.measurement_id && <><span className="ga-proc__sep">·</span><span>{meta.measurement_id}</span></>}
      <span className="ga-proc__sep">·</span><span>atualizado {fmtDesde(meta.atualizado_em)}</span>
      {meta.parcial && <><span className="ga-proc__sep">·</span><Badge tipo="alerta">dados parciais</Badge></>}
      {meta.observacao && <><span className="ga-proc__sep">·</span><span>{meta.observacao}</span></>}
      {meta.nota_custo && <><span className="ga-proc__sep">·</span><span>{meta.nota_custo}</span></>}
    </div>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────
export interface Coluna<T> {
  chave: string;
  rotulo: string;
  /** Números vão à direita (§60.2). */
  num?: boolean;
  larg?: number;
  render: (linha: T) => ReactNode;
  /** Totalizador de rodapé (§60.1). */
  total?: (linhas: T[]) => ReactNode;
}

export function Grid<T>({
  colunas, linhas, chave, vazio, onLinha, selecionada,
}: {
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (l: T, i: number) => string;
  vazio?: ReactNode;
  onLinha?: (l: T) => void;
  selecionada?: (l: T) => boolean;
}) {
  if (linhas.length === 0) {
    return <div className="ga-grid-wrap">{vazio ?? <Vazio titulo="Sem dados no período" detalhe="Ajuste o período ou limpe os filtros." />}</div>;
  }
  const temTotal = colunas.some((c) => c.total);
  return (
    <div className="ga-grid-wrap">
      <table className="ga-grid">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} className={c.num ? 'ga-num' : undefined} style={c.larg ? { width: c.larg } : undefined}>
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr
              key={chave(l, i)}
              data-sel={selecionada?.(l) ? 'true' : undefined}
              onClick={onLinha ? () => onLinha(l) : undefined}
              style={onLinha ? { cursor: 'pointer' } : undefined}
            >
              {colunas.map((c) => (
                <td key={c.chave} className={c.num ? 'ga-num' : undefined}>{c.render(l)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {temTotal && (
          <tfoot>
            <tr>
              {colunas.map((c, i) => (
                <td key={c.chave} className={c.num ? 'ga-num' : undefined}>
                  {c.total ? c.total(linhas) : (i === 0 ? `Σ ${linhas.length} linhas` : '')}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Barra proporcional para célula de grid. */
export function BarraProp({ valor, max }: { valor: number; max: number }) {
  const p = max > 0 ? Math.max(2, Math.min(100, (valor / max) * 100)) : 0;
  return <div className="ga-bar" title={fmtCompacto(valor)}><i style={{ width: `${p}%` }} /></div>;
}

/** Item do painel "exige atenção" (§17). */
export function AlertaItem({
  sev, titulo, impacto, causa, recomendacao, onIr,
}: {
  sev: string; titulo: string; impacto: string; causa: string; recomendacao: string; onIr?: () => void;
}) {
  return (
    <div className="ga-alerta-item" data-sev={sev}>
      <div className="ga-alerta-item__faixa" />
      <div className="ga-alerta-item__corpo">
        <div className="ga-alerta-item__tit">{titulo}</div>
        <div className="ga-alerta-item__lin"><b>Impacto:</b> {impacto}</div>
        <div className="ga-alerta-item__lin"><b>Possível causa:</b> {causa}</div>
        <div className="ga-alerta-item__lin"><b>Recomendação:</b> {recomendacao}</div>
      </div>
      <div className="ga-alerta-item__acao">
        {onIr && (
          <button className="ga-btn" onClick={onIr} title="Abrir a tela relacionada">
            Analisar <Icone nome="ArrowRight" tam={13} />
          </button>
        )}
      </div>
    </div>
  );
}
