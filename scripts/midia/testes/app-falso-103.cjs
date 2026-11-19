// DSHOW-103 (ACIMA_DIREITA) — app FALSO do canal Dash → app, contrato do app ≥ ea77d74: recibo CORRELACIONADO ao pedido (chave = request_id,
// titular_user_id = user_id assinado, foto/produto do caminho, ordem da query), sem_mudanca = 200, 409 em_andamento (posse perdida).
// Confere a assinatura HMAC com o segredo SINTÉTICO; registra cada pedido em JSONL (sem segredo). Só 127.0.0.1.
// Modos pelo id: produto 551 → sem_mudanca · foto 900 → 409 em_andamento · foto 901 → recibo de OUTRA chave · foto 902 → 503 desconhecido.
// Uso: node app-falso-103.cjs <porta> <arquivo-segredo-teste> <log.jsonl>
const http = require('http'); const crypto = require('crypto'); const fs = require('fs');
const [porta, arqSeg, log] = [Number(process.argv[2]), process.argv[3], process.argv[4]];
const segredo = fs.readFileSync(arqSeg, 'utf8').trim();
const WEBP = Buffer.from('52494646240000005745425056503820180000003001009d012a0100010002003425a400037000fefb94000000', 'hex');
http.createServer((req, res) => {
  const partes = []; req.on('data', (c) => partes.push(c)); req.on('end', () => {
    const corpo = Buffer.concat(partes); const u = new URL(req.url, 'http://x'); const q = Object.fromEntries(u.searchParams);
    const base = `${req.headers['x-dash-ts']}\n${req.headers['x-dash-nonce']}\n${req.method}\n${req.url}\n${crypto.createHash('sha256').update(corpo).digest('hex')}`;
    const sig = crypto.createHmac('sha256', segredo).update(base).digest('hex');
    const assinaturaOk = typeof req.headers['x-dash-sig'] === 'string' && req.headers['x-dash-sig'].length === 64 && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(req.headers['x-dash-sig']));
    fs.appendFileSync(log, JSON.stringify({ metodo: req.method, caminho: u.pathname, query: q, assinaturaOk, bytes: corpo.length, sha256: crypto.createHash('sha256').update(corpo).digest('hex') }) + '\n');
    const json = (st, o, h = {}) => { res.writeHead(st, { 'content-type': 'application/json', ...h }); res.end(JSON.stringify(o)); };
    if (!assinaturaOk) return json(401, { error: { code: 'assinatura_invalida', message: 'Assinatura inválida.' }, desfecho: 'recusada', gravado: false });
    const ch = q.request_id; const tit = Number(q.user_id);
    const recibo = (op, x = {}) => ({ canal: 'dash', chave: ch, confirmado_em: '2026-11-19T12:00:00.000Z', desfecho: 'aplicada', foto_id: 812, operacao: op, produto_id: 550, titular_user_id: tit, versao_nova: 8, ...x });
    let m;
    if (req.method === 'GET' && (m = u.pathname.match(/\/products\/(\d+)\/gallery$/))) return json(200, { produto: { id: Number(m[1]), nome: 'Produto teste', ativo: true, pode_receber_foto: true }, versao_galeria: 7, limite_fotos: 30, fotos: [], removidas: [] });
    if (req.method === 'GET' && /\/products\/media\/\d+\/image$/.test(u.pathname)) {
      if (req.headers['if-none-match'] === '"v1-812-256"') { res.writeHead(304, { etag: '"v1-812-256"' }); return res.end(); }
      res.writeHead(200, { 'content-type': 'image/webp', etag: '"v1-812-256"', 'cache-control': 'private, no-store' }); return res.end(WEBP);
    }
    if (req.method === 'GET' && (m = u.pathname.match(/\/operacoes\/([A-Za-z0-9_-]+)$/))) return json(200, { estado: 'aplicada', operacao: 'capa', desfecho: 'aplicada', recibo: { ...recibo('capa'), chave: m[1] } });
    if (req.method === 'POST' && (m = u.pathname.match(/\/products\/(\d+)\/media$/))) {
      const pid = Number(m[1]);
      if (pid === 551) return json(200, { desfecho: 'sem_mudanca', recibo: recibo('publicar', { produto_id: pid, desfecho: 'sem_mudanca', duplicada: true }) });
      return json(201, { desfecho: 'aplicada', recibo: recibo('publicar', { produto_id: pid, duplicada: false }) });
    }
    if (req.method === 'POST' && (m = u.pathname.match(/\/products\/(\d+)\/media\/order$/))) return json(200, { desfecho: 'aplicada', recibo: recibo('ordem', { produto_id: Number(m[1]), foto_id: null, ordem: q.ordem.split(',').map(Number) }) });
    if (req.method === 'POST' && (m = u.pathname.match(/\/products\/media\/(\d+)\/(cover|remove|restore)$/))) {
      const id = Number(m[1]); const op = { cover: 'capa', remove: 'remover', restore: 'restaurar' }[m[2]];
      if (id === 900) return json(409, { error: { code: 'request_in_progress', message: 'Em andamento.' }, desfecho: 'em_andamento', gravado: null, chave: ch });
      if (id === 901) return json(200, { desfecho: 'aplicada', recibo: recibo(op, { foto_id: id, chave: 'op-de-outra-intencao-000' }) });
      if (id === 902) return json(503, { error: { code: 'upstream_unavailable', message: 'x' }, desfecho: 'desconhecido', gravado: null, chave: ch });
      return json(200, { desfecho: 'aplicada', recibo: recibo(op, { foto_id: id }) });
    }
    return json(404, { error: { code: 'nao_encontrado', message: 'x' } });
  });
}).listen(porta, '127.0.0.1', () => console.log(`app-falso-103 ouvindo 127.0.0.1:${porta}`));
