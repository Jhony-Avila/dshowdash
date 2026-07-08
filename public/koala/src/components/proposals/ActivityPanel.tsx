import { useEffect, useState } from 'react';
import { apiGet } from '../../api/client';
import { dateTimeBr } from '../../format';

// F5 — Timeline de atividade (auditoria readonly, últimas 50).
type LogEntry = {
  id: number; action: string; field_name: string | null; old_value: string | null;
  new_value: string | null; created_at: string; author: string | null; metadata_json: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  proposal_created: 'criou a proposta',
  field_updated: 'alterou',
  status_changed: 'mudou o status',
  item_added: 'adicionou item', item_updated: 'editou item', item_removed: 'removeu item',
  expense_added: 'adicionou despesa', expense_updated: 'editou despesa', expense_removed: 'removeu despesa',
  proposal_version_frozen: 'congelou uma versão',
  proposal_pdf_generated: 'gerou o PDF',
  proposal_published: 'publicou a proposta',
  proposal_link_revoked: 'revogou o link público',
  proposal_restored: 'restaurou uma versão',
  proposal_deleted: 'excluiu a proposta',
};

function describe(e: LogEntry): string {
  if (e.action === 'field_updated') {
    return `alterou ${e.field_name} de "${e.old_value ?? '—'}" para "${e.new_value ?? '—'}"`;
  }
  if (e.action === 'status_changed') return `mudou o status de "${e.old_value}" para "${e.new_value}"`;
  const base = ACTION_LABEL[e.action] || e.action;
  if ((e.action.startsWith('item_') || e.action.startsWith('expense_')) && (e.new_value || e.old_value)) {
    return `${base}: ${e.new_value || e.old_value}`;
  }
  return base;
}

export function ActivityPanel({ proposalId }: { proposalId: number }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    apiGet('/proposals/' + proposalId + '/activity').then(setLogs)
      .catch((e: any) => setMsg(e?.meta?.message || e?.message || 'Falha ao carregar atividade.'));
  }, [proposalId]);

  if (msg) return <div className="k-sm k-pdf-err">{msg}</div>;
  if (!logs.length) return <div className="k-sm k-muted">Sem atividade registrada.</div>;

  return (
    <ul className="k-timeline">
      {logs.map((e) => (
        <li key={e.id}>
          <span className="k-tl-when">{dateTimeBr(e.created_at)}</span>
          <span className="k-tl-who">{e.author || 'sistema'}</span>
          <span className="k-tl-what">{describe(e)}</span>
        </li>
      ))}
    </ul>
  );
}
