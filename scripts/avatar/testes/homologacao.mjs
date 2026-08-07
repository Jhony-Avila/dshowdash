// testes/homologacao.mjs — lote 701–710 (§487–§495 + gate §631):
// HOMOLOGAÇÃO da onda 611–720 sobre os ASSETS REAIS publicados.
//   A) §487/§488: validador ampliado varre TODOS os personagens e partes
//      publicados — nenhum reprovado; assets UBC sem NENHUMA ressalva;
//      relatório §488 impresso por asset com problema;
//   B) pacote UAL: integridade §477 (hash do manifest bate no arquivo) e
//      curadoria mínima (≥10 clipes);
//   C) gate §631: motor3d ≤ 1180KB (quando o dist local existe);
//   D) §489/§490/§493 no PALCO: Herói vestido (Ranger+cabelo) em corpo
//      esbelto→robusto→compacto com animação VIVA (loop §493), fundo
//      claro e escuro (§489 luz), zero erros JS — evidências salvas.
// N/A honestos (registrados em docs/AVATAR-STUDIO-5/homologacao-onda-611):
// §491 boné/capacete/headset (sem esses assets), física §424 (rígido),
// §492 acessórios (sem acessórios 3D próprios), §494 cenário/§495 poder
// (F9 com arte própria).
// @version 1.0.0  @created 2026-08-07
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { relatorioDeValidacao } from '../assets3d/validar-asset.mjs';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) §487/§488: varredura de TODOS os assets publicados ───────────
let total = 0;
let aprovadosLimpos = 0;
let comRessalvas = 0;
const ubcComRessalva = [];
for (const base of ['public/assets/avatars/3d/personagens', 'public/assets/avatars/3d/partes']) {
  const dir = join(RAIZ, base);
  for (const slug of readdirSync(dir).sort()) {
    if (!existsSync(join(dir, slug, 'manifest.json'))) continue;
    total += 1;
    const r = relatorioDeValidacao(join(dir, slug));
    if (r.status === 'reprovado') {
      falhas.push(`asset REPROVADO na homologação: ${slug}`);
      console.log(`── relatório §488: ${slug} ──\n${r.linhas.join('\n')}`);
    } else if (r.status === 'aprovado com ressalvas') {
      comRessalvas += 1;
      const ehUbc = slug.startsWith('base_superhero') || slug.startsWith('cab_') || slug.startsWith('rou3d_');
      if (ehUbc) {
        ubcComRessalva.push(slug);
        console.log(`── relatório §488: ${slug} ──\n${r.linhas.join('\n')}`);
      }
    } else {
      aprovadosLimpos += 1;
    }
  }
}
ok(total >= 34, `varredura encontrou só ${total} assets (esperava ≥34)`);
ok(ubcComRessalva.length === 0, `assets UBC com ressalvas: ${ubcComRessalva.join(', ')} (onda 611+ tem de sair LIMPA)`);
console.log(`[homologacao] §488: ${total} assets · ${aprovadosLimpos} aprovados limpos · ${comRessalvas} com ressalvas (legados) · 0 reprovados exigido`);

// ── B) pacote UAL: integridade §477 + curadoria ─────────────────────
{
  const pastaPac = join(RAIZ, 'public/assets/avatars/3d/animacoes/ual_basico');
  ok(existsSync(join(pastaPac, 'manifest.json')), 'pacote ual_basico ausente');
  if (existsSync(join(pastaPac, 'manifest.json'))) {
    const m = JSON.parse(readFileSync(join(pastaPac, 'manifest.json'), 'utf8'));
    ok(m.tipo === 'pacote_animacoes' && (m.clipes ?? []).length >= 10,
      `pacote com curadoria incompleta (${(m.clipes ?? []).length} clipes)`);
    const hash = createHash('sha256').update(readFileSync(join(pastaPac, m.arquivo))).digest('hex');
    ok(hash === m.hashes?.pacote, 'hash do pacote UAL não confere (§477)');
    ok(m.licenca?.tipo === 'CC0', 'pacote sem licença CC0 declarada (§511)');
  }
}

// ── C) gate §631: peso do motor3d (dist local, quando existe) ───────
{
  const chunks = join(RAIZ, 'public/components/panels/panel-avatar-studio/dist/chunks');
  if (existsSync(chunks)) {
    const motor = readdirSync(chunks).find((f) => f.startsWith('motor3d.'));
    if (motor) {
      const kb = Math.round(statSync(join(chunks, motor)).size / 1024);
      ok(kb <= 1180, `motor3d com ${kb}KB — acima do gate §631 (1180KB)`);
      console.log(`[homologacao] gate §631: motor3d ${kb}KB ≤ 1180KB`);
    }
  } else {
    console.log('[homologacao] aviso: dist local ausente — gate §631 medido no deploy');
  }
}

// ── D) §489/§490/§493 no palco: corpos × luz × animação viva ────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1600, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
      localStorage.setItem('dshow.avst5.p3d.qualidade.v1', 'medio');
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[data-teste="botao-3d"]').click();
    await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
    await p.waitForTimeout(3000);
    // Herói UBC VESTIDO: Ranger + cabelo Longo (§490 roupa · §491 cabelo)
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-p3d-personagens .avst5-p3d-chip')].find((x) => x.textContent.includes('Herói (UBC)'))?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(5000);
    await p.waitForFunction(() => !document.querySelector('[data-teste="p3d-carga"]'), { timeout: 25000 }).catch(() => {});
    await p.evaluate(() => document.querySelector('[data-teste="p3d-cabelo-cab_longo"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(4000);
    await p.evaluate(() => document.querySelector('[data-teste="p3d-roupa-ranger"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(7000);
    await p.waitForFunction(() => !document.querySelector('[data-teste="p3d-carga"]'), { timeout: 25000 }).catch(() => {});
    const canvas = p.locator('[data-teste="palco-3d"] canvas');
    // §493 loop: animação VIVA (pacote UAL) — frames diferem sozinhos
    const f1 = await canvas.screenshot();
    await p.waitForTimeout(900);
    const f2 = await canvas.screenshot();
    ok(!f1.equals(f2), 'animação não está viva com o pacote UAL (§493 loop)');
    // §489 corpos: esbelto → robusto → compacto via UI §102 (sem erro)
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
    await p.waitForTimeout(800);
    for (const corpo of ['esbelto', 'robusto', 'compacto']) {
      await p.evaluate((c) => document.querySelector(`[data-teste="corpo-${c}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true })), corpo);
      await p.waitForTimeout(1200);
    }
    await p.screenshot({ path: `${SAIDA}/homolog-robusto-vestido.png` });
    await p.evaluate(() => document.querySelector('[data-teste="corpo-medio"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(800);
    // §489 luz clara/escura: fundo Estúdio ↔ Neutro
    await p.evaluate(() => { [...document.querySelectorAll('[data-teste="palco-3d"] .avst5-p3d-chip')].find((x) => x.textContent.trim() === 'Neutro')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${SAIDA}/homolog-neutro.png` });
    ok(erros.length === 0, `erros de página na homologação: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no palco: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS homologacao:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('homologacao OK');
