// components/ui.tsx — blocos visuais do painel Visão Geral.
// @version 2.0.0  @created 2026-07-29
import { type ReactNode } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import type { CartaoSaude, MetricaWidget, NivelSaude, ResumoModulo } from '../domain/types';

// ── formatadores ────────────────────────────────────────────────────
export const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const relTempo = (iso: string): string => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min <= 0) return 'agora';
  if (min === 1) return 'há 1 minuto';
  if (min < 60) return `há ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? 'há 1 hora' : `há ${h} horas`;
  const d = Math.round(h / 24);
  return d === 1 ? 'há 1 dia' : `há ${d} dias`;
};

// ── estados básicos ─────────────────────────────────────────────────
export function Skeleton({ altura = 140 }: { altura?: number }) {
  return <div className="ger-skel" style={{ height: altura }} aria-label="Carregando" />;
}

export function ErroWidget({ mensagem, onTentar }: { mensagem: string; onTentar: () => void }) {
  return (
    <div className="ger-erro">
      <span>{mensagem}</span>
      <button className="ger-btn ger-btn-mini" onClick={onTentar}>
        <RefreshCw size={12} aria-hidden /> Tentar de novo
      </button>
    </div>
  );
}

export function SeloSimulado() {
  return (
    <span className="ger-selo-sim" title="Dados de demonstração — a integração real substitui apenas a fonte, o widget permanece.">
      simulado
    </span>
  );
}

// ── seção ───────────────────────────────────────────────────────────
export function Secao({ titulo, sub, acoes, children }: {
  titulo: string; sub?: string; acoes?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="ger-sec">
      <div className="ger-sec-head">
        <div>
          <h3>{titulo}</h3>
          {sub && <span className="ger-sec-sub">{sub}</span>}
        </div>
        {acoes && <div className="ger-sec-acoes">{acoes}</div>}
      </div>
      {children}
    </section>
  );
}

// ── sparkline ───────────────────────────────────────────────────────
export function Sparkline({ dados }: { dados: number[] }) {
  if (dados.length < 2) return null;
  const max = Math.max(...dados, 1);
  const pts = dados.map((v, i) => `${(i / (dados.length - 1)) * 100},${28 - (v / max) * 26}`).join(' ');
  return (
    <svg className="ger-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── cartão de saúde (§22) ───────────────────────────────────────────
const NIVEL_CLASSE: Record<NivelSaude, string> = {
  ok: 'ok', atencao: 'warn', critico: 'bad', indisponivel: 'dim',
};

export function CartaoSaudeView({ cartao, aoAbrir }: {
  cartao: CartaoSaude; aoAbrir: (rota: string) => void;
}) {
  const clicavel = !!cartao.rota;
  return (
    <button className={`ger-saude ger-nivel-${NIVEL_CLASSE[cartao.nivel]}${clicavel ? ' is-click' : ''}`}
      onClick={() => cartao.rota && aoAbrir(cartao.rota)} disabled={!clicavel}>
      <span className="ger-saude-rotulo">{cartao.rotulo}</span>
      <span className="ger-saude-valor">{cartao.valor}</span>
      <span className="ger-saude-detalhe">{cartao.detalhe}</span>
    </button>
  );
}

// ── widget de módulo (§24) ──────────────────────────────────────────
function Metrica({ m }: { m: MetricaWidget }) {
  return (
    <div className="ger-wg-metrica">
      <span className="ger-wg-metrica-rotulo">{m.rotulo}</span>
      <span className={`ger-wg-metrica-valor${m.ruim ? ' is-ruim' : ''}${m.bom ? ' is-bom' : ''}`}>{m.valor}</span>
    </div>
  );
}

export function WidgetModulo({ nome, icone, resumo, rota, aoAbrir }: {
  nome: string;
  icone: ReactNode;
  resumo: ResumoModulo;
  rota: string | null;
  aoAbrir: (rota: string) => void;
}) {
  return (
    <article className={`ger-widget ger-borda-${NIVEL_CLASSE[resumo.status]}`}>
      <header className="ger-wg-head">
        <span className="ger-wg-ic" aria-hidden>{icone}</span>
        <span className="ger-wg-nome">{nome}</span>
        {resumo.simulado && <SeloSimulado />}
        <span className={`ger-wg-status ger-status-${NIVEL_CLASSE[resumo.status]}`}>{resumo.statusRotulo}</span>
      </header>

      <div className="ger-wg-metricas">
        {resumo.metricas.map((m) => <Metrica key={m.rotulo} m={m} />)}
      </div>

      {resumo.sparkline && resumo.sparkline.length > 1 && (
        <div className="ger-wg-spark"><Sparkline dados={resumo.sparkline} /></div>
      )}

      {resumo.alerta && <p className="ger-wg-alerta">{resumo.alerta}</p>}

      <footer className="ger-wg-foot">
        <span className="ger-wg-quando">
          {resumo.atualizadoEm ? `atualizado ${relTempo(resumo.atualizadoEm)}` : ''}
        </span>
        {rota && (
          <button className="ger-wg-abrir" onClick={() => aoAbrir(rota)}>
            Abrir <ArrowRight size={12} aria-hidden />
          </button>
        )}
      </footer>
    </article>
  );
}
