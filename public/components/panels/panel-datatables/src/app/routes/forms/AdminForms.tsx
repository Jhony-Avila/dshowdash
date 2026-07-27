// forms/AdminForms.tsx — escritas da Administração (§38.15).
// @version 1.0.0  @created 2026-07-20
// Limites, regras, silêncios (criar) e canal (editar). DELETE fica na tela.
import { useState, type JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiWrite, ApiError } from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Campo, Texto, Selecao, Interruptor, AcoesForm, Linha, ErroForm } from '../../../components/ui/Campo';

export interface ConexaoOpt { id: number; name: string }
export interface Catalogo {
  metrics: Record<string, { label: string; unit: string; help: string }>;
  alert_types: Record<string, string>;
}

function usarSalvar(aoFechar: () => void, setErro: (m: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dt', 'admin'] }); aoFechar(); },
    onError: (e: ApiError) => setErro(e.message),
  });
}

const optConns = (conns: ConexaoOpt[]) => conns.map((c) => ({ valor: String(c.id), rotulo: c.name }));

// ── LIMITE ──────────────────────────────────────────────────────
export function LimiteForm({ conns, catalog, aberto, aoFechar }: {
  conns: ConexaoOpt[]; catalog: Catalogo; aberto: boolean; aoFechar: () => void;
}): JSX.Element {
  const [erro, setErro] = useState<string | null>(null);
  const salvar = usarSalvar(aoFechar, setErro);
  const metricas = Object.entries(catalog.metrics).map(([k, v]) => ({ valor: k, rotulo: v.label }));
  const [f, setF] = useState({ connection_id: '', metric_key: metricas[0]?.valor ?? '', warn_value: '', critical_value: '' });
  const set = (k: keyof typeof f, v: string): void => setF((s) => ({ ...s, [k]: v }));

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault(); setErro(null);
    salvar.mutate(() => apiWrite('/admin/limits', 'POST', {
      connection_id: f.connection_id || null, metric_key: f.metric_key,
      warn_value: f.warn_value, critical_value: f.critical_value,
    }));
  };
  return (
    <Modal titulo="Novo limite" aberto={aberto} aoFechar={aoFechar}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Escopo">{(id) => <Selecao id={id} valor={f.connection_id} aoMudar={(v) => set('connection_id', v)} opcoes={optConns(conns)} placeholder="global (todas)" />}</Campo>
          <Campo rotulo="Métrica">{(id) => <Selecao id={id} valor={f.metric_key} aoMudar={(v) => set('metric_key', v)} opcoes={metricas} />}</Campo>
        </Linha>
        <Linha>
          <Campo rotulo="Atenção">{(id) => <Texto id={id} tipo="number" valor={f.warn_value} aoMudar={(v) => set('warn_value', v)} />}</Campo>
          <Campo rotulo="Crítico">{(id) => <Texto id={id} tipo="number" valor={f.critical_value} aoMudar={(v) => set('critical_value', v)} />}</Campo>
        </Linha>
        <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>Vale a partir do próximo ciclo de verificação.</p>
        <AcoesForm aoCancelar={aoFechar} salvando={salvar.isPending} />
      </form>
    </Modal>
  );
}

// ── REGRA ───────────────────────────────────────────────────────
export function RegraForm({ conns, catalog, aberto, aoFechar }: {
  conns: ConexaoOpt[]; catalog: Catalogo; aberto: boolean; aoFechar: () => void;
}): JSX.Element {
  const [erro, setErro] = useState<string | null>(null);
  const salvar = usarSalvar(aoFechar, setErro);
  const tipos = Object.entries(catalog.alert_types).map(([k, v]) => ({ valor: k, rotulo: v }));
  const [f, setF] = useState({ connection_id: '', alert_type: tipos[0]?.valor ?? '', severity: 'atencao', min_interval_sec: '3600', is_enabled: true });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]): void => setF((s) => ({ ...s, [k]: v }));

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault(); setErro(null);
    salvar.mutate(() => apiWrite('/admin/rules', 'POST', {
      connection_id: f.connection_id || null, alert_type: f.alert_type, severity: f.severity,
      min_interval_sec: Number(f.min_interval_sec) || 3600, is_enabled: f.is_enabled,
    }));
  };
  return (
    <Modal titulo="Nova regra de alerta" aberto={aberto} aoFechar={aoFechar} largura={620}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Escopo">{(id) => <Selecao id={id} valor={f.connection_id} aoMudar={(v) => set('connection_id', v)} opcoes={optConns(conns)} placeholder="global (todas)" />}</Campo>
          <Campo rotulo="Evento">{(id) => <Selecao id={id} valor={f.alert_type} aoMudar={(v) => set('alert_type', v)} opcoes={tipos} />}</Campo>
        </Linha>
        <Linha>
          <Campo rotulo="Severidade">{(id) => <Selecao id={id} valor={f.severity} aoMudar={(v) => set('severity', v)} opcoes={[{ valor: 'informativo', rotulo: 'informativo' }, { valor: 'atencao', rotulo: 'atenção' }, { valor: 'critico', rotulo: 'crítico' }]} />}</Campo>
          <Campo rotulo="Anti-flood (s)" dica="intervalo mín. entre envios">{(id) => <Texto id={id} tipo="number" valor={f.min_interval_sec} aoMudar={(v) => set('min_interval_sec', v)} />}</Campo>
          <Interruptor marcado={f.is_enabled} aoMudar={(v) => set('is_enabled', v)} rotulo="ativa" />
        </Linha>
        <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
          Desligar a regra faz o alerta <strong>nem ser registrado</strong>. Para só suprimir o envio, use uma janela de silêncio.
        </p>
        <AcoesForm aoCancelar={aoFechar} salvando={salvar.isPending} />
      </form>
    </Modal>
  );
}

