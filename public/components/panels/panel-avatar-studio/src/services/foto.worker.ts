// services/foto.worker.ts — WORKER de tarefas pesadas de imagem (AS6
// Parte 9, lote 1091–1100, decisão #111, flag as6.workers no caller).
// @version 1.0.0  @created 2026-08-09
//
// Redimensiona/re-encoda imagens FORA da main thread (thumbs/minia-
// turas): dataURI → createImageBitmap → OffscreenCanvas → JPEG/PNG.
// Protocolo mínimo {id, tarefa, ...}; qualquer falha responde {ok:false}
// — quem chama tem SEMPRE o fallback síncrono (o worker é aceleração,
// nunca dependência).
interface PedidoRedimensionar {
  id: number;
  tarefa: 'redimensionar';
  dataUri: string;
  lado: number;
  tipo: 'image/jpeg' | 'image/png';
  qualidade?: number;
  fundo?: string;
}

self.onmessage = (e: MessageEvent<PedidoRedimensionar>) => {
  const { id, tarefa } = e.data;
  void (async () => {
    try {
      if (tarefa !== 'redimensionar') throw new Error('tarefa desconhecida');
      const { dataUri, lado, tipo, qualidade, fundo } = e.data;
      const blob = await (await fetch(dataUri)).blob();
      const img = await createImageBitmap(blob);
      const c = new OffscreenCanvas(lado, lado);
      const g = c.getContext('2d');
      if (!g) throw new Error('sem 2d');
      if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, lado, lado); }
      g.drawImage(img, 0, 0, lado, lado);
      const saida = await c.convertToBlob({ type: tipo, quality: qualidade ?? 0.85 });
      const leitor = new FileReader();
      const uri: string = await new Promise((res, rej) => {
        leitor.onload = () => res(String(leitor.result));
        leitor.onerror = rej;
        leitor.readAsDataURL(saida);
      });
      (self as unknown as Worker).postMessage({ id, ok: true, dataUri: uri });
    } catch (erro) {
      (self as unknown as Worker).postMessage({ id, ok: false, motivo: String((erro as Error)?.message ?? erro).slice(0, 120) });
    }
  })();
};
