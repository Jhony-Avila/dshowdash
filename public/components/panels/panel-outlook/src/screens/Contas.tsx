// screens/Contas.tsx — gestão de contas Microsoft (conectar/reconectar/desconectar).
// @version 1.0.0  @created 2026-07-21
//
// Inicia o OAuth via POST /accounts/connect (o backend devolve authorize_url e o
// navegador é redirecionado à Microsoft). O callback volta ao SPA com
// ?outlook_auth=connected|error no hash — tratado aqui como aviso.
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiWrite, chaves, ApiError } from '../lib/api';
import type { OutlookStatus, OutlookAccount, ConnStatus, ConnectResponse } from '../shell/types';
import { dataRelativa, iniciais, corDeterministica } from '../lib/format';

const STATUS_META: Record<ConnStatus, { label: string; cls: string }> = {
  connected:    { label: 'Conectada',       cls: 'ok' },
  needs_auth:   { label: 'Reconectar',      cls: 'warn' },
  revoked:      { label: 'Acesso revogado', cls: 'danger' },
  expired:      { label: 'Expirada',        cls: 'warn' },
  error:        { label: 'Erro',            cls: 'danger' },
  disconnected: { label: 'Desconectada',    cls: 'dim' },
};

function lerAvisoDoHash(): string | null {
  const h = window.location.hash || '';
  const i = h.indexOf('?');
  if (i < 0) return null;
  const qs = new URLSearchParams(h.slice(i + 1));
  return qs.get('outlook_auth');
}

function limparAvisoDoHash() {
  const h = window.location.hash || '';
  const i = h.indexOf('?');
  if (i >= 0) window.location.hash = h.slice(0, i);
}

export function Contas({ status }: { status?: OutlookStatus }) {
  const qc = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<number | 'connect' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const a = lerAvisoDoHash();
    if (a) {
      setAviso(a === 'connected' ? 'ok' : 'erro');
      limparAvisoDoHash();
      qc.invalidateQueries({ queryKey: chaves.status });
    }
  }, [qc]);

  const contas = status?.accounts ?? [];
  const podeConectar = !!status?.oauth_configured && !!status?.db_ready;

  const recarregar = () => qc.invalidateQueries({ queryKey: chaves.status });

  async function conectar() {
    setErro(null);
    setOcupado('connect');
    try {
      const returnTo = '#/panel-outlook/contas';
      const { data } = await apiWrite<ConnectResponse>('/accounts/connect', 'POST', { return_to: returnTo });
      if (data?.authorize_url) {
        window.location.assign(data.authorize_url);
        return; // navega para fora
      }
      setErro('O servidor não retornou a URL de autorização.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao iniciar a conexão.');
    } finally {
      setOcupado(null);
    }
  }

  async function reconectar(id: number) {
    setErro(null);
    setOcupado(id);
    try {
      const { data } = await apiWrite<ConnectResponse>(`/accounts/${id}/reconnect`, 'POST', { return_to: '#/panel-outlook/contas' });
      if (data?.authorize_url) { window.location.assign(data.authorize_url); return; }
      setErro('O servidor não retornou a URL de autorização.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao reconectar.');
    } finally {
      setOcupado(null);
    }
  }

  async function desconectar(id: number) {
    if (!window.confirm('Desconectar esta conta? Os tokens serão removidos; nenhum e-mail é apagado no Outlook.')) return;
    setErro(null);
    setOcupado(id);
    try {
      await apiWrite(`/accounts/${id}`, 'DELETE');
      recarregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao desconectar.');
    } finally {
      setOcupado(null);
    }
  }

  async function tornarPadrao(id: number) {
    setErro(null);
    setOcupado(id);
    try {
      await apiWrite(`/accounts/${id}`, 'PATCH', { is_default: true });
      recarregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao definir conta padrão.');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="ol-page">
      <header className="ol-page-head">
        <div>
          <h1 className="ol-h1">Contas</h1>
          <p className="ol-sub">Conecte contas Microsoft 365 ou pessoais. Cada conta é sua e isolada — ninguém mais vê seus e-mails.</p>
        </div>
        <button className="ol-btn ol-btn-primary" onClick={conectar} disabled={!podeConectar || ocupado === 'connect'}
          title={podeConectar ? 'Conectar uma conta Microsoft' : 'Disponível quando a configuração do módulo concluir'}>
          {ocupado === 'connect' ? 'Redirecionando…' : '+ Conectar conta Microsoft'}
        </button>
      </header>

      {aviso === 'ok' && (
        <div className="ol-alert ol-alert-ok">Conta conectada com sucesso.</div>
      )}
      {aviso === 'erro' && (
        <div className="ol-alert ol-alert-danger">Não foi possível concluir a autorização. Tente novamente.</div>
      )}
      {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}
      {!podeConectar && (
        <div className="ol-alert ol-alert-info">
          {status && !status.oauth_configured
            ? 'A integração com a Microsoft ainda não foi ativada (registro do app no Azure pendente).'
            : 'O armazenamento do módulo ainda está sendo provisionado.'}
        </div>
      )}

      {contas.length === 0 ? (
        <div className="ol-empty">
          <div className="ol-empty-icon" aria-hidden>📭</div>
          <h2 className="ol-empty-title">Nenhuma conta conectada</h2>
          <p className="ol-empty-desc">Conecte sua primeira conta Microsoft para ver e enviar e-mails aqui.</p>
          <button className="ol-btn ol-btn-primary" onClick={conectar} disabled={!podeConectar || ocupado === 'connect'}>
            + Conectar conta Microsoft
          </button>
        </div>
      ) : (
        <div className="ol-acc-list">
          {contas.map((c) => <CartaoConta key={c.id} conta={c}
            ocupado={ocupado === c.id}
            onReconectar={() => reconectar(c.id)}
            onDesconectar={() => desconectar(c.id)}
            onPadrao={() => tornarPadrao(c.id)} />)}
        </div>
      )}
    </div>
  );
}

