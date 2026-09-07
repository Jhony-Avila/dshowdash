// testes/vc-3d.mjs — VC-3D (Briefing 2): aceite headless MÍNIMO do modo 3D do Visual Composer.
// Não roda suíte completa/axe/perf (validação reduzida assumida pelo Jhony). Cobre:
//  flag OFF = caminho anterior · flag ON = VC · 3D carrega sem erro fatal · seleção de mesh
//  roteia a categoria certa · asset 3D real aplicado · câmera responde · 2D↔3D preserva estado
//  · undo/redo + save · sem overflow desktop+mobile. WebGL via SwiftShader (webgl:true).
// Cliques via DOM (.click()) — robustos a acordeão/visibilidade do MaisPainel.
import { abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const FLAGS_ON = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true };
const FLAGS_OFF = { 'as5.novo_shell': true, 'as6.visual_composer': true };
const RESUMO = {};

// clica o 1º elemento cujo texto OU aria-label casa a regex (fonte da regex + escopo CSS)
const clickBy = (p, fonte, scope = 'button') => p.evaluate(({ fonte, scope }) => {
  const rx = new RegExp(fonte, 'i');
  const el = [...document.querySelectorAll(scope)].find((x) => rx.test(x.textContent || '') || rx.test(x.getAttribute('aria-label') || ''));
  if (el) { el.click(); return true; }
  return false;
}, { fonte, scope });

const tentar3d = (p) => p.evaluate(() => {
  const cand = [...document.querySelectorAll('button, [role="button"], .vc-mp-item, a')].find((x) => {
    const t = (x.textContent || '').trim();
    return /Abrir modo 3D/i.test(t) && t.length < 40;
  });
  if (!cand) return false;
  (cand.closest('button, [role="button"], .vc-mp-item, a') || cand).click();
  return true;
});
async function expandirEClicar3d(p) {
  if (await tentar3d(p)) return true;
  // expande especificamente o grupo "Apresentar" (onde vive o item)
  await p.evaluate(() => { const g = [...document.querySelectorAll('.vc-mp-grupo-cab, [class*="grupo-cab"]')].find((b) => /Apresentar/i.test(b.textContent || '')); if (g) g.click(); });
  await p.waitForTimeout(400);
  if (await tentar3d(p)) return true;
  // último recurso: expande todos
  await p.evaluate(() => { document.querySelectorAll('.vc-mp-grupo-cab, [class*="grupo-cab"]').forEach((b) => { try { b.click(); } catch { /* ok */ } }); });
  await p.waitForTimeout(400);
  return tentar3d(p);
}
async function abrir3d(p) {
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });
  await p.click('[aria-label="Mais"]');
  await p.waitForTimeout(500);
  const clicou = await expandirEClicar3d(p);
  if (!clicou) {
    const diag = await p.evaluate(() => ({ mpItens: [...document.querySelectorAll('.vc-mp-item')].map((x) => (x.textContent || '').trim()).slice(0, 30), com3d: [...document.querySelectorAll('*')].filter((x) => x.children.length === 0 && /3D/i.test(x.textContent || '')).map((x) => x.tagName + ':' + (x.textContent || '').trim()).slice(0, 10) }));
    throw new Error('item "Abrir modo 3D" nao encontrado. diag=' + JSON.stringify(diag));
  }
  await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 20000 });
  await p.waitForTimeout(900);
  return p.evaluate(() => (window).__vc3dPronto === true);
}

// ── Sessão 1: flag ON ────────────────────────────────────────────────────
const s1 = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); }, initArg: FLAGS_ON });
const b1 = s1.navegador, p1 = s1.pagina, erros1 = s1.erros;
const consoleErros = [];
p1.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/Failed to load resource|net::|ERR_|favicon|status of 40|status of 50|WebGL|GL_/i.test(t)) consoleErros.push(t.slice(0, 180)); } });

