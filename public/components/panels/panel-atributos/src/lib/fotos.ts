// FOTOS NA FICHA (CIMA, 19/11) — cliente do PROXY DE FOTOS DO DASH, conforme o contrato v1.0 da DIREITA:
// /srv/dshow-docs/briefings/CONTRATO-PROXY-MIDIA.md (ramo feat/fotos1-dash = d572b279). A tela só fala com /api/midia; o proxy fala com o app.
// Envelope do Dash {ok, data, error, meta}. Escritas: X-Chave-Operacao (uma por intenção; 16–64 [A-Za-z0-9_-]) + X-CSRF-Token; "Publicada/Salvo"
// SÓ com recibo (data.recibo). Erros → desfecho pelo tratarEscrita do api.ts (5xx/502/504 = desconhecido; 4xx com meta.desfecho).
import { ErroApi, MSG_DESCONHECIDO, novaChaveOperacao, obterDe, tokenCsrf, tratarRespostaEscrita, enviarPara } from './api';
import { lerRespostaCheck } from '../../../../../core/auth/sessao-encerrada';   // validador ÚNICO de sessão encerrada (P7 + P9, Codex 115B)

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
export type EstadoGaleria = { tipo: 'carregando' } | { tipo: 'ok'; g: Galeria } | { tipo: 'desligado' } | { tipo: 'sem_permissao' } | { tipo: 'sessao'; msg: string; reentrar: boolean } | { tipo: 'indisponivel'; msg: string } | { tipo: 'erro'; msg: string };

/** 401 do Dash (sessão revogada / usuário desativado / expirada): mensagem de SESSÃO, nunca "sem permissão" nem "não salvo por erro do app".
 *  Parecer do Jhony (23/11, P2): sessão encerrada/expirada = texto único + ação "Entrar novamente" (ver `entrarNovamente`). Usuário desativado
 *  não tem como resolver entrando de novo: fica só a mensagem. */
export const MSG_SESSAO_ENCERRADA = 'Sua sessão foi encerrada. Entre novamente para continuar enviando e gerenciando fotos.';
export function mensagemSessao(codigo: string): string {
  if (codigo === 'USER_DISABLED') return 'Seu usuário está desativado. Fale com o administrador do Dash.';
  return MSG_SESSAO_ENCERRADA;
}
/** Entrar de novo resolve? (sim para sessão revogada/expirada; não para usuário desativado). */
export const sessaoReentravel = (codigo: string) => codigo !== 'USER_DISABLED';
/** Codex DSHOW-114 (P9): TRÊS estados de sessão. Só a saída CONFIRMADA vale; o resto é DESCONHECIDO e nunca vira saída nem entrada.
 *  - encerrada: logout 2xx com o envelope `ok:true`, ou o check.php PROVANDO a saída pelo validador único (envelope exato de sucesso com
 *    `authenticated:false`, `user:null`);
 *  - desconhecido: check 503 SESSION_CHECK_UNAVAILABLE, rede, timeout, 403 de CSRF, 5xx. */
export type SaidaSessao = { estado: 'encerrada'; sessaoAntiga: string | null } | { estado: 'desconhecido'; motivo: string };
type Checagem = { estado: 'autenticado'; token: string | null; csrf: string; usuario: number | null } | { estado: 'nao_autenticado' } | { estado: 'desconhecido'; motivo: string };
const comPrazo = (ms: number) => { const c = new AbortController(); const t = window.setTimeout(() => c.abort(), ms); return { sinal: c.signal, fim: () => window.clearTimeout(t) }; };

/** check.php pelo validador ÚNICO de sessão encerrada (core/auth/sessao-encerrada, DIREITA 993dd85e — o mesmo arquivo-fonte da P7, nunca
 *  uma cópia). Codex 115B: o envelope tem de ser o EXATO de sucesso (200 + JSON + ok:true + error:null + data); `{ok:false, authenticated:false}`
 *  não prova saída. ativa = autenticado (com o token, para provar depois que é OUTRA sessão); encerrada = não autenticado CONFIRMADO;
 *  todo o resto (503, rede, tempo, envelope de erro, corpo ambíguo) = desconhecido — a identidade fica, nada de /login, nada de retomar. */
