import { useState } from 'react';
import { ProposalsList } from './ProposalsList';
import { EditorShell } from './EditorShell';

// Container de Propostas: alterna lista <-> editor.
export function ProposalsApp() {
  const [editing, setEditing] = useState<number | null>(null);
  if (editing !== null) {
    return <EditorShell proposalId={editing} onBack={() => setEditing(null)} />;
  }
  return <ProposalsList onOpen={(id) => setEditing(id)} />;
}
