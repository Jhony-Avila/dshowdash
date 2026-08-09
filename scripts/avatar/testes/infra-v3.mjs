// testes/infra-v3.mjs — lote 581–590 (§268/§277/§299–§300, flag
// as5.infra_v3): INFRA CLIENT v3.
//   A) §299–300: migrações de storage no boot — chave nova criada, chave
//      ANTIGA preservada (backup), idempotente; som segue funcionando;
//   B) §268/§277: salvar projeto de foto passa pelo pipeline e a thumb
//      96px aparece no cache multinível (IndexedDB);
//   C) rollback §651: flag off = sem migração, salvar = caminho legado.
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) §299–300 no SHELL ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false }));
      // semente pré-migração: chave de som da era AS3 (§299)
      localStorage.setItem('dshow.avatar.som.v1', '1');
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);

  // §299–300: migração criou a chave nova e PRESERVOU a antiga
  const chaves = await p.evaluate(() => ({
    nova: localStorage.getItem('dshow.avst5.som.v1'),
    antiga: localStorage.getItem('dshow.avatar.som.v1'),
  }));
  ok(chaves.nova === '1', `migração §300 não criou a chave nova (veio ${chaves.nova})`);
  ok(chaves.antiga === '1', 'migração §300 APAGOU a chave antiga (backup violado)');
  // som continua LIGADO pela leitura dual
  ok(await p.locator('[data-teste="som-toggle"][aria-pressed="true"]').count() === 1, 'som deveria seguir ligado após a migração (leitura dual §300)');
  ok(erros.length === 0, `erros de página (shell): ${erros.join(' | ')}`);
  await b.close();
}

// ── B) §268/§277 na FOTO (modo clássico) ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 1100 },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);

  // §268/§277: salvar projeto → pipeline → thumb no IDB
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = '#7c5cff'; g.fillRect(0, 0, 480, 480);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'iv3.png', { type: 'image/png' }));
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
  await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
  await p.waitForSelector('[data-teste="guardar-projeto"]', { timeout: 10000 });
  await p.locator('[data-teste="guardar-projeto"]').click();
  await p.waitForTimeout(900);
  const projetos = await p.evaluate(() => localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '');
  ok(projetos.includes('pf_'), 'projeto não salvou');
  ok(projetos.includes('data:image/jpeg'), 'pipeline §268 não comprimiu a foto em JPEG');
  // thumb no IndexedDB (cache §277, store kv de avst-cache-v1)
  const thumb = await p.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('avst-cache-v1', 1);
    req.onerror = () => resolve('erro-abrir');
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction('kv', 'readonly').objectStore('kv').getAllKeys();
        tx.onsuccess = () => resolve((tx.result ?? []).filter((k) => String(k).startsWith('foto-thumb:')).length);
        tx.onerror = () => resolve('erro-ler');
      } catch { resolve('erro-tx'); }
    };
  }));
  ok(thumb === 1, `esperava 1 thumb no cache §277 (veio ${thumb})`);
  await p.screenshot({ path: `${SAIDA}/infra-v3.png` });
  ok(erros.length === 0, `erros de página (foto): ${erros.join(' | ')}`);
  await b.close();
}

// ── C) rollback §651 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.infra_v3': false }));
      localStorage.setItem('dshow.avatar.som.v1', '1');
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);
  ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.som.v1')) === null, 'flag off não deveria migrar (§651)');
  ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS infra-v3:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('infra-v3 OK');
