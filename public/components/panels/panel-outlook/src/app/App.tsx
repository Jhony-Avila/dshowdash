// app/App.tsx — raiz do painel Integração Outlook.
// @version 1.0.0  @created 2026-07-21
//
// Fase 1: shell com abas (§5) + navegação por hash em SEGMENTOS
// (#/panel-outlook/<aba>). Foco: E-mails (central 3 colunas) e Contas (OAuth).
// Dashboard/Modelos/Regras/Configurações entram como placeholders das próximas fases.
import { useEffect, useState } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient, apiGet, chaves } from '../lib/api';
import type { ShellConfig, OutlookStatus, EmailTemplate } from '../shell/types';
import { Emails } from '../screens/Emails';
import { Contas } from '../screens/Contas';
import { Dashboard } from '../screens/Dashboard';
import { Modelos } from '../screens/Modelos';
import { Regras } from '../screens/Regras';
import { Configuracoes } from '../screens/Configuracoes';
import '../styles/tokens.css';

const HASH_BASE = '#/panel-outlook';

type AbaId = 'emails' | 'dashboard' | 'modelos' | 'regras' | 'contas' | 'config';
const ABAS: { id: AbaId; label: string; icon: string }[] = [
  { id: 'emails',    label: 'E-mails',        icon: '✉️' },
  { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
  { id: 'modelos',   label: 'Modelos',        icon: '📝' },
  { id: 'regras',    label: 'Regras',         icon: '⚙️' },
  { id: 'contas',    label: 'Contas',         icon: '👤' },
  { id: 'config',    label: 'Configurações',  icon: '🔧' },
];

function lerAba(): AbaId {
  const h = window.location.hash || '';
  if (h.startsWith(HASH_BASE)) {
    const resto = h.slice(HASH_BASE.length).replace(/^\/+/, '');
    const seg = resto.split(/[/?]/)[0];
    const ok: AbaId[] = ['emails', 'dashboard', 'modelos', 'regras', 'contas', 'config'];
    if ((ok as string[]).includes(seg)) return seg as AbaId;
  }
  return 'emails';
}

function lerColapso(): boolean {
  try { return localStorage.getItem('ol_nav_collapsed') === '1'; } catch { return false; }
}

function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [aba, setAba] = useState<AbaId>(lerAba());
  const [navRecolhida, setNavRecolhida] = useState<boolean>(lerColapso);
  const [modeloPendente, setModeloPendente] = useState<EmailTemplate | null>(null);

  const alternarNav = () => setNavRecolhida((v) => {
    const n = !v;
    try { localStorage.setItem('ol_nav_collapsed', n ? '1' : '0'); } catch { /* ignora */ }
    return n;
  });

  useEffect(() => {
    const onHash = () => setAba(lerAba());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const irPara = (id: AbaId) => {
    window.location.hash = `${HASH_BASE}/${id}`;
    setAba(id);
  };

  const { data: status, isLoading } = useQuery<OutlookStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<OutlookStatus>('/status', undefined, signal),
    refetchInterval: 60_000,
  });

  const ativas = status?.accounts_active ?? 0;
  const precisamAuth = status?.accounts_need_auth ?? 0;
  const emConfig = status ? (!status.oauth_configured || !status.db_ready) : false;
  const contaPadraoId = (() => {
    const accs = status?.accounts ?? [];
    const a = accs.find((x) => x.is_default && x.is_active) ?? accs.find((x) => x.is_active);
    return a?.id ?? null;
  })();

  return (
    <div className="ol-shell">
      <nav className={`ol-nav${navRecolhida ? ' is-collapsed' : ''}`}>
        <div className="ol-brand">
          <span className="ol-brand-mark">✉️</span>
          <span className="ol-brand-text">E-mails</span>
          <button
            className="ol-nav-toggle"
            onClick={alternarNav}
            title={navRecolhida ? 'Expandir menu' : 'Recolher menu'}
            aria-label={navRecolhida ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!navRecolhida}
          >
            {navRecolhida ? '»' : '«'}
          </button>
        </div>
        {status?.provider === 'mock' && (
          <span className="ol-test-pill" title="Dados fictícios para testes — nenhuma conexão real com a Microsoft.">
            <span aria-hidden>🧪</span> <span className="ol-test-txt">Modo de testes</span>
          </span>
        )}
        {ABAS.map((t) => (
          <button
            key={t.id}
            className={`ol-navitem${aba === t.id ? ' is-active' : ''}`}
            onClick={() => irPara(t.id)}
            title={navRecolhida ? t.label : undefined}
          >
            <span className="ol-navitem-icon" aria-hidden>{t.icon}</span>
            <span className="ol-navitem-label">{t.label}</span>
            {t.id === 'contas' && precisamAuth > 0 && (
              <span className="ol-nav-badge" title="Contas que precisam reconectar">{precisamAuth}</span>
            )}
          </button>
        ))}
        <div className="ol-nav-foot" title={ativas > 0 ? `${ativas} conta(s) ativa(s)` : 'Nenhuma conta'}>
          <span className={`ol-conn-dot ${ativas > 0 ? 'is-on' : 'is-off'}`} />
          <span className="ol-nav-foot-txt">{ativas > 0 ? `${ativas} conta${ativas > 1 ? 's' : ''} ativa${ativas > 1 ? 's' : ''}` : 'Nenhuma conta'}</span>
        </div>
      </nav>

      <main className="ol-main">
        {emConfig && (
          <div className="ol-setup-banner" role="status">
            <strong>Módulo em configuração.</strong>{' '}
            {!status?.oauth_configured
              ? 'A conexão com a Microsoft ainda não foi ativada (registro do app no Azure pendente).'
              : 'O armazenamento do módulo ainda está sendo provisionado.'}{' '}
            Você já pode navegar; conectar contas ficará disponível assim que a configuração concluir.
          </div>
        )}

        {isLoading && !status ? (
          <div className="ol-skel-page"><div className="ol-spinner" /> Carregando…</div>
        ) : aba === 'emails' ? (
          <Emails status={status} onContas={() => irPara('contas')}
            modeloInicial={modeloPendente} onModeloConsumido={() => setModeloPendente(null)} />
        ) : aba === 'contas' ? (
          <Contas status={status} />
        ) : aba === 'dashboard' ? (
          <Dashboard accountId={contaPadraoId} />
        ) : aba === 'modelos' ? (
          <Modelos onUsar={(t) => { setModeloPendente(t); irPara('emails'); }} />
        ) : aba === 'regras' ? (
          <Regras />
        ) : (
          <Configuracoes />
        )}
      </main>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell config={config} />
    </QueryClientProvider>
  );
}
