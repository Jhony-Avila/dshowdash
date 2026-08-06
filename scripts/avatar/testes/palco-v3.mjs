// testes/palco-v3.mjs — lote 571–580 (§176.1/§178.2/§157.4, flag
// as5.palco_v3): PALCO/SOM v3.
//   A) §178.2: painel de preferências de som (volume geral + categorias
//      independentes + preview); neutro = chave AUSENTE no storage;
//   B) §157.4: transições de ENTRADA one-shot ligam data-entrada e o
//      atributo some sozinho (nada persiste);
//   C) §176.1: chips Órbita/Composto no palco 3D (UI; o motor 3D real é
//      coberto pelos testes de contrato palco3d-*);
//   D) rollback §651.
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A+B) SOM §178.2 + ENTRADA §157.4 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false }));
      localStorage.setItem('dshow.avatar.som.v1', '1'); // som LIGADO
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);

  // §178.2: painel de preferências
  ok(await p.locator('[data-teste="som-prefs-abrir"]').count() === 1, 'botão de prefs de som ausente (§178.2)');
  await p.evaluate(() => document.querySelector('[data-teste="som-prefs-abrir"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="som-prefs"]').count() === 1, 'painel de prefs não abriu');
  ok(await p.locator('[data-teste="som-volume"]').count() === 1, 'slider de volume geral ausente (§178.2)');
  // desligar a categoria EFEITOS persiste — e só ela
  await p.evaluate(() => document.querySelector('[data-teste="som-cat-efeitos"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(200);
  const prefs = await p.evaluate(() => localStorage.getItem('dshow.avst5.som.prefs.v1') ?? '');
  ok(prefs.includes('"efeitos":false'), `prefs não persistiram a categoria (§178.2): "${prefs}"`);
  ok(!prefs.includes('ambiente'), 'categoria neutra não deveria entrar no storage');
  // religar = neutro total → chave SOME
  await p.evaluate(() => document.querySelector('[data-teste="som-cat-efeitos"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.som.prefs.v1')) === null, 'neutro deveria REMOVER a chave de prefs');
  ok(await p.locator('[data-teste="som-preview"]').count() === 1, 'botão de preview ausente (§178.2)');
  await p.evaluate(() => document.querySelector('[data-teste="som-prefs-abrir"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

  // §157.4: entrada one-shot no palco 2D
  await p.evaluate(() => document.querySelector('[data-teste="cenario-abrir"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="entrada-teleporte"]').count() === 1, 'chip de entrada Teleporte ausente (§157.4)');
  await p.evaluate(() => document.querySelector('[data-teste="entrada-teleporte"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(350);
  ok(await p.locator('.avst5-viewport[data-entrada="teleporte"]').count() === 1, 'data-entrada não ligou no clique (§157.4)');
  await p.waitForTimeout(1500);
  ok(await p.locator('.avst5-viewport[data-entrada]').count() === 0, 'data-entrada deveria SUMIR sozinho (one-shot §157.4)');
  await p.screenshot({ path: `${SAIDA}/palco-v3-shell.png` });
  ok(erros.length === 0, `erros de página (shell): ${erros.join(' | ')}`);
  await b.close();
}

// ── C) §176.1: chips de movimento composto no palco 3D ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true })); },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('[data-teste="botao-3d"]').click();
  await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
  await p.waitForTimeout(4000);
  await p.locator('[data-teste="p3d-cinema"]').click();
  await p.waitForSelector('[data-teste="p3d-mov"]', { timeout: 3000 }).catch(() => {});
  if (await p.locator('[data-teste="p3d-mov"]').count() === 1) {
    ok(await p.locator('[data-teste="p3d-mov-orbita"]').count() === 1, 'chip Órbita ausente (§176.1)');
    ok(await p.locator('[data-teste="p3d-mov-composto"]').count() === 1, 'chip Composto ausente (§176.1)');
    await p.evaluate(() => document.querySelector('[data-teste="p3d-mov-composto"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="p3d-mov-composto"][aria-pressed="true"]').count() === 1, 'chip Composto não ativou');
  } else {
    falhas.push('grupo de movimento §176 não apareceu no palco 3D');
  }
  await p.screenshot({ path: `${SAIDA}/palco-v3-3d.png` });
  ok(erros.length === 0, `erros de página (3D): ${erros.join(' | ')}`);
  await b.close();
}

// ── D) rollback §651 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as5.palco_v3': false }));
      localStorage.setItem('dshow.avatar.som.v1', '1');
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);
  ok(await p.locator('[data-teste="som-prefs-abrir"]').count() === 0, 'flag off com prefs de som visíveis (§651)');
  await p.evaluate(() => document.querySelector('[data-teste="cenario-abrir"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="entrada-teleporte"]').count() === 0, 'flag off com chips de entrada (§651)');
  ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS palco-v3:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('palco-v3 OK');
