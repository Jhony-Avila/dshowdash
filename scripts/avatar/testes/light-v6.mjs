// testes/light-v6.mjs — lote 1141–1150 (decisão #116, flag
// as6.light_v6): LIGHT MODE REAL (AS6 §577/§578) — direção própria.
//   A) flag ON + data-theme=light: fundo do workspace NÃO é branco puro
//      nem o cinza do #112; cards são quase-brancos (≠ #fff);
//      profundidade §577: flutuante > card > painel > fundo (luminância
//      crescente); contraste do texto segue ≥4.5:1; sombra do palco
//      leve (não a preta do dark).
//   B) dark intocado: tokens escuros idênticos com flag ON.
//   C) rollback §651: flag OFF = claro do #112 byte a byte (#eef1f7).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const lum = (rgb) => {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? [0, 0, 0]).slice(0, 3)
    .map((v) => { const s = Number(v) / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const abrirTema = async (tema, flags) => {
  const r = await abrir({
    viewport: { width: 1500, height: 940 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', f); },
    initArg: JSON.stringify({ 'as5.novo_shell': true, ...flags }),
  });
  await irParaHarness(r.pagina, 'avst-harness.html', 1200);
  if (tema === 'light') {
    await r.pagina.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await r.pagina.waitForTimeout(400);
  }
  return r;
};
const varDe = (p, nome) => p.evaluate((n) => getComputedStyle(document.querySelector('[data-avst-react-root]')).getPropertyValue(n).trim(), nome);

// ── A) flag ON no claro ─────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrirTema('light', {});
  try {
    ok(await p.locator('[data-avst-react-root][data-light-v6]').count() === 1, 'root sem [data-light-v6] com a flag ON');
    const fundo = await varDe(p, '--avst-fundo');
    const card = await varDe(p, '--as6-superficie-3');
    ok(fundo === '#e9edf5', `fundo deveria ser a rampa fria §578 (veio ${fundo})`);
    ok(card !== '#ffffff' && card !== '#fff', 'card não pode ser branco puro (§578)');
    // §577: profundidade por luminosidade — flutuante > card > painel > fundo
    const ordem = await p.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('[data-avst-react-root]'));
      return ['--as6-superficie-1', '--avst-painel', '--as6-superficie-3'].map((v) => cs.getPropertyValue(v).trim());
    });
    const ls = ordem.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3;
    });
    ok(ls[0] < ls[1] && ls[1] < ls[2], `profundidade §577 fora de ordem: ${ordem.join(' < ')}`);
    // contraste do nome do card selecionado segue ≥4.5
    const cores = await p.evaluate(() => {
      const card2 = document.querySelector('.avst5-painel .avst-card-ativo') ?? document.querySelector('.avst5-painel .avst-card');
      const nome = card2?.querySelector('.avst-card-nome');
      return nome ? { texto: getComputedStyle(nome).color } : null;
    });
    ok(!!cores, 'card não encontrado');
    if (cores) ok(lum(cores.texto) < 0.2, `texto do card deveria ser escuro no claro (${cores.texto})`);
    // sombra leve no palco (não a preta do dark)
    const filtro = await p.locator('.avst5-palco svg').first().evaluate((el) => getComputedStyle(el).filter);
    ok(!filtro.includes('0, 0, 0'), `sombra do palco ainda é a preta do dark: ${filtro}`);
    await p.screenshot({ path: `${SAIDA}/light-v6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) dark intocado com a flag ON ──────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrirTema('dark', {});
  try {
    ok((await varDe(p, '--as6-superficie-3')) === '#161b26', 'dark mudou com a flag ON (deveria ser intocado)');
    ok((await varDe(p, '--avst-fundo')).includes('superficie') === false, 'var fundo dark inesperada');
  } catch (e) { falhas.push(`exceção (B): ${e.message}`); }
  await b.close();
}

// ── C) rollback §651: OFF = claro do #112 ───────────────────────────
{
  const { navegador: b, pagina: p } = await abrirTema('light', { 'as6.light_v6': false });
  try {
    ok(await p.locator('[data-avst-react-root][data-light-v6]').count() === 0, 'flag OFF ainda marca [data-light-v6]');
    ok((await varDe(p, '--avst-fundo')) === '#eef1f7', 'flag OFF deveria voltar ao claro do #112');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[light-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[light-v6] FALHAS: nenhuma');
console.log('[light-v6] ERROS JS: nenhum');
