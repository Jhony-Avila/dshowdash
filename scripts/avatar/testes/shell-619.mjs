// testes/shell-619.mjs — AS5: espelho §619 atrás da flag as5.estado_api
// (dual-write: legado é a verdade; draft §619 com lock otimista §619.1).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.estado_api': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const chamadas = () => p.evaluate(() => window.__ch619 ?? []);
const equipar = () => p.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')].find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

// montagem: GET carrega o checksum base do servidor
await p.waitForTimeout(800);
let ch = await chamadas();
ok(ch.some((c) => c.m === 'GET'), 'flag ligada deveria carregar o estado (GET) na montagem');

// mudança → autosave espelha o DRAFT com o checksum_base do servidor
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(600);
await equipar();
await p.waitForTimeout(1600); // debounce 800ms + rede
ch = await chamadas();
const drafts = ch.filter((c) => c.m === 'POST' && c.corpo?.draft);
ok(drafts.length >= 1, 'autosave não espelhou o draft no §619');
ok(drafts[0]?.corpo?.checksum_base === 'ck0', `1º draft deveria usar checksum ck0 (usou ${drafts[0]?.corpo?.checksum_base})`);
ok(drafts[0]?.corpo?.draft?.schemaVersion === 1 && drafts[0]?.corpo?.draft?.equipment,
  'payload do draft não é um EstadoAvatar em domínios (§607)');

// segunda mudança → o LOCK encadeia (checksum devolvido vira a nova base)
await equipar();
await p.waitForTimeout(1600);
ch = await chamadas();
const drafts2 = ch.filter((c) => c.m === 'POST' && c.corpo?.draft);
ok(drafts2.length >= 2, 'segunda mudança não gerou segundo espelho');
const base2 = drafts2[drafts2.length - 1]?.corpo?.checksum_base;
ok(typeof base2 === 'string' && base2.startsWith('ck') && base2 !== 'ck0',
  `lock otimista não encadeou (base do 2º draft: ${base2})`);
await p.screenshot({ path: `${SAIDA}/s619-espelho.png` });

// FLAG OFF (fail-safe): desligar EM TEMPO DE EXECUÇÃO corta o espelho
// (sem reload — o addInitScript re-semearia as flags; lição registrada)
await p.evaluate(() => localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })));
const antesOff = (await chamadas()).length;
await equipar();
await p.waitForTimeout(1600);
ok(((await chamadas()).length) === antesOff, 'com a flag OFF o espelho §619 deveria PARAR');

const ok_ = relatorio('shell-619', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