// ── SILÊNCIO ────────────────────────────────────────────────────
export function SilencioForm({ conns, catalog, aberto, aoFechar }: {
  conns: ConexaoOpt[]; catalog: Catalogo; aberto: boolean; aoFechar: () => void;
}): JSX.Element {
  const [erro, setErro] = useState<string | null>(null);
  const salvar = usarSalvar(aoFechar, setErro);
  const tipos = [{ valor: '', rotulo: 'todos os tipos' }, ...Object.entries(catalog.alert_types).map(([k, v]) => ({ valor: k, rotulo: v }))];
  const [f, setF] = useState({ connection_id: '', alert_type: '', daily_from: '22:00', daily_to: '06:00', reason: '' });
  const set = (k: keyof typeof f, v: string): void => setF((s) => ({ ...s, [k]: v }));

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault(); setErro(null);
    salvar.mutate(() => apiWrite('/admin/silences', 'POST', {
      connection_id: f.connection_id || null, alert_type: f.alert_type || null,
      daily_from: f.daily_from ? f.daily_from + ':00' : null,
      daily_to: f.daily_to ? f.daily_to + ':00' : null, reason: f.reason.trim(),
    }));
  };
  return (
    <Modal titulo="Nova janela de silêncio" aberto={aberto} aoFechar={aoFechar} largura={620}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Escopo">{(id) => <Selecao id={id} valor={f.connection_id} aoMudar={(v) => set('connection_id', v)} opcoes={optConns(conns)} placeholder="todas as conexões" />}</Campo>
          <Campo rotulo="Tipo de alerta">{(id) => <Selecao id={id} valor={f.alert_type} aoMudar={(v) => set('alert_type', v)} opcoes={tipos} />}</Campo>
        </Linha>
        <Linha>
          <Campo rotulo="De">{(id) => <Texto id={id} tipo="time" valor={f.daily_from} aoMudar={(v) => set('daily_from', v)} />}</Campo>
          <Campo rotulo="Até">{(id) => <Texto id={id} tipo="time" valor={f.daily_to} aoMudar={(v) => set('daily_to', v)} />}</Campo>
          <Campo rotulo="Motivo">{(id) => <Texto id={id} valor={f.reason} aoMudar={(v) => set('reason', v)} />}</Campo>
        </Linha>
        <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
          Janela diária recorrente; cruzar a meia-noite é suportado (ex.: 22:00 → 06:00). O alerta continua sendo <strong>registrado</strong>; só o envio externo é suspenso.
        </p>
        <AcoesForm salvarRotulo="Criar janela" aoCancelar={aoFechar} salvando={salvar.isPending} />
      </form>
    </Modal>
  );
}

// ── CANAL (PATCH) ───────────────────────────────────────────────
export interface CanalEdit { id: number; channel_key: string; label: string; is_enabled: boolean }
export function CanalForm({ canal, aberto, aoFechar }: { canal: CanalEdit; aberto: boolean; aoFechar: () => void }): JSX.Element {
  const [erro, setErro] = useState<string | null>(null);
  const salvar = usarSalvar(aoFechar, setErro);
  const ehWebhook = canal.channel_key === 'webhook';
  const [f, setF] = useState({ label: canal.label, url: '', secret: '', is_enabled: canal.is_enabled });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]): void => setF((s) => ({ ...s, [k]: v }));

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault(); setErro(null);
    const payload: Record<string, unknown> = { label: f.label.trim(), is_enabled: f.is_enabled };
    if (f.secret !== '') payload.secret = f.secret;      // vazio = manter o atual
    if (f.url !== '') payload.config = { url: f.url.trim() };
    salvar.mutate(() => apiWrite(`/admin/channels/${canal.id}`, 'PATCH', payload));
  };
  return (
    <Modal titulo={`Editar canal — ${canal.label}`} aberto={aberto} aoFechar={aoFechar} largura={620}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Rótulo">{(id) => <Texto id={id} valor={f.label} aoMudar={(v) => set('label', v)} autoComplete="off" />}</Campo>
          <Interruptor marcado={f.is_enabled} aoMudar={(v) => set('is_enabled', v)} rotulo="habilitado" />
        </Linha>
        {ehWebhook && (
          <Linha>
            <Campo rotulo="URL do webhook" dica="vazio = manter a atual">{(id) => <Texto id={id} valor={f.url} aoMudar={(v) => set('url', v)} placeholder="https://…" autoComplete="off" />}</Campo>
          </Linha>
        )}
        <Linha>
          <Campo rotulo="Token/segredo" dica="em branco = manter o atual">{(id) => <Texto id={id} tipo="password" valor={f.secret} aoMudar={(v) => set('secret', v)} autoComplete="new-password" placeholder="••••••" />}</Campo>
        </Linha>
        {ehWebhook && (
          <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
            POST assinado com HMAC-SHA256 em <code>X-DataTables-Signature</code>. Use “testar” para validar sem esperar um incidente.
          </p>
        )}
        <AcoesForm aoCancelar={aoFechar} salvando={salvar.isPending} />
      </form>
    </Modal>
  );
}
