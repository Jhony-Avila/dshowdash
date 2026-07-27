// screens/Configuracoes.tsx — estado do módulo + modo de testes (§40/§41).
// @version 1.0.0  @created 2026-07-21
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiWrite } from '../lib/api';
import type { AdsStatus } from '../shell/types';
import { PageHeader } from '../components/ui';

function Sim({ v }: { v: boolean }) {
  return <span className={`ads-pill ${v ? 'ads-pill-ok' : 'ads-pill-dim'}`}>{v ? 'Sim' : 'Não'}</span>;
}

export function Configuracoes({ status }: { status?: AdsStatus }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const isMock = status?.provider === 'mock';

  const resetarMock = async () => {
    setBusy(true);
    try { await apiWrite('/mock/reset', 'POST'); qc.invalidateQueries(); } finally { setBusy(false); }
  };

  return (
    <div className="ads-page">
      <PageHeader title="Configurações" subtitle="Estado da integração e do modo de testes. As credenciais reais do Google Ads ficam apenas no servidor." />

      <div className="ads-cfg-card">
        <h3 className="ads-cfg-tit">Estado da integração</h3>
        <p className="ads-cfg-desc">
          {isMock
            ? 'O módulo está em modo de testes (dados fictícios). Nenhuma conexão real com o Google Ads é feita.'
            : 'Modo real. As credenciais são lidas do servidor.'}
        </p>
        <div className="ads-cfg-rows">
          <div className="ads-cfg-row"><span className="ads-cfg-k">Provedor</span><span className="ads-cfg-v">{isMock ? '🧪 Mock (testes)' : '🔷 Google Ads'}</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">Fase</span><span className="ads-cfg-v">{status?.phase ?? '—'}</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">OAuth configurado</span><span className="ads-cfg-v"><Sim v={!!status?.oauth_configured} /></span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">Developer token</span><span className="ads-cfg-v"><Sim v={!!status?.developer_token_ready} /></span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">Banco (ADS_DSHOW)</span><span className="ads-cfg-v"><Sim v={!!status?.db_ready} /></span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">Contas conectadas</span><span className="ads-cfg-v">{status?.accounts_total ?? 0} ({status?.accounts_active ?? 0} ativas)</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">Moeda</span><span className="ads-cfg-v">{status?.currency ?? '—'}</span></div>
        </div>
        {status?.message && <p className="ads-note">{status.message}</p>}
      </div>

      {isMock && (
        <div className="ads-cfg-card">
          <h3 className="ads-cfg-tit">Modo de testes</h3>
          <p className="ads-cfg-desc">
            Os dados são gerados por sessão. Alterações (conta padrão, favoritos, conta conectada) ficam salvas na sua sessão de teste.
            Você pode zerar tudo para recomeçar do estado inicial.
          </p>
          <button className="ads-btn" onClick={resetarMock} disabled={busy}>♻️ Zerar dados de teste</button>
        </div>
      )}

      <div className="ads-cfg-card">
        <h3 className="ads-cfg-tit">Para ativar dados reais (go-live)</h3>
        <p className="ads-cfg-desc">Provisionamento do dono/DBA — detalhe em <code>docs/GOOGLE-ADS/05-plano-fases.md</code>.</p>
        <div className="ads-cfg-rows">
          <div className="ads-cfg-row"><span className="ads-cfg-k">1. Developer token + MCC</span><span className="ads-cfg-v">pendente (aprovação Google)</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">2. OAuth + as 2 contas</span><span className="ads-cfg-v">pendente</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">3. Banco ADS_DSHOW</span><span className="ads-cfg-v">pendente (DBA)</span></div>
          <div className="ads-cfg-row"><span className="ads-cfg-k">4. Trocar ADS_PROVIDER=mock → google</span><span className="ads-cfg-v">pendente (dev)</span></div>
        </div>
      </div>
    </div>
  );
}