export async function checarSessao(): Promise<Checagem> {
  const p = comPrazo(10000);
  try {
    const r = await fetch('/api/auth/check.php', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: p.sinal });
    const copia = r.clone();
    const l = await lerRespostaCheck(r);
    if (l.estado === 'ativa') {
      // Reforço P2: QUEM está na sessão (id do usuário), para a retomada não atravessar contas; ilegível = null (nunca retoma por suposição)
      let usuario: number | null = null;
      try { const id = (JSON.parse(await copia.text()) as { data?: { user?: { id?: unknown } } }).data?.user?.id; usuario = Number.isSafeInteger(Number(id)) && Number(id) > 0 ? Number(id) : null; } catch { usuario = null; }
      if (usuario !== null) titularPagina ??= usuario;
      return { estado: 'autenticado', token: l.token, csrf: l.csrf, usuario };
    }
    if (l.estado === 'encerrada') return { estado: 'nao_autenticado' };
    return { estado: 'desconhecido', motivo: l.motivo };
  } catch { return { estado: 'desconhecido', motivo: 'rede ou tempo esgotado' }; } finally { p.fim(); }
}

/** Encerra a sessão do Dash pelo mesmo caminho do menu → Sair (check.php → POST /api/auth/logout.php com o CSRF) e SÓ devolve "encerrada"
 *  com prova: logout 2xx COM o envelope `ok:true`, ou check confirmando que a sessão acabou. 2xx ambíguo = desconhecido (DSHOW-115). */
export async function encerrarSessaoDoDash(): Promise<SaidaSessao> {
  const c = await checarSessao();
  if (c.estado === 'nao_autenticado') return { estado: 'encerrada', sessaoAntiga: null };
  if (c.estado === 'desconhecido') return { estado: 'desconhecido', motivo: c.motivo };
  const p = comPrazo(10000);
  try {
    const s = await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: p.sinal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(c.csrf ? { 'X-CSRF-Token': c.csrf } : {}) }, body: '{}' });
    const corpo = await s.text().catch(() => '');
    if (!s.ok) return { estado: 'desconhecido', motivo: `logout ${s.status}` };
    // DSHOW-115 (NO-GO da P9): 2xx sozinho NÃO confirma. Só o envelope de sucesso que o logout.php define (ApiResponse::success →
    // `{"ok":true,…}` em JSON) é saída confirmada. 2xx com HTML, JSON inválido ou `ok:false` é AMBÍGUO = desconhecido, a não ser que
    // o check.php PROVE que a sessão acabou (authenticated:false). Nada de /login sem prova.
    if (envelopeDeSucesso(s, corpo)) return { estado: 'encerrada', sessaoAntiga: c.token };
    const prova = await checarSessao();
    if (prova.estado === 'nao_autenticado') return { estado: 'encerrada', sessaoAntiga: c.token };
    return { estado: 'desconhecido', motivo: `logout ${s.status} sem confirmação` };
  } catch { return { estado: 'desconhecido', motivo: 'rede ou tempo esgotado' }; } finally { p.fim(); }
}

/** Envelope de sucesso do POST /api/auth/logout.php (ApiResponse::success): JSON com `ok === true`. Qualquer outra coisa não confirma. */
export function envelopeDeSucesso(r: { status: number; headers: { get(n: string): string | null } }, corpo: string): boolean {
  if (r.status < 200 || r.status > 299) return false;
  if (!/application\/json/i.test(r.headers.get('content-type') ?? '')) return false;
  try { const j = JSON.parse(corpo); return !!j && typeof j === 'object' && j.ok === true; } catch { return false; }
}

