// FOTOS NA FICHA (CIMA, 19/11) — cliente do PROXY DE FOTOS DO DASH, conforme o contrato v1.0 da DIREITA:
// /srv/dshow-docs/briefings/CONTRATO-PROXY-MIDIA.md (ramo feat/fotos1-dash = d572b279). A tela só fala com /api/midia; o proxy fala com o app.
// Envelope do Dash {ok, data, error, meta}. Escritas: X-Chave-Operacao (uma por intenção; 16–64 [A-Za-z0-9_-]) + X-CSRF-Token; "Publicada/Salvo"
// SÓ com recibo (data.recibo). Erros → desfecho pelo tratarEscrita do api.ts (5xx/502/504 = desconhecido; 4xx com meta.desfecho).
import { ErroApi, MSG_DESCONHECIDO, novaChaveOperacao, obterDe, tokenCsrf, tratarRespostaEscrita, enviarPara } from './api';

const BASE = '/api/midia/index.php';

/** Foto da galeria (contrato §3.1). O nome do autor a tela resolve pelo cadastro do Dash (aqui: autor_nome opcional). */
export interface FotoGaleria {
  id: number; capa: boolean; posicao: number; origem: 'precifica' | 'dshow'; autor_user_id: number | null; autor_nome?: string | null;
  criado_em: string | null; largura: number; altura: number; cor: string | null; versao_arquivo?: number;
}
export interface Galeria {
  produto: { id: number; nome: string; ativo: boolean; pode_receber_foto: boolean };
  versao_galeria: number; limite_fotos: number; fotos: FotoGaleria[]; removidas: (FotoGaleria & { removida_em: string; motivo: string | null })[];
}
/** Escrita só com `ok`. 403 NOT_AUTHORIZED (piloto: só o 75) e 404 (flag/rota) = sem botões; 503 APP_UNAVAILABLE = indisponível (sem botões). */
export type EstadoGaleria = { tipo: 'carregando' } | { tipo: 'ok'; g: Galeria } | { tipo: 'desligado' } | { tipo: 'sem_permissao' } | { tipo: 'sessao'; msg: string } | { tipo: 'indisponivel'; msg: string } | { tipo: 'erro'; msg: string };

/** 401 do Dash (sessão revogada / usuário desativado / expirada): mensagem de SESSÃO, nunca "sem permissão" nem "não salvo por erro do app". */
export function mensagemSessao(codigo: string): string {
  if (codigo === 'SESSION_REVOKED') return 'Sua sessão foi encerrada. Entre de novo para ver e enviar fotos.';
  if (codigo === 'USER_DISABLED') return 'Seu usuário está desativado. Fale com o administrador do Dash.';
  return 'Sua sessão expirou. Entre de novo para ver e enviar fotos.';
}
/** Proxy corrigido (35f037cd): o canal recusou a assinatura (401 ou 403 assinatura_invalida do app) → 503 APP_UNAVAILABLE com desfecho
 *  "recusada" e gravado false. A tela diz só "não foi possível enviar agora" (não afirma salvo; não culpa o usuário). */
export const MSG_CANAL_RECUSOU = 'Não foi possível enviar agora. Tente de novo mais tarde.';
/** Como a tela trata o erro de UMA escrita de foto: sessão (401) e canal recusado (503 recusada) são recusas comprovadas; o resto segue o "foi salvo". */
export function classificarErroFoto(er: ErroApi | null): { tipo: 'recusada'; msg: string } | { tipo: 'conflito' } | { tipo: 'andando' } | { tipo: 'desconhecido' } {
  if (!er || er.desconhecido) return { tipo: 'desconhecido' };
  if (er.http === 401) return { tipo: 'recusada', msg: mensagemSessao(er.codigo) };
  if (er.http === 503 && er.extra.desfecho === 'recusada') return { tipo: 'recusada', msg: MSG_CANAL_RECUSOU };
  if (er.emAndamento) return { tipo: 'andando' };
  if (er.conflito) return { tipo: 'conflito' };
  if (er.recusada) return { tipo: 'recusada', msg: er.message };
  return { tipo: 'desconhecido' };
}

export async function carregarGaleria(productId: number, sinal?: AbortSignal): Promise<EstadoGaleria> {
  try { return { tipo: 'ok', g: await obterDe<Galeria>(`${BASE}?r=galeria&product_id=${productId}`, sinal) }; }
  catch (e) {
    const er = e instanceof ErroApi ? e : null;
    if (er?.http === 404) return { tipo: 'desligado' };
    if (er?.http === 401) return { tipo: 'sessao', msg: mensagemSessao(er.codigo) };
    if (er?.http === 403) return { tipo: 'sem_permissao' };
    if (er?.http === 503) return { tipo: 'indisponivel', msg: er.message };
    return { tipo: 'erro', msg: e instanceof Error ? e.message : 'Falha ao ler as fotos.' };
  }
}

/** Bytes da variante (§3.2): 256 | 768 | 1536 | 2048; removida só com removida=1. */
export const urlImagem = (id: number, t: 256 | 768 | 1536 | 2048 = 256, removida = false) => `${BASE}?r=imagem&id=${id}&t=${t}${removida ? '&removida=1' : ''}`;

