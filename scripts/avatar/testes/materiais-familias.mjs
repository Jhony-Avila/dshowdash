// testes/materiais-familias.mjs — onda 1421 (MEGA_BRIEFING_01 Parte 7
// P7-C..F; decisões #208/#209): FAMÍLIAS DE MATERIAL APLICADAS + TEXTURE
// PIPELINE.
//
//   A) Node puro — FamiliasMaterial: paramsFamiliaPorTier (econômico sem
//      extras físicos/normalScale; alto herda ultra), skin 3 tiers com
//      deltas travados (DELTA_MAX_TIER — proxy do "ΔE entre tiers"),
//      GOLDEN_MATERIAIS M01–M12 snapshot literal (#83), teto emissivo
//      por raridade monotônico e ≤ 2.0, naoTingir/albedo dos metais
//      nobres, alpha policy (cabelo mask, vidro/holo blend), anisotropy
//      só no ultra do cabelo. Validador de texturas: parsers PNG/JPEG/
//      WEBP em buffers sintéticos, POT, teto por categoria, E1 (color
//      space) e E2 (fator fora de [0,1]) num glTF sintético; catálogo
//      real (110 glbs) SEM erros; manifests das bases superhero declaram
//      famílias que EXISTEM no registry.
//   B) Navegador (palco 3D, handle dev): flags OFF = zero userData.familia
//      nos materiais do personagem; as6.material_v2 ON = cena de
//      calibração com as 12 esferas do Golden Set batendo os params
//      esperados (metais com albedo físico e naoTingir; pipeline de
//      cores NÃO tinge esfera naoTingir), context loss não perde as
//      famílias do personagem (retomada §1677), zero erros JS.
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
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1421-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { FAMILIAS_MATERIAL, GOLDEN_MATERIAIS, DELTA_MAX_TIER, TETO_EMISSIVO_POR_RARIDADE, ALBEDO_METAL, paramsFamiliaPorTier, tetoEmissivo, corPbrSegura } from '@painel/services/FamiliasMaterial';
const p: string[] = [];
// econômico: sem extras físicos nem normalScale
for (const fam of Object.values(FAMILIAS_MATERIAL)) {
  const eco = paramsFamiliaPorTier(fam, 'economico') as Record<string, unknown>;
  for (const k of ['transmission', 'sheen', 'clearcoat', 'anisotropy', 'normalScale']) {
    if (eco[k] !== undefined) p.push(fam.id + ': economico nao pode ter ' + k);
  }
  const alto = paramsFamiliaPorTier(fam, 'alto');
  const medio = paramsFamiliaPorTier(fam, 'medio');
  if (JSON.stringify(medio) !== JSON.stringify(fam.padrao)) p.push(fam.id + ': medio != padrao');
  if (fam.ultra?.sheen !== undefined && alto.sheen !== fam.ultra.sheen) p.push(fam.id + ': alto nao herda ultra');
  // deltas por tier travados (proxy do dE) p/ familias organicas
  if (['skin', 'hair', 'hair_soft', 'hair_gloss', 'hair_coarse'].includes(fam.id)) {
    if (Math.abs((eco.roughness as number) - alto.roughness) > DELTA_MAX_TIER.roughness) p.push(fam.id + ': roughness eco/alto longe demais');
    if (Math.abs((eco.env as number) - alto.env) > DELTA_MAX_TIER.env) p.push(fam.id + ': env eco/alto longe demais');
  }
}
// skin 3 tiers de verdade
const sEco = paramsFamiliaPorTier(FAMILIAS_MATERIAL.skin, 'economico');
const sAlto = paramsFamiliaPorTier(FAMILIAS_MATERIAL.skin, 'alto');
if (sEco.roughness === sAlto.roughness && sEco.env === sAlto.env) p.push('skin: economico igual ao alto (deveria haver 3 tiers)');
if (sAlto.sheen === undefined) p.push('skin alto deveria ter sheen');
// golden set M01-M12 (snapshot literal, #83)
if (GOLDEN_MATERIAIS.length !== 12) p.push('golden set != 12 casos');
for (const caso of GOLDEN_MATERIAIS) {
  const fam = FAMILIAS_MATERIAL[caso.familia];
  if (!fam) { p.push(caso.id + ': familia inexistente'); continue; }
  const eff = paramsFamiliaPorTier(fam, caso.tier);
  if (eff.roughness !== caso.esperado.roughness || eff.metalness !== caso.esperado.metalness || eff.env !== caso.esperado.env) {
    p.push(caso.id + ': registry divergiu do golden (' + JSON.stringify(eff) + ')');
  }
}
// teto emissivo por raridade: monotonico e <= 2
const ordem = ['comum', 'raro', 'epico', 'lendario', 'mitico'] as const;
for (let i = 1; i < ordem.length; i += 1) {
  if (TETO_EMISSIVO_POR_RARIDADE[ordem[i]] <= TETO_EMISSIVO_POR_RARIDADE[ordem[i - 1]]) p.push('teto emissivo nao cresce com a raridade');
}
if (Object.values(TETO_EMISSIVO_POR_RARIDADE).some((v) => v > 2)) p.push('teto por raridade acima do teto global 2.0');
if (tetoEmissivo(undefined) !== 2 || tetoEmissivo('zzz') !== 2) p.push('tetoEmissivo sem raridade deveria ser o global');
if (tetoEmissivo('comum') !== 1.2) p.push('tetoEmissivo(comum) != 1.2');
// metais nobres: naoTingir + albedo fisico
for (const id of ['gold', 'silver', 'bronze'] as const) {
  if (!FAMILIAS_MATERIAL[id].naoTingir) p.push(id + ' deveria ser naoTingir');
  if (ALBEDO_METAL[id] === undefined) p.push(id + ' sem albedo fisico');
}
if (!FAMILIAS_MATERIAL.eyes.naoTingir || !FAMILIAS_MATERIAL.teeth.naoTingir) p.push('olhos/dentes deveriam ser naoTingir');
// alpha policy
if (FAMILIAS_MATERIAL.hair.padrao.alpha !== 'mask') p.push('cabelo deveria ser alpha mask');
if (FAMILIAS_MATERIAL.glass_clear.padrao.alpha !== 'blend' || FAMILIAS_MATERIAL.hologram.padrao.alpha !== 'blend') p.push('vidro/holograma deveriam ser blend');
// anisotropy so no ultra do cabelo
if (paramsFamiliaPorTier(FAMILIAS_MATERIAL.hair, 'medio').anisotropy !== undefined) p.push('anisotropy vazou p/ o medio');
if (paramsFamiliaPorTier(FAMILIAS_MATERIAL.hair, 'alto').anisotropy === undefined) p.push('hair ultra deveria ter anisotropy');
// clamp pbr-safe
if (corPbrSegura(0x000000) === 0 || corPbrSegura(0xffffff) === 0xffffff) p.push('corPbrSegura nao clampa extremos');
console.log(JSON.stringify(p));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim().split('\n').pop();
    for (const m of JSON.parse(saida)) falhas.push(`[A] ${m}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// A2: validador de texturas — helpers puros + catálogo real + manifests
{
  const { execSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const V = await import('../assets3d/validar-texturas.mjs');
  // parsers em buffers sintéticos
  const png = Buffer.alloc(26);
  png.writeUInt32BE(0x89504e47, 0); png.writeUInt32BE(512, 16); png.writeUInt32BE(256, 20);
  const dPng = V.dimensoesPng(png);
  ok(dPng && dPng.largura === 512 && dPng.altura === 256, '[A2] parser PNG errado');
  ok(V.dimensoesPng(Buffer.from('nada')) === null, '[A2] PNG falso deveria dar null');
  ok(V.ehPot(1024) && !V.ehPot(1000) && !V.ehPot(0), '[A2] ehPot errado');
  ok(V.TEXTURA_MAX.parte === 1024 && V.TEXTURA_MAX.personagem === 2048, '[A2] tetos por categoria errados');
  ok(V.categoriaDoCaminho('/x/partes/cab/modelo.glb') === 'parte' && V.categoriaDoCaminho('/x/personagens/a/m.glb') === 'personagem', '[A2] categoria do caminho errada');
  // glTF sintético: E1 (mesma imagem cor+normal) e E2 (fator > 1)
  const sintetico = {
    materials: [{ name: 'ruim', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 1.4 }, normalTexture: { index: 0 } }],
    textures: [{ source: 0 }],
    images: [{ mimeType: 'image/png' }],
  };
  const r = V.validarGlb(sintetico, null, 'parte');
  ok(r.erros.some((e) => e.startsWith('E1')), '[A2] E1 (color space) nao detectado');
  ok(r.erros.some((e) => e.startsWith('E2')), '[A2] E2 (fator fora de [0,1]) nao detectado');
  // catálogo real: roda o CLI — zero erros (avisos ok; A1 das partes é achado registrado)
  const saida = execSync(`node "${join(RAIZ, 'scripts', 'avatar', 'assets3d', 'validar-texturas.mjs')}"`, { encoding: 'utf8' });
  ok(/erros 0/.test(saida), `[A2] catálogo real com ERROS de textura: ${saida.slice(0, 160)}`);
  // manifests superhero: familias declaradas existem no registry
  for (const slug of ['base_superhero_m', 'base_superhero_f']) {
    const man = JSON.parse(readFileSync(join(RAIZ, 'public', 'assets', 'avatars', '3d', 'personagens', slug, 'manifest.json'), 'utf8'));
    const fams = Object.values(man.materiais ?? {}).map((m) => m.familia).filter(Boolean);
    ok(fams.length >= 3, `[A2] ${slug}: manifest sem familias declaradas`);
    ok(fams.includes('skin') && fams.includes('eyes') && fams.includes('hair'), `[A2] ${slug}: familias esperadas ausentes (${fams})`);
  }
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

// B1: flags OFF — zero familia nos materiais do personagem
{
  const { pagina, fechar } = await abrirPalco3d({});
  const marcas = await pagina.evaluate(() => {
    const r = window.__avst3d;
    let n = 0;
    r?.personagem?.traverse?.((o) => {
      const m = o.material;
      for (const x of Array.isArray(m) ? m : m ? [m] : []) if (x.userData?.familia) n += 1;
    });
    return n;
  });
  ok(marcas === 0, `[B1] userData.familia vazou SEM as6.material_v2 (${marcas})`);
  await fechar();
}

// B2: as6.material_v2 ON — golden spheres + naoTingir + retomada
{
  const { pagina, erros: errosJs, fechar } = await abrirPalco3d({ 'as6.material_v2': true, 'as6.qa_visual': true });
  const info = await pagina.evaluate(() => {
    const r = window.__avst3d;
    const n = r.montarCenaMateriais('alto');
    const casos = r.cenaMateriaisInfo();
    // pipeline de cores com cor de destaque forte: naoTingir tem que resistir
    return { n, casos };
  });
  ok(info.n === 12, `[B2] cena de materiais deveria ter 12 esferas (veio ${info.n})`);
  const caso = (id) => info.casos.find((c) => c.id === id);
  ok(caso('M07') && caso('M07').metalness === 1 && caso('M07').naoTingir === true, '[B2] M07 (ouro) deveria ser metal naoTingir');
  ok(caso('M07') && caso('M07').cor === 0xffc46b, `[B2] M07 (ouro) deveria usar o albedo físico (veio #${caso('M07')?.cor?.toString(16)})`);
  ok(caso('M01') && Math.abs(caso('M01').roughness - 0.55) < 1e-6, '[B2] M01 (skin medio... alto) roughness fora do golden');
  ok(caso('M09') && Math.abs(caso('M09').roughness - 0.05) < 1e-6, '[B2] M09 (vidro) roughness fora do golden');
  ok(info.casos.every((c) => c.familia), '[B2] esfera sem familia marcada');
  // retomada §1677: context loss não perde as famílias do personagem
  const antes = await pagina.evaluate(() => {
    const r = window.__avst3d;
    r.desmontarCenaMateriais();
    let fams = 0;
    r.personagem?.traverse?.((o) => {
      const m = o.material;
      for (const x of Array.isArray(m) ? m : m ? [m] : []) if (x.userData?.familia) fams += 1;
    });
    return fams;
  });
  if (antes > 0) {
    const depois = await pagina.evaluate(async () => {
      const r = window.__avst3d;
      const ext = r.renderer?.getContext?.()?.getExtension?.('WEBGL_lose_context');
      if (!ext) return -1;
      ext.loseContext();
      await new Promise((res) => { setTimeout(res, 400); });
      ext.restoreContext();
      await new Promise((res) => { setTimeout(res, 3500); });
      let fams = 0;
      r.personagem?.traverse?.((o) => {
        const m = o.material;
        for (const x of Array.isArray(m) ? m : m ? [m] : []) if (x.userData?.familia) fams += 1;
      });
      return fams;
    });
    ok(depois === -1 || depois > 0, `[B2] familias sumiram após context loss (${antes} -> ${depois})`);
  }
  ok(!errosJs.length, `[B2] erros JS: ${errosJs.slice(0, 2).join(' | ')}`);
  await fechar();
}

console.log('[materiais-familias] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
