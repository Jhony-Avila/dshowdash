// components/ui.tsx — blocos visuais do painel Visão Geral.
// @version 2.0.0  @created 2026-07-29
import { type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, PlugZap, RefreshCw } from 'lucide-react';
import type { CartaoSaude, FaltaConexao, MetricaWidget, NivelSaude, ResumoModulo } from '../domain/types';

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

/** "às 17:40" hoje; "21/11 às 17:40" em outro dia */
export const fmtQuando = (iso: string): string => {
  const d = new Date(iso); const hoje = new Date();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === hoje.toDateString() ? `às ${hora}` : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
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

// ── estados do cartão (Geral, estados e movimento — 23/11/2026) ─────
// Quatro estados, SEMPRE escritos (nunca só cor): Carregando · Conectado · Aguardando conexão · Com problema.
// Movimento só em CSS (tokens.css, 150–300 ms); em laço só o esqueleto e o ponto de sincronização; "reduzir movimento" desliga tudo.

/** COM PROBLEMA: o que falhou em uma linha, o último sucesso e "Tentar de novo". */
export function ProblemaLinha({ motivo, ultimoSucesso, onTentar, desatualizado = false, tentando = false }: {
  motivo: string; ultimoSucesso: string | null; onTentar: () => void; desatualizado?: boolean; tentando?: boolean;
}) {
  return (
    <div className="ger-problema" role="status" data-ger-problema>
      <AlertTriangle size={14} aria-hidden className="ger-problema-ic" />
      <div className="ger-problema-corpo">
        <span className="ger-problema-motivo">{motivo}</span>
        <div className="ger-problema-linha2">
          <span className="ger-problema-quando">
            {ultimoSucesso ? `Último sucesso ${fmtQuando(ultimoSucesso)}` : 'Sem leitura válida recente'}
            {desatualizado && <> <span className="ger-tag-desatualizado">Desatualizado</span></>}
          </span>
          <button type="button" className="ger-btn ger-btn-mini" onClick={onTentar} disabled={tentando} aria-busy={tentando}>
            <RefreshCw size={12} aria-hidden className={tentando ? 'ger-girando' : undefined} /> {tentando ? 'Tentando…' : 'Tentar de novo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** CARREGANDO: esqueleto na FORMA do cartão (cabeçalho, números, minigráfico, rodapé), com o estado escrito. */
export function WidgetCarregando({ nome, icone, ordem = 0 }: { nome: string; icone: ReactNode; ordem?: number }) {
  return (
    <article className="ger-widget ger-borda-dim ger-entra" data-ger-estado="carregando" aria-busy="true"
      style={{ ['--ger-ordem' as string]: ordem }}>
      <header className="ger-wg-head">
        <span className="ger-wg-ic" aria-hidden>{icone}</span>
        <span className="ger-wg-nome">{nome}</span>
        <span className="ger-wg-status ger-status-dim">Carregando…</span>
      </header>
      <div className="ger-wg-metricas" aria-hidden>
        {[0, 1, 2].map((k) => (
          <div key={k} className="ger-wg-metrica">
            <span className="ger-osso ger-osso-rotulo" />
            <span className="ger-osso ger-osso-numero" />
          </div>
        ))}
      </div>
      <div className="ger-osso ger-osso-spark" aria-hidden />
      <footer className="ger-wg-foot"><span className="ger-osso ger-osso-rodape" aria-hidden /></footer>
    </article>
  );
}

/** AGUARDANDO CONEXÃO: cartão COMPACTO (sem caixa vazia) — o que falta, com quem está e o link da integração. */
export function CartaoAguardando({ nome, icone, falta, aoAbrir, ordem = 0 }: {
  nome: string; icone: ReactNode; falta: FaltaConexao | undefined; aoAbrir: (rota: string) => void; ordem?: number;
}) {
  return (
    <article className="ger-aguardando ger-entra" data-ger-estado="aguardando" style={{ ['--ger-ordem' as string]: ordem }}>
      <span className="ger-aguardando-ic" aria-hidden><PlugZap size={15} /></span>
      <div className="ger-aguardando-corpo">
        <div className="ger-aguardando-topo">
          <span className="ger-wg-ic" aria-hidden>{icone}</span>
          <strong title={nome}>{nome}</strong>
          <span className="ger-wg-status ger-status-dim">Aguardando conexão</span>
        </div>
        <span className="ger-aguardando-falta">
          {falta ? falta.texto : 'Integração ainda não conectada.'}
          {falta?.com && <> <em>Com {falta.com}.</em></>}
        </span>
        {falta?.rota && (
          <button type="button" className="ger-wg-abrir ger-aguardando-link" onClick={() => aoAbrir(falta.rota!)}>
            {falta.rotuloLink ?? 'Abrir integração'} <ArrowRight size={12} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

// ── widget de módulo (§24) ──────────────────────────────────────────
function Metrica({ m }: { m: MetricaWidget }) {
  return (
    <div className="ger-wg-metrica">
      <span className="ger-wg-metrica-rotulo" title={m.rotulo}>{m.rotulo}</span>
      {/* key = valor: o número que MUDA entra com uma transição curta (o dado aparece na hora; só a opacidade/posição animam) */}
      <span key={m.valor} className={`ger-wg-metrica-valor ger-num-entra${m.ruim ? ' is-ruim' : ''}${m.bom ? ' is-bom' : ''}`}>{m.valor}</span>
    </div>
  );
}

export function WidgetModulo({ nome, icone, resumo, rota, aoAbrir, sincronizando = false, ordem = 0, onTentar }: {
  nome: string;
  icone: ReactNode;
  resumo: ResumoModulo;
  rota: string | null;
  aoAbrir: (rota: string) => void;
  sincronizando?: boolean;
  ordem?: number;
  onTentar?: () => void;
}) {
  const problema = resumo.estado === 'problema';
  return (
    <article className={`ger-widget ger-borda-${NIVEL_CLASSE[resumo.status]} ger-entra`} data-ger-estado={problema ? 'problema' : 'conectado'}
      style={{ ['--ger-ordem' as string]: ordem }}>
      <header className="ger-wg-head">
        <span className="ger-wg-ic" aria-hidden>{icone}</span>
        <span className="ger-wg-nome">{nome}</span>
        {resumo.simulado && <SeloSimulado />}
        <span className={`ger-wg-status ger-status-${NIVEL_CLASSE[resumo.status]}`} title={resumo.statusRotulo}>{resumo.statusRotulo}</span>
      </header>

      {problema && resumo.problema && (
        <ProblemaLinha motivo={resumo.problema.motivo} ultimoSucesso={resumo.problema.ultimoSucesso}
          desatualizado={!!resumo.desatualizado} tentando={sincronizando} onTentar={onTentar ?? (() => undefined)} />
      )}

      {resumo.metricas.length > 0 && (
        <div className={`ger-wg-metricas${resumo.desatualizado ? ' is-desatualizado' : ''}`}>
          {resumo.metricas.map((m) => <Metrica key={m.rotulo} m={m} />)}
        </div>
      )}

      {resumo.sparkline && resumo.sparkline.length > 1 && (
        <div className="ger-wg-spark"><Sparkline dados={resumo.sparkline} /></div>
      )}

      {resumo.alerta && <p className="ger-wg-alerta">{resumo.alerta}</p>}

      <footer className="ger-wg-foot">
        {problema ? <span className="ger-wg-quando">Com problema</span> : (
          <span className="ger-wg-quando ger-sync" data-sincronizando={sincronizando ? '1' : '0'}>
            <span className="ger-sync-ponto" aria-hidden />
            {sincronizando ? 'Sincronizando…' : `Conectado${resumo.atualizadoEm ? ` · atualizado ${relTempo(resumo.atualizadoEm)}` : ''}`}
          </span>
        )}
        {rota && (
          <button className="ger-wg-abrir" onClick={() => aoAbrir(rota)}>
            Abrir <ArrowRight size={12} aria-hidden />
          </button>
        )}
      </footer>
    </article>
  );
}
