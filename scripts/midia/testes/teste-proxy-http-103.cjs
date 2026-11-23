// DSHOW-103 (ACIMA_DIREITA) — proxy de fotos pelo HTTP REAL, num harness PRÓPRIO (não usa o 8114 da DIREITA, sem navegador):
// sobe `php -S 127.0.0.1:<PORTA>` com harness-proxy-103.php (FotosProxy + emissor reais; flags/sessão/repositório/CSRF falsos por
// cabeçalho) e o app-falso-103.cjs em 127.0.0.1:<PORTA_APP> (HMAC conferido com segredo SINTÉTICO). Prova: P1-1 (404 com zero chamadas ao
// app e corpo não lido), P1-2 (revogada/desativada/fora), P1-3 (no-store), A (correlação), B (ids), C ("*"), D (201/200), ea77d74 (409).
// Uso: node scripts/midia/testes/teste-proxy-http-103.cjs   (PORTA=8131 PORTA_APP=3191 por padrão)
'use strict';
const { spawn } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path'); const crypto = require('crypto');
const PORTA = Number(process.env.PORTA || 8131); const PORTA_APP = Number(process.env.PORTA_APP || 3191);
// regra de 23/11: diretório PRIVADO desta execução, VERIFICADO antes de qualquer escrita (mkdtemp lança se falhar)
const TMPB = fs.realpathSync(os.tmpdir());
const DIR = fs.realpathSync(fs.mkdtempSync(path.join(TMPB, 'dshow103-')));
if (!DIR.startsWith(TMPB + path.sep) || !fs.statSync(DIR).isDirectory() || (fs.statSync(DIR).mode & 0o777) !== 0o700) { console.log('[ERRO] diretório temporário não verificado — ABORTADO'); process.exit(2); }
const SEG = path.join(DIR, 'segredo-sintetico.key'); const SEGREDO = 'segredo-SINTETICO-dshow103-'.padEnd(48, 'q');
fs.writeFileSync(SEG, SEGREDO + '\n', { mode: 0o600 });
const LOG_APP = path.join(DIR, 'app.jsonl'); const LOG_H = path.join(DIR, 'harness.log');
const RAIZ = path.resolve(__dirname, '../../..');
let ok = 0, falhas = 0; const tudo = [];
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
const linhas = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean) : []);
const app = () => linhas(LOG_APP).map((l) => JSON.parse(l)); const corposLidos = () => linhas(LOG_H).length;
const LIGADO = { panel_fotos_enabled: { enabled: true, source: 'global' }, panel_fotos_escrita: { enabled: true, source: 'global' } };
const pedir = async (estado, metodo, q, corpo, cab = {}) => {
  const r = await fetch(`http://127.0.0.1:${PORTA}/api/midia/index.php?${new URLSearchParams(q)}`, { method: metodo,
    headers: { 'X-Harness-Estado': Buffer.from(JSON.stringify(estado)).toString('base64'), ...cab }, body: corpo });
  const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch {}
  tudo.push(buf.toString('latin1') + JSON.stringify([...r.headers]));
  return { st: r.status, j, buf, h: r.headers };
};
const chave = () => 'op-http103-' + crypto.randomBytes(6).toString('hex');
const JPG = Buffer.concat([Buffer.from('ffd8ffe000104a46494600', 'hex'), crypto.randomBytes(3000)]);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function pronto(porta) { for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${porta}/`); return; } catch { await espera(100); } } throw new Error('servidor não subiu ' + porta); }

(async () => {
  const pApp = spawn(process.execPath, [path.join(__dirname, 'app-falso-103.cjs'), String(PORTA_APP), SEG, LOG_APP], { stdio: 'ignore' });
  const pPhp = spawn('php', ['-S', `127.0.0.1:${PORTA}`, path.join(__dirname, 'harness-proxy-103.php')], { cwd: RAIZ, stdio: 'ignore',
    env: { ...process.env, HARNESS_LOG: LOG_H, HARNESS_APP_PORTA: String(PORTA_APP), DSHOW_FOTOS_APP_SEGREDO_ARQUIVO: SEG } });
  try {
    await pronto(PORTA_APP); await pronto(PORTA);
    fs.writeFileSync(LOG_APP, ''); fs.writeFileSync(LOG_H, '');   // a checagem de prontidão não conta como pedido do proxy
    const post = (estado, q, corpo, ch = chave(), extra = {}) => pedir(estado, 'POST', q, corpo, { 'X-Chave-Operacao': ch, 'Content-Type': Buffer.isBuffer(corpo) ? 'application/octet-stream' : 'application/json', ...extra });
    // P1-1
    let r = await post({ flags: {} }, { r: 'publicar', product_id: '550' }, JPG);
    afirma('P1-1 flag de fotos AUSENTE → 404; 0 pedidos ao app; corpo NÃO lido', r.st === 404 && app().length === 0 && corposLidos() === 0, `${r.st} app=${app().length} corpo=${corposLidos()}`);
    r = await post({ flags: { panel_atributos_enabled: { enabled: true, source: 'global' }, panel_atributos_escrita: { enabled: true, source: 'global' } } }, { r: 'publicar', product_id: '550' }, JPG);
    afirma('P1-1 EXCLUSIVA: atributos ligada não abre fotos → 404, 0 app', r.st === 404 && app().length === 0 && corposLidos() === 0);
    for (const m of ['GET', 'POST']) {   // DSHOW-103 §1 teste bloqueante: atributos ON + fotos INVÁLIDA + segredo sintético válido configurado
      const est = { flags: { panel_atributos_enabled: { enabled: true, source: 'global' }, panel_fotos_enabled: { enabled: true, source: 'error' } } };
      r = m === 'GET' ? await pedir(est, 'GET', { r: 'galeria', product_id: '550' }) : await post(est, { r: 'publicar', product_id: '550' }, JPG);
      afirma(`P1-1 ${m}: flag de fotos inválida = OFF → 404 (atributos ON, segredo válido), 0 app, corpo não lido`, r.st === 404 && app().length === 0 && corposLidos() === 0);
      afirma(`P1-3 ${m}: resposta de erro também "private, no-store"`, r.h.get('cache-control') === 'private, no-store');
    }
    r = await post({ flags: { panel_fotos_enabled: { enabled: true, source: 'global' } } }, { r: 'publicar', product_id: '550' }, JPG);
    afirma('P1-1 escrita ausente → 404, corpo não lido', r.st === 404 && app().length === 0 && corposLidos() === 0);
    r = await post({ flags: LIGADO, csrf: false }, { r: 'publicar', product_id: '550' }, JPG);
    afirma('P1-1 CSRF inválido → 403, corpo não lido, 0 app', r.st === 403 && app().length === 0 && corposLidos() === 0);
    // P1-2
    r = await pedir({ flags: LIGADO, sess: null }, 'GET', { r: 'galeria', product_id: '550' });
    afirma('P1-2 sem sessão → 401, 0 app', r.st === 401 && app().length === 0);
    r = await pedir({ flags: LIGADO, situacao: { sessao_ativa: false, usuario_ativo: true } }, 'GET', { r: 'galeria', product_id: '550' });
    afirma('P1-2 sessão revogada → 401 SESSION_REVOKED, 0 app', r.st === 401 && r.j?.error === 'SESSION_REVOKED' && app().length === 0);
    r = await post({ flags: LIGADO, situacao: { sessao_ativa: true, usuario_ativo: false } }, { r: 'publicar', product_id: '550' }, JPG);
    afirma('P1-2 usuário desativado → 401 USER_DISABLED, corpo não lido, 0 app', r.st === 401 && r.j?.error === 'USER_DISABLED' && app().length === 0 && corposLidos() === 0);
    r = await pedir({ flags: LIGADO, repoFalha: true }, 'GET', { r: 'galeria', product_id: '550' });
    afirma('P1-2 conferência fora → 503, 0 app', r.st === 503 && app().length === 0);
    // C
    for (const env of ['*', '75,*', '', ' 75']) {
      r = await pedir({ flags: LIGADO, publicadoresEnv: env }, 'GET', { r: 'galeria', product_id: '550' });
      afirma(`C DSHOW_FOTOS_PUBLICADORES=${JSON.stringify(env)} → 403 para o 75, 0 app`, r.st === 403 && app().length === 0);
    }
    afirma('portas P1-1/P1-2/C: NENHUM pedido ao app e o corpo NUNCA lido', app().length === 0 && corposLidos() === 0, `app=${app().length} corpo=${corposLidos()}`);
    // B (aqui as portas passam: a ordem PRECISA ler o corpo para validar a lista — mas nada sai para o app)
    r = await pedir({ flags: LIGADO }, 'GET', { r: 'galeria', product_id: '550abc' });
    afirma('B product_id "550abc" → 422, 0 app', r.st === 422 && app().length === 0);
    r = await post({ flags: LIGADO }, { r: 'ordem' }, JSON.stringify({ product_id: 550, versao: 7, ordem: Array.from({ length: 101 }, (_, i) => i + 1) }));
    afirma('B ordem com 101 ids → 422 recusada, 0 app', r.st === 422 && r.j?.meta?.desfecho === 'recusada' && app().length === 0);
    r = await post({ flags: LIGADO }, { r: 'ordem' }, '{"product_id":550,"versao":7,"ordem":[1,2.0]}');
    afirma('B ordem com decimal 2.0 → 422, 0 app', r.st === 422 && app().length === 0);
    afirma('B ids inválidos: NENHUM pedido ao app', app().length === 0);
    const lidosAntes = corposLidos();
    // tudo ligado: publicar (D 201) — o app recebe os MESMOS bytes, assinados; corpo lido UMA vez
    const ch1 = chave();
    r = await post({ flags: LIGADO }, { r: 'publicar', product_id: '550' }, JPG, ch1);
    const a1 = app().at(-1);
    afirma('D publicar aplicada → 201 + recibo com titular 75 e a MESMA chave', r.st === 201 && r.j?.data?.desfecho === 'aplicada' && r.j?.data?.recibo?.titular_user_id === 75 && r.j?.data?.recibo?.chave === ch1, `${r.st} ${JSON.stringify(r.j)}`);
    afirma('app recebeu 1 pedido assinado com os bytes exatos; corpo lido 1 vez', app().length === 1 && a1.assinaturaOk && a1.sha256 === crypto.createHash('sha256').update(JPG).digest('hex') && a1.query.user_id === '75' && a1.query.request_id === ch1 && corposLidos() === lidosAntes + 1);
    r = await post({ flags: LIGADO }, { r: 'publicar', product_id: '551' }, JPG);
    afirma('D publicar sem_mudanca → 200 (nunca 201)', r.st === 200 && r.j?.data?.desfecho === 'sem_mudanca');
    r = await pedir({ flags: LIGADO }, 'GET', { r: 'galeria', product_id: '550' });
    afirma('P1-3 JSON 200 (galeria) também "private, no-store"', r.st === 200 && r.h.get('cache-control') === 'private, no-store');
    // P1-3
    r = await pedir({ flags: LIGADO }, 'GET', { r: 'imagem', id: '812', t: '256' });
    afirma('P1-3 imagem: Cache-Control "private, no-store", sem max-age, webp', r.st === 200 && r.h.get('cache-control') === 'private, no-store' && r.h.get('content-type') === 'image/webp' && r.buf.subarray(0, 4).toString() === 'RIFF', `${r.st} ${r.h.get('cache-control')}`);
    r = await pedir({ flags: LIGADO }, 'GET', { r: 'imagem', id: '812', t: '256' }, undefined, { 'If-None-Match': '"v1-812-256"' });
    afirma('P1-3 imagem 304 também no-store', r.st === 304 && r.h.get('cache-control') === 'private, no-store');
    // A + ea77d74
    r = await post({ flags: LIGADO }, { r: 'capa' }, JSON.stringify({ id: 901, versao: 7 }));
    afirma('A recibo de OUTRA chave → desconhecido (502), gravado null', r.st === 502 && r.j?.meta?.desfecho === 'desconhecido' && r.j?.meta?.gravado === null);
    const ch9 = chave();
    r = await post({ flags: LIGADO }, { r: 'remover' }, JSON.stringify({ id: 900, versao: 7 }), ch9);
    afirma('ea77d74 409 em_andamento → 409, desfecho em_andamento, gravado null, mesma chave', r.st === 409 && r.j?.meta?.desfecho === 'em_andamento' && r.j?.meta?.gravado === null && r.j?.meta?.chave === ch9, JSON.stringify(r.j));
    r = await post({ flags: LIGADO }, { r: 'restaurar' }, JSON.stringify({ id: 902, versao: 7 }));
    afirma('503 do app → desconhecido', r.j?.meta?.desfecho === 'desconhecido');
    r = await post({ flags: LIGADO }, { r: 'ordem' }, JSON.stringify({ product_id: 550, versao: 7, ordem: ['3', 1, 2] }));
    afirma('ordem correlacionada (3,1,2) → 200 aplicada', r.st === 200 && r.j?.data?.recibo?.ordem?.join(',') === '3,1,2');
    const chC = chave();
    r = await pedir({ flags: LIGADO }, 'GET', { r: 'conferir', chave: chC });
    afirma('conferir: recibo da MESMA chave e titular → aplicada', r.st === 200 && r.j?.data?.resultado === 'aplicada' && r.j?.data?.recibo?.chave === chC);
    afirma('segredo nunca aparece em resposta ou cabeçalho', !tudo.some((t) => t.includes(SEGREDO)));
    afirma('todo pedido que chegou ao app tinha assinatura válida', app().every((x) => x.assinaturaOk));
  } catch (e) { falhas++; console.log('FALHA execução: ' + e.message); }
  finally { pPhp.kill(); pApp.kill(); }
  console.log(`${falhas ? '[ERRO]' : '[OK]  '} teste-proxy-http-103 (harness próprio 127.0.0.1:${PORTA}, app falso :${PORTA_APP}): ${ok} ok, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})();
