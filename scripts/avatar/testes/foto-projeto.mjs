// testes/foto-projeto.mjs — lote 971–980 (decisão #99, flag
// as6.foto_projeto): Photo Project v2 (AS6 §1417/§1418/§1226/§1227).
//   A) flag ON (clássico, aba Foto): "Usar meu avatar" → estilizar →
//      guardar projeto grava schema v2 (versao 2 + avatarFonte + o
//      estilo — configuração, não só bitmap §1416); projeto v1 SEMEADO
//      continua abrindo (§1418) e sem snapshot NÃO ganha o botão §1227;
//      o projeto v2 ganha "atualizar p/ avatar atual" e o clique troca
//      foto+snapshot mantendo a estilização.
//   B) rollback §651: flag OFF = salvar grava o shape v1 byte a byte
//      (sem versao/avatarFonte) e o botão §1227 não existe.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// projeto v1 legado (sem versao/avatarFonte) — precisa continuar abrindo
const PROJETO_V1 = {
  id: 'pf_legado', nome: 'Legado V1', criadoEm: '2026-08-01T00:00:00.000Z',
  foto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  estilo: { camadas: {}, cores: { destaque: '#7c5cff' } }, formato: 'perfil',
};

const irFoto = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
};
const avatarVirouFoto = async (p) => {
  await p.locator('[data-teste="foto-do-avatar"]').click();
  await p.waitForTimeout(900);
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(700);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: (v1) => { localStorage.setItem('dshow.avst5.foto.projetos.v1', v1); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate((v1) => localStorage.setItem('dshow.avst5.foto.projetos.v1', v1), JSON.stringify([PROJETO_V1]));
    await irFoto(p);
    await avatarVirouFoto(p);
    // guardar projeto → schema v2 com snapshot
    await p.locator('[data-teste="guardar-projeto"]').click();
    await p.waitForTimeout(900);
    const lista = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '[]'));
    ok(lista.length === 2, `esperava 2 projetos (v2 novo + v1 legado), veio ${lista.length}`);
    const novo = lista.find((x) => x.id !== 'pf_legado');
    ok(novo?.versao === 2, `projeto novo sem versao 2 (§1417): ${JSON.stringify(novo?.versao)}`);
    ok(!!novo?.avatarFonte?.base, 'projeto novo sem snapshot do avatar (§1226)');
    ok(typeof novo?.atualizadoEm === 'string', 'projeto novo sem atualizadoEm');
    ok(!!novo?.estilo, 'projeto sem a configuração serializada (§1416)');
    // sair do modo estilo p/ ver a galeria de projetos
    await p.locator('button', { hasText: 'Cancelar' }).click();
    await p.waitForTimeout(500);
    ok(await p.locator('[data-teste="projetos-foto"]').count() === 1, 'galeria de projetos ausente');
    // §1227 só no projeto COM snapshot
    ok(await p.locator('[data-teste="projeto-atualizar-fonte"]').count() === 1,
      'botão §1227 deveria existir só no projeto v2 com snapshot');
    // v1 legado continua abrindo (§1418)
    await p.evaluate(() => {
      const itens = [...document.querySelectorAll('[data-teste="projetos-foto"] .avst-foto-item')];
      const alvo = itens.find((i) => i.textContent.includes('Legado V1'));
      alvo?.querySelector('.avst-foto-item-img')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(600);
    ok(await p.locator('.avst-ft-preview svg').count() === 1, 'projeto v1 não reabriu (§1418)');
    await p.locator('button', { hasText: 'Cancelar' }).click();
    await p.waitForTimeout(400);
    // §1227: atualizar fonte troca foto+snapshot e mantém o estilo
    const fotoAntes = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1'))[0]?.foto);
    await p.locator('[data-teste="projeto-atualizar-fonte"]').click();
    await p.waitForTimeout(900);
    const depois = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '[]'));
    const v2 = depois.find((x) => x.id !== 'pf_legado');
    ok(v2?.foto !== fotoAntes, 'atualizar fonte não trocou a foto-base (§1227)');
    ok(!!v2?.avatarFonte?.base && !!v2?.estilo, 'atualizar fonte perdeu snapshot/estilo (§1227)');
    await p.screenshot({ path: `${SAIDA}/foto-projeto.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as6.foto_projeto': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irFoto(p);
    await avatarVirouFoto(p);
    await p.locator('[data-teste="guardar-projeto"]').click();
    await p.waitForTimeout(900);
    const lista = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '[]'));
    ok(lista.length === 1 && lista[0].versao === undefined && lista[0].avatarFonte === undefined,
      'flag OFF deveria gravar o shape v1 byte a byte (§651)');
    await p.locator('button', { hasText: 'Cancelar' }).click();
    await p.waitForTimeout(400);
    ok(await p.locator('[data-teste="projeto-atualizar-fonte"]').count() === 0,
      'flag OFF ainda mostra o botão §1227 (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[foto-projeto] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[foto-projeto] FALHAS: nenhuma');
console.log('[foto-projeto] ERROS JS: nenhum');
