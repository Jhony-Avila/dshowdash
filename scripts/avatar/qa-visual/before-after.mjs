#!/usr/bin/env node
// qa-visual/before-after.mjs — onda 1423 (BRIEFING_CORRETIVO_01 §7–§9,
// §88–§90; decisão #215): GERADOR DE BEFORE × AFTER — o novo gate
// principal. Produz IMAGENS observáveis (não hash) comparando o que o
// usuário VÊ hoje (Legacy/flags OFF) com a experiência CANDIDATA
// (premium/stack v2 ON), mesmo avatar/pose/câmera/viewport (§8).
//
//   A) 2D (node puro — o motor SVG é puro): 8 casos §88, cada um
//      renderizado DUAS vezes (opcoes.premium/faceV2 explícitos — sem
//      flag global) e rasterizado com sharp em pares lado a lado.
//   B) 3D (navegador): 8 casos §89 — mesma cena capturada com flags OFF
//      e com o preset Candidate (looks/material/camera/sombras/pos).
//   C) UX (navegador): screenshot da UI 3D atual × simplificada (§90).
//
// Saída: scripts/avatar/testes/saida/before-after/*.png (fora do git,
// #158) — as folhas são ENVIADAS ao Jhony (aprovação humana §10).
// Uso: node scripts/avatar/qa-visual/before-after.mjs [--so-2d|--so-3d]
// @version 1.0.0  @created 2026-08-22
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const SAIDA = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'before-after');
mkdirSync(join(SAIDA, '2d'), { recursive: true });
mkdirSync(join(SAIDA, '3d'), { recursive: true });
mkdirSync(join(SAIDA, 'ux'), { recursive: true });

const sharp = (await import('sharp')).default;

const so2d = process.argv.includes('--so-2d');
const so3d = process.argv.includes('--so-3d');

/** Par lado a lado com rótulos BEFORE | AFTER (§9). */
async function montarPar(antesPng, depoisPng, titulo, destino) {
  const alvoAltura = 640;
  const a = await sharp(antesPng).resize({ height: alvoAltura }).toBuffer({ resolveWithObject: true });
  const d = await sharp(depoisPng).resize({ height: alvoAltura }).toBuffer({ resolveWithObject: true });
  const larg = a.info.width + d.info.width + 36;
  const alt = alvoAltura + 64;
  const rotulo = (texto, cor, x) => ({
    input: Buffer.from(`<svg width="${larg}" height="30"><text x="${x}" y="22" font-family="sans-serif" font-size="18" font-weight="bold" fill="${cor}">${texto}</text></svg>`),
    top: alt - 34, left: 0,
  });
  await sharp({ create: { width: larg, height: alt, channels: 4, background: '#14161c' } })
    .composite([
      { input: Buffer.from(`<svg width="${larg}" height="30"><text x="12" y="22" font-family="sans-serif" font-size="16" fill="#dfe4ee">${titulo}</text></svg>`), top: 2, left: 0 },
      { input: a.data, top: 34, left: 12 },
      { input: d.data, top: 34, left: a.info.width + 24 },
      rotulo('BEFORE (atual)', '#9aa3b5', 12),
      rotulo('AFTER (candidate)', '#69d58c', a.info.width + 24),
    ])
    .png()
    .toFile(destino);
}