/** Recibo (§4): chaves do app em ordem alfabética, operacao prefixada. */
export interface ReciboFoto { canal?: string; chave: string; confirmado_em: string; desfecho: 'aplicada' | 'sem_mudanca'; duplicada?: boolean; foto_id: number | null; operacao: 'foto_publicar' | 'foto_capa' | 'foto_ordem' | 'foto_remover' | 'foto_restaurar'; produto_id: number; versao_nova: number; ordem?: number[] }
export type RespostaFoto = { desfecho: 'aplicada' | 'sem_mudanca'; recibo: ReciboFoto; repetido?: boolean };

/** Publicar UMA foto (§3.4): corpo = bytes, octet-stream. XHR para ter o progresso da TRANSFERÊNCIA (enviando %) e saber quando o
 *  servidor passa a PROCESSAR (upload terminou, resposta ainda não veio). Resposta pelo MESMO tratamento do "foi salvo". */
export function publicarFoto(productId: number, arquivo: Blob, chave: string, aoProgresso?: (fase: 'enviando' | 'processando', pct: number) => void): Promise<RespostaFoto> {
  return tokenCsrf().then((token) => new Promise<RespostaFoto>((ok, falha) => {
    const x = new XMLHttpRequest();
    x.open('POST', `${BASE}?r=publicar&product_id=${productId}`); x.withCredentials = true;
    x.setRequestHeader('Accept', 'application/json'); x.setRequestHeader('Content-Type', 'application/octet-stream');
    x.setRequestHeader('X-CSRF-Token', token); x.setRequestHeader('X-Chave-Operacao', chave);
    x.upload.onprogress = (e) => { if (e.lengthComputable) aoProgresso?.('enviando', Math.round((100 * e.loaded) / e.total)); };
    x.upload.onload = () => aoProgresso?.('processando', 100);
    x.onerror = x.ontimeout = x.onabort = () => falha(new ErroApi(0, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave }));
    x.onload = () => { tratarRespostaEscrita<RespostaFoto>(new Response(x.responseText, { status: x.status, headers: { 'Content-Type': 'application/json' } }), chave).then(ok, falha); };
    x.send(arquivo);
  }));
}
export const marcarCapa = (fotoId: number, versao: number, chave = novaChaveOperacao()) => enviarPara<RespostaFoto>(`${BASE}?r=capa`, { id: fotoId, versao }, { chave });
export const ordenarFotos = (productId: number, ordem: number[], versao: number, chave = novaChaveOperacao()) => enviarPara<RespostaFoto>(`${BASE}?r=ordem`, { product_id: productId, versao, ordem }, { chave });
export const removerFoto = (fotoId: number, versao: number, chave = novaChaveOperacao()) => enviarPara<RespostaFoto>(`${BASE}?r=remover`, { id: fotoId, versao }, { chave });
export const restaurarFoto = (fotoId: number, versao: number, chave = novaChaveOperacao()) => enviarPara<RespostaFoto>(`${BASE}?r=restaurar`, { id: fotoId, versao }, { chave });

/** Conferir gravação (§3.3): só leitura, nunca reexecuta; formato do `Conferencia` do api.ts. */
export type Conferido = { tipo: 'salvo'; recibo: ReciboFoto } | { tipo: 'andando'; demorando: boolean } | { tipo: 'nao_aplicada'; msg: string } | { tipo: 'nao_encontrada' };
export async function conferirFoto(chave: string): Promise<Conferido> {
  const c = await obterDe<{ resultado: string; recibo?: ReciboFoto; erro?: { mensagem?: string }; sinal?: string; reenvio_seguro?: boolean }>(`${BASE}?r=conferir&chave=${encodeURIComponent(chave)}`);
  if ((c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') && c.recibo) return { tipo: 'salvo', recibo: c.recibo };
  if (c.resultado === 'em_andamento') return { tipo: 'andando', demorando: c.sinal === 'pode_estar_demorando' };
  if (c.resultado === 'nao_aplicada') return { tipo: 'nao_aplicada', msg: c.erro?.mensagem ?? 'O servidor recusou esta foto.' };
  return { tipo: 'nao_encontrada' };
}

/** Formatos e limites do canal (contrato do proxy §3.4 e do app §1). Vagas restantes vêm da galeria (limite_fotos − fotos ativas). */
export const FORMATOS_TEXTO = 'JPEG, PNG, WebP ou HEIC · até 15 MB por foto';
export const DETALHES_LIMITES = 'Até 40 megapixels; lado menor com pelo menos 64 px.';
export const LIMITE_BYTES = 15 * 1024 * 1024;
export const ACEITOS = /^image\/(jpeg|png|webp|heic|heif)$/i;
/** HEIC vai sem redimensionar (o Chrome de desktop não decodifica HEIC em canvas; o app converte) e sem prévia no navegador. */
export const ehHeic = (f: File) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

/** Reduz para ≤ 2560 px no lado maior SÓ se passar disso (a deduplicação do app compara os bytes; não recomprimir à toa). */
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
