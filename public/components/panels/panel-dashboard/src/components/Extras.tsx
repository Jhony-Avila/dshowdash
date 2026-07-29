// components/Extras.tsx — widgets da Home: agenda (§17), e-mails (§18),
// trânsito (§19) e insights por regras (§22).
// @version 3.0.0  @created 2026-07-29
import {
  ArrowRight, CalendarDays, Car, CheckSquare, Clock3, Lightbulb, Mail,
} from 'lucide-react';
import type { AgendaItem, Insight, ResumoEmails, ResumoTransito } from '../domain/types';
import { ErroWidget, Secao, SeloSimulado, Skeleton, relTempo } from './ui';

// ── Agenda (§17) ────────────────────────────────────────────────────
export function AgendaWidget({ itens, carregando }: { itens: AgendaItem[] | null; carregando: boolean }) {
  return (
    <Secao titulo="Agenda de hoje" sub="compromissos e tarefas"
      acoes={<CalendarDays size={15} aria-hidden />}>
      {carregando && !itens ? <Skeleton altura={140} /> : (itens ?? []).length === 0 ? (
        <p className="ger-vazio-inline">Não há compromissos para hoje.</p>
      ) : (
        <div className="ger-agenda">
          {(itens ?? []).map((a) => (
            <div key={a.id} className={`ger-agenda-item${a.atrasado ? ' is-atrasado' : ''}`}>
              <span className="ger-agenda-hora">{a.hora}</span>
              <span className="ger-agenda-ic" aria-hidden>
                {a.tipo === 'tarefa' ? <CheckSquare size={13} /> : <Clock3 size={13} />}
              </span>
              <span className="ger-agenda-titulo">{a.titulo} <SeloSimulado /></span>
              {a.atrasado && <span className="ger-agenda-flag">atrasado</span>}
            </div>
          ))}
        </div>
      )}
      <p className="ger-nota-widget">A integração com o calendário do Outlook substitui estes dados de demonstração.</p>
    </Secao>
  );
}

// ── E-mails (§18) ───────────────────────────────────────────────────
export function EmailsWidget({ resumo, carregando, aoAbrir }: {
  resumo: ResumoEmails | null; carregando: boolean; aoAbrir: () => void;
}) {
  return (
    <Secao titulo="E-mails" sub="resumo da caixa de entrada"
      acoes={<Mail size={15} aria-hidden />}>
      {carregando && !resumo ? <Skeleton altura={120} /> : resumo && (
        <>
          <div className="ger-emails">
            <div className="ger-email-m"><strong>{resumo.naoLidos}</strong><span>não lidos</span></div>
            <div className="ger-email-m"><strong className="ger-warn-txt">{resumo.importantes}</strong><span>importantes</span></div>
            <div className="ger-email-m"><strong>{resumo.aguardandoResposta}</strong><span>aguardando resposta</span></div>
            <div className="ger-email-m"><strong>{resumo.recebidosHoje}</strong><span>recebidos hoje</span></div>
          </div>
          <button className="ger-wg-abrir" onClick={aoAbrir}>
            Abrir caixa de entrada <ArrowRight size={12} aria-hidden />
          </button>
          {resumo.simulado && <p className="ger-nota-widget">Dados de demonstração <SeloSimulado /> — a integração real usa o Outlook conectado.</p>}
        </>
      )}
    </Secao>
  );
}

// ── Trânsito (§19) ──────────────────────────────────────────────────
const NIVEL_ROTULO: Record<ResumoTransito['nivel'], string> = {
  normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível',
};

export function TrafficWidget({ transito, carregando, erro, aoTentar, aoAbrir }: {
  transito: ResumoTransito | null; carregando: boolean; erro: boolean;
  aoTentar: () => void; aoAbrir: () => void;
}) {
  return (
    <Secao titulo="Trânsito em São Paulo" sub="mesma fonte do indicador do header"
      acoes={<Car size={15} aria-hidden />}>
      {carregando && !transito ? <Skeleton altura={130} /> : erro && !transito ? (
        <ErroWidget mensagem="Não foi possível consultar o trânsito." onTentar={aoTentar} />
      ) : transito && (
        <>
          <div className={`ger-transito ger-transito-${transito.nivel}`}>
            <div className="ger-transito-indice">
              <strong>{transito.indice === null ? '—' : transito.indice}</strong>
              <span>/100</span>
            </div>
            <div className="ger-transito-corpo">
              <strong>{NIVEL_ROTULO[transito.nivel]}</strong>
              <span>{transito.km === null ? 'sem estimativa de lentidão' : `${transito.km} km de lentidão`}</span>
              <span>{transito.ocorrencias ?? 0} ocorrências · {transito.interdicoes} interdições</span>
            </div>
          </div>
          {transito.indice !== null && (
            <div className="ger-transito-barra" aria-hidden>
              <span style={{ width: `${Math.min(100, transito.indice)}%` }} />
            </div>
          )}
          <div className="ger-transito-foot">
            <span>{transito.atualizadoEm ? `atualizado ${relTempo(transito.atualizadoEm)}` : ''}
              {transito.desatualizado ? ' · desatualizado' : ''}</span>
            <button className="ger-wg-abrir" onClick={aoAbrir}>
              Abrir painel de Trânsito <ArrowRight size={12} aria-hidden />
            </button>
          </div>
        </>
      )}
    </Secao>
  );
}

// ── Insights (§22) ──────────────────────────────────────────────────
export function InsightsPanel({ insights, carregando, aoAbrir }: {
  insights: Insight[] | null; carregando: boolean; aoAbrir: (rota: string) => void;
}) {
  return (
    <Secao titulo="Insights e recomendações" sub="gerados por regras sobre os dados dos módulos — nunca sem evidência"
      acoes={<Lightbulb size={15} aria-hidden />}>
      {carregando && !insights ? <Skeleton altura={180} /> : (insights ?? []).length === 0 ? (
        <p className="ger-vazio-inline">Nenhum insight relevante agora — tudo dentro do esperado.</p>
      ) : (
        <div className="ger-insights">
          {(insights ?? []).map((i) => (
            <article key={i.id} className={`ger-insight ger-insight-${i.tom}`}>
              <header>
                <strong>{i.conclusao}</strong>
                <span className="ger-insight-mod">{i.modulo} {i.simulado && <SeloSimulado />}</span>
              </header>
              <p><em>Evidência:</em> {i.evidencia}</p>
              <p><em>Impacto:</em> {i.impacto}</p>
              <p><em>Recomendação:</em> {i.recomendacao}</p>
              {i.rota && (
                <button className="ger-wg-abrir" onClick={() => aoAbrir(i.rota!)}>
                  Abrir análise <ArrowRight size={12} aria-hidden />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </Secao>
  );
}
