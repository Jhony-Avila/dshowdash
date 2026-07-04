import { EditableLineTable } from './EditableLineTable';

// Despesas Operacionais = mesma tabela editável dos itens (espelho estrutural), sem catálogo.
export function ExpensesEditor({ proposalId, currency, onChange }: { proposalId: number; currency: string; onChange: () => void }) {
  return (
    <EditableLineTable
      proposalId={proposalId} resource="expenses" currency={currency}
      onChange={onChange} addLabel="+ despesa"
    />
  );
}