/** "Entrar novamente": encerra a sessão (acima) e, SÓ com a saída confirmada, abre a entrada do Dash (/login) em OUTRA aba — a fila de fotos e
 *  a ficha ficam nesta. A aba abre no clique (senão o navegador bloqueia o pop-up) e é FECHADA se a saída não for confirmada: com o estado
 *  desconhecido nada de /login, o aviso fica e a pessoa tenta de novo. Pop-up bloqueado e saída confirmada: vai a /login nesta aba. */
export async function entrarNovamente(): Promise<SaidaSessao> {
  const aba = window.open('about:blank', '_blank');
  const r = await encerrarSessaoDoDash();
  if (r.estado !== 'encerrada') { try { aba?.close(); } catch { /* ignora */ } return r; }
  if (aba && !aba.closed) { try { aba.opener = null; } catch { /* ignora */ } aba.location.href = '/login'; }
  else window.location.assign('/login');
  return r;
}

/** Reforço P2 (AZUL, 27/11, aprovado pelo arquiteto): TITULAR da fila desta página = o 1º usuário autenticado visto aqui. "Entrar novamente" abre o
 *  login em OUTRA aba; se lá entrar OUTRA conta, a fila desta aba (fotos escolhidas por outra pessoa) NUNCA é retomada com a sessão dela. */
let titularPagina: number | null = null;
export const titularDaFila = (): number | null => titularPagina;
/** Chamada ao abrir a ficha (sessão ativa): fixa o titular. Sem confirmação = titular desconhecido = nenhuma retomada. */
export async function lembrarTitular(): Promise<number | null> { if (titularPagina === null) await checarSessao(); return titularPagina; }

/** Retomar depois de "Entrar novamente": só com um LOGIN REAL — autenticado e com uma sessão diferente da que foi encerrada. A sessão
 *  antiga ainda viva (logout que não pegou) ou o check indisponível NUNCA contam como reentrada. */
export async function sessaoRenovada(sessaoAntiga: string | null): Promise<'nova' | 'sem_login' | 'antiga' | 'desconhecido' | 'outra_conta'> {
  const titular = titularPagina;   // lido ANTES da nova checagem (que não troca um titular já fixado)
  const c = await checarSessao();
  if (c.estado === 'desconhecido') return 'desconhecido';
  if (c.estado === 'nao_autenticado') return 'sem_login';
  if (sessaoAntiga !== null && (c.token === null || c.token === sessaoAntiga)) return 'antiga';
  // Reforço P2: sessão nova, mas de OUTRA pessoa (ou titular/usuário desconhecido) → não retoma
  if (titular === null || c.usuario === null || c.usuario !== titular) return 'outra_conta';
  return 'nova';
}
/** Proxy corrigido (35f037cd): o canal recusou a assinatura (401 ou 403 assinatura_invalida do app) → 503 APP_UNAVAILABLE com desfecho
 *  "recusada" e gravado false. A tela diz só "não foi possível enviar agora" (não afirma salvo; não culpa o usuário). */
export const MSG_CANAL_RECUSOU = 'Não foi possível enviar agora. Tente de novo mais tarde.';
/** Como a tela trata o erro de UMA escrita de foto: sessão (401) e canal recusado (503 recusada) são recusas comprovadas; o resto segue o "foi salvo". */
export function classificarErroFoto(er: ErroApi | null): { tipo: 'recusada'; msg: string; sessao?: boolean } | { tipo: 'conflito' } | { tipo: 'andando' } | { tipo: 'desconhecido' } {
  if (!er || er.desconhecido) return { tipo: 'desconhecido' };
  if (er.http === 401) return { tipo: 'recusada', msg: mensagemSessao(er.codigo), sessao: sessaoReentravel(er.codigo) };
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
    if (er?.http === 401) return { tipo: 'sessao', msg: mensagemSessao(er.codigo), reentrar: sessaoReentravel(er.codigo) };
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
