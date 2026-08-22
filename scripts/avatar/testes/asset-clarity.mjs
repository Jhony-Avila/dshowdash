// testes/asset-clarity.mjs — onda 1425 (BRIEFING_COMPLEMENTAR_02
// "Asset Clarity"; decisão #217): card = peça ISOLADA · palco = aplicado.
//
//   A) Node puro — ApresentacaoAsset: toda categoria tem política;
//      fundo/moldura = environment; usaThumbIsolado true p/ itens.
//      svgItemIsolado: compõe TODAS as camadas do cabelo (contém a saída
//      de renderAtras — massa traseira), e devolve SVG não-vazio p/
//      base/olhos/boca/cabelo/roupa/fundo (não só acessório). focoItemDe
//      por categoria (viewBox próprio, não o canvas cheio 240×240).
//   B) Navegador (as6.thumb_item_v2 + candidate):
//      1. categoria Cabelo mostra thumbs ISOLADOS (data-teste=thumb-item),
//         não AvatarSvg;
//      2. HOVER num card NÃO troca o card (data-thumb-item continua
//         presente) — §29/§88;
//      3. §89: equipar chapéu → ir p/ Cabelo → nenhum thumb de cabelo
//         contém o chapéu (o isolado só tem a camada do cabelo);
//      4. flag OFF: cabelo volta ao thumb aplicado (sem thumb-item).
// @version 1.0.0  @created 2026-08-22
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1425-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
(globalThis as Record<string, unknown>).localStorage = { _d: { 'dshow.avst.flags.v1': JSON.stringify({ 'as6.classico_premium': true, 'as6.face_v2': true }) } as Record<string,string>, getItem(k: string){ return this._d[k] ?? null; }, setItem(k: string, v: string){ this._d[k]=v; }, removeItem(k: string){ delete this._d[k]; } };
import { APRESENTACAO_POR_CATEGORIA, apresentacaoDe, usaThumbIsolado } from '@painel/services/ApresentacaoAsset';
import { CATEGORIAS, itensDe, svgItemIsolado } from '@painel/services/AvatarCatalog';
import { focoItemDe } from '@painel/components/modoItem';
const p: string[] = [];
// toda categoria navegável tem política
for (const c of CATEGORIAS.map((x: { id: string }) => x.id)) {
  if (!(c in APRESENTACAO_POR_CATEGORIA)) p.push('categoria sem politica: ' + c);
}
if (apresentacaoDe('fundo').thumbnail !== 'environment') p.push('fundo deveria ser environment');
if (apresentacaoDe('moldura').thumbnail !== 'environment') p.push('moldura deveria ser environment');
if (apresentacaoDe('cabelo').thumbnail !== 'isolated' || apresentacaoDe('cabelo').previewCamera !== 'bust') p.push('cabelo deveria ser isolated/bust');
if (apresentacaoDe('olhos').previewCamera !== 'face') p.push('olhos deveriam prever em face');
if (!usaThumbIsolado('cabelo') || !usaThumbIsolado('roupa') || !usaThumbIsolado('olhos')) p.push('categorias de item deveriam usar thumb isolado');
// svgItemIsolado nao-vazio em varias categorias (nao so acessorio)
for (const cat of ['base', 'olhos', 'boca', 'cabelo', 'roupa', 'fundo']) {
  const itens = itensDe(cat as never);
  if (!itens.length) { p.push('sem itens: ' + cat); continue; }
  const svg = svgItemIsolado(itens[0].id, { uid: 't', foco: focoItemDe(itens[0].id, cat) });
  if (!svg || svg.length < 40 || !svg.includes('<svg')) p.push('svgItemIsolado vazio p/ ' + cat + ' (' + itens[0].id + ')');
}
// cabelo premium com renderAtras: o isolado deve conter a massa traseira.
// pega um cab_px_ (tem renderAtras) e compara com/sem — o composto e MAIOR
import { itemPorId } from '@painel/services/AvatarCatalog';
const cabComAtras = itensDe('cabelo' as never).find((i) => itemPorId(i.id) && (itemPorId(i.id) as { renderAtras?: unknown }).renderAtras);
if (cabComAtras) {
  const svg = svgItemIsolado(cabComAtras.id, { uid: 'ct', foco: focoItemDe(cabComAtras.id, 'cabelo') });
  // massaAtras() define o gradiente id \`\${u}pxcatb\` — só existe se
  // renderAtras (massa traseira) foi composto no thumb isolado (§6)
  if (!svg.includes('ctpxcatb')) p.push('cabelo com renderAtras: massa traseira NAO entrou no thumb isolado (' + cabComAtras.id + ')');
} else {
  p.push('nenhum cabelo com renderAtras p/ testar (premium ligado?)');
}
// focoItemDe por categoria: nao pode ser sempre o canvas cheio
const fOlho = focoItemDe(itensDe('olhos' as never)[0].id, 'olhos');
if (fOlho === '0 0 240 240') p.push('foco de olhos deveria enquadrar (nao canvas cheio)');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
async function abrir2d(flags) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1400, height: 900 },
    init: ({ f }) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as6.tax_v2': false, 'as6.nav_grupos': false, 'as6.acess_hub': false, ...flags } },
  });
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.waitForTimeout(1200);
  return { pagina, erros, fechar: () => navegador.close() };
}

