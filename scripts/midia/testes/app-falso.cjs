// App FALSO do canal Dash → app (FOTOS-1 / DSHOW-100), SÓ para o teste HTTP do proxy no harness 8114.
// Escuta só em 127.0.0.1:<porta>; confere a assinatura HMAC com o segredo SINTÉTICO de teste (nunca o real) e o corpo; grava cada pedido
// recebido em JSONL (sem o segredo). Respostas no formato do contrato do app (docs/contracts/fotos-canal-publicacao.md).
// Uso: node app-falso.cjs <porta> <arquivo-segredo-teste> <log.jsonl>
const http = require('http'); const crypto = require('crypto'); const fs = require('fs');
const [porta, arqSeg, log] = [Number(process.argv[2]), process.argv[3], process.argv[4]];
const segredo = fs.readFileSync(arqSeg, 'utf8').trim();
const WEBP = Buffer.from('52494646240000005745425056503820180000003001009d012a0100010002003425a400037000fefb94000000', 'hex');
const recibo = (op, chave, extra = {}) => ({ canal: 'dash', chave, confirmado_em: new Date().toISOString(), desfecho: 'aplicada', foto_id: 812, operacao: op, produto_id: 550, versao_nova: 8, ...extra });
http.createServer((req, res) => {
  const partes = []; req.on('data', (c) => partes.push(c)); req.on('end', () => {
    const corpo = Buffer.concat(partes); const u = new URL(req.url, 'http://x');
    const base = `${req.headers['x-dash-ts']}\n${req.headers['x-dash-nonce']}\n${req.method}\n${req.url}\n${crypto.createHash('sha256').update(corpo).digest('hex')}`;
    const sig = crypto.createHmac('sha256', segredo).update(base).digest('hex');
    const assinaturaOk = !!req.headers['x-dash-sig'] && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(String(req.headers['x-dash-sig']).padEnd(64, '0').slice(0, 64)));
    const reg = { quando: Date.now(), metodo: req.method, caminho: u.pathname, query: Object.fromEntries(u.searchParams), host: req.headers.host, assinaturaOk, bytes: corpo.length,
      sha256: crypto.createHash('sha256').update(corpo).digest('hex'), cabecalhos: Object.keys(req.headers).sort() };
    fs.appendFileSync(log, JSON.stringify(reg) + '\n');
    const json = (st, o, h = {}) => { res.writeHead(st, { 'content-type': 'application/json', ...h }); res.end(JSON.stringify(o)); };
    if (!assinaturaOk) return json(401, { error: { code: 'assinatura_invalida', message: 'Assinatura inválida.' }, desfecho: 'recusada', gravado: false });
    const ch = u.searchParams.get('request_id');
    if (req.method === 'GET' && /^\/internal\/dash\/v1\/products\/\d+\/gallery$/.test(u.pathname))
      return json(200, { produto: { id: 550, nome: 'Produto teste', ativo: true, pode_receber_foto: true }, versao_galeria: 7, limite_fotos: 30, fotos: [{ id: 812, capa: true, posicao: 1, origem: 'dshow', autor_user_id: 75, criado_em: '2026-11-19T12:00:00Z', largura: 1, altura: 1, cor: null, versao_arquivo: 1 }], removidas: [] });
    if (req.method === 'GET' && /^\/internal\/dash\/v1\/products\/media\/\d+\/image$/.test(u.pathname)) {
      if (req.headers['if-none-match'] === '"v1-812-256"') { res.writeHead(304, { etag: '"v1-812-256"' }); return res.end(); }
      res.writeHead(200, { 'content-type': 'image/webp', etag: '"v1-812-256"', 'cache-control': 'private, no-store' }); return res.end(WEBP);
    }
    if (req.method === 'GET' && /^\/internal\/dash\/v1\/operacoes\//.test(u.pathname)) return json(200, { estado: 'aplicada', operacao: 'capa', desfecho: 'aplicada', recibo: recibo('capa', u.pathname.split('/').pop()) });
    if (req.method === 'POST' && /\/products\/\d+\/media$/.test(u.pathname)) return json(201, { desfecho: 'aplicada', recibo: recibo('publicar', ch, { duplicada: false }) });
    if (req.method === 'POST' && /\/cover$/.test(u.pathname)) return json(200, { desfecho: 'aplicada', recibo: recibo('capa', ch) });
    if (req.method === 'POST' && /\/remove$/.test(u.pathname)) return json(503, { error: { code: 'indisponivel', message: 'x' }, desfecho: 'desconhecido', gravado: null });
    if (req.method === 'POST' && /\/restore$/.test(u.pathname)) return json(409, { error: { code: 'version_conflict', message: 'As fotos mudaram.' }, desfecho: 'conflito', gravado: false }, { 'x-gallery-version': '9' });
    return json(404, { error: { code: 'nao_encontrado', message: 'x' } });
  });
}).listen(porta, '127.0.0.1', () => console.log(`app-falso ouvindo 127.0.0.1:${porta}`));
