// testes/posfoto.mjs — onda 1420 (MEGA_BRIEFING_01 Parte 8 P8-D/P8-E;
// decisões #206/#207): PÓS V2 POR LOOK + LENTES DO PHOTO 3D.
//
//   A) Node puro — Looks3d: hero/product existem (legado=false), todo
//      look declara `pos` válido, `estudio` é NEUTRO (contrato §2027),
//      `product` sem bloom/vinheta (catálogo); Cenas3d.LUZES_3D cresceu
//      aditivamente; QualityManager.passesPos degrada POR PASS
//      (econômico zera, médio derruba só o bloom, alto libera tudo);
//      LentesFoto: 6 lentes, aspectos 1:1/4:5/9:16, dimensões coerentes,
//      câmera/look apontam para registries reais, terços em (0,1).
//   B) Navegador (palco 3D, handle dev as5.hud3d):
//      1. flags OFF: sem UI de lentes/dev-luz; posInfo().v2 = false
//         mesmo em look com pós (composer v2 nem nasce);
//      2. flags ON: look hero liga bloom+grade+vinheta no tier alto;
//         estudio derruba o composer (neutro); tier médio degrada o
//         bloom e mantém grade/vinheta; CONTEXT LOSS recria o composer
//         (geracao cresce — WEBGL_lose_context); capturarComLente é
//         determinística (2 capturas = mesmos bytes), respeita as
//         dimensões da lente e RESTAURA look/câmera; ajustarLuzDev
//         multiplica a key e null restaura; zero erros JS.
// @version 1.0.0  @created 2026-08-22
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1420-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { LOOKS, POS_NEUTRO } from '@painel/services/Looks3d';
import { LUZES_3D } from '@painel/services/Cenas3d';
import { passesPos, PASSES_POR_TIER } from '@painel/services/QualityManager';
import { LENTES_FOTO, DIMENSOES_ASPECTO, dimensoesLente, nomeFotoLente } from '@painel/services/LentesFoto';
import { PRESETS_CAMERA_3D } from '@painel/services/Camera3d';
const p: string[] = [];
// looks novos
for (const id of ['hero', 'product'] as const) {
  const l = (LOOKS as Record<string, { legado: boolean } | undefined>)[id];
  if (!l) p.push('look ausente: ' + id);
  else if (l.legado) p.push(id + ' nao pode ser legado (so aparece com as6.looks)');
}
// contrato de pos por look
for (const [id, l] of Object.entries(LOOKS)) {
  if (!l.pos || typeof l.pos !== 'object') { p.push(id + ': sem pos'); continue; }
  const { bloom, grade, vinheta } = l.pos;
  if (bloom !== null && !(bloom.forca > 0 && bloom.raio >= 0 && bloom.limiar >= 0 && bloom.limiar <= 1)) p.push(id + ': bloom invalido');
  if (grade !== null && !(grade.saturacao > 0 && grade.contraste > 0 && Math.abs(grade.temperatura) <= 0.2 && typeof grade.protegerPele === 'boolean')) p.push(id + ': grade invalido');
  if (vinheta !== null && !(vinheta.forca > 0 && vinheta.forca <= 1 && vinheta.suavidade > 0 && vinheta.suavidade <= 1)) p.push(id + ': vinheta invalida');
}
if (JSON.stringify(LOOKS.estudio.pos) !== JSON.stringify(POS_NEUTRO)) p.push('estudio DEVE ter pos neutro (contrato)');
if (LOOKS.product.pos.bloom !== null || LOOKS.product.pos.vinheta !== null) p.push('product nao pode ter bloom/vinheta (catalogo)');
if (!LOOKS.hero.pos.bloom || !LOOKS.hero.pos.grade || !LOOKS.hero.pos.vinheta) p.push('hero deveria usar a cadeia completa');
for (const [id, l] of Object.entries(LOOKS)) if (l.pos.grade && !l.pos.grade.protegerPele) p.push(id + ': grade sem protecao de pele (§1969)');
// enum de cenas cresceu aditivamente
for (const luz of ['estudio', 'quente', 'fria', 'neon', 'portrait', 'dramatic', 'hero', 'product']) {
  if (!(LUZES_3D as readonly string[]).includes(luz)) p.push('LUZES_3D sem ' + luz);
}
// degradação por pass
const eco = passesPos('economico'); const med = passesPos('medio'); const alt = passesPos('alto');
if (eco.bloom || eco.grade || eco.vinheta) p.push('economico deveria zerar os passes');
if (med.bloom || !med.grade || !med.vinheta) p.push('medio deveria derrubar SO o bloom');
if (!alt.bloom || !alt.grade || !alt.vinheta) p.push('alto deveria liberar a cadeia inteira');
if (JSON.stringify(passesPos('zzz')) !== JSON.stringify(PASSES_POR_TIER.medio)) p.push('tier desconhecido deveria cair no medio (fail-safe)');
// lentes
const ids = Object.keys(LENTES_FOTO);
if (ids.length !== 6) p.push('deveriam ser 6 lentes (veio ' + ids.length + ')');
for (const [id, l] of Object.entries(LENTES_FOTO)) {
  if (!DIMENSOES_ASPECTO[l.aspecto]) p.push(id + ': aspecto fora do dominio');
  if (!(PRESETS_CAMERA_3D as Record<string, unknown>)[l.camera]) p.push(id + ': camera sem preset no Camera3d');
  if (!(LOOKS as Record<string, unknown>)[l.look]) p.push(id + ': look inexistente');
  if (!(l.tercos > 0 && l.tercos < 1)) p.push(id + ': tercos fora de (0,1)');
  const d = dimensoesLente(id as keyof typeof LENTES_FOTO);
  const [aw, ah] = l.aspecto.split(':').map(Number);
  if (Math.abs(d.largura / d.altura - aw / ah) > 0.01) p.push(id + ': dimensoes nao batem com o aspecto');
  if (!nomeFotoLente(id as keyof typeof LENTES_FOTO).includes(id)) p.push(id + ': nome de arquivo sem o id');
}
if (LENTES_FOTO.profile.aspecto !== '1:1' || LENTES_FOTO.portrait.aspecto !== '4:5' || LENTES_FOTO.fashion.aspecto !== '9:16') p.push('aspectos canonicos errados');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B) Navegador ────────────────────────────────────────────────────
async function abrirPalco3d(flags) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch { /* ok */ }
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags } },
  });
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(6000);
  return { pagina, erros, fechar: () => navegador.close() };
}

