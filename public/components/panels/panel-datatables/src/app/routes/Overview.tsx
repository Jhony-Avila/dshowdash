// app/routes/Overview.tsx — TELA DE REFERÊNCIA da Elevação Visual.
// @version 2.0.0  @updated 2026-07-20
//
// Estrutura padrão: (PageHeader vem do shell) → cards de resumo → resumo de
// saúde → visão por ambiente (barras) → pendências + conexões com problema.
// Cada bloco isolado por ErrorBoundary; um widget que falha não derruba a tela.
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../../lib/api';
import { fmtInt, fmtRelativo } from '../../lib/format';
import { ErrorBoundary } from '../../shell/ErrorBoundary';
import { HealthBanner } from '../../components/ui/HealthBanner';
import { MetricCard } from '../../components/ui/MetricCard';
import { TopProblemas } from '../../components/ui/TopProblemas';
import { AtividadeRecente } from '../../components/ui/AtividadeRecente';
import { Tendencia } from '../../components/ui/Tendencia';
import { Revelar } from '../../components/ui/Revelar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { Skeleton, SkeletonCartoes, EmptyState, ErrorState } from '../../components/ui/Estados';
import css from './Overview.module.css';

interface Dashboard {
  counters: Record<string, number>;
  environments: Array<{ id: number; label: string; color: string; databases: number; tables: number; connections: number }>;
  problems: Array<{ id: number; name: string; status: string; environment_label: string | null;
                    step_failed: string | null; last_check_at: string | null; last_error: string | null }>;
  pending: Record<string, number>;
}