function CartaoConta({ conta, ocupado, onReconectar, onDesconectar, onPadrao }: {
  conta: OutlookAccount;
  ocupado: boolean;
  onReconectar: () => void;
  onDesconectar: () => void;
  onPadrao: () => void;
}) {
  const meta = STATUS_META[conta.connection_status] ?? STATUS_META.error;
  const nome = conta.display_name || conta.email || 'Conta Microsoft';
  const tipoLabel = conta.account_type === 'work' ? 'Corporativa'
    : conta.account_type === 'personal' ? 'Pessoal'
    : conta.account_type === 'shared' ? 'Compartilhada' : '—';
  const precisaAuth = conta.connection_status === 'needs_auth'
    || conta.connection_status === 'revoked' || conta.connection_status === 'expired';

  return (
    <div className={`ol-acc-card${conta.is_active ? '' : ' is-off'}`}>
      <div className="ol-acc-avatar" style={{ background: corDeterministica(conta.email) }}>
        {iniciais({ name: conta.display_name, address: conta.email })}
      </div>
      <div className="ol-acc-body">
        <div className="ol-acc-line1">
          <span className="ol-acc-name">{nome}</span>
          {conta.is_default && <span className="ol-tag ol-tag-default">Padrão</span>}
          <span className={`ol-pill ol-pill-${meta.cls}`}>{meta.label}</span>
        </div>
        <div className="ol-acc-line2">
          <span>{conta.email}</span>
          <span className="ol-dot-sep">·</span>
          <span>{tipoLabel}</span>
          {conta.last_success_at && (<>
            <span className="ol-dot-sep">·</span>
            <span>última sincronização {dataRelativa(conta.last_success_at)}</span>
          </>)}
        </div>
        {precisaAuth && conta.last_error_message && (
          <div className="ol-acc-err">{conta.last_error_message}</div>
        )}
      </div>
      <div className="ol-acc-actions">
        {precisaAuth ? (
          <button className="ol-btn ol-btn-warn" onClick={onReconectar} disabled={ocupado}>Reconectar</button>
        ) : (
          !conta.is_default && conta.is_active && (
            <button className="ol-btn ol-btn-ghost" onClick={onPadrao} disabled={ocupado}>Tornar padrão</button>
          )
        )}
        {conta.is_active && (
          <button className="ol-btn ol-btn-ghost ol-btn-danger" onClick={onDesconectar} disabled={ocupado}>Desconectar</button>
        )}
      </div>
    </div>
  );
}
