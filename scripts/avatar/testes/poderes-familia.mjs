// testes/poderes-familia.mjs — lote 281–290 (§153.1–.4/§154/§156, flag
// as5.poderes_familia): poderes por FAMÍLIA. Duas partes:
//   1. CONTRATO (node puro): biblioteca de partículas §156 determinística
//      (mesmos args = mesmos bytes), densidade por tier §156.3, movimento
//      reduzido sem <animate>, classificação §153.1–.4 (overrides do
//      briefing + fallback por tema).
//   2. UI (harness): ativar poder → campo de partículas da família no
//      palco, família na placa, câmera §154 passo 2, rollback §651.
// @version 1.0.0  @created 2026-08-05
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── PARTE 1: contrato em node (funções puras) ────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'avst-podfam-'));
writeFileSync(join(dir, 'entrada.ts'), `
export { svgParticulas } from '${PAINEL}/src/engine/particulas';
export { familiaDoPoder, svgRoteiroFamilia, ROTULO_FAMILIA } from '${PAINEL}/src/services/PoderesFamilia';
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm --platform=neutral ` +
  `--outfile="${join(dir, 'bundle.mjs')}"`, { stdio: 'inherit' });
try {
  const api = await import(pathToFileURL(join(dir, 'bundle.mjs')).href);
  const params = { quantidade: 20, tamanho: 5, velocidade: 1, direcao: 'subir', cor: '#4cd9e8', opacidade: 0.9, duracaoMs: 1500 };

  // determinismo (regra da casa): mesmos args → MESMOS bytes
  const a = api.svgParticulas('pontos', params, 'medio', 7);
  const b = api.svgParticulas('pontos', params, 'medio', 7);
  ok(a === b, 'partículas não são determinísticas (§156 + byte-stability)');
  ok(a !== api.svgParticulas('pontos', params, 'medio', 8), 'semente diferente deveria mudar o campo');

  // §156.3: densidade por tier (contagem de <g)
  const conta = (svg) => (svg.match(/<g /g) ?? []).length;
  const eco = conta(api.svgParticulas('pontos', params, 'economico'));
  const med = conta(api.svgParticulas('pontos', params, 'medio'));
  const cin = conta(api.svgParticulas('pontos', params, 'cinematico'));
  ok(eco < med && med < cin, `tiers §156.3 sem efeito na densidade (${eco}/${med}/${cin})`);

  // movimento reduzido: poses estáticas, ZERO <animate>
  const estatico = api.svgParticulas('estrelas', params, 'medio', 1, false);
  ok(!estatico.includes('<animate'), 'animado=false ainda tem <animate> (§120)');
  ok(conta(estatico) === med, 'versão estática deveria manter a densidade');

  // §153.1–.4: overrides do briefing + fallback por tema
  ok(api.familiaDoPoder('efe_portal') === 'originals', 'Portal de Dados é Dshow Original (§153.1)');
  ok(api.familiaDoPoder('efe_chuva') === 'tecnologico', 'chuva digital é Data Storm (§153.2)');
  ok(api.familiaDoPoder('efe_fogo') === 'elemental', 'fogo é elemental (§153.3)');
  ok(api.familiaDoPoder('aur_orbital') === 'cosmico', 'orbital é Orbital Rings (§153.4)');
  ok(api.familiaDoPoder('efe_neve') === 'elemental', 'fallback por tema (clima → elemental)');
  ok(api.familiaDoPoder('id_que_nao_existe') === 'originals', 'id desconhecido cai em originals');

  // roteiro: usa a COR DE DESTAQUE e é determinístico
  const rot = api.svgRoteiroFamilia('cosmico', '#ff2d75');
  ok(rot.includes('#ff2d75'), 'roteiro não usou a cor de destaque');
  ok(rot === api.svgRoteiroFamilia('cosmico', '#ff2d75'), 'roteiro não determinístico');
  ok(Object.keys(api.ROTULO_FAMILIA).length === 4, 'esperava 4 famílias');
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// ── PARTE 2: UI no harness ───────────────────────────────────────────
async function ativarPoderNoPalco(p) {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-bloqueado'));
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(400);
  await p.locator('button[title="Modo Studio (apresentação)"]').click();
  await p.waitForTimeout(400);
  await p.locator('[data-teste="ativar-poder"]').click();
  await p.waitForTimeout(500);
}

const { navegador: b, pagina: p2, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await ativarPoderNoPalco(p2);
  // §153/§156: campo da família presente, com data-familia válida
  const fam = await p2.locator('[data-teste="poder-particulas"]').getAttribute('data-familia');
  ok(['originals', 'tecnologico', 'elemental', 'cosmico'].includes(fam ?? ''),
    `campo de partículas da família ausente/ inválido (${fam})`);
  ok(await p2.locator('[data-teste="poder-particulas"] svg g').count() > 0,
    'partículas do roteiro não renderizaram');
  // mega 288: família na placa do nome
  const placa = await p2.locator('[data-teste="poder-nome"] small').textContent();
  ok(/Originals|Tecnológico|Elemental|Cósmico/.test(placa ?? ''), 'família ausente da placa do poder');
  // mega 287 (§154 passo 2): câmera aproxima durante a reprodução
  ok(await p2.locator('.avst5-viewport[data-poder-cam]').count() === 1, 'câmera §154 passo 2 não engajou');
  await p2.screenshot({ path: `${SAIDA}/poderes-familia.png` });
  // sequência termina: overlay e câmera saem
  await p2.waitForTimeout(2600);
  ok(await p2.locator('[data-teste="poder-particulas"]').count() === 0, 'partículas não saíram após a sequência');
  ok(await p2.locator('.avst5-viewport[data-poder-cam]').count() === 0, 'câmera não voltou após a sequência');
} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}
await b.close();

// rollback §651: flag off → poder roda como antes, SEM o campo da família
const { navegador: b2, pagina: p3, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.poderes_familia': false,
    }));
  },
});
try {
  await irParaHarness(p3, 'avst-harness.html', 1200);
  await ativarPoderNoPalco(p3);
  ok(await p3.locator('[data-teste="poder-ativo"]').count() === 1, 'poder clássico deveria seguir funcionando');
  ok(await p3.locator('[data-teste="poder-particulas"]').count() === 0, 'flag off não pode ter partículas de família (§651)');
  ok(await p3.locator('.avst5-viewport[data-poder-cam]').count() === 0, 'flag off não pode mexer na câmera (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('poderes-familia', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