export function Overview({ ir }: { ir: (r: { grupo: string; tela: string }) => void }): JSX.Element {
  const q = useQuery({
    queryKey: chaves.dashboard,
    queryFn: ({ signal }) => apiGet<Dashboard>('/dashboard', undefined, signal),
  });

  if (q.isPending) {
    return <div className={css.raiz}><Skeleton linhas={2} altura={46} /><SkeletonCartoes n={8} /></div>;
  }
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState
      mensagem={e.ehAuth ? 'Sua sessão expirou. Recarregue a página para entrar novamente.'
                         : 'Não foi possível carregar o panorama da infraestrutura.'}
      codigo={e.code} onRetry={e.ehAuth ? undefined : () => q.refetch()} />;
  }

  const c = q.data.counters;
  const pend = q.data.pending;
  const comProblema = (c.offline ?? 0) + (c.cred_expired ?? 0) + (c.unstable ?? 0);

  return (
    <div className={css.raiz}>
      <ErrorBoundary variant="widget" label="o resumo de saúde">
        <HealthBanner
          online={c.online ?? 0} offline={c.offline ?? 0} instaveis={c.unstable ?? 0}
          alertasCriticos={c.critical_alerts ?? 0}
          alertasAtencao={(c.active_alerts ?? 0) - (c.critical_alerts ?? 0)}
          problemasQualidade={c.quality_issues ?? 0}
          ultimaVerificacao={q.data.problems[0]?.last_check_at ?? null} />
      </ErrorBoundary>

      <ErrorBoundary variant="widget" label="os indicadores">
        <section className={css.cards}>
          <MetricCard icone="Server" rotulo="Servidores" valor={c.servers} contexto="cadastrados"
            onClick={() => ir({ grupo: 'infrastructure', tela: 'servers' })} />
          <MetricCard icone="Database" rotulo="Bancos" valor={c.databases} contexto={`${fmtInt(c.tables)} tabelas`}
            onClick={() => ir({ grupo: 'infrastructure', tela: 'databases' })} />
          <MetricCard icone="PlugZap" rotulo="Conexões online" valor={c.online} tom="ok"
            contexto={`de ${fmtInt(c.connections)} ativas`}
            onClick={() => ir({ grupo: 'infrastructure', tela: 'connections' })} />
          <MetricCard icone="CircleX" rotulo="Com problema" valor={comProblema}
            tom={comProblema > 0 ? 'alerta' : 'ok'} contexto="offline, instáveis ou credencial"
            onClick={() => ir({ grupo: 'infrastructure', tela: 'connections' })} />
          <MetricCard icone="TableProperties" rotulo="Tabelas" valor={c.tables} contexto={`${fmtInt(c.fields)} campos`}
            onClick={() => ir({ grupo: 'data', tela: 'tables' })} />
          <MetricCard icone="Gauge" rotulo="Qualidade" valor={c.quality_issues}
            tom={(c.quality_issues ?? 0) > 0 ? 'atencao' : 'ok'} contexto="em aberto"
            onClick={() => ir({ grupo: 'observability', tela: 'quality' })} />
          <MetricCard icone="ShieldAlert" rotulo="Campos sensíveis" valor={c.sensitive_fields}
            tom={(c.sensitive_fields ?? 0) > 0 ? 'atencao' : 'neutro'} contexto="indício por metadado"
            onClick={() => ir({ grupo: 'data', tela: 'sensitive' })} />
          <MetricCard icone="BellRing" rotulo="Alertas ativos" valor={c.active_alerts}
            tom={(c.critical_alerts ?? 0) > 0 ? 'alerta' : (c.active_alerts ?? 0) > 0 ? 'atencao' : 'ok'}
            contexto={`${fmtInt(c.critical_alerts)} crítico(s)`}
            onClick={() => ir({ grupo: 'observability', tela: 'alerts' })} />
        </section>
      </ErrorBoundary>

      <div className={css.duasColunas}>
        <ErrorBoundary variant="widget" label="a distribuição por ambiente">
          <Bloco icone="Network" titulo="Distribuição por ambiente"
                 acao={<Badge texto={`${q.data.environments.length} ambientes`} tom="info" fraco />}>
            <div className={css.ambientes}>
              {(() => {
                const max = Math.max(1, ...q.data.environments.map((e) => e.tables));
                return q.data.environments.map((e) => (
                  <div key={e.id} className={css.ambiente}>
                    <span className={css.ambienteDot} style={{ background: e.color }} aria-hidden="true" />
                    <span className={css.ambienteNome}>{e.label}</span>
                    <span className={css.ambienteBarraWrap}>
                      <span className={css.ambienteBarra}
                            style={{ width: `${(e.tables / max) * 100}%`, background: e.color }} />
                    </span>
                    <span className={css.ambienteNum}>
                      {fmtInt(e.databases)} <em>bancos</em> · {fmtInt(e.tables)} <em>tabelas</em>
                    </span>
                  </div>
                ));
              })()}
            </div>
          </Bloco>
        </ErrorBoundary>

        <ErrorBoundary variant="widget" label="as pendências estruturais">
          <Bloco icone="ListChecks" titulo="Pendências estruturais">
            <ul className={css.pendencias}>
              <Pendencia icone="FileText" rotulo="Tabelas sem comentário" valor={pend.tables_no_comment} />
              <Pendencia icone="GitBranch" rotulo="Tabelas órfãs" valor={pend.orphan_tables} nota="sinal, não problema" tom="info" />
              <Pendencia icone="KeyRound" rotulo="Sem chave primária" valor={pend.tables_no_pk} alerta />
              <Pendencia icone="TriangleAlert" rotulo="Chaves estrangeiras quebradas" valor={pend.broken_fks} alerta />
              <Pendencia icone="Sparkles" rotulo="Novas nos últimos 7 dias" valor={pend.new_tables_7d} tom="ok" />
            </ul>
          </Bloco>
        </ErrorBoundary>
      </div>

      <Revelar atraso={80}>
        <div className={css.duasColunas}>
          <ErrorBoundary variant="widget" label="os principais problemas">
            <Bloco icone="ShieldAlert" titulo="Top problemas de qualidade"
                   acao={<Badge texto="por saúde da tabela" tom="info" fraco />}>
              <TopProblemas ir={ir} />
            </Bloco>
          </ErrorBoundary>
          <ErrorBoundary variant="widget" label="a atividade recente">
            <Bloco icone="Activity" titulo="Atividade recente"
                   acao={<Badge texto="alertas + manutenções" tom="neutro" fraco />}>
              <AtividadeRecente ir={ir} />
            </Bloco>
          </ErrorBoundary>
        </div>
      </Revelar>

      <Revelar atraso={120}>
        <ErrorBoundary variant="widget" label="a tendência de crescimento">
          <Bloco icone="TrendingUp" titulo="Tendência de crescimento"
                 acao={<Badge texto="maior banco" tom="info" fraco />}>
            <Tendencia />
          </Bloco>
        </ErrorBoundary>
      </Revelar>

      <ErrorBoundary variant="widget" label="as conexões com problema">
        <Bloco icone="PlugZap" titulo="Conexões com problema"
               acao={comProblema > 0
                 ? <Badge texto={`${fmtInt(comProblema)} afetada(s)`} tom="alerta" icone="TriangleAlert" />
                 : <Badge texto="tudo saudável" tom="ok" icone="CircleCheck" />}>
          {q.data.problems.length === 0 ? (
            <EmptyState icone="CircleCheck" titulo="Nenhuma conexão com problema"
              descricao="Todas as fontes monitoradas responderam normalmente na última verificação." />
          ) : (
            <ul className={css.problemas}>
              {q.data.problems.map((p) => (
                <li key={p.id} className={css.problema}
                    onClick={() => ir({ grupo: 'infrastructure', tela: 'connections' })}>
                  <StatusBadge status={p.status} />
                  <span className={css.problemaNome}>{p.name}</span>
                  {p.environment_label && <Badge texto={p.environment_label} tom="neutro" fraco />}
                  {p.step_failed && <span className={css.problemaEtapa}>falhou em: {p.step_failed}</span>}
                  <span className={css.problemaTempo}><Icone nome="Clock" size={11} /> {fmtRelativo(p.last_check_at)}</span>
                  <Icone nome="ChevronRight" size={14} className={css.problemaIr} />
                </li>
              ))}
            </ul>
          )}
        </Bloco>
      </ErrorBoundary>
    </div>
  );
}

function Bloco({ icone, titulo, acao, children }: { icone: string; titulo: string; acao?: JSX.Element; children: JSX.Element }): JSX.Element {
  return (
    <section className={css.bloco}>
      <header className={css.blocoTopo}>
        <span className={css.blocoIcone}><Icone nome={icone} size={14} /></span>
        <h2 className={css.blocoTitulo}>{titulo}</h2>
        {acao && <span className={css.blocoAcao}>{acao}</span>}
      </header>
      {children}
    </section>
  );
}

function Pendencia({ icone, rotulo, valor, nota, alerta, tom }: {
  icone: string; rotulo: string; valor?: number; nota?: string; alerta?: boolean; tom?: 'ok' | 'info';
}): JSX.Element {
  const n = valor ?? 0;
  const badgeTom = alerta && n > 0 ? 'alerta' : tom ?? 'neutro';
  return (
    <li className={css.pendencia}>
      <span className={css.pendIcone}><Icone nome={icone} size={13} /></span>
      <span className={css.pendenciaRotulo}>
        {rotulo}{nota && <em className={css.pendenciaNota}> — {nota}</em>}
      </span>
      <Badge texto={fmtInt(n)} tom={badgeTom} fraco />
    </li>
  );
}