// B1: flags OFF — UI ausente e composer v2 nunca nasce
{
  const { pagina, fechar } = await abrirPalco3d({});
  ok((await pagina.locator('[data-teste="p3d-lentes"]').count()) === 0, '[B1] UI de lentes visivel SEM as6.foto_lentes');
  ok((await pagina.locator('[data-teste="p3d-dev-luz"]').count()) === 0, '[B1] painel dev visivel SEM as6.dev_iluminacao');
  const info = await pagina.evaluate(() => {
    const r = window.__avst3d;
    if (!r || !r.aplicarLook || !r.posInfo) return null;
    r.aplicarLook('dramatic'); // look COM pos declarado
    return r.posInfo();
  });
  ok(info && info.v2 === false, '[B1] composer v2 nasceu SEM as6.pos_v2');
  await fechar();
}

// B2: pos_v2 + looks + foto_lentes + camera_v2 + sombras_v2 ON
{
  const { pagina, erros: errosJs, fechar } = await abrirPalco3d({
    'as6.pos_v2': true, 'as6.looks': true, 'as6.foto_lentes': true,
    'as6.dev_iluminacao': true, 'as6.camera_v2': true, 'as6.sombras_v2': true,
  });
  ok((await pagina.locator('[data-teste="p3d-lentes"] button').count()) === 6, '[B2] deveriam ser 6 botoes de lente');
  ok((await pagina.locator('[data-teste="p3d-dev-key"]').count()) === 1, '[B2] slider dev key ausente');
  const posInfo = async () => pagina.evaluate(() => window.__avst3d.posInfo());
  // hero: cadeia completa no tier alto
  await pagina.evaluate(() => { window.__avst3d.definirQualidade('alto'); window.__avst3d.aplicarLook('hero'); });
  await pagina.waitForTimeout(400);
  let i = await posInfo();
  ok(i && i.v2 === true, '[B2] hero deveria LIGAR o composer v2');
  ok(i && i.passes.join(',') === 'bloom,grade,vinheta', `[B2] hero/alto deveria ter a cadeia completa (veio ${i?.passes})`);
  // estudio: neutro derruba o composer (contrato)
  await pagina.evaluate(() => { window.__avst3d.aplicarLook('estudio'); });
  i = await posInfo();
  ok(i && i.v2 === false, '[B2] estudio NAO pode manter composer (pos neutro)');
  // degradação por pass: médio derruba só o bloom
  await pagina.evaluate(() => { window.__avst3d.aplicarLook('neon'); window.__avst3d.definirQualidade('medio'); });
  await pagina.waitForTimeout(600);
  i = await posInfo();
  ok(i && i.v2 === true && !i.passes.includes('bloom') && i.passes.includes('grade') && i.passes.includes('vinheta'),
    `[B2] tier medio deveria derrubar SO o bloom (veio ${i?.passes})`);
  await pagina.evaluate(() => { window.__avst3d.definirQualidade('alto'); });
  await pagina.waitForTimeout(600);
  i = await posInfo();
  ok(i && i.passes.includes('bloom'), '[B2] voltar ao alto deveria devolver o bloom');
  // CONTEXT LOSS: composer recriado (geracao cresce)
  const gAntes = i ? i.geracao : 0;
  const perdeu = await pagina.evaluate(async () => {
    const r = window.__avst3d;
    const gl = r.renderer?.getContext?.();
    const ext = gl?.getExtension?.('WEBGL_lose_context');
    if (!ext) return 'sem-extensao';
    ext.loseContext();
    await new Promise((res) => { setTimeout(res, 400); });
    ext.restoreContext();
    return 'ok';
  });
  if (perdeu === 'ok') {
    await pagina.waitForTimeout(3500); // aoRestaurarContexto reaplica estado
    i = await posInfo();
    ok(i && i.v2 === true, '[B2] context loss deveria RECRIAR o composer v2');
    ok(i && i.geracao > gAntes, `[B2] geracao do composer deveria crescer no context loss (${gAntes} -> ${i?.geracao})`);
  }
  // LENTES: determinismo (2 capturas = mesmos bytes) + dimensões + restauro
  await pagina.evaluate(() => { window.__avst3d.aplicarLook('neon'); window.__avst3d.pausar(); });
  const lente = await pagina.evaluate(async () => {
    const r = window.__avst3d;
    const lookAntes = r.lookAtivo();
    const a = await r.capturarComLente('portrait', {});
    const b = await r.capturarComLente('portrait', {});
    const c = await r.capturarComLente('profile', {});
    return {
      iguais: a.dataUri === b.dataUri,
      dimsRetrato: [a.largura, a.altura],
      dimsPerfil: [c.largura, c.altura],
      nome: a.nome,
      lookRestaurado: r.lookAtivo() === lookAntes,
      posDepois: r.posInfo().v2,
    };
  });
  await pagina.evaluate(() => { window.__avst3d.retomar(); });
  ok(lente.iguais, '[B2] capturarComLente NAO foi deterministica (2 capturas diferentes)');
  ok(lente.dimsRetrato[0] === 960 && lente.dimsRetrato[1] === 1200, `[B2] portrait deveria sair 960x1200 (veio ${lente.dimsRetrato})`);
  ok(lente.dimsPerfil[0] === 960 && lente.dimsPerfil[1] === 960, `[B2] profile deveria sair 960x960 (veio ${lente.dimsPerfil})`);
  ok(lente.nome.includes('portrait'), '[B2] nome do arquivo sem a lente');
  ok(lente.lookRestaurado, '[B2] look NAO foi restaurado apos a captura');
  ok(lente.posDepois === true, '[B2] pos v2 do look ativo deveria voltar apos a captura');
  // dev-luz: multiplicador sobre a key e restauro exato
  const dev = await pagina.evaluate(() => {
    const r = window.__avst3d;
    r.aplicarLook('estudio');
    const antes = r.luzes.chave.intensity;
    r.ajustarLuzDev({ key: 1.5 });
    const durante = r.luzes.chave.intensity;
    r.ajustarLuzDev(null);
    const depois = r.luzes.chave.intensity;
    return { antes, durante, depois };
  });
  ok(Math.abs(dev.durante - dev.antes * 1.5) < 1e-6, `[B2] ajustarLuzDev(key 1.5) nao multiplicou (${dev.antes} -> ${dev.durante})`);
  ok(Math.abs(dev.depois - dev.antes) < 1e-6, '[B2] ajustarLuzDev(null) nao restaurou byte a byte');
  ok(!errosJs.length, `[B2] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

console.log('[posfoto] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