// ── A) 2D ────────────────────────────────────────────────────────────
async function gerar2d() {
  const tmp = mkdtempSync(join(tmpdir(), 'avst-ba-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { svgDe, validarConfig } from '@painel/services/AvatarCatalog';
const B = { pele: '#e8b58c', cabelo: '#4a3527', roupa: '#2b5f8f', destaque: '#c9a227' };
const cfg = (extra: Record<string, unknown>) => validarConfig({ formato: 'camadas', versao: 3, cores: B, ...extra });
type Caso = { id: string; titulo: string; antes: Record<string, unknown>; depois: Record<string, unknown>; corpo?: boolean };
const CASOS: Caso[] = [
  { id: '01_face_male', titulo: 'Rosto masculino — Legacy vs Premium (base+olhos+boca+faceV2)',
    antes: { base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso' } },
    depois: { base: 'bas_px_oval', camadas: { olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', sobrancelha: 'sbr_reta', nariz: 'nar_reto' }, acabamento: 'premium' } },
  { id: '02_face_female', titulo: 'Rosto feminino — Legacy vs Premium',
    antes: { base: 'bas_redonda', camadas: { olhos: 'olh_focado', boca: 'boc_neutra' } },
    depois: { base: 'bas_px_redonda', camadas: { olhos: 'olh_px_focado', boca: 'boc_px_neutra', sobrancelha: 'sbr_arqueada', nariz: 'nar_fino' }, acabamento: 'premium' } },
  { id: '03_hair_male', titulo: 'Cabelo masculino — cab_curto vs cab_px_curto',
    antes: { base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', cabelo: 'cab_curto' } },
    depois: { base: 'bas_px_oval', camadas: { olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', cabelo: 'cab_px_curto' }, acabamento: 'premium' } },
  { id: '04_hair_female', titulo: 'Cabelo feminino — cab_longo vs cab_px_longo',
    antes: { base: 'bas_redonda', camadas: { olhos: 'olh_focado', boca: 'boc_neutra', cabelo: 'cab_longo' } },
    depois: { base: 'bas_px_redonda', camadas: { olhos: 'olh_px_focado', boca: 'boc_px_neutra', cabelo: 'cab_px_longo' }, acabamento: 'premium' } },
  { id: '05_outfit', titulo: 'Roupa — rou_social vs rou_px_camisa',
    antes: { base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_social' } },
    depois: { base: 'bas_px_oval', camadas: { olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', roupa: 'rou_px_camisa' }, acabamento: 'premium' } },
  { id: '06_full_male', titulo: 'Corpo inteiro masculino — Legacy vs Premium', corpo: true,
    antes: { base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', cabelo: 'cab_curto', roupa: 'rou_social' } },
    depois: { base: 'bas_px_oval', camadas: { olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', cabelo: 'cab_px_curto', roupa: 'rou_px_camisa', roupa_inferior: 'rin_social' }, acabamento: 'premium' } },
  { id: '07_full_female', titulo: 'Corpo inteiro feminino — Legacy vs Premium', corpo: true,
    antes: { base: 'bas_redonda', camadas: { olhos: 'olh_focado', boca: 'boc_neutra', cabelo: 'cab_longo', roupa: 'rou_camiseta' } },
    depois: { base: 'bas_px_redonda', camadas: { olhos: 'olh_px_focado', boca: 'boc_px_neutra', cabelo: 'cab_px_longo', roupa: 'rou_px_blazer', roupa_inferior: 'rin_social' }, acabamento: 'premium' } },
  { id: '08_environment', titulo: 'Ambiente — fun_estudio vs fun_px_estudio (+aura premium)', corpo: true,
    antes: { base: 'bas_classica', camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', cabelo: 'cab_curto', roupa: 'rou_social', fundo: 'fun_estudio' } },
    depois: { base: 'bas_px_oval', camadas: { olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', cabelo: 'cab_px_curto', roupa: 'rou_px_camisa', fundo: 'fun_px_estudio', aura: 'aur_px_fluxo' }, acabamento: 'premium' } },
];
const saida = CASOS.map((c) => {
  const opAntes = { estatico: true, tamanho: 480, ...(c.corpo ? { palco: true, enquadramento: 'corpo' as const } : {}), premium: false, faceV2: false };
  const opDepois = { estatico: true, tamanho: 480, ...(c.corpo ? { palco: true, enquadramento: 'corpo' as const } : {}), premium: true, faceV2: true };
  return { id: c.id, titulo: c.titulo, antes: svgDe(cfg(c.antes), opAntes), depois: svgDe(cfg(c.depois), opDepois) };
});
console.log(JSON.stringify(saida));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
    const casos = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim().split('\n').pop());
    for (const c of casos) {
      const a = await sharp(Buffer.from(c.antes), { density: 220 }).png().toBuffer();
      const d = await sharp(Buffer.from(c.depois), { density: 220 }).png().toBuffer();
      await montarPar(a, d, `2D · ${c.titulo}`, join(SAIDA, '2d', `${c.id}.png`));
      console.log(`2d/${c.id}.png`);
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ── B/C) 3D + UX (navegador) ─────────────────────────────────────────
async function gerar3dUx() {
  const { abrir, irParaHarness } = await import('../testes/navegador.mjs');
  const capturarSessao = async (flags, rotulo) => {
    const { navegador, pagina } = await abrir({
      viewport: { width: 1500, height: 940 }, webgl: true,
      init: ({ f }) => {
        localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
        try {
          localStorage.setItem('dshow.avst6.qualidade.v1', 'alto');
          localStorage.setItem('dshow.avst5.p3d.personagem.v1', 'base_superhero_m');
        } catch { /* ok */ }
      },
      initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': true, ...flags } },
    });
    await pagina.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(pagina, 'avst-harness.html', 1200);
    await pagina.locator('[data-teste="botao-3d"]').click();
    await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
    await pagina.waitForTimeout(8000);
    // UX: screenshot da área toda do palco (§90)
    const shotUi = await pagina.locator('[data-teste="palco-3d"]').screenshot();
    writeFileSync(join(SAIDA, 'ux', `ui-${rotulo}.png`), shotUi);
    // capturas 3D determinísticas (mesma cena/câmera §8)
    const capturas = {};
    const capturar = async (nome, opts) => {
      const dataUri = await pagina.evaluate(async (o) => {
        const r = window.__avst3d;
        r.pausar();
        if (o.look && r.aplicarLook) r.aplicarLook(o.look);
        if (o.chao && r.definirChao) r.definirChao(o.chao);
        const foto = await r.capturar({ largura: 720, altura: 900, deterministica: true, superAmostra: 2, camera: o.camera });
        r.retomar();
        return foto.dataUri;
      }, opts);
      capturas[nome] = Buffer.from(dataUri.split(',')[1], 'base64');
    };
    await capturar('01_full', { camera: { modo: 'corpo', forcar: true } });
    await capturar('02_bust', { camera: { modo: flags['as6.camera_v2'] ? 'busto' : 'retrato', forcar: true } });
    await capturar('03_face', { camera: { modo: flags['as6.camera_v2'] ? 'face' : 'retrato', forcar: true } });
    await capturar('04_material_skin', { camera: { modo: flags['as6.camera_v2'] ? 'busto' : 'retrato', forcar: true } });
    await capturar('05_material_hair', { camera: { modo: flags['as6.camera_v2'] ? 'face' : 'retrato', forcar: true } });
    await capturar('06_outfit', { camera: { modo: 'corpo', forcar: true } });
    await capturar('07_studio', { look: 'estudio', camera: { modo: 'corpo', forcar: true } });
    await capturar('08_hero', { look: flags['as6.looks'] ? 'hero' : 'quente', camera: { modo: 'corpo', forcar: true } });
    await navegador.close();
    return capturas;
  };
  const antes = await capturarSessao({}, 'atual');
  const depois = await capturarSessao({
    'as6.looks': true, 'as6.material_v2': true, 'as6.camera_v2': true,
    'as6.sombras_v2': true, 'as6.pos_v2': true, 'as6.foto_lentes': true,
    'as6.ux3d_simples': true,
  }, 'candidate');
  const TITULOS = {
    '01_full': 'Corpo inteiro (câmera corpo)', '02_bust': 'Busto (câmera v2 28°)',
    '03_face': 'Rosto (câmera v2 24° + eye-line)', '04_material_skin': 'Pele (material v2 + sombras v2)',
    '05_material_hair': 'Cabelo (material v2)', '06_outfit': 'Roupa (full)',
    '07_studio': 'Studio — a verdade (§79)', '08_hero': 'Hero/apresentação (look + pós v2)',
  };
  for (const [nome, buf] of Object.entries(antes)) {
    await montarPar(buf, depois[nome], `3D · ${TITULOS[nome] ?? nome}`, join(SAIDA, '3d', `${nome}.png`));
    console.log(`3d/${nome}.png`);
  }
  await montarPar(
    await sharp(join(SAIDA, 'ux', 'ui-atual.png')).png().toBuffer(),
    await sharp(join(SAIDA, 'ux', 'ui-candidate.png')).png().toBuffer(),
    'UX 3D · UI atual vs simplificada (as6.ux3d_simples)',
    join(SAIDA, 'ux', 'ux_before_after.png'),
  );
  console.log('ux/ux_before_after.png');
}

if (!so3d) await gerar2d();
if (!so2d) await gerar3dUx();
console.log('BEFORE-AFTER OK →', SAIDA);