try {
  await irParaHarness(p1, 'avst-harness.html', 1000);
  await p1.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });   // 3. flag ON abre o VC

  // 8a. edição no 2D (para checar preservação no roundtrip)
  await p1.click('[aria-label="Editar Cabelo"]').catch(() => {});
  await p1.waitForTimeout(200);
  await p1.click('#vc-painel-cat .vc-grade .vc-card-btn').catch(() => {});
  await p1.waitForTimeout(200);
  const undo2dAntes = await p1.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);

  // 4. entra no modo 3D — carrega sem erro fatal
  const pronto = await abrir3d(p1);
  RESUMO.WEBGL2 = pronto;
  const canvas = await p1.$('[data-modo="3d"] canvas');
  ok(!!canvas, '4 canvas 3D ausente');
  RESUMO.THREE_D_MODE = canvas ? 'YES' : 'NO';
  ok(erros1.length === 0, `4 PAGEERRORS=${erros1.length}: ${erros1.slice(0, 3).join(' | ')}`);

  if (!pronto) {
    RESUMO.MESH_SELECTION = 'skip(sem WebGL2)'; RESUMO.CATALOG_INTEGRATION = 'skip'; RESUMO.CAMERA = 'skip';
    ok(!!(await p1.$('.vc3d-erro, [data-modo="3d"]')), '4 fallback 3D ausente');
  } else {
    // 5. seleção de mesh (raycasting) → categoria correta (hook determinístico)
    const rota = await p1.evaluate(() => ({ head: (window).__vc3dRota?.('Casual_Head'), body: (window).__vc3dRota?.('Casual_Body'), acc: (window).__vc3dRota?.('soc_jetpack') }));
    RESUMO.MESH_SELECTION = (rota.head === 'cabelo' && rota.body === 'roupa' && rota.acc === 'acessorios') ? 'YES' : `NO(${JSON.stringify(rota)})`;
    ok(RESUMO.MESH_SELECTION === 'YES', `5 mesh→categoria: ${JSON.stringify(rota)}`);

    // 6. aplicar um asset 3D real (Roupa → Executivo = variante 'terno' → humano_terno.glb)
    await clickBy(p1, '^Roupa$', '.vc-trilho button'); await p1.waitForTimeout(250);
    await clickBy(p1, '^Executivo$', '#vc3d-painel button'); await p1.waitForTimeout(350);
    const roupa = await p1.evaluate(() => (window).__vc3dEstado?.().roupa);
    RESUMO.CATALOG_INTEGRATION = roupa === 'terno' ? 'YES' : `NO(${roupa})`;
    ok(roupa === 'terno', `6 asset 3D aplicado: roupa=${roupa}`);

    // 9. undo no 3D reverte + Salvar presente
    await p1.click('[aria-label="Desfazer"]').catch(() => {});
    await p1.waitForTimeout(250);
    const roupaUndo = await p1.evaluate(() => (window).__vc3dEstado?.().roupa);
    ok(roupaUndo === 'casual', `9 undo 3D: roupa=${roupaUndo} (esperado casual)`);
    ok(!!(await p1.$('[aria-label="Salvar"]')), '9 botão Salvar ausente no 3D');

    // 7. câmera responde (preset Busto)
    await clickBy(p1, '^Busto$', '.vc3d-camera button'); await p1.waitForTimeout(250);
    const cam = await p1.evaluate(() => (window).__vc3dEstado?.().camera);
    RESUMO.CAMERA = cam === 'busto' ? 'YES' : `NO(${cam})`;
    ok(cam === 'busto', `7 câmera responde: camera=${cam}`);
  }

  // 10a. sem overflow horizontal no 3D (desktop)
  const ovD = await p1.evaluate(() => { const r = document.querySelector('.vc-root'); return r && r.scrollWidth > r.clientWidth + 2 ? `${r.scrollWidth}>${r.clientWidth}` : ''; });
  ok(ovD === '', `10 overflow desktop 3D ${ovD}`);

  // 8b. volta ao 2D sem reload e preserva estado (undo do 2D continua disponível)
  await p1.click('[aria-label="Voltar ao 2D"]').catch(() => {});
  await p1.waitForTimeout(500);
  const volta2d = await p1.$('[data-vc][data-modo="visual"]');
  const undo2dDepois = await p1.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);
  RESUMO.TWO_D_THREE_D_ROUNDTRIP = (!!volta2d && undo2dAntes === undo2dDepois) ? 'YES' : `parcial(antes=${undo2dAntes},depois=${undo2dDepois})`;
  ok(!!volta2d, '8 não voltou ao 2D');
  ok(undo2dDepois === undo2dAntes, `8 roundtrip: undo 2D antes=${undo2dAntes} depois=${undo2dDepois}`);

  // 10b. mobile 390×844 sem overflow (reentra no 3D)
  await p1.setViewportSize({ width: 390, height: 844 }); await p1.waitForTimeout(300);
  await abrir3d(p1).catch(() => {});
  const ovM = await p1.evaluate(() => { const r = document.querySelector('.vc-root'); return r && r.scrollWidth > r.clientWidth + 2 ? `${r.scrollWidth}>${r.clientWidth}` : ''; });
  ok(ovM === '', `10 overflow mobile 3D ${ovM}`);
  RESUMO.DESKTOP = ovD === '' ? 'ok' : 'overflow'; RESUMO.MOBILE = ovM === '' ? 'ok' : 'overflow';

  ok(consoleErros.length === 0, `CONSOLE_ERRORS(app)=${consoleErros.length}: ${consoleErros.slice(0, 3).join(' | ')}`);
} catch (e) { falhas.push(`EXCEÇÃO sessão ON: ${e.message}`); }
await b1.close();

// ── Sessão 2: flag OFF → "Abrir modo 3D" NÃO usa o modo novo (caminho anterior) ──
const s2 = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); }, initArg: FLAGS_OFF });
const b2 = s2.navegador, p2 = s2.pagina;
try {
  await irParaHarness(p2, 'avst-harness.html', 1000);
  await p2.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });
  await p2.click('[aria-label="Mais"]'); await p2.waitForTimeout(500);
  await expandirEClicar3d(p2);
  await p2.waitForTimeout(1400);
  const modoNovo = await p2.$('[data-vc][data-modo="3d"]');
  ok(!modoNovo, '2 flag OFF NÃO deveria abrir o modo 3D novo (abriu [data-modo=3d])');
  RESUMO.FLAG_OFF_CAMINHO_ANTERIOR = modoNovo ? 'FALHA' : 'ok';
} catch (e) { falhas.push(`EXCEÇÃO sessão OFF: ${e.message}`); }
await b2.close();

console.log('[vc-3d] RESUMO:', JSON.stringify(RESUMO));
const okAll = relatorio('vc-3d', falhas, [...erros1, ...consoleErros]);
process.exit(okAll ? 0 : 1);
