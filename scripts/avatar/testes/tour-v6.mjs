// testes/tour-v6.mjs — lote 1121–1130 (decisão #114, flag as6.tour_v6):
// o tour §568 v2 APRESENTA o layout do #112 — dock inferior, alturas,
// toolbar Cenário e câmera. Off = roteiro anterior byte a byte (§651).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const titulo = (p) => p.locator('.avst5-tour-card strong').textContent();
const contagem = (p) => p.locator('.avst5-tour-card em').textContent();
const proximo = async (p) => { await p.locator('[data-teste="tour-proximo"]').click(); await p.waitForTimeout(250); };

// ── A) flag ON (padrão): roteiro do layout novo ─────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
      localStorage.removeItem('dshow.avst5.tour.v1'); // primeira visita
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    ok(await p.locator('[data-teste="tour"]').count() === 1, 'tour não abriu na 1ª visita');
    ok((await contagem(p)) === '1/8', `esperava 8 passos (7 v6 + poder), veio ${await contagem(p)}`);
    ok((await titulo(p)) === 'Seu palco', 'passo 1 deveria ser o palco');
    await proximo(p); // 2 categorias
    await proximo(p); // 3 dock
    ok((await titulo(p)) === 'Dock de assets', `passo 3 deveria apresentar a dock (veio ${await titulo(p)})`);
    // o anel realça a dock real (embaixo do preview) — o pulso anima
    // scale, então comparamos pelo CENTRO, não pela borda
    const anel = await p.locator('.avst5-tour-anel').boundingBox();
    const painel = await p.locator('.avst5-painel').boundingBox();
    const centroAnel = anel ? anel.y + anel.height / 2 : -1;
    ok(!!anel && !!painel && centroAnel > painel.y && centroAnel < painel.y + painel.height,
      'anel do passo 3 não realça a dock');
    await proximo(p); // 4 altura
    ok((await titulo(p)) === 'Altura da dock', 'passo 4 deveria ser a altura da dock');
    ok(await p.locator('.avst5-tour-anel').count() === 1, 'passo 4 sem anel no botão de altura');
    await proximo(p); // 5 cenário
    ok((await titulo(p)) === 'Cenário', 'passo 5 deveria ser a toolbar Cenário');
    await p.screenshot({ path: `${SAIDA}/tour-v6.png` });
    await proximo(p); // 6 salvar
    await proximo(p); // 7 extras
    await proximo(p); // 8 poder
    await proximo(p); // fecha
    ok(await p.locator('[data-teste="tour"]').count() === 0, 'tour não fechou no último passo');
    ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.tour.v1')) === 'feito',
      'tour concluído não marcou visto');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651: flag OFF = roteiro anterior byte a byte ───────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.tour_v6': false }));
      localStorage.removeItem('dshow.avst5.tour.v1');
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    ok((await contagem(p)) === '1/6', `flag OFF: esperava 6 passos (5 + poder), veio ${await contagem(p)}`);
    await proximo(p); await proximo(p);
    ok((await titulo(p)) === 'Catálogo', 'flag OFF: passo 3 deveria ser o Catálogo de antes');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[tour-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[tour-v6] FALHAS: nenhuma');
console.log('[tour-v6] ERROS JS: nenhum');
