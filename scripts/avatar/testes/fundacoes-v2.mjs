// testes/fundacoes-v2.mjs — lote 271–280 (§267/§274–§277/§283/§287/§290–
// §291, flag as5.fundacoes_v2): A6 fundações. Duas partes:
//   1. CONTRATO (página efêmera): manifest por categoria §267 (derivação
//      local pura · override remoto só de disponibilidade · id
//      desconhecido ignorado), cache multinível §277 (memória → IndexedDB
//      → rede, sobrevive a reload, esquecer() invalida) e logging §291 v2
//      (crítico persiste no ring, sobrevive a reload, limpa).
//   2. UI (harness): lazy §275 — chunk do overlay só atravessa a rede na
//      PRIMEIRA abertura; tokens §283/§287 presentes no root.
// @version 1.0.0  @created 2026-08-05
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const PORTA = 8913;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE 1: contrato (manifest + cache + log crítico) ───────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-fnd-'));
writeFileSync(join(dir, 'entrada.ts'), `
import { manifestoDaCategoria } from '${PAINEL}/src/services/ManifestCatalogo';
import { lembrar, esquecer } from '${PAINEL}/src/services/CacheNiveis';
import { log, lerCriticos, limparCriticos } from '${PAINEL}/src/services/Log';
(window as any).__api = { manifestoDaCategoria, lembrar, esquecer, log, lerCriticos, limparCriticos };
(window as any).__bundlePronto = true;
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm ` +
  `--outfile="${join(dir, 'bundle.js')}"`, { stdio: 'inherit' });

let hitsManifest = 0;
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html><head><meta charset="utf-8"></head><body><script type="module" src="/bundle.js"></script></body></html>');
      return;
    }
    if (url === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(await readFile(join(dir, 'bundle.js')));
      return;
    }
    if (url === '/assets/avatars/manifests/cabelo.json') {
      hitsManifest += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ indisponiveis: ['cab_moicano', 'cab_nao_existe'] }));
      return;
    }
    if (url.startsWith('/assets/avatars/manifests/')) { res.writeHead(404); res.end(); return; }
    res.writeHead(404); res.end();
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => srv.listen(PORTA, '127.0.0.1', r));

const { chromium } = await import('playwright-core');
let nav1 = null;
try {
  nav1 = await chromium.launch({
    executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const ctx = await nav1.newContext();
  const p = await ctx.newPage();
  const errosPag = [];
  p.on('pageerror', (e) => errosPag.push(e.message.slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });

  // §267 flag OFF: derivação local pura, zero rede
  const local = await p.evaluate(async () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.fundacoes_v2': false }));
    const m = await window.__api.manifestoDaCategoria('cabelo');
    return { origem: m.origem, n: m.itens.length, campos: Object.keys(m.itens[0] ?? {}) };
  });
  ok(local.origem === 'catalogo', 'flag off deveria derivar do catálogo');
  ok(local.n > 0, 'manifest local vazio');
  ok(local.campos.includes('dependencias') && local.campos.includes('incompatibilidades'),
    'entradas sem dependências/compatibilidade (§267)');
  ok(hitsManifest === 0, 'flag off não poderia tocar a rede');

  // §267 flag ON: remoto marca indisponível SÓ em id conhecido
  const remoto = await p.evaluate(async () => {
    localStorage.removeItem('dshow.avst.flags.v1'); // padrão = flag ON
    const m = await window.__api.manifestoDaCategoria('cabelo');
    return {
      origem: m.origem,
      moicano: m.itens.find((i) => i.id === 'cab_moicano')?.indisponivel === true,
      fantasma: m.itens.some((i) => i.id === 'cab_nao_existe'),
    };
  });
  ok(remoto.origem === 'remoto', 'override remoto não aplicou');
  ok(remoto.moicano, 'id conhecido não foi marcado indisponível');
  ok(!remoto.fantasma, 'id desconhecido NUNCA pode entrar no manifest');
  ok(hitsManifest === 1, `esperava 1 hit de rede, veio ${hitsManifest}`);

  // §277: segunda chamada = cache (0 hits novos); esquecer() invalida
  await p.evaluate(() => window.__api.manifestoDaCategoria('cabelo'));
  ok(hitsManifest === 1, 'cache de memória não segurou a 2ª chamada');
  await p.evaluate(async () => {
    window.__api.esquecer('manifest:cabelo');
    await window.__api.manifestoDaCategoria('cabelo');
  });
  ok(hitsManifest === 2, 'esquecer() não invalidou o cache');

  // §277: RELOAD → memória zera, IndexedDB responde (0 hits novos)
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  await p.evaluate(() => window.__api.manifestoDaCategoria('cabelo'));
  ok(hitsManifest === 2, `IndexedDB deveria responder após reload (hits=${hitsManifest})`);

  // §291 v2: crítico persiste, sobrevive a reload e limpa
  await p.evaluate(() => {
    window.__api.limparCriticos();
    window.__api.log.critico('teste_critico', { origem: 'fundacoes-v2' });
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__bundlePronto === true, { timeout: 20000 });
  const criticos = await p.evaluate(() => {
    const antes = window.__api.lerCriticos();
    window.__api.limparCriticos();
    return { n: antes.length, evento: antes[0]?.evento, depois: window.__api.lerCriticos().length };
  });
  ok(criticos.n === 1 && criticos.evento === 'teste_critico',
    'crítico não sobreviveu ao reload (§291 v2)');
  ok(criticos.depois === 0, 'limparCriticos não limpou');
  ok(errosPag.length === 0, `erros JS no contrato: ${errosPag.join(' | ')}`);
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  await nav1?.close().catch(() => {});
  srv.close();
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE 2: UI no harness — lazy §275 + tokens §283/§287 ────────────
const { navegador: b, pagina: p2, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  // ANTES de abrir: o chunk do Atalhos não pode ter atravessado a rede
  const antes = await p2.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => r.name.includes('/chunks/Atalhos.')).length);
  ok(antes === 0, 'chunk do Atalhos carregou cedo demais (§275)');
  await p2.keyboard.press('?');
  await p2.waitForSelector('[data-teste="atalhos"], .avst5-atalhos', { timeout: 8000 });
  const depois = await p2.evaluate(() =>
    performance.getEntriesByType('resource').filter((r) => r.name.includes('/chunks/Atalhos.')).length);
  ok(depois === 1, 'abrir o overlay deveria buscar o chunk sob demanda');
  await p2.keyboard.press('Escape');

  // tokens §283 v2 (sombra/borda) e §287 v2 (hierarquia) no root
  const tokens = await p2.evaluate(() => {
    const el = document.querySelector('[data-avst-react-root]');
    const cs = el ? getComputedStyle(el) : null;
    return {
      sombra: cs?.getPropertyValue('--t-sombra-2').trim() ?? '',
      borda: cs?.getPropertyValue('--t-borda-fina').trim() ?? '',
      hero: cs?.getPropertyValue('--t-tipo-hero').trim() ?? '',
      micro: cs?.getPropertyValue('--t-tipo-micro').trim() ?? '',
    };
  });
  ok(tokens.sombra.length > 0, 'token --t-sombra-2 ausente (§283 v2)');
  ok(tokens.borda.length > 0, 'token --t-borda-fina ausente (§283 v2)');
  ok(tokens.hero === '22px' && tokens.micro.length > 0, 'hierarquia §287 v2 ausente');
  await p2.screenshot({ path: `${SAIDA}/fundacoes-v2.png` });
} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}

const ok_ = relatorio('fundacoes-v2', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