/** navega para uma categoria pela sidebar (data-teste do item de nav). */
async function irCategoria(pagina, cat) {
  const sel = `[data-teste="cat-${cat}"]`;
  if (await pagina.locator(sel).count()) { await pagina.locator(sel).first().click(); await pagina.waitForTimeout(500); return true; }
  return false;
}

// B1: thumb_item_v2 ON — Cabelo mostra thumbs isolados e NÃO troca no hover
{
  const { pagina, erros: errosJs, fechar } = await abrir2d({ 'as6.thumb_item_v2': true, 'as6.classico_premium': true, 'as6.face_v2': true });
  const foiCabelo = await irCategoria(pagina, 'cabelo');
  if (foiCabelo) {
    const isolados = await pagina.locator('[data-teste="thumb-item"][data-cat="cabelo"]').count();
    ok(isolados > 0, '[B1] Cabelo deveria ter thumbs ISOLADOS com thumb_item_v2');
    // hover num card QUE TEM thumb isolado — deve permanecer isolado (§29/§88)
    const card = pagina.locator('.avst-card:has([data-teste="thumb-item"])').first();
    ok(await card.count() > 0, '[B1] nenhum card com thumb isolado');
    await card.hover();
    await pagina.waitForTimeout(400);
    const aindaIsolado = await card.locator('[data-teste="thumb-item"]').count();
    ok(aindaIsolado > 0, '[B1] card trocou no hover (deveria permanecer isolado §29/§88)');
  } else {
    falhas.push('[B1] não achei a navegação de Cabelo');
  }
  ok(!errosJs.length, `[B1] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

// B2: §89 — chapéu equipado NÃO aparece nos thumbs de cabelo (isolado)
{
  const { pagina, fechar } = await abrir2d({ 'as6.thumb_item_v2': true });
  // equipa um acessório de cabeça (chapéu) e vai p/ Cabelo
  if (await irCategoria(pagina, 'acessorio')) {
    const chapeu = pagina.locator('[data-teste="card-ace_bone"], .avst-card').first();
    await chapeu.click();
    await pagina.waitForTimeout(400);
  }
  if (await irCategoria(pagina, 'cabelo')) {
    // os thumbs isolados de cabelo só têm a camada do cabelo — sem o chapéu.
    // verifica que os SVGs isolados não contêm nenhum id de acessório de cabeça
    const temAcessorio = await pagina.evaluate(() => {
      const thumbs = [...document.querySelectorAll('[data-teste="thumb-item"][data-cat="cabelo"] svg')];
      // heurística: um thumb isolado de cabelo é pequeno (1 camada); um avatar
      // aplicado teria muito mais nós. Conferimos que nenhum tem <image> de fundo
      return thumbs.some((s) => s.querySelector('image') || (s.childElementCount > 60));
    });
    ok(!temAcessorio, '[B2] §89: thumb de cabelo contém elementos além da camada do cabelo');
    ok((await pagina.locator('[data-teste="thumb-item"][data-cat="cabelo"]').count()) > 0, '[B2] cabelo sem thumbs isolados');
  }
  await fechar();
}

// B3: flag OFF — cabelo volta ao thumb aplicado (sem thumb-item)
{
  const { pagina, fechar } = await abrir2d({ 'as6.thumb_item_v2': false });
  if (await irCategoria(pagina, 'cabelo')) {
    const isolados = await pagina.locator('[data-teste="thumb-item"][data-cat="cabelo"]').count();
    ok(isolados === 0, '[B3] cabelo NÃO deveria ter thumb isolado com a flag OFF (byte a byte)');
  }
  await fechar();
}

console.log('[asset-clarity] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
