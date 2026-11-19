// Testes de interface extras (Codex DSHOW-060 §4), harness 8112, banco de validação. 1 navegador, no máximo 2 abas.
//  Profundidade (394) no 154: m antes de 1; limite 1000 mm (= 100 cm; posto pelo roteiro de fora e retirado no fim): 1 m aceito, 2 m
//  recusado sem perder o valor; zero preservado. Produto 225: falso (booleano "Não") e opção preservados por recarga e Esc, sem nenhum
//  pedido de limpeza. 409 com duas abas: o texto digitado não se perde. Limpa tudo que gravou (exclusão lógica, pela tela/API).
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const pg = await ctx.newPage();
  const limpezas = []; ctx.on('request', (r) => { if (r.url().includes('valor_limpar')) limpezas.push(r.url()); });
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const abrir = async (p, P, campoSel) => { await p.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await p.goto(`${B}/#/panel-atributos/produto/${P}`); await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector(campoSel, { timeout: 30000 }); await p.waitForTimeout(700); };
  const valor = (p, P, A) => p.evaluate(async ([P, A]) => { const d = (await (await fetch(`/api/atributos/index.php?r=ficha_produto&product_id=${P}`, { credentials: 'include' })).json()).data;
    const it = d.itens.find((i) => i.atributo_id === A); const v = it.valor; if (!v) return 'vazio'; const u = (it.unidades || []).find((x) => x.id === v.unidade_id);
    return v.estado !== 'informado' ? v.estado : v.booleano !== null ? (v.booleano ? 'Sim' : 'Não') : v.opcao_ids?.length ? 'opcao:' + v.opcao_ids.join(',') : `${Number(v.numero)}${u ? ' ' + u.simbolo : ''}`; }, [P, A]);
  const salvo = async (p) => { for (let i = 0; i < 40; i++) { if (await p.$('.at-salvo--ok')) return 'ok'; if (await p.$('.at-salvo--erro')) return 'erro'; await p.waitForTimeout(250); } return 'nada'; };
  const P1 = 154, A1 = 394, C1 = `#campo-${P1}-${A1}`, U1 = 'select[aria-label="Unidade de Profundidade"]';
  const limparNum = async () => { await abrir(pg, P1, C1); if ((await valor(pg, P1, A1)) === 'vazio') return; await pg.fill(C1, ''); await pg.press(C1, 'Tab'); await pg.waitForSelector('[role="dialog"][aria-label="Limpar o valor?"]', { timeout: 5000 }); await pg.click('[role="dialog"] button:has-text("Limpar valor")'); await salvo(pg); await pg.waitForTimeout(600); };
  await limparNum();
  // m antes de 1
  await abrir(pg, P1, C1); await pg.selectOption(U1, { label: 'm' }); await pg.fill(C1, '1'); await pg.press(C1, 'Tab');
  afirma('m antes de 1 → grava', (await salvo(pg)) === 'ok');
  await abrir(pg, P1, C1); afirma('reabrir = 1 m (limite 1000 mm = 100 cm: aceito)', (await valor(pg, P1, A1)) === '1 m', await valor(pg, P1, A1));
  // 2 m passa do limite → recusado, o valor salvo continua 1 m
  await pg.fill(C1, '2'); await pg.press(C1, 'Tab');
  const r2 = await salvo(pg); const msg = (await pg.$('.at-salvo--erro')) ? await pg.$eval('.at-salvo--erro', (e) => e.textContent) : '';
  afirma('2 m (= 2000 mm > 1000) → recusado com mensagem', r2 === 'erro' && /m[aá]xim|limite|entre|até|maior/i.test(msg), msg.slice(0, 120));
  afirma('recusado: o valor salvo continua 1 m', (await valor(pg, P1, A1)) === '1 m', await valor(pg, P1, A1));
  // zero preservado
  await abrir(pg, P1, C1); await pg.fill(C1, '0'); await pg.press(C1, 'Tab'); await salvo(pg);
  await abrir(pg, P1, C1); afirma('zero gravado e preservado (não vira vazio): reabrir = 0', (await pg.inputValue(C1)) === '0' && /^0( |$)/.test(await valor(pg, P1, A1)), `${await pg.inputValue(C1)} / ${await valor(pg, P1, A1)}`);
  await limparNum(); afirma('limpo (Profundidade)', (await valor(pg, P1, A1)) === 'vazio');
  // 225: booleano "Não" (falso) e opção — recarga e Esc não disparam limpeza
  const P2 = 225, BOOL = '[role="radiogroup"][aria-label="Resina Protetora (GOB)"]', OPC = `#campo-${P2}-21`;
  await abrir(pg, P2, BOOL);
  await pg.click(`${BOOL} button:has-text("Não")`); await salvo(pg);
  await pg.selectOption(OPC, { index: 1 }); await salvo(pg);
  const opc0 = await valor(pg, P2, 21);
  const l0 = limpezas.length;
  await abrir(pg, P2, BOOL); await abrir(pg, P2, BOOL);
  await pg.focus(OPC); await pg.keyboard.press('Escape'); await pg.focus(`${BOOL} button:has-text("Não")`); await pg.keyboard.press('Escape'); await pg.waitForTimeout(800);
  await abrir(pg, P2, BOOL);
  afirma('falso preservado: "Não" continua marcado depois de 2 recargas e Esc', (await valor(pg, P2, 115)) === 'Não' && (await pg.getAttribute(`${BOOL} button:has-text("Não")`, 'aria-checked')) === 'true');
  afirma('opção preservada depois de recargas e Esc', (await valor(pg, P2, 21)) === opc0 && opc0.startsWith('opcao:'), opc0);
  afirma('nenhum pedido de limpeza (valor_limpar) disparado por recarga ou Esc', limpezas.length === l0, `${limpezas.length - l0} pedido(s)`);
  // limpeza explícita (escolha do usuário)
  await pg.click(`${BOOL} button:has-text("Sem resposta")`); await salvo(pg); await pg.selectOption(OPC, { value: '' }); await salvo(pg);
  await abrir(pg, P2, BOOL); afirma('225 limpo pela escolha explícita ("Sem resposta" e "—")', (await valor(pg, P2, 115)) === 'vazio' && (await valor(pg, P2, 21)) === 'vazio');
  // 409 sem perda: aba 1 (velha) × aba 2
  await abrir(pg, P1, C1); await pg.fill(C1, '10'); await pg.press(C1, 'Tab'); await salvo(pg);
  const p2 = await ctx.newPage(); await abrir(pg, P1, C1); await abrir(p2, P1, C1);
  await p2.fill(C1, '20'); await p2.press(C1, 'Tab'); await salvo(p2);
  await pg.fill(C1, '30'); await pg.press(C1, 'Tab'); await pg.waitForTimeout(1500);
  // "foi salvo ou não": o conflito mostra o valor ao abrir, o rascunho e o valor atual, com unidades
  const conflito = await pg.$('.at-salvo--erro:has-text("O valor mudou desde que você começou")');
  const tc = conflito ? (await conflito.textContent()) : '';
  afirma('409: a aba velha mostra "O valor mudou desde que você começou" com Valor ao abrir 10 mm · Seu rascunho 30 mm · Valor atual 20 mm, e o texto digitado (30) NÃO se perde',
    !!conflito && tc.includes('Valor ao abrir: 10 mm') && tc.includes('Seu rascunho: 30 mm') && tc.includes('Valor atual: 20 mm') && (await pg.inputValue(C1)) === '30' && (await valor(pg, P1, A1)) === '20 mm', `${tc} · campo=${await pg.inputValue(C1)} · salvo=${await valor(pg, P1, A1)}`);
  await p2.close();
  await limparNum(); afirma('limpo no fim (Profundidade)', (await valor(pg, P1, A1)) === 'vazio');
  console.log(`UI EXTRA: ${ok} ok, ${falhas} falhas`);
  await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(2); });
