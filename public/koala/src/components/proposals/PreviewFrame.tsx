// Preview A4 ao vivo — iframe do renderizador único (recarrega via cache-bust `tick`).
export function PreviewFrame({ proposalId, tick }: { proposalId: number; tick: number }) {
  const src = `/api/koala/proposals/${proposalId}/preview?mode=draft&_t=${tick}`;
  return (
    <div className="k-preview-frame k-preview-tall">
      <iframe key={tick} title="Preview A4 da proposta" src={src} />
    </div>
  );
}
