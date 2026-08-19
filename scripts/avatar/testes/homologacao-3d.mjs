// testes/homologacao-3d.mjs — onda 1409 (MEGA_BRIEFING_01 §96, §148–§151,
// §1749–§1755, §2625–§2650, §2804, §2968–§2972; decisão #165b): HOMOLOGAÇÃO
// de assets 3D, LODs, corpo-benchmark e telemetria de asset.
//
//   A) Node + navegador headless (fora da UI): gerar-renders-homologacao na
//      base UBC (front, silhueta+clay, lod0+lod2) → renders gerados, IoU
//      lod0×lod2 ≥ 0,92 (§2636), landmarks (altura/ombros/cabeças) coerentes;
//      corpo-benchmark: estiloDe/avaliar em fixtures (faixa por estilo,
//      desvio detectado), benchmark(--so) da UBC masculina dentro da faixa e
//      evidências JSON (lods-3d, corpo-benchmark) coerentes com o medido.
//   B) Navegador (palco 3D do shell): com `as6.telemetria_assets` ON o
//      carregamento emite `avst:asset_carregou` (slug/lod/ms, sem URL);
//      trocar o tier (definirQualidade) emite `avst:lod_transicao`
//      (lodAnterior≠lod); rate limit ≤ 6/slug/min; OFF → zero eventos
//      asset_*; TelemetriaDev mostra o bloco "Assets 3D" (tlm-assets).
// @version 1.0.0  @created 2026-08-19
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { abrir, irParaHarness, relatorio } from './navegador.mjs';
import { gerarRendersHomologacao } from '../assets3d/gerar-renders-homologacao.mjs';
import { IOU_MINIMO, auditarTudo } from '../assets3d/auditar-lods.mjs';
import { FAIXAS, estiloDe, avaliar, benchmark } from '../assets3d/corpo-benchmark.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const UBC = join(RAIZ, 'public', 'assets', 'avatars', '3d', 'personagens', 'base_superhero_m');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) homologação fora da UI ───────────────────────────────────────
{
  const r = await gerarRendersHomologacao(UBC, { angulos: ['front', '34'], modos: ['silhueta', 'clay'], lods: [0, 2], gravarPng: true, saida: join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'homologacao', 'base_superhero_m'), porta: 8915 });
  ok(r.arquivos.length === 8, `[A] esperados 8 renders (2 ângulos × 2 modos × 2 LODs), vieram ${r.arquivos.length}`);
  ok(r.arquivos.every((a) => existsSync(a)), '[A] render não gravado em disco');
  ok(existsSync(join(r.destino, 'metricas.json')), '[A] metricas.json ausente');
  const l2 = r.metricas.lods.lod2;
  ok(l2 && l2.iou_front >= IOU_MINIMO && l2.iou_34 >= IOU_MINIMO, `[A] IoU lod0×lod2 abaixo de ${IOU_MINIMO}: ${JSON.stringify(l2)}`);
  ok(l2 && l2.triangulos < r.metricas.lods.lod0.triangulos, '[A] lod2 deveria ter menos triângulos renderizados que lod0');
  const lm = r.metricas.landmarks;
  ok(lm && lm.altura > 1.6 && lm.altura < 2.0, `[A] altura UBC fora de 1,6–2,0 m: ${lm?.altura}`);
  ok(lm && lm.larguraOmbros > 0.3 && lm.larguraOmbros < 0.6, `[A] largura de ombros UBC estranha: ${lm?.larguraOmbros}`);
  ok(lm && lm.cabecasNaAltura > 7 && lm.cabecasNaAltura < 9.5, `[A] cabeças na altura UBC estranho: ${lm?.cabecasNaAltura}`);
  ok(r.metricas.look === 'estudio@1', '[A] metadados de captura sem look estudio@1');

  // corpo-benchmark puro
  ok(estiloDe({ id: 'base_superhero_m' }) === 'realista' && estiloDe({ id: 'humano_punk' }) === 'estilizado' && estiloDe({ id: 'animal_pug' }) === 'criatura' && estiloDe({ id: 'androide' }) === 'robo', '[A] estiloDe heurística');
  ok(estiloDe({ id: 'x', estilo: 'cartoon' }) === 'cartoon', '[A] estiloDe deveria respeitar manifest.estilo');
  const dentro = avaliar({ altura: 1.8, larguraOmbros: 0.4, cabecasNaAltura: 7.8 }, 'realista');
  ok(dentro.dentroDaFaixa && dentro.ombrosSobreAltura === 0.222, `[A] avaliar dentro da faixa: ${JSON.stringify(dentro)}`);
  const fora = avaliar({ altura: 1.8, larguraOmbros: 0.9, cabecasNaAltura: 3 }, 'realista');
  ok(!fora.dentroDaFaixa && fora.desvios.length === 2, `[A] avaliar deveria apontar 2 desvios: ${JSON.stringify(fora)}`);
  ok(avaliar({}, 'realista').dentroDaFaixa, '[A] landmarks ausentes não são desvio');
  for (const [e, f] of Object.entries(FAIXAS)) ok(f.cabecasNaAltura[0] < f.cabecasNaAltura[1] && f.alturaM[0] < f.alturaM[1], `[A] faixa ${e} inválida`);
  const bm = await benchmark({ so: 'base_superhero_m', porta: 8916 });
  ok(bm.resumo.total === 1 && bm.bases[0].dentroDaFaixa, `[A] benchmark UBC fora da faixa: ${JSON.stringify(bm.resumo)}`);
  const cbJson = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'corpo-benchmark.json');
  ok(existsSync(cbJson), '[A] evidencias/corpo-benchmark.json ausente');
  if (existsSync(cbJson)) {
    const g = JSON.parse(readFileSync(cbJson, 'utf8'));
    const ubc = g.bases.find((b) => b.id === 'base_superhero_m');
    ok(g.resumo.total === 8 && ubc && JSON.stringify(ubc.landmarks) === JSON.stringify(bm.bases[0].landmarks), '[A] corpo-benchmark.json diverge do medido (regenerar: node scripts/avatar/assets3d/corpo-benchmark.mjs)');
  }
  // lods-3d coerente com o IoU medido (identicos = 1 por definição)
  const lods = auditarTudo();
  const a = lods.assets.find((x) => x.id === 'base_superhero_m');
  ok(a && a.classe === 'lod1=lod0' && a.reducao.lod2 < 0.6, `[A] auditoria de LODs da UBC: ${JSON.stringify(a?.reducao)}`);
}

