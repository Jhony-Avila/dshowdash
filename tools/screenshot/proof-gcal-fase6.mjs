// Prova a Fase 6: vínculos com registros REAIS de Pipedrive e Koala (§32, §57).
//
// O que esta prova verifica de verdade: que a busca traz registro do CRM real,
// que anexar persiste no evento, que a ficha lateral abre os dados vivos da
// origem, e que remover volta ao estado anterior.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/8c88ec85-e267-42fe-b900-d339ee8df790/scratchpad';
const log = (...a) => console.log(...a);
const r = {};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn]', e.message); }
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e).slice(0, 180)));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(3000);
await page.evaluate(() => { location.hash = '#/panel-google-calendar/hoje'; });
await page.waitForSelector('[data-gc-react-root] .gc-layout', { timeout: 25000 });
await page.waitForTimeout(2200);

/* ── 1. Abrir um evento e achar a seção Relacionado ────────────────── */
log('\n[1] Seção "Relacionado" no drawer:');
{
  // Um evento do calendário próprio (onde há permissão de escrita).
  await page.locator('.gc-timeline .gc-lev').nth(1).click();
  await page.waitForSelector('.gc-drawer', { timeout: 10000 });
  await page.waitForTimeout(900);
  const sec = await page.locator('.gc-drawer-sec').filter({ hasText: 'Relacionado' }).count();
  const btn = await page.getByRole('button', { name: /Vincular/i }).count();
  const fichas = await page.locator('.gc-ficha').count();
  log(`  seção: ${sec > 0} · botão Vincular: ${btn > 0} · vínculos já existentes: ${fichas}`);
  r.secaoRelacionado = sec > 0 && btn > 0;
}

/* ── 2. Ficha lateral abre dados VIVOS da origem (§32.2) ───────────── */
log('\n[2] Ficha lateral com dado real:');
{
  const temFicha = await page.locator('.gc-ficha-cabeca').count();
  if (temFicha > 0) {
    await page.locator('.gc-ficha-cabeca').first().click();
    await page.waitForTimeout(2200);
    const campos = await page.locator('.gc-ficha-corpo .gc-defs > div').count();
    const abrirEm = await page.locator('.gc-ficha-acoes button').filter({ hasText: /Abrir no/i }).count();
    const sumiu = await page.locator('.gc-aviso-cancelado').count();
    const texto = campos > 0
      ? (await page.locator('.gc-ficha-corpo .gc-defs').first().innerText()).replace(/\n/g, ' · ').slice(0, 90)
      : '';
    log(`  campos: ${campos} · botão "Abrir no": ${abrirEm > 0} · aviso de origem sumida: ${sumiu}`);
    if (campos) log(`  conteúdo: ${texto}`);
    // Vale tanto ficha carregada quanto o aviso honesto de que a origem sumiu.
    r.fichaLateral = (campos >= 2 && abrirEm > 0) || sumiu > 0;
    await page.screenshot({ path: `${OUT}/f6-ficha.png` });
  } else {
    log('  (evento sem vínculo — será coberto no passo 3)');
    r.fichaLateral = null;
  }
}

/* ── 3. Buscar no CRM REAL e vincular ──────────────────────────────── */
log('\n[3] Buscar no Pipedrive/Koala e vincular:');
{
  const antes = await page.locator('.gc-ficha').count();
  await page.getByRole('button', { name: /^Vincular$/i }).first().click();
  await page.waitForSelector('.gc-modal', { timeout: 8000 });
  await page.waitForTimeout(600);

  const tipos = await page.locator('.gc-modal .gc-chip').allInnerTexts();
  log(`  filtros de tipo: ${tipos.join(', ')}`);

  await page.locator('.gc-modal input').first().fill('painel');
  await page.waitForTimeout(2600);          // debounce 320ms + consulta real

  const achados = await page.locator('.gc-vinc-item').count();
  const primeiro = achados
    ? (await page.locator('.gc-vinc-item').first().innerText()).replace(/\n/g, ' · ').slice(0, 84)
    : '';
  const fontes = await page.locator('.gc-vinc-fim .gc-tag').allInnerTexts();
  log(`  resultados: ${achados}`);
  if (achados) log(`  1º: ${primeiro}`);
  log(`  fontes marcadas: ${[...new Set(fontes)].join(', ')}`);
  r.buscaReal = achados > 0 && fontes.some((f) => /Pipedrive|Koala/.test(f));
  if (achados) await page.screenshot({ path: `${OUT}/f6-busca.png` });

  if (achados > 0) {
    await page.locator('.gc-vinc-item').first().click();
    await page.waitForTimeout(2600);
    const depois = await page.locator('.gc-ficha').count();
    const toast = await page.locator('.gc-toast-ok').count();
    log(`  vínculos: ${antes} → ${depois} · toast de sucesso: ${toast > 0}`);
    r.vinculou = depois === antes + 1;
  } else { r.vinculou = false; }
}

/* ── 4. A ficha do vínculo recém-criado carrega da origem ──────────── */
log('\n[4] Ficha do vínculo recém-criado:');
{
  const fichas = await page.locator('.gc-ficha-cabeca').count();
  if (fichas > 0) {
    await page.locator('.gc-ficha-cabeca').last().click();
    await page.waitForTimeout(2400);
    const campos = await page.locator('.gc-ficha-corpo .gc-defs > div').count();
    const atividades = await page.locator('.gc-ficha-atividades li').count();
    log(`  campos: ${campos} · atividades do CRM: ${atividades}`);
    r.fichaNova = campos >= 2;
    await page.screenshot({ path: `${OUT}/f6-ficha-nova.png` });
  } else { r.fichaNova = false; }
}

/* ── 5. Remover o vínculo volta ao estado anterior ─────────────────── */
log('\n[5] Remover vínculo:');
{
  const antes = await page.locator('.gc-ficha').count();
  const btn = page.getByRole('button', { name: /Remover vínculo/i }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(2400);
    const depois = await page.locator('.gc-ficha').count();
    log(`  vínculos: ${antes} → ${depois}`);
    r.removeu = depois === antes - 1;
  } else { log('  ✗ botão não encontrado'); r.removeu = false; }
}

/* ── 6. Calendário sem escrita NÃO oferece vincular (§30) ──────────── */
log('\n[6] Calendário somente-leitura não permite vincular:');
{
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // O bloco da Diretoria é freeBusyReader (redigido).
  const priv = page.locator('.gc-timeline .gc-lev').filter({ hasText: 'Ocupado' }).first();
  if (await priv.count()) {
    await priv.click();
    await page.waitForSelector('.gc-drawer', { timeout: 8000 });
    await page.waitForTimeout(900);
    const btn = await page.getByRole('button', { name: /^Vincular$/i }).count();
    const aviso = await page.locator('.gc-aviso-privado').count();
    log(`  botão Vincular: ${btn} (esperado 0) · aviso de privacidade: ${aviso > 0}`);
    r.somenteLeitura = btn === 0 && aviso > 0;
  } else { log('  (evento privado não encontrado na timeline)'); r.somenteLeitura = null; }
}

log('\n=== RESUMO FASE 6 ===');
log(JSON.stringify({ ...r, errosPagina: erros.slice(0, 5) }, null, 2));
const falhas = Object.entries(r).filter(([, v]) => v === false).map(([k]) => k);
log(falhas.length ? `FALHAS: ${falhas.join(', ')}` : 'TODOS OS CHECKS PASSARAM');
await browser.close();
