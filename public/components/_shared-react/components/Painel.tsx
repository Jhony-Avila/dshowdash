// _shared-react/components/Painel.tsx — KPI, filtros e cabeçalho de página
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import { porTipo, TipoFormato, percentual, haQuantoTempo } from '../lib/formato';

/* ─────────────────────────── KpiCard (§14.1) ─────────────────────────── */

export interface Kpi {
  id: string;
  rotulo: string;
  valor: number;
  formato: TipoFormato;
  variacao?: number | null;
  tendencia?: 'alta' | 'baixa' | 'estavel';
  sparkline?: { data: string; valor: number }[] | null;
  drilldown?: string | null;
  semantica?: 'ok' | 'atencao' | 'critico';
  tooltip?: string | null;
  definicao?: string;
  meta?: number | null;
}

/** Sparkline em SVG puro: 40 pontos não justificam carregar biblioteca. */
function Sparkline({ pontos, cor }: { pontos: { valor: number }[]; cor: string }) {
  if (!pontos || pontos.length < 2) return null;
  const vals = pontos.map(p => p.valor);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const amp = max - min || 1;
  const L = 100, A = 26;
  const d = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * L;
    const y = A - ((v - min) / amp) * (A - 3) - 1.5;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" aria-hidden
      style={{ width: '100%', height: 26, display: 'block', overflow: 'visible' }}>
      <path d={`${d} L${L},${A} L0,${A} Z`} fill={cor} opacity={.1} />
      <path d={d} fill="none" stroke={cor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * `aoAbrir` recebe o **id do KPI** e, como segundo argumento, o destino cru que
 * a API sugeriu.
 *
 * A primeira versão passava só `kpi.drilldown` — e quem consome resolvia o
 * destino por um mapa indexado pelo ID. O mapa nunca casava, e o drill-down
 * abria a tela certa SEM o recorte, silenciosamente. O id é o que identifica o
 * indicador; o drilldown é só o palpite do servidor.
 */
export function CartaoKpi({ kpi, aoAbrir }: {
  kpi: Kpi;
  aoAbrir?: (id: string, drilldown: string | null) => void;
}) {
  const corSemantica =
    kpi.semantica === 'critico' ? 'var(--bl-erro)'
    : kpi.semantica === 'atencao' ? 'var(--bl-aviso)'
    : 'var(--bl-verde)';

  const corVariacao =
    kpi.variacao === null || kpi.variacao === undefined ? 'var(--bl-texto-3)'
    : kpi.variacao > 0 ? 'var(--bl-sucesso)'
    : kpi.variacao < 0 ? 'var(--bl-erro)' : 'var(--bl-texto-3)';

  const clicavel = Boolean(kpi.drilldown && aoAbrir);
  const Tag = (clicavel ? 'button' : 'div') as React.ElementType;

  return (
    <Tag
      type={clicavel ? 'button' : undefined}
      onClick={clicavel ? () => aoAbrir!(kpi.id, kpi.drilldown ?? null) : undefined}
      title={kpi.tooltip ?? kpi.definicao ?? undefined}
      className="bl-cartao"
      style={{
        padding: '11px 13px', textAlign: 'left', font: 'inherit', color: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0,
        cursor: clicavel ? 'pointer' : 'default',
        borderLeft: `3px solid ${kpi.semantica && kpi.semantica !== 'ok' ? corSemantica : 'transparent'}`,
      }}
    >
      <div style={{
        fontSize: 11, color: 'var(--bl-texto-2)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {kpi.rotulo}
      </div>

      <div style={{
        fontSize: 19, fontWeight: 650, lineHeight: 1.15,
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {porTipo(kpi.valor, kpi.formato, true)}
      </div>

      {/* Linha de comparação: só aparece quando HÁ comparação.
          Repetir "sem comparação vs. período anterior" em todos os cards enche a
          tela de ruído e não informa nada — o silêncio já diz que não há base. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, minHeight: 15 }}>
        {kpi.variacao !== null && kpi.variacao !== undefined ? (
          <>
            <span style={{ color: corVariacao, fontWeight: 600 }}>
              <span aria-hidden>{kpi.variacao > 0 ? '↑' : kpi.variacao < 0 ? '↓' : '→'}</span>{' '}
              {percentual(Math.abs(kpi.variacao))}
            </span>
            <span style={{ color: 'var(--bl-texto-3)' }}>vs. período anterior</span>
          </>
        ) : (
          <span style={{ color: 'var(--bl-texto-3)', opacity: .55 }} title="Sem base de comparação para este indicador">
            —
          </span>
        )}
      </div>

      {kpi.sparkline && kpi.sparkline.length > 1 && (
        <Sparkline pontos={kpi.sparkline} cor={corSemantica} />
      )}

      {kpi.meta !== null && kpi.meta !== undefined && kpi.meta > 0 && (
        <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>
          meta: {porTipo(kpi.meta, kpi.formato, true)}
        </div>
      )}
    </Tag>
  );
}

export function GradeKpis({ kpis, aoAbrir, colunasMin = 168 }: {
  kpis: Kpi[];
  aoAbrir?: (id: string, drilldown: string | null) => void;
  colunasMin?: number;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${colunasMin}px, 1fr))`,
      gap: 10,
    }}>
      {kpis.map(k => <CartaoKpi key={k.id} kpi={k} aoAbrir={aoAbrir} />)}
    </div>
  );
}

/* ─────────────────────────── FilterBar (§12) ─────────────────────────── */

export interface Faceta { valor: string; quantidade: number }

export interface FiltrosTela {
  periodo: string;
  situacao: string;
  canal: string;
  deposito: string;
  fornecedor: string;
  categoria: string;
  vendedor: string;
  [k: string]: string;
}

export const PERIODOS = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: '7d',   rotulo: '7 dias' },
  { id: '30d',  rotulo: '30 dias' },
  { id: '90d',  rotulo: '90 dias' },
  { id: '12m',  rotulo: '12 meses' },
];

export function BarraFiltros({ filtros, aoMudar, facetas, camposExtras, aoLimpar }: {
  filtros: FiltrosTela;
  aoMudar: (parcial: Partial<FiltrosTela>) => void;
  facetas?: Record<string, Faceta[]>;
  camposExtras?: string[];
  aoLimpar?: () => void;
}) {
  const campos = camposExtras ?? [];
  const ativos = campos.filter(c => filtros[c]).length + (filtros.periodo !== '30d' ? 1 : 0);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '9px 0', minWidth: 0,
    }}>
      <div role="group" aria-label="Período" style={{ display: 'flex', gap: 2 }}>
        {PERIODOS.map(p => {
          const sel = filtros.periodo === p.id;
          return (
            <button key={p.id} type="button" onClick={() => aoMudar({ periodo: p.id })}
              aria-pressed={sel}
              className="bl-botao"
              style={{
                height: 28, fontSize: 11.5,
                background: sel ? 'var(--bl-verde-suave)' : undefined,
                borderColor: sel ? 'var(--bl-verde-borda)' : undefined,
                color: sel ? 'var(--bl-verde)' : undefined,
                fontWeight: sel ? 600 : undefined,
              }}>
              {p.rotulo}
            </button>
          );
        })}
      </div>

      {campos.map(campo => {
        const opcoes = facetas?.[campo] ?? [];
        if (opcoes.length === 0) return null;
        return (
          <select
            key={campo}
            value={filtros[campo] ?? ''}
            onChange={e => aoMudar({ [campo]: e.target.value } as Partial<FiltrosTela>)}
            aria-label={rotuloCampo(campo)}
            style={{
              height: 28, maxWidth: 190, padding: '0 8px', font: 'inherit', fontSize: 12,
              color: filtros[campo] ? 'var(--bl-texto)' : 'var(--bl-texto-2)',
              background: filtros[campo] ? 'var(--bl-verde-suave)' : 'var(--bl-superficie-2)',
              border: `1px solid ${filtros[campo] ? 'var(--bl-verde-borda)' : 'var(--bl-borda)'}`,
              borderRadius: 'var(--bl-raio-sm)',
            }}
          >
            <option value="">{rotuloCampo(campo)}: todos</option>
            {opcoes.map(o => (
              <option key={o.valor} value={o.valor}>{o.valor} ({o.quantidade})</option>
            ))}
          </select>
        );
      })}

      {ativos > 0 && aoLimpar && (
        <button type="button" className="bl-botao" onClick={aoLimpar}>
          Limpar filtros ({ativos})
        </button>
      )}
    </div>
  );
}

function rotuloCampo(c: string): string {
  const m: Record<string, string> = {
    situacao: 'Situação', canal: 'Canal', deposito: 'Depósito',
    fornecedor: 'Fornecedor', categoria: 'Categoria', vendedor: 'Vendedor',
    status: 'Status', tipo: 'Tipo', marca: 'Marca', uf: 'UF',
    transportadora: 'Transportadora', severidade: 'Severidade', modulo: 'Módulo',
    nivel: 'Nível', origem: 'Origem', evento: 'Evento', classe: 'Classificação',
    forma: 'Forma', urgencia: 'Urgência', atributo: 'Atributo', vinculo: 'Vínculo',
  };
  return m[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
}

/* ─────────────────────────── PageHeader ─────────────────────────── */

export function CabecalhoPagina({ titulo, subtitulo, ultimaSync, aoAtualizar, atualizando, acoes }: {
  titulo: string; subtitulo?: string; ultimaSync?: string | null;
  aoAtualizar?: () => void; atualizando?: boolean; acoes?: React.ReactNode;
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      padding: '2px 0 6px', minWidth: 0,
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 650, letterSpacing: '-.01em' }}>{titulo}</h1>
        {subtitulo && (
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--bl-texto-2)' }}>{subtitulo}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {ultimaSync && (
          <span style={{ fontSize: 11.5, color: 'var(--bl-texto-3)' }}>
            atualizado {haQuantoTempo(ultimaSync)}
          </span>
        )}
        {aoAtualizar && (
          <button type="button" className="bl-botao" onClick={aoAtualizar} disabled={atualizando}>
            {atualizando ? 'Atualizando…' : 'Atualizar'}
          </button>
        )}
        {acoes}
      </div>
    </header>
  );
}

/* ─────────────────────────── Seção ─────────────────────────── */

export function Secao({ titulo, descricao, acoes, children }: {
  titulo: string; descricao?: string; acoes?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 18, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 9 }}>
        <h2 className="bl-titulo-secao" style={{ margin: 0 }}>{titulo}</h2>
        {descricao && (
          <span style={{ fontSize: 11.5, color: 'var(--bl-texto-3)', flex: 1 }}>{descricao}</span>
        )}
        {acoes}
      </div>
      {children}
    </section>
  );
}
