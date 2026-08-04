// services/Compartilhar.ts — compartilhamento de imagens (AS5 · mega 15).
// @version 1.0.0  @created 2026-08-03
//
// CASCATA fail-safe (§21.5): Web Share nível 2 (com File) → área de
// transferência (ClipboardItem) → download. Devolve QUAL caminho serviu —
// a UI dá o feedback certo e a telemetria §290 registra. Nunca lança:
// compartilhar é cosmético, não fluxo.

export type CanalCompartilhamento = 'share' | 'clipboard' | 'download' | 'nenhum';

function dataUriParaBlob(dataUri: string): Blob | null {
  try {
    const [cab, b64] = dataUri.split(',');
    const mime = /data:([^;]+)/.exec(cab)?.[1] ?? 'image/png';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch { return null; }
}

/** true quando ALGUM canal além do download existe (decide mostrar botão). */
export function podeCompartilhar(): boolean {
  return typeof navigator !== 'undefined'
    && (typeof navigator.share === 'function' || typeof ClipboardItem !== 'undefined');
}

export async function compartilharPng(
  dataUri: string,
  nomeArquivo: string,
  titulo: string,
): Promise<CanalCompartilhamento> {
  const blob = dataUriParaBlob(dataUri);
  if (!blob) return 'nenhum';
  return compartilharBlob(blob, nomeArquivo, titulo);
}

/** mega 36: a MESMA cascata para qualquer blob (vídeo WebM incluso) —
 *  clipboard sem suporte ao MIME cai limpo para o download. */
export async function compartilharBlob(
  blob: Blob,
  nomeArquivo: string,
  titulo: string,
): Promise<CanalCompartilhamento> {
  // 1) Web Share nível 2 — a folha nativa do sistema (mobile primeiro)
  try {
    if (typeof navigator.share === 'function') {
      const arquivo = new File([blob], nomeArquivo, { type: blob.type });
      if (!navigator.canShare || navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: titulo });
        return 'share';
      }
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'nenhum'; // usuário desistiu
    /* segue a cascata */
  }

  // 2) área de transferência (colar direto em chat/doc) — SÓ imagem:
  // vídeo nunca é aceito pelo clipboard do Chromium e o write() pode ficar
  // PENDENTE p/ sempre (visto na mega 36) — a cascata não pode estalar,
  // então além do filtro de tipo há um guarda de tempo.
  try {
    if (blob.type.startsWith('image/') && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const guarda = new Promise<never>((_, rejeitar) => {
        setTimeout(() => rejeitar(new Error('clipboard pendente')), 2500);
      });
      await Promise.race([navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]), guarda]);
      return 'clipboard';
    }
  } catch { /* segue a cascata */ }

  // 3) download clássico — sempre existe
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'download';
  } catch { return 'nenhum'; }
}