// ── B) telemetria de asset no palco 3D do shell ────────────────────
async function abrirPalco3d(flags) {
  const sessao = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch {}
      window.__eventosAsset = [];
      for (const t of ['asset_carregou', 'asset_falhou', 'lod_transicao', 'fallback_ativado', 'parte_falhou', 'parte_carregou']) {
        window.addEventListener(`avst:${t}`, (e) => window.__eventosAsset.push({ tipo: t, ...(e.detail ?? {}) }));
      }
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, 'as5.analytics_local': true, 'as5.telemetria_painel': true, ...flags } },
  });
  const { pagina } = sessao;
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(6000);
  return sessao;
}
const eventos = (pagina) => pagina.evaluate(() => window.__eventosAsset ?? []);
let errosB = [];
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.telemetria_assets': true });
  try {
    const ev = await eventos(pagina);
    const carregou = ev.filter((e) => e.tipo === 'asset_carregou');
    ok(carregou.length >= 1, `[B1] asset_carregou não emitido (eventos: ${JSON.stringify(ev).slice(0, 300)})`);
    ok(carregou.every((e) => typeof e.slug === 'string' && /^lod[0-2]$/.test(e.lod ?? '') && typeof e.ms === 'number' && !('url' in e)), `[B1] payload de asset_carregou deveria ter slug/lod/ms e nunca URL: ${JSON.stringify(carregou[0])}`);
    ok(carregou.every((e) => e.origem === 'panel-avatar-studio'), '[B1] evento sem origem do painel');
    // transição de LOD via tier (sem trocar personagem)
    const antes = carregou.length;
    await pagina.evaluate(() => window.__avst3d?.definirQualidade?.('economico'));
    await pagina.waitForTimeout(5000);
    const ev2 = await eventos(pagina);
    const trans = ev2.filter((e) => e.tipo === 'lod_transicao');
    ok(trans.length >= 1 && trans.every((e) => e.lod !== e.lodAnterior && /^lod/.test(e.lodAnterior)), `[B2] lod_transicao não emitido/inválido após trocar tier: ${JSON.stringify(ev2.slice(antes)).slice(0, 300)}`);
    // rate limit: 20 emissões sintéticas do mesmo slug → ≤ 6 passam por minuto
    const passaram = await pagina.evaluate(async () => {
      const r = window.__avst3d; if (!r) return -1;
      const n0 = (window.__eventosAsset ?? []).filter((e) => e.tipo === 'parte_carregou' && e.slug === 'sintetico').length;
      for (let i = 0; i < 20; i += 1) r.eventoAsset?.({ tipo: 'parte_carregou', slug: 'sintetico' });
      await new Promise((res) => setTimeout(res, 200));
      return (window.__eventosAsset ?? []).filter((e) => e.tipo === 'parte_carregou' && e.slug === 'sintetico').length - n0;
    });
    ok(passaram === 6, `[B3] rate limit deveria deixar passar 6 de 20 (passaram ${passaram})`);
    // TelemetriaDev: bloco Assets 3D (paleta Ctrl+K → "telemetria")
    await pagina.keyboard.press('Control+k');
    await pagina.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
    await pagina.locator('[data-teste="paleta-comandos"] input').fill('telemetria');
    await pagina.waitForTimeout(300);
    await pagina.keyboard.press('Enter');
    await pagina.waitForSelector('[data-teste="telemetria-dev"]', { timeout: 5000 });
    ok(await pagina.locator('[data-teste="tlm-assets"]').count() === 1, '[B4] TelemetriaDev sem o bloco "Assets 3D" (tlm-assets)');
    const txt = await pagina.locator('[data-teste="tlm-assets-carregou"]').textContent().catch(() => '');
    ok(/×[1-9]\d*/.test(txt ?? '') && /média \d+ ms/.test(txt ?? ''), `[B4] contagem/média de carregou ausente: ${txt}`);
  } finally { errosB = [...erros]; await navegador.close(); }
}
{
  const { navegador, pagina, erros } = await abrirPalco3d({ 'as6.telemetria_assets': false });
  try {
    const ev = await eventos(pagina);
    ok(ev.length === 0, `[B5] com a flag OFF não deveria haver eventos asset_* (${ev.length})`);
    await pagina.evaluate(() => window.__avst3d?.definirQualidade?.('economico'));
    await pagina.waitForTimeout(4000);
    ok((await eventos(pagina)).length === 0, '[B5] flag OFF: troca de tier não deveria emitir');
  } finally { errosB.push(...erros); await navegador.close(); }
}

relatorio('homologacao-3d', falhas, errosB);
process.exit(falhas.length ? 1 : 0);
