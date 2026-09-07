// testes/vc-3d-visual.mjs — VC-3D consolidação: PROVA de que o preview serve o VC 3D limpo
// (não o shell clássico) + captura das 6 telas reais para avaliação humana. WebGL SwiftShader.
// NÃO faz comparação golden. Screenshots normais aguardando load/renderer/câmera/frame.
import { mkdirSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-3d`;
try { mkdirSync(DIR, { recursive: true }); } catch { /* ok */ }
const FLAGS_ON = { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true };
const R = {};        // relatório booleano
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const shots = [];

const tentar3d = (p) => p.evaluate(() => {
  const cand = [...document.querySelectorAll('button, [role="button"], .vc-mp-item, a')].find((x) => { const t = (x.textContent || '').trim(); return /Abrir modo 3D/i.test(t) && t.length < 40; });
  if (!cand) return false; (cand.closest('button, [role="button"], .vc-mp-item, a') || cand).click(); return true;
});
async function entrar3d(p) {
  await p.click('[aria-label="Mais"]'); await p.waitForTimeout(500);
  if (!(await tentar3d(p))) { await p.evaluate(() => { const g = [...document.querySelectorAll('.vc-mp-grupo-cab, [class*="grupo-cab"]')].find((b) => /Apresentar/i.test(b.textContent || '')); if (g) g.click(); }); await p.waitForTimeout(400); await tentar3d(p); }
  await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 20000 });
}
const canvasLen = (p) => p.evaluate(() => { const c = document.querySelector('[data-modo="3d"] canvas'); if (!c) return 0; try { return c.toDataURL('image/png').length; } catch { return -1; } });
async function capturar(p, nome) {
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const caminho = `${DIR}/${nome}.png`;
  await p.screenshot({ path: caminho });
  const len = await canvasLen(p).catch(() => 0);
  shots.push({ nome, canvasLen: len }); return caminho;
}

const s = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); }, initArg: FLAGS_ON });
const b = s.navegador, p = s.pagina, erros = s.erros;
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 });
  // preview serve o VC?
  R.VC_ROOT = !!(await p.$('.vc-root'));
  R.CLASSIC_HEADER_VISIBLE = !!(await p.$('.avst-topo, .avst-shell'));
  R.TEXT_CATEGORY_TREE_VISIBLE = !!(await p.$('.avst-categorias, .avst-arvore, nav.avst-cats'));
  ok(R.VC_ROOT, 'VC_ROOT ausente'); ok(!R.CLASSIC_HEADER_VISIBLE, 'header clássico visível'); ok(!R.TEXT_CATEGORY_TREE_VISIBLE, 'árvore textual clássica visível');

  // uma edição no 2D antes de ir ao 3D (para o roundtrip)
  await p.click('[aria-label="Editar Cabelo"]').catch(() => {});
  await p.waitForTimeout(200);
  await p.click('#vc-painel-cat .vc-grade .vc-card-btn').catch(() => {});
  await p.waitForTimeout(150);
  const undoAntes = await p.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);

  await entrar3d(p);
  // espera modelo/renderer/câmera assentarem (SwiftShader é lento p/ GLB)
  await p.waitForTimeout(8000);
  const len0 = await canvasLen(p);
  R.WEBGL_CANVAS = !!(await p.$('[data-modo="3d"] canvas')) && len0 > 3000;
  R.CLASSIC_FALLBACK_VISIBLE = !!(await p.$('.avst-topo, .avst-shell'));
  R.STAGE_DOMINANT = await p.evaluate(() => { const pa = document.querySelector('.vc3d-palco'); const pn = document.querySelector('#vc3d-painel'); if (!pa) return false; const a = pa.getBoundingClientRect(); const b2 = pn ? pn.getBoundingClientRect() : { width: 0 }; return a.width > b2.width && a.width > 400; });
  R.RIGHT_CONTEXT_PANEL = !!(await p.$('#vc3d-painel'));
  R.PERMANENT_TEXT_CONTROLS = await p.evaluate(() => { const cam = document.querySelector('.vc3d-camera'); const hud = document.querySelector('.vc3d-hud'); const camTxt = cam ? [...cam.querySelectorAll('button')].some((b3) => (b3.textContent || '').trim().length > 0) : false; return !!hud || camTxt; });
  const nTop = await p.$$eval('.vc-barra button', (e) => e.length);
  const nRail = await p.$$eval('.vc-trilho .vc-cat', (e) => e.length);
  ok(R.WEBGL_CANVAS, `WEBGL_CANVAS len=${len0}`); ok(!R.CLASSIC_FALLBACK_VISIBLE, 'FALLBACK clássico no 3D'); ok(R.STAGE_DOMINANT, 'palco não dominante'); ok(!R.PERMANENT_TEXT_CONTROLS, 'controle textual permanente no palco'); ok(nTop <= 5, `TOP_ACTIONS=${nTop}`); ok(nRail === 5, `RAIL=${nRail}`);
  R.TOP_ACTIONS = nTop; R.RAIL = nRail;

  await capturar(p, '1-desktop-inicial');

  // seleção direta de mesh + auto-framing
  const rota = await p.evaluate(() => (window).__vc3dRota?.('Casual_Head'));
  await p.waitForTimeout(500);
  const camDepois = await p.evaluate(() => (window).__vc3dEstado?.().camera);
  R.MESH_DIRECT_SELECTION = rota === 'cabelo'; R.AUTO_FRAMING = camDepois === 'rosto';
  ok(R.MESH_DIRECT_SELECTION, `mesh→cat=${rota}`); ok(R.AUTO_FRAMING, `auto-framing cam=${camDepois}`);
  await capturar(p, '2-desktop-mesh-selecionada');

  // catálogo contextual (Roupa) + aplica GLB
  await p.evaluate(() => { const b3 = [...document.querySelectorAll('.vc-trilho button')].find((x) => /Roupa/i.test(x.getAttribute('aria-label') || '')); if (b3) b3.click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { const b3 = [...document.querySelectorAll('#vc3d-painel button')].find((x) => /^Executivo$/i.test((x.textContent || '').trim().replace(/Disponível.*/i, ''))); if (b3) b3.click(); }); await p.waitForTimeout(400);
  R.NATIVE_GLB_APPLIED = (await p.evaluate(() => (window).__vc3dEstado?.().roupa)) === 'terno';
  ok(R.NATIVE_GLB_APPLIED, 'GLB (Executivo/terno) não aplicou');
  await capturar(p, '3-desktop-catalogo');

  // painel "Mais" + ferramentas secundárias (Histórico/Captura/Missões/Evolução/Diagnóstico)
  await p.click('[aria-label="Mais"]'); await p.waitForTimeout(500);
  R.MAIS_SHEET = !!(await p.$('.vc3d-mais'));
  const menu = await p.evaluate(() => { const t = [...document.querySelectorAll('.vc3d-mi')].map((b3) => (b3.textContent || '').trim()); const secs = [...document.querySelectorAll('.vc3d-mi-sec')].map((s3) => (s3.textContent || '').trim()); return { hist: t.some((x) => /Histórico/i.test(x)), capt: t.some((x) => /Captura/i.test(x)), miss: t.some((x) => /Missões/i.test(x)), evo: t.some((x) => /Evolução/i.test(x)), classic: t.some((x) => /clássica/i.test(x)), diag: secs.includes('Diagnóstico') }; });
  R.HISTORY_IN_3D_MORE = menu.hist; R.CAPTURE_IN_3D_MORE = menu.capt; R.MISSIONS_IN_3D_MORE = menu.miss; R.EVOLUTION_IN_3D_MORE = menu.evo; R.CLASSIC_ONLY_IN_DIAGNOSTICS = menu.classic && menu.diag;
  ok(R.MAIS_SHEET, 'sheet Mais 3D ausente'); ok(menu.hist && menu.capt && menu.miss && menu.evo, `menu 3D incompleto ${JSON.stringify(menu)}`); ok(R.CLASSIC_ONLY_IN_DIAGNOSTICS, 'Interface clássica não está sob Diagnóstico');
  await capturar(p, '4-desktop-mais');
  // abrir/fechar cada tool; personagem NÃO desmonta (Canvas segue montado)
  const abrirTool = async (nome) => { await p.evaluate((n) => { const b3 = [...document.querySelectorAll('.vc3d-mi')].find((x) => new RegExp(n, 'i').test(x.textContent || '')); if (b3) b3.click(); }, nome); await p.waitForTimeout(800); const aberto = !!(await p.$('.vc3d-tool')); const canvas = !!(await p.$('[data-modo="3d"] canvas')); await p.evaluate(() => { const v = document.querySelector('.vc3d-mais .vc-sheet-cab [aria-label="Voltar"]'); if (v) v.click(); }); await p.waitForTimeout(300); return aberto && canvas; };
  R.TOOL_HISTORICO = await abrirTool('Histórico'); R.TOOL_MISSOES = await abrirTool('Missões'); R.TOOL_EVOLUCAO = await abrirTool('Evolução');
  R.STAGE_REMAINS_CLEAN = R.TOOL_HISTORICO && R.TOOL_MISSOES && R.TOOL_EVOLUCAO;
  ok(R.STAGE_REMAINS_CLEAN, 'tool não abriu ou personagem desmontou');
  // Captura: oculta controles e gera imagem só do canvas
  await p.evaluate(() => { const b3 = [...document.querySelectorAll('.vc3d-mi')].find((x) => /Captura/i.test(x.textContent || '')); if (b3) b3.click(); }); await p.waitForTimeout(1400);
  R.CAPTURE_PRODUCED = !!(await p.$('.vc3d-captura img'));
  ok(R.CAPTURE_PRODUCED, 'captura sem controles não gerou imagem');
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(300);

  // undo 3D + roundtrip
  await p.click('[aria-label="Desfazer"]').catch(() => {}); await p.waitForTimeout(300);
  R.UNDO_REDO_SAVE = ((await p.evaluate(() => (window).__vc3dEstado?.().roupa)) === 'casual') && !!(await p.$('[aria-label="Salvar"]'));
  await p.click('[aria-label="Voltar ao 2D"]').catch(() => {}); await p.waitForTimeout(500);
  const undoDepois = await p.$eval('[aria-label="Desfazer"]', (e) => !e.disabled).catch(() => false);
  R.TWO_D_THREE_D_ROUNDTRIP = !!(await p.$('[data-vc][data-modo="visual"]')) && undoDepois === undoAntes;
  ok(R.UNDO_REDO_SAVE, 'undo/save 3D falhou'); ok(R.TWO_D_THREE_D_ROUNDTRIP, `roundtrip antes=${undoAntes} depois=${undoDepois}`);

  // mobile: gaveta recolhida e expandida
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  await entrar3d(p); await p.waitForTimeout(6000);
  R.MOBILE_BOTTOM_SHEET = await p.evaluate(() => { const pn = document.querySelector('#vc3d-painel'); if (!pn) return false; const cs = getComputedStyle(pn); return cs.position === 'absolute' || cs.position === 'fixed'; });
  ok(R.MOBILE_BOTTOM_SHEET, 'painel mobile não é gaveta');
  await p.evaluate(() => { const r = document.querySelector('.vc-root'); if (r) r.setAttribute('data-gaveta', 'recolhida'); }); await p.waitForTimeout(400);
  await capturar(p, '5-mobile-gaveta-recolhida');
  await p.evaluate(() => { const r = document.querySelector('.vc-root'); if (r) r.setAttribute('data-gaveta', 'expandida'); }); await p.waitForTimeout(400);
  await capturar(p, '6-mobile-gaveta-expandida');
  const ovM = await p.evaluate(() => { const r = document.querySelector('.vc-root'); return r && r.scrollWidth > r.clientWidth + 2 ? `${r.scrollWidth}>${r.clientWidth}` : ''; });
  ok(ovM === '', `overflow mobile ${ovM}`);
} catch (e) { falhas.push(`EXCEÇÃO: ${e.message}`); }
await b.close();

console.log('[vc-3d-visual] BOOLEANS:', JSON.stringify(R));
console.log('[vc-3d-visual] SHOTS:', JSON.stringify(shots));
console.log('[vc-3d-visual] DIR:', DIR);
console.log('[vc-3d-visual] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
console.log('[vc-3d-visual] PAGEERRORS:', erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum');
process.exit(falhas.length === 0 ? 0 : 1);
