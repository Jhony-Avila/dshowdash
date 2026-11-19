// FOTOS NA FICHA (CIMA, 19/11; tela passou da DIREITA para a CIMA). Cliente das rotas do PROXY DO DASH para o app (/api/midia), conforme o
// levantamento da DIREITA (dash/20261118-fotos/LEVANTAMENTO.md §P.2/P.3) e o contrato do app (app/20261119-fotos1/CONTRATO-ROTAS-FOTOS1.md).
// O proxy (PHP) ainda NÃO existe: a tela foi feita e testada com essas rotas SIMULADAS (Playwright). Contrato da tela: portoes/FOTOS-FICHA/CONTRATO-TELA.md.
// Envelope do Dash: {ok, data, error, meta:{message, desfecho}}. Escritas: X-Chave-Operacao (uma por intenção) + recibo obrigatório ("foi salvo").
import { enviarPara, ErroApi, novaChaveOperacao, obterDe } from './api';

const BASE = '/api/midia/index.php';

export interface FotoGaleria {
  id: number; capa: boolean; posicao: number; origem: 'precifica' | 'dshow'; autor_user_id: number | null; autor_nome?: string | null;
  criado_em: string | null; largura: number; altura: number; cor: string | null; versao_arquivo?: number;
}
export interface Galeria {
  produto: { id: number; nome: string; ativo: boolean; pode_receber_foto: boolean };
  versao_galeria: number; limite_fotos: number; fotos: FotoGaleria[]; removidas: (FotoGaleria & { removida_em: string; motivo: string | null })[];
}
/** A tela só mostra os botões de escrita com `ok`. Flag do app desligada (404) ou usuário fora da lista de publicação (403) = sem botões. */
export type EstadoGaleria = { tipo: 'carregando' } | { tipo: 'ok'; g: Galeria } | { tipo: 'desligado' } | { tipo: 'sem_permissao' } | { tipo: 'erro'; msg: string };

export async function carregarGaleria(productId: number, sinal?: AbortSignal): Promise<EstadoGaleria> {
  try { return { tipo: 'ok', g: await obterDe<Galeria>(`${BASE}?r=fotos&product_id=${productId}`, sinal) }; }
  catch (e) {
    if (e instanceof ErroApi && e.http === 404) return { tipo: 'desligado' };
    if (e instanceof ErroApi && (e.http === 403 || e.http === 401)) return { tipo: 'sem_permissao' };
    return { tipo: 'erro', msg: e instanceof Error ? e.message : 'Falha ao ler as fotos.' };
  }
}

export const urlFotoMidia = (id: number, t: 256 | 768 | 1536 = 256, removida = false) => `${BASE}?r=foto&id=${id}&t=${t}${removida ? '&removida=1' : ''}`;

/** Recibo do proxy (= recibo do app, §3.1 do contrato). "Salvo" na tela SÓ com ele. */
export interface ReciboFoto { operacao: 'publicar' | 'capa' | 'ordem' | 'remover' | 'restaurar'; chave: string; desfecho: 'aplicada' | 'sem_mudanca'; confirmado_em: string; foto_id: number | null; produto_id: number; versao_nova: number; duplicada?: boolean; [k: string]: unknown }
export type RespostaFoto = { desfecho: 'aplicada' | 'sem_mudanca'; recibo: ReciboFoto };

export const publicarFoto = (productId: number, arquivo: Blob, chave: string) =>
  enviarPara<RespostaFoto>(`${BASE}?r=foto_enviar&product_id=${productId}`, arquivo, { chave, contentType: 'application/octet-stream' });
export const marcarCapa = (productId: number, fotoId: number, versao: number, chave = novaChaveOperacao()) =>
  enviarPara<RespostaFoto>(`${BASE}?r=foto_capa`, { product_id: productId, foto_id: fotoId, versao }, { chave });
export const ordenarFotos = (productId: number, ordem: number[], versao: number, chave = novaChaveOperacao()) =>
  enviarPara<RespostaFoto>(`${BASE}?r=foto_ordem`, { product_id: productId, ordem, versao }, { chave });
export const removerFoto = (productId: number, fotoId: number, versao: number, chave = novaChaveOperacao()) =>
  enviarPara<RespostaFoto>(`${BASE}?r=foto_remover`, { product_id: productId, foto_id: fotoId, versao }, { chave });
export const restaurarFoto = (productId: number, fotoId: number, versao: number, chave = novaChaveOperacao()) =>
  enviarPara<RespostaFoto>(`${BASE}?r=foto_restaurar`, { product_id: productId, foto_id: fotoId, versao }, { chave });

/** Conferir gravação (§4.1 do contrato): só leitura. */
export type Conferido = { tipo: 'salvo'; recibo: ReciboFoto } | { tipo: 'andando'; demorando: boolean } | { tipo: 'nao_aplicada'; msg: string } | { tipo: 'nao_encontrada' };
export async function conferirFoto(chave: string): Promise<Conferido> {
  const c = await obterDe<{ estado: string; recibo?: ReciboFoto; erro?: { message?: string } }>(`${BASE}?r=conferir_gravacao&chave=${encodeURIComponent(chave)}`);
  if ((c.estado === 'aplicada' || c.estado === 'sem_mudanca') && c.recibo) return { tipo: 'salvo', recibo: c.recibo };
  if (c.estado === 'em_andamento' || c.estado === 'pode_estar_demorando') return { tipo: 'andando', demorando: c.estado === 'pode_estar_demorando' };
  if (c.estado === 'nao_aplicada') return { tipo: 'nao_aplicada', msg: c.erro?.message ?? 'O servidor recusou esta foto.' };
  return { tipo: 'nao_encontrada' };
}

/** HEIC vai sem redimensionar (o Chrome de desktop não decodifica HEIC em canvas; o app converte). */
export const ehHeic = (f: File) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
export const LIMITE_BYTES = 15 * 1024 * 1024;
export const ACEITOS = /^image\/(jpeg|png|webp|heic|heif)$/i;

/** No navegador: reduz para ≤ 2560 px no lado maior SÓ se passar disso (a deduplicação do app compara os bytes; não recomprimir à toa). */
export async function prepararArquivo(f: File): Promise<Blob> {
  if (ehHeic(f) || typeof createImageBitmap === 'undefined') return f;
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(f); } catch { return f; }   // o servidor decide (tipo pelos bytes)
  const lado = Math.max(bmp.width, bmp.height);
  if (lado <= 2560) { bmp.close?.(); return f; }
  const k = 2560 / lado; const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  const tipo = /png/i.test(f.type) ? 'image/webp' : 'image/jpeg';
  return await new Promise<Blob>((ok) => c.toBlob((b) => ok(b ?? f), tipo, 0.85));
}
