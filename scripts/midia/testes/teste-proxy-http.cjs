// DSHOW-100 · DIREITA · proxy de fotos (/api/midia) pelo HTTP REAL do harness 8114 (código feat/fotos1-dash; Dash de validação) contra o APP
// FALSO (app-falso.cjs) em 127.0.0.1:<porta>, com segredo SINTÉTICO. Fase A (segredo presente): portas, CSRF, recibos, bytes e assinatura
// conferidos do outro lado, desfechos, cache privado, conferir sem efeito, limite, sem vazamento. Fase B (FASE=sem-segredo): 503 recusada,
// nada sai do Dash. Uso: node teste-proxy-http.cjs <log-do-app-falso.jsonl> <arquivo-segredo-teste>   (FASE=sem-segredo para a fase B)
const fs = require('fs'); const crypto = require('crypto');
const B = `http://127.0.0.1:${process.env.PORTA || 8114}`; const [LOG, SEG] = [process.argv[2], process.argv[3]];
const SEGREDO = fs.readFileSync(SEG, 'utf8').trim();
let ok = 0, falhas = 0; const visto = [];
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
const app = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
async function sessao(perfil) {
  const r = await fetch(`${B}/__entrar?perfil=${perfil}&ir=%2F`, { redirect: 'manual' });
  const ck = (r.headers.getSetCookie?.() ?? [r.headers.get('set-cookie')]).filter(Boolean).map((c) => c.split(';')[0]).join('; ');
  const t = await (await fetch(`${B}/api/auth/check.php`, { headers: { cookie: ck } })).json();
  return { ck, csrf: t?.data?.session?.csrf_token ?? '' };
}
const pedir = async (s, metodo, q, corpo, cab = {}) => {
  const r = await fetch(`${B}/api/midia/index.php?${new URLSearchParams(q)}`, { method: metodo, redirect: 'manual',
    headers: { ...(s ? { cookie: s.ck } : {}), ...cab }, body: corpo });
  const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch {}
  visto.push(buf.toString('latin1') + JSON.stringify([...r.headers]));
  return { st: r.status, j, buf, h: r.headers };
};
const chave = () => 'op-teste100-' + crypto.randomBytes(6).toString('hex');
const JPG = Buffer.concat([Buffer.from('ffd8ffe000104a46494600', 'hex'), crypto.randomBytes(2000)]);
(async () => {
  const adm = await sessao('admin');
  if (process.env.FASE === 'sem-segredo') {
    const n0 = app().length; const ch = chave();
    const r = await pedir(adm, 'POST', { r: 'capa' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': ch });
    afirma('B sem segredo: POST capa → 503 APP_UNAVAILABLE, desfecho recusada, gravado false', r.st === 503 && r.j?.error === 'APP_UNAVAILABLE' && r.j?.meta?.desfecho === 'recusada' && r.j?.meta?.gravado === false, JSON.stringify(r.j));
    const g = await pedir(adm, 'GET', { r: 'galeria', product_id: 550 });
    afirma('B sem segredo: galeria → 503', g.st === 503);
    afirma('B sem segredo: NADA chegou ao app', app().length === n0, `${app().length - n0} pedidos`);
  } else {
    // portas
    const sem = await pedir(null, 'GET', { r: 'galeria', product_id: 550 });
    afirma('A sem sessão → 401', sem.st === 401, sem.st);
    const sf = await sessao('semflag'); const r404 = await pedir(sf, 'GET', { r: 'galeria', product_id: 550 });
    afirma('A pessoa fora da flag (semflag 990070) → 404', r404.st === 404, r404.st);
    const eq = await sessao('equipe'); const n0 = app().length; const r403 = await pedir(eq, 'GET', { r: 'galeria', product_id: 550 });
    afirma('A usuário que não é publicador (equipe 990050) → 403 (ou 404 se fora da flag) e nada vai ao app', [403, 404].includes(r403.st) && app().length === n0, `${r403.st} ${JSON.stringify(r403.j)}`);
    const rx = await pedir(adm, 'GET', { r: 'apagar_tudo' });
    afirma('A rota desconhecida → 404', rx.st === 404);
    // galeria: destino fixo, assinatura conferida no app, user_id assinado
    const g = await pedir(adm, 'GET', { r: 'galeria', product_id: 550 }); const ga = app().at(-1);
    afirma('A galeria 200 com a galeria do app', g.st === 200 && g.j?.data?.versao_galeria === 7 && g.j?.data?.fotos?.[0]?.id === 812, JSON.stringify(g.j).slice(0, 200));
    afirma('A o app recebeu em 127.0.0.1, caminho /internal/dash/v1/products/550/gallery, user_id=990080, assinatura CONFERIDA', ga?.host?.startsWith('127.0.0.1:') && ga.caminho === '/internal/dash/v1/products/550/gallery' && ga.query.user_id === '990080' && ga.assinaturaOk === true, JSON.stringify(ga));
    // CSRF
    let n1 = app().length; const ch1 = chave();
    const semCsrf = await pedir(adm, 'POST', { r: 'capa' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-Chave-Operacao': ch1 });
    afirma('A POST sem CSRF → 403 e nada vai ao app', semCsrf.st === 403 && app().length === n1, `${semCsrf.st} ${JSON.stringify(semCsrf.j)}`);
    const csrfRuim = await pedir(adm, 'POST', { r: 'capa' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': 'x'.repeat(64), 'X-Chave-Operacao': ch1 });
    afirma('A POST com CSRF inválido → 403 e nada vai ao app', csrfRuim.st === 403 && app().length === n1, csrfRuim.st);
    // capa: recibo + POST sem corpo assinado
    const capa = await pedir(adm, 'POST', { r: 'capa' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': ch1 }); const ca = app().at(-1);
    afirma('A capa → 200 aplicada com recibo (foto_capa, mesma chave, versao_nova)', capa.st === 200 && capa.j?.data?.desfecho === 'aplicada' && capa.j?.data?.recibo?.operacao === 'foto_capa' && capa.j?.data?.recibo?.chave === ch1 && capa.j?.data?.recibo?.versao_nova === 8, JSON.stringify(capa.j));
    afirma('A o app recebeu POST /cover com corpo VAZIO, request_id = chave, versao=7, assinatura conferida', ca.metodo === 'POST' && ca.caminho === '/internal/dash/v1/products/media/812/cover' && ca.bytes === 0 && ca.query.request_id === ch1 && ca.query.versao === '7' && ca.assinaturaOk, JSON.stringify(ca));
    // publicar: bytes idênticos nas duas pontas
    const ch2 = chave(); const pub = await pedir(adm, 'POST', { r: 'publicar', product_id: 550 }, JPG, { 'Content-Type': 'application/octet-stream', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': ch2 }); const pa = app().at(-1);
    afirma('A publicar → 201 aplicada com recibo foto_publicar', pub.st === 201 && pub.j?.data?.recibo?.operacao === 'foto_publicar' && pub.j?.data?.recibo?.chave === ch2, JSON.stringify(pub.j));
    afirma('A o app recebeu os MESMOS bytes (tamanho e sha256) com a assinatura conferida', pa.bytes === JPG.length && pa.sha256 === crypto.createHash('sha256').update(JPG).digest('hex') && pa.assinaturaOk, JSON.stringify(pa));
    n1 = app().length; const ruim = await pedir(adm, 'POST', { r: 'publicar', product_id: 550 }, Buffer.from('%PDF-1.4 xxxx'), { 'Content-Type': 'application/octet-stream', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': chave() });
    afirma('A publicar PDF → 415 recusada, nada vai ao app', ruim.st === 415 && ruim.j?.meta?.desfecho === 'recusada' && app().length === n1, ruim.st);
    // desfechos 503 → desconhecido; 409 → conflito
    const ch3 = chave(); const rem = await pedir(adm, 'POST', { r: 'remover' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': ch3 });
    afirma('A app 503 → 502 RESULTADO_DESCONHECIDO, desfecho desconhecido, MESMA chave', rem.st === 502 && rem.j?.meta?.desfecho === 'desconhecido' && rem.j?.meta?.chave === ch3, JSON.stringify(rem.j));
    const res = await pedir(adm, 'POST', { r: 'restaurar' }, JSON.stringify({ id: 812, versao: 7 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': chave() });
    afirma('A app 409 → 409 VERSION_CONFLICT, conflito, versao_atual 9', res.st === 409 && res.j?.error === 'VERSION_CONFLICT' && res.j?.meta?.desfecho === 'conflito' && res.j?.meta?.versao_atual === 9, JSON.stringify(res.j));
    n1 = app().length; const ord = await pedir(adm, 'POST', { r: 'ordem' }, JSON.stringify({ product_id: 550, versao: 7, ordem: Array.from({ length: 101 }, (_, i) => i + 1) }), { 'Content-Type': 'application/json', 'X-CSRF-Token': adm.csrf, 'X-Chave-Operacao': chave() });
    afirma('A ordem com 101 IDs → 422, nada vai ao app', ord.st === 422 && app().length === n1, ord.st);
    // imagem: cache privado, ETag, 304
    const im = await pedir(adm, 'GET', { r: 'imagem', id: 812, t: 256 });
    afirma('A imagem 200 image/webp com Cache-Control private e ETag do app', im.st === 200 && /^image\/webp/.test(im.h.get('content-type') || '') && /private/.test(im.h.get('cache-control') || '') && !/public/.test(im.h.get('cache-control') || '') && im.h.get('etag') === '"v1-812-256"' && im.h.get('x-content-type-options') === 'nosniff', JSON.stringify([...im.h]));
    const im2 = await pedir(adm, 'GET', { r: 'imagem', id: 812, t: 256 }, undefined, { 'If-None-Match': '"v1-812-256"' });
    afirma('A If-None-Match → 304 sem corpo', im2.st === 304 && im2.buf.length === 0, im2.st);
    // conferir: GET sem efeito
    n1 = app().length; const cf = await pedir(adm, 'GET', { r: 'conferir', chave: ch1 }); const cfa = app().slice(n1);
    afirma('A conferir → 200 resultado aplicada com o recibo (foto_capa)', cf.st === 200 && cf.j?.data?.resultado === 'aplicada' && cf.j?.data?.recibo?.operacao === 'foto_capa', JSON.stringify(cf.j));
    afirma('A conferir chegou ao app como UM GET /operacoes/<chave>, sem corpo e sem request_id', cfa.length === 1 && cfa[0].metodo === 'GET' && cfa[0].caminho === `/internal/dash/v1/operacoes/${ch1}` && cfa[0].bytes === 0 && !('request_id' in cfa[0].query), JSON.stringify(cfa));
    // nenhum vazamento
    const php = (() => { try { return fs.readFileSync('/srv/dshow-modularizacao/atributos-web/validacao/shell-direita/logs/php.log', 'utf8').slice(-200000); } catch { return ''; } })();
    afirma('A o segredo não aparece em nenhuma resposta, cabeçalho, no log do app falso nem no php.log do harness', !visto.join('').includes(SEGREDO) && !fs.readFileSync(LOG, 'utf8').includes(SEGREDO) && !php.includes(SEGREDO));
    afirma('A todos os pedidos que chegaram ao app tinham assinatura válida (nenhum 401 de assinatura)', app().every((x) => x.assinaturaOk));
  }
  console.log(`${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e); process.exit(2); });
