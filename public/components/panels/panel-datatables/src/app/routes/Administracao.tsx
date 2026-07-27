// app/routes/Administracao.tsx — Administração no padrão de Elevação Visual.
// @version 3.0.0  @updated 2026-07-20
// Estrutura: cards de resumo → canais (cards) → limites/regras/silêncios/cron
// TODOS em AppDataGrid (nada de <table> HTML), com menu ⋮ por linha.
// ⚠️ `delivery_implemented`: só "app" e "webhook" entregam de verdade.
// ⚠️ Frequências vêm do /etc/cron.d REAL (só leitura).
import { useState, type JSX, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtRelativo } from '../../lib/format';
import { Badge } from '../../components/ui/Badge';
import { MetricCard } from '../../components/ui/MetricCard';
import { Icone } from '../../components/ui/Icone';
import { DataGrid } from '../../components/grid/DataGrid';
import type { ColunaDef, ItemMenuLinha } from '../../components/grid/tipos';
import { ErrorState, Skeleton } from '../../components/ui/Estados';
import { LimiteForm, RegraForm, SilencioForm, CanalForm, type ConexaoOpt, type Catalogo, type CanalEdit } from './forms/AdminForms';
import css from './Administracao.module.css';

interface Limite { id: number; label: string; unit: string; help: string; metric_key: string; warn_value: string | null; critical_value: string | null; connection_name: string | null; is_global: boolean; is_active: boolean }
interface Regra { id: number; alert_type: string; label: string; severity: string; is_enabled: boolean; connection_name: string | null; min_interval_sec: number; recipients: string | null }
interface Canal { id: number; channel_key: string; label: string; is_enabled: boolean; has_secret: boolean; delivery_implemented: boolean; testable: boolean; last_ok_at: string | null; last_error: string | null; config: Record<string, unknown> }
interface Silencio { id: number; scope: string; kind: string; reason: string | null; daily_from: string | null; daily_to: string | null; starts_at: string | null; ends_at: string | null; created_by: string | null }
interface Schedule { cron: string; user: string; mode: string; human: string }
interface Dados {
  limits: Limite[]; rules: Regra[]; channels: Canal[]; silences: Silencio[];
  schedules: { file: string; readable: boolean; entries: Schedule[] };
  connections: ConexaoOpt[]; catalog: Catalogo;
}
type FormAberto = { tipo: 'limite' } | { tipo: 'regra' } | { tipo: 'silencio' } | { tipo: 'canal'; canal: CanalEdit } | null;

