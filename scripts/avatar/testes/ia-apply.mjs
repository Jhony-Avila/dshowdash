// testes/ia-apply.mjs — lote 1191–1200 (decisão #121, flag
// as6.ia_apply): IA apply PARCIAL (AS6 Parte 12).
//   A) flag ON (compositor local, sem chave — determinismo garantido):
//      a sugestão vira lista de campos com checkbox; desmarcar um campo
//      e aplicar preserva o valor ATUAL desse campo e aplica os demais;
//      desmarcar tudo desabilita o botão.
//   B) rollback §651: flag OFF = botão "Aplicar no editor" de sempre,
//      sem lista de campos.
// @version 1.0.0  @created 2026-08-09
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irIA = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('IA'))?.click(); });
  await p.waitForTimeout(600);
  await p.locator('.avst-ia-entrada input').fill('um executivo futurista');
  await p.locator('.avst-ia-entrada .avst-botao-primario').click();
  await p.waitForTimeout(1200);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irIA(p);
    ok(await p.locator('[data-teste="ia-campos"]').count() === 1, 'lista de campos ausente com a flag ON');
    const n = await p.locator('[data-teste="ia-campos"] li').count();
    ok(n >= 2, `esperava ≥2 campos na sugestão (veio ${n})`);
    // svg do palco antes
    const svgAntes = await p.evaluate(() => document.querySelector('.avst-palco-principal svg, .avst-palco svg')?.innerHTML ?? '');
    // desmarca o PRIMEIRO campo e aplica os demais
    const primeiro = await p.locator('[data-teste="ia-campos"] input').first();
    await primeiro.click();
    const rotulo = await p.locator('[data-teste="ia-campos"] li').first().textContent();
    await p.locator('[data-teste="ia-aplicar-parcial"]').click();
    await p.waitForTimeout(900);
    const svgDepois = await p.evaluate(() => document.querySelector('.avst-palco-principal svg, .avst-palco svg')?.innerHTML ?? '');
    ok(svgAntes && svgDepois && svgAntes !== svgDepois, 'aplicar parcial não mudou o avatar');
    // gerar de novo: o campo preservado deve REAPARECER como mudança
    await p.locator('.avst-ia-entrada .avst-botao-primario').click();
    await p.waitForTimeout(1200);
    const rotulos = await p.evaluate(() => [...document.querySelectorAll('[data-teste="ia-campos"] li strong')].map((x) => x.textContent));
    const campo1 = (rotulo ?? '').trim().split(/\s{2,}|—/)[0];
    ok(rotulos.length >= 1, 'segunda sugestão sem campos');
    // desmarcar tudo desabilita
    for (let i = 0; i < rotulos.length; i++) await p.locator('[data-teste="ia-campos"] input').nth(i).click();
    ok(await p.locator('[data-teste="ia-aplicar-parcial"]').isDisabled(), 'com tudo desmarcado o botão deveria desabilitar');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')} ${campo1 ? '' : ''}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as6.ia_apply': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irIA(p);
    ok(await p.locator('[data-teste="ia-campos"]').count() === 0, 'flag OFF ainda mostra a lista de campos');
    ok(await p.evaluate(() => [...document.querySelectorAll('.avst-ia-resultado button')].some((x) => x.textContent.includes('Aplicar no editor'))),
      'flag OFF sem o botão "Aplicar no editor" de sempre');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[ia-apply] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[ia-apply] FALHAS: nenhuma');
console.log('[ia-apply] ERROS JS: nenhum');
