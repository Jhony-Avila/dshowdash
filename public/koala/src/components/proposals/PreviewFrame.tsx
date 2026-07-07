import type { RefObject } from 'react';

// Preview A4 ao vivo — iframe do renderizador único (recarrega via cache-bust `tick`). GENÉRICO:
// recebe o `src` completo (proposta OU template). iframeRef exposto p/ o filmstrip de páginas (R2).
export function PreviewFrame({ src, tick, iframeRef, title = 'Preview A4' }:
  { src: string; tick: number; iframeRef?: RefObject<HTMLIFrameElement | null>; title?: string }) {
  return (
    <div className="k-preview-frame k-preview-tall">
      <iframe ref={iframeRef} key={tick} title={title} src={src} />
    </div>
  );
}
