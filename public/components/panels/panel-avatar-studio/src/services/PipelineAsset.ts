// services/PipelineAsset.ts — PIPELINE de asset client-side (megas
// 581–584 · §268, lote 581–590, flag as5.infra_v3).
// @version 1.0.0  @created 2026-08-06
//
// §268 pede FASES explícitas: importação → validação → compressão →
// thumbnails → preview → metadados. Este é o pipeline REAL do que o
// client publica hoje: a foto-base dos projetos do Photo Studio. Cada
// fase reporta ok/detalhe — falha PARA o pipeline com o nome da fase
// (nunca um erro anônimo). Determinístico: mesma entrada = mesma saída.
//
// lote 1091-1100 (#111, as6.workers): a COMPRESSÃO tenta o worker
// primeiro (main thread livre p/ a UI); null = canvas síncrono de
// sempre, byte a byte. O gate da flag vive em redimensionarNoWorker.
import { redimensionarNoWorker } from './WorkerPool';

export interface FasePipeline {
  fase: 'importacao' | 'validacao' | 'compressao' | 'thumbnail' | 'preview' | 'metadados';
  ok: boolean;
  detalhe?: string;
}

export interface ResultadoPipeline {
  ok: boolean;
  fases: FasePipeline[];
  /** foto comprimida (JPEG quadrado `lado`) — presente quando ok */
  foto?: string;
  /** thumbnail (JPEG quadrado `ladoThumb`) p/ cache §277 */
  thumb?: string;
  meta?: { lado: number; ladoThumb: number; bytes: number; origem: { largura: number; altura: number } };
}

const LADO_MIN = 64; // §268 validação: abaixo disso a foto vira ruído

function paraJpeg(img: HTMLImageElement, lado: number, qualidade: number): string | null {
  const c = document.createElement('canvas');
  c.width = lado; c.height = lado;
  const g = c.getContext('2d');
  if (!g) return null;
  g.fillStyle = '#0a0d15';
  g.fillRect(0, 0, lado, lado);
  g.drawImage(img, 0, 0, lado, lado);
  return c.toDataURL('image/jpeg', qualidade);
}

/** Executa o pipeline §268 sobre uma foto (dataURI). Nunca lança. */
export async function processarFoto(
  dataUri: string, lado = 480, ladoThumb = 96,
): Promise<ResultadoPipeline> {
  const fases: FasePipeline[] = [];
  const falhar = (fase: FasePipeline['fase'], detalhe: string): ResultadoPipeline => {
    fases.push({ fase, ok: false, detalhe });
    return { ok: false, fases };
  };

  // 1) IMPORTAÇÃO — decodifica a imagem
  const img = new Image();
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUri; });
  } catch { return falhar('importacao', 'imagem não decodificou'); }
  fases.push({ fase: 'importacao', ok: true });

  // 2) VALIDAÇÃO — dimensões mínimas
  const largura = img.width || 0;
  const altura = img.height || 0;
  if (largura < LADO_MIN || altura < LADO_MIN) {
    return falhar('validacao', `mínimo ${LADO_MIN}px (veio ${largura}×${altura})`);
  }
  fases.push({ fase: 'validacao', ok: true });

  // 3) COMPRESSÃO — JPEG quadrado no lado alvo (worker → sync, #111)
  const ladoReal = Math.min(lado, Math.max(largura, altura) || lado);
  const daWorker = await redimensionarNoWorker(dataUri, ladoReal, 'image/jpeg', { qualidade: 0.85, fundo: '#0a0d15' });
  const foto = daWorker ?? paraJpeg(img, ladoReal, 0.85);
  if (!foto) return falhar('compressao', 'canvas indisponível');
  fases.push({ fase: 'compressao', ok: true, detalhe: `${ladoReal}px${daWorker ? ' · worker' : ''}` });

  // 4) THUMBNAIL — miniatura p/ listas (cacheada em IDB, §277)
  const thumb = paraJpeg(img, ladoThumb, 0.7);
  if (!thumb) return falhar('thumbnail', 'canvas indisponível');
  fases.push({ fase: 'thumbnail', ok: true, detalhe: `${ladoThumb}px` });

  // 5) PREVIEW — a foto comprimida É o preview do projeto (registro §268)
  fases.push({ fase: 'preview', ok: true, detalhe: 'foto comprimida' });

  // 6) METADADOS
  const bytes = Math.round(foto.length * 0.75); // base64 → bytes aprox.
  const meta = { lado: ladoReal, ladoThumb, bytes, origem: { largura, altura } };
  fases.push({ fase: 'metadados', ok: true, detalhe: `${Math.round(bytes / 1024)}KB` });

  return { ok: true, fases, foto, thumb, meta };
}
