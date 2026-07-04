import { useEffect, useRef, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { Section } from './Section';
import { ProposalFields } from './ProposalFields';
import { ClientIdentity } from './ClientIdentity';
import { ContactsEditor } from './ContactsEditor';
import { AddressForm } from './AddressForm';
import { SellerForm } from './SellerForm';
import { OrcamentoImport } from './OrcamentoImport';
import { LineItemsEditor } from './LineItemsEditor';
import { ExpensesEditor } from './ExpensesEditor';
import { PricingPanel } from './PricingPanel';
import { PaymentTermsEditor } from './PaymentTermsEditor';
import { PreviewFrame } from './PreviewFrame';
import { SplitPane } from './SplitPane';
import { STATUS_LABELS } from './status';
import type { Proposal } from '../../types';

// Editor: formulário agrupado (ordem da spec) à esquerda + preview A4 ao vivo à direita.
export function EditorShell({ proposalId, onBack }: { proposalId: number; onBack: () => void }) {
  const [p, setP] = useState<Proposal | null>(null);
  const [externalClientId, setExternalClientId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const timer = useRef<any>(null);
  const pending = useRef<Record<string, any>>({});

  async function reload() {
    const d = await apiGet('/proposals/' + proposalId);
    setP(d);
    // deriva o id externo do cliente (p/ importar orçamentos) a partir do snapshot
    if (d.client_snapshot_id) {
      try {
        const b = await apiGet('/proposals/' + proposalId + '/client');
        setExternalClientId(b?.snapshot?.external_client_id ?? null);
      } catch { /* ignora */ }
    } else {
      setExternalClientId(null);
    }
    return d;
  }
  useEffect(() => { reload(); }, [proposalId]);

  function bump() { setTick((t) => t + 1); }

  function scheduleFlush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1200);
  }

  // Autosave: ACUMULA todas as edições num patch e envia num único PUT ao parar de digitar (~1.2s).
  // Fix F1: antes um timer único guardava só o ÚLTIMO campo — tabular rápido entre campos descartava
  // o PUT do campo anterior (perda silenciosa). Agora o patch acumula e nenhum campo se perde.
  function onField(field: string, value: any) {
    setP((prev) => (prev ? { ...prev, [field]: value } : prev));
    pending.current[field] = value;
    setSaveState('saving');
    setSaveMsg('');
    scheduleFlush();
  }

  async function flush() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    try {
      await apiSend('PUT', '/proposals/' + proposalId, patch);
      await reload();
      bump();
      // Fix F2: só declara "salvo" após 200 REAL. Se novas edições entraram durante o PUT, segue salvando.
      setSaveState(Object.keys(pending.current).length ? 'saving' : 'saved');
    } catch (e: any) {
      // Fix F3: erro deixa de ser silencioso — vira estado visível + mensagem do backend.
      setSaveState('error');
      setSaveMsg(e?.meta?.message || e?.message || 'Falha ao salvar. Tente novamente.');
    }
  }

  // status: endpoint próprio (POST /status) — com indicador/erro honestos.
  async function onStatus(status: string) {
    setP((prev) => (prev ? { ...prev, status: status as Proposal['status'] } : prev));
    setSaveState('saving');
    setSaveMsg('');
    try {
      await apiSend('POST', '/proposals/' + proposalId + '/status', { status });
      await reload();
      bump();
      setSaveState('saved');
    } catch (e: any) {
      setSaveState('error');
      setSaveMsg(e?.meta?.message || e?.message || 'Falha ao alterar o status.');
    }
  }

  async function afterChange() { await reload(); bump(); }

  // Persiste edição pendente ao sair do editor (não perde a última digitação).
  async function handleBack() { await flush(); onBack(); }

  if (!p) return <div className="k-center">Carregando proposta…</div>;

  return (
    <div>
      <div className="k-editor-top">
        <button className="k-btn k-btn-ghost" onClick={handleBack}>← Propostas</button>
        <div className="k-editor-title">{p.proposal_number} <span className="k-badge">{STATUS_LABELS[p.status] || p.status}</span></div>
        <div className={'k-sm k-save k-save-' + saveState}>
          {saveState === 'saving' ? 'salvando…'
            : saveState === 'saved' ? 'salvo ✓'
            : saveState === 'error' ? 'erro ao salvar'
            : ''}
        </div>
      </div>
      {saveState === 'error' && saveMsg && <div className="k-msg k-msg-err">{saveMsg}</div>}

      <SplitPane
        left={
        <div className="k-editor-form">
          <Section title="Dados da proposta">
            <ProposalFields p={p} onField={onField} onStatus={onStatus} />
          </Section>

          <Section title="Cliente">
            <ClientIdentity proposalId={proposalId} onChange={afterChange} />
            <OrcamentoImport proposalId={proposalId} externalClientId={externalClientId} onImported={afterChange} />
          </Section>

          <Section title="Contatos do cliente" defaultOpen={false}>
            <ContactsEditor proposalId={proposalId} />
          </Section>

          <Section title="Endereço do cliente" defaultOpen={false}>
            <AddressForm proposalId={proposalId} />
          </Section>

          <Section title="Vendedor" defaultOpen={false}>
            <SellerForm p={p} onField={onField} />
          </Section>

          <Section title="Itens da proposta">
            <LineItemsEditor proposalId={proposalId} currency={p.currency} onChange={afterChange} />
          </Section>

          <Section title="Despesas operacionais">
            <ExpensesEditor proposalId={proposalId} currency={p.currency} onChange={afterChange} />
          </Section>

          <Section title="Totais">
            <PricingPanel p={p} onField={onField} />
          </Section>

          <Section title="Formas de pagamento" defaultOpen={false}>
            <PaymentTermsEditor proposalId={proposalId} currency={p.currency} />
          </Section>
        </div>
        }
        right={
        <div className="k-editor-preview">
          <PreviewFrame proposalId={proposalId} tick={tick} />
        </div>
        }
      />
    </div>
  );
}