export function Administracao(): JSX.Element {
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [form, setForm] = useState<FormAberto>(null);

  const q = useQuery({ queryKey: ['dt', 'admin'], queryFn: ({ signal }) => apiGet<Dados>('/admin', undefined, signal) });

  const testar = useMutation({
    mutationFn: (id: number) => apiWrite<{ delivered: boolean; status_code?: number }>('/admin/test-webhook', 'POST', { channel_id: id }),
    onSuccess: (r) => setAviso({ ok: !!r.data.delivered, texto: r.data.delivered ? `Webhook entregue (HTTP ${r.data.status_code ?? '2xx'}).` : 'Webhook não confirmou entrega.' }),
    onError: (e: ApiError) => setAviso({ ok: false, texto: `Falha no teste: ${e.message}` }),
  });
  const excluir = useMutation({
    mutationFn: ({ tipo, id }: { tipo: 'limits' | 'rules' | 'silences'; id: number }) => apiWrite(`/admin/${tipo}/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dt', 'admin'] }),
    onError: (e: ApiError) => setAviso({ ok: false, texto: `Falha ao excluir: ${e.message}` }),
  });

  if (q.isPending) return <Skeleton linhas={8} altura={26} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar a administração." codigo={e.code} onRetry={() => q.refetch()} />;
  }
  const { limits, rules, channels, silences, schedules, connections, catalog } = q.data;
  const entregam = channels.filter((c) => c.delivery_implemented && c.is_enabled).length;

  const colLimites: ColunaDef<Limite>[] = [
    { id: 'metrica', cabecalho: 'Métrica', icone: 'SlidersHorizontal', largura: 'minmax(200px,1.2fr)', obrigatoria: true,
      celula: (l) => <span className={css.metrica} title={l.help}>{l.label}</span> },
    { id: 'escopo', cabecalho: 'Escopo', icone: 'PlugZap', largura: 'minmax(150px,1fr)',
      celula: (l) => l.is_global ? <Badge texto="global" tom="info" icone="Globe" fraco /> : <span className={css.mono}>{l.connection_name}</span> },
    { id: 'warn', cabecalho: 'Atenção', largura: '120px', alinhamento: 'fim',
      celula: (l) => <span className={css.num}>{l.warn_value !== null ? `${Number(l.warn_value)}${l.unit}` : '—'}</span> },
    { id: 'crit', cabecalho: 'Crítico', largura: '120px', alinhamento: 'fim',
      celula: (l) => <span className={css.num}>{l.critical_value !== null ? `${Number(l.critical_value)}${l.unit}` : '—'}</span> },
    { id: 'estado', cabecalho: 'Estado', largura: '110px',
      celula: (l) => l.is_active ? <Badge texto="ativo" tom="ok" icone="CircleCheck" fraco /> : <Badge texto="inativo" tom="neutro" fraco /> },
  ];
  const menuLimite = (l: Limite): ItemMenuLinha<Limite>[] => [
    { rotulo: 'Remover limite', icone: 'X', perigo: true,
      aoClicar: () => { if (confirm(`Remover o limite de "${l.label}"? Volta a valer o padrão global.`)) excluir.mutate({ tipo: 'limits', id: l.id }); } },
  ];

  const colRegras: ColunaDef<Regra>[] = [
    { id: 'evento', cabecalho: 'Evento', icone: 'BellRing', largura: 'minmax(200px,1.3fr)', obrigatoria: true, celula: (r) => r.label },
    { id: 'severidade', cabecalho: 'Severidade', largura: '130px',
      celula: (r) => <Badge texto={r.severity} tom={r.severity === 'critico' ? 'alerta' : r.severity === 'atencao' ? 'atencao' : 'neutro'}
        icone={r.severity === 'critico' ? 'CircleX' : r.severity === 'atencao' ? 'TriangleAlert' : 'CircleHelp'} /> },
    { id: 'escopo', cabecalho: 'Escopo', icone: 'PlugZap', largura: 'minmax(150px,1fr)',
      celula: (r) => r.connection_name ? <span className={css.mono}>{r.connection_name}</span> : <Badge texto="global" tom="info" icone="Globe" fraco /> },
    { id: 'antiflood', cabecalho: 'Anti-flood', icone: 'Clock', largura: '110px', alinhamento: 'fim',
      celula: (r) => <span className={css.num}>{Math.round(r.min_interval_sec / 60)} min</span> },
    { id: 'estado', cabecalho: 'Estado', largura: '120px',
      celula: (r) => r.is_enabled ? <Badge texto="ativa" tom="ok" icone="CircleCheck" fraco /> : <Badge texto="desativada" tom="neutro" fraco /> },
  ];
  const menuRegra = (r: Regra): ItemMenuLinha<Regra>[] => [
    { rotulo: 'Remover regra', icone: 'X', perigo: true, aoClicar: () => { if (confirm(`Remover a regra "${r.label}"?`)) excluir.mutate({ tipo: 'rules', id: r.id }); } },
  ];

  const colSilencios: ColunaDef<Silencio>[] = [
    { id: 'scope', cabecalho: 'Escopo', icone: 'BellOff', largura: 'minmax(220px,1.4fr)', obrigatoria: true, celula: (s) => <span>{s.scope}</span> },
    { id: 'tipo', cabecalho: 'Tipo', largura: '120px',
      celula: (s) => <Badge texto={s.kind === 'diario' ? 'diário' : 'intervalo'} tom="info" fraco icone={s.kind === 'diario' ? 'Clock' : 'CalendarClock'} /> },
    { id: 'janela', cabecalho: 'Janela', icone: 'Clock', largura: 'minmax(160px,1fr)',
      celula: (s) => <span className={css.mono}>{s.kind === 'diario'
        ? `${s.daily_from?.slice(0, 5)}–${s.daily_to?.slice(0, 5)}`
        : `${s.starts_at ? fmtRelativo(s.starts_at) : '—'} → ${s.ends_at ? fmtRelativo(s.ends_at) : '—'}`}</span> },
    { id: 'motivo', cabecalho: 'Motivo', icone: 'FileText', largura: 'minmax(150px,1fr)',
      celula: (s) => <span className={css.discreto}>{s.reason || '—'}</span> },
  ];
  const menuSilencio = (s: Silencio): ItemMenuLinha<Silencio>[] => [
    { rotulo: 'Encerrar janela', icone: 'X', perigo: true, aoClicar: () => { if (confirm('Encerrar esta janela de silêncio?')) excluir.mutate({ tipo: 'silences', id: s.id }); } },
  ];

  const colCron: ColunaDef<Schedule>[] = [
    { id: 'rotina', cabecalho: 'Rotina', icone: 'CalendarClock', largura: 'minmax(140px,1fr)', obrigatoria: true, celula: (e) => <span className={css.mono}>{e.mode}</span> },
    { id: 'cron', cabecalho: 'Agenda (cron)', icone: 'Clock', largura: 'minmax(160px,1fr)', celula: (e) => <span className={css.mono}>{e.cron}</span> },
    { id: 'human', cabecalho: 'Descrição', largura: 'minmax(200px,1.4fr)', celula: (e) => <span className={css.discreto}>{e.human}</span> },
  ];

  return (
    <div className={css.raiz}>
      {aviso && (
        <div className={`${css.aviso} ${aviso.ok ? css.avisoOk : css.avisoErro}`}>
          <Icone nome={aviso.ok ? 'CircleCheck' : 'TriangleAlert'} size={14} />{aviso.texto}
        </div>
      )}

      <section className={css.cards}>
        <MetricCard icone="Send" rotulo="Canais entregando" valor={entregam} tom={entregam > 0 ? 'ok' : 'atencao'} contexto={`de ${channels.length} configurados`} />
        <MetricCard icone="SlidersHorizontal" rotulo="Limites" valor={limits.length} contexto="atenção/crítico" />
        <MetricCard icone="BellRing" rotulo="Regras de alerta" valor={rules.length} contexto="eventos monitorados" />
        <MetricCard icone="BellOff" rotulo="Silêncios ativos" valor={silences.length} tom={silences.length > 0 ? 'atencao' : 'neutro'} contexto="envio suspenso" />
      </section>

      <Secao icone="Send" titulo="Canais de alerta" sub="por onde os alertas são entregues">
        <div className={css.canais}>
          {channels.map((ch) => (
            <div key={ch.id} className={css.canal} data-off={!ch.delivery_implemented}>
              <div className={css.canalTopo}>
                <span className={css.canalIcone}><Icone nome={ch.channel_key === 'webhook' ? 'Webhook' : ch.channel_key === 'app' ? 'BellRing' : 'AtSign'} size={15} /></span>
                <strong>{ch.label}</strong>
                {ch.is_enabled ? <Badge texto="ligado" tom="ok" fraco /> : <Badge texto="desligado" tom="neutro" fraco />}
              </div>
              {ch.delivery_implemented
                ? <span className={css.entrega}><Icone nome="Check" size={11} /> entrega implementada</span>
                : <span className={css.semEntrega}><Icone nome="TriangleAlert" size={11} /> configurável, mas NÃO entrega ainda</span>}
              {ch.last_error && <span className={css.erro} title={ch.last_error}>último erro: {ch.last_error}</span>}
              {ch.last_ok_at && <span className={css.discreto}>ok {fmtRelativo(ch.last_ok_at)}</span>}
              <div className={css.canalAcoes}>
                <button type="button" className={css.btnCanal}
                  onClick={() => setForm({ tipo: 'canal', canal: { id: ch.id, channel_key: ch.channel_key, label: ch.label, is_enabled: ch.is_enabled } })}>
                  <Icone nome="SlidersHorizontal" size={12} /> Editar
                </button>
                {ch.testable && (
                  <button type="button" className={css.btnCanal} disabled={testar.isPending} onClick={() => testar.mutate(ch.id)}>
                    <Icone nome="Send" size={12} /> Testar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icone="SlidersHorizontal" titulo="Limites" sub="valores que disparam atenção/crítico"
        acao={<BotaoNovo rotulo="Novo limite" onClick={() => setForm({ tipo: 'limite' })} />}>
        <DataGrid<Limite> rotulo="Limites" colunas={colLimites} linhas={limits} idLinha={(l) => l.id} menuLinha={menuLimite}
          vazio={{ titulo: 'Nenhum limite específico', descricao: 'Sem limites por conexão — valem os padrões globais.' }} />
      </Secao>

      <Secao icone="BellRing" titulo="Regras de alerta" sub="quais eventos geram alerta e com que severidade"
        acao={<BotaoNovo rotulo="Nova regra" onClick={() => setForm({ tipo: 'regra' })} />}>
        <DataGrid<Regra> rotulo="Regras de alerta" colunas={colRegras} linhas={rules} idLinha={(r) => r.id} menuLinha={menuRegra}
          vazio={{ titulo: 'Nenhuma regra específica', descricao: 'Sem regras por conexão — valem os padrões do sistema.' }} />
      </Secao>

      <Secao icone="BellOff" titulo="Janelas de silêncio" sub="períodos em que o alerta não notifica"
        acao={<BotaoNovo rotulo="Nova janela" onClick={() => setForm({ tipo: 'silencio' })} />}>
        <DataGrid<Silencio> rotulo="Janelas de silêncio" colunas={colSilencios} linhas={silences} idLinha={(s) => s.id} menuLinha={menuSilencio}
          vazio={{ titulo: 'Nenhuma janela de silêncio ativa', descricao: 'Os alertas notificam normalmente em qualquer horário.' }} />
      </Secao>

      <Secao icone="CalendarClock" titulo="Frequências das rotinas" sub={`lido de ${schedules.file}`}>
        {!schedules.readable ? (
          <p className={css.vazio}>Arquivo de cron não legível pelo processo web (esperado em produção).</p>
        ) : (
          <DataGrid<Schedule> rotulo="Frequências das rotinas" colunas={colCron} linhas={schedules.entries} idLinha={(e) => `${e.mode}-${e.cron}`}
            vazio={{ titulo: 'Nenhuma rotina agendada', descricao: 'Nada em /etc/cron.d/datatables.' }} />
        )}
        <p className={css.notaCron}>
          <Icone nome="Clock" size={11} /> Só leitura: a frequência real vive no crontab do servidor — gravá-la num banco que não altera o cron seria decorativo.
        </p>
      </Secao>

      {form?.tipo === 'limite' && <LimiteForm conns={connections} catalog={catalog} aberto aoFechar={() => setForm(null)} />}
      {form?.tipo === 'regra' && <RegraForm conns={connections} catalog={catalog} aberto aoFechar={() => setForm(null)} />}
      {form?.tipo === 'silencio' && <SilencioForm conns={connections} catalog={catalog} aberto aoFechar={() => setForm(null)} />}
      {form?.tipo === 'canal' && <CanalForm canal={form.canal} aberto aoFechar={() => setForm(null)} />}
    </div>
  );
}

function Secao({ icone, titulo, sub, acao, children }: { icone: string; titulo: string; sub?: string; acao?: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <section className={css.secao}>
      <header className={css.secaoTopo}>
        <span className={css.secaoIcone}><Icone nome={icone} size={15} /></span>
        <div className={css.secaoTexto}>
          <h2 className={css.secaoTitulo}>{titulo}</h2>
          {sub && <span className={css.secaoSub}>{sub}</span>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

function BotaoNovo({ onClick, rotulo }: { onClick: () => void; rotulo: string }): JSX.Element {
  return <button type="button" className={css.novo} onClick={onClick}><Icone nome="SlidersHorizontal" size={13} /> {rotulo}</button>;
}
