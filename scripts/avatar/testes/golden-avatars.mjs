// testes/golden-avatars.mjs — lote 1001–1010 (decisão #102): GOLDEN
// AVATARS + regressão visual de RENDER (AS6 Parte 16).
//
// N configs CANÔNICAS cobrindo os subsistemas do motor (avatar busto/
// palco/corpo inteiro/sobrepeça/params/canais/corpo/título + foto
// medalhão/ordem/wide) rendem SVG determinístico → sha256 versionado em
// docs/AVATAR-STUDIO-6/golden-avatars.json. Qualquer mudança de render
// em avatar SALVO aparece AQUI antes de chegar em produção — é a
// materialização executável da regra de byte-stability.
//
// Uso:
//   node scripts/avatar/testes/golden-avatars.mjs            (compara)
//   node scripts/avatar/testes/golden-avatars.mjs --gravar   (regenera —
//     desvio intencional segue a doutrina #83: regenerar + REVISAR o
//     diff do JSON no MESMO commit)
// Node puro (esbuild --platform=node) — zero navegador, zero flags de
// localStorage (defaults do PADROES valem: determinístico).
// @version 1.0.0  @created 2026-08-09
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const BASELINE = join(RAIZ, 'docs', 'AVATAR-STUDIO-6', 'golden-avatars.json');
const GRAVAR = process.argv.includes('--gravar');
const tmp = mkdtempSync(join(tmpdir(), 'avst-golden-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
import { CONFIG_PADRAO, itensDe, svgDe, svgFotoDe, validarConfig } from '${PAINEL}/src/services/AvatarCatalog';
import type { AvatarConfig, EstiloFoto } from '${PAINEL}/src/domain/types';

// primeiro id (ordenado) de cada categoria — muda de catálogo ⇒ muda o
// golden ⇒ revisão consciente (é o comportamento DESEJADO)
const primeiro = (cat: string): string => itensDe(cat as never).map((x) => x.id).sort()[0];
const sha = (s: string): string => createHash('sha256').update(s).digest('hex');

const cfg = (extra: Partial<AvatarConfig>): AvatarConfig => validarConfig({ ...CONFIG_PADRAO, ...extra });

const completo = cfg({
  camadas: {
    ...CONFIG_PADRAO.camadas,
    moldura: primeiro('moldura'), efeito: primeiro('efeito'),
    aura: primeiro('aura'), banner: primeiro('banner'), emblema: primeiro('emblema'),
    acessorio_cabeca: itensDe('acessorio').filter((x) => (x.slot ?? 'cabeca') === 'cabeca').map((x) => x.id).sort()[0],
  },
});

const CASOS: Array<[string, () => string]> = [
  ['g01-padrao-busto', () => svgDe(cfg({}))],
  ['g02-completo-busto', () => svgDe(completo)],
  ['g03-sobrepeca', () => svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_gamer', roupa_sobre: 'sob_colete' } }))],
  ['g04-params-aura', () => svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, aura: primeiro('aura') }, params: { aura: { intensidade: 0.5 } } }))],
  ['g05-canais-roupa', () => svgDe(cfg({ coresCamada: { roupa: { roupa: '#123456' } } }))],
  ['g06-corpo-postura-fino', () => svgDe(cfg({ corpo: 'robusto', postura: 'heroica', corpoFino: { largura: 1.05 } }))],
  ['g07-titulo-cores', () => svgDe(cfg({ titulo: 'tit_lenda_dshow', cores: { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#2d4a8a', destaque: '#39d98a' } }))],
  ['g08-palco', () => svgDe(cfg({}), { palco: true })],
  ['g09-corpo-inteiro', () => svgDe(completo, { palco: true, enquadramento: 'corpo' })],
];

const FOTO = 'data:image/png;base64,GOLDENSTUB';
const estiloBase: EstiloFoto = {
  camadas: { fundo: primeiro('fundo'), aura: primeiro('aura') },
  cores: { destaque: '#7c5cff' },
};
const CASOS_FOTO: Array<[string, () => string]> = [
  ['g10-foto-medalhao', () => svgFotoDe(FOTO, { ...estiloBase, legenda: 'Golden', ajustes: { vinheta: 0.4 } }, { estatico: true, uid: 'gold10' })],
  ['g11-foto-ordem-camadas', () => svgFotoDe(FOTO, {
    ...estiloBase, ordemFundo: ['aura', 'fundo', 'banner'],
    camadasFoto: { aura: { opacidade: 0.6, blend: 'screen' } },
  }, { estatico: true, uid: 'gold11' })],
  ['g12-foto-wide-header', () => svgFotoDe(FOTO, {
    ...estiloBase, subtitulo: 'Head of Golden', tipografia: { fonte: 'mono', peso: 800 },
  }, { estatico: true, uid: 'gold12', formato: 'header' })],
  // ── goldens v2 (lote 1271–1280, decisão #131): formatos wide restantes
  // + §337/§334 + sobrepeça de corpo — fecham a rede de render ──
  ['g13-foto-wide-banner-reflow', () => svgFotoDe(FOTO, {
    ...estiloBase, legenda: 'Golden', pos: { texto: { x: 30, y: 200 } },
  }, { estatico: true, uid: 'gold13', formato: 'banner', reflowPos: true })],
  ['g14-foto-wide-wallpaper', () => svgFotoDe(FOTO, {
    ...estiloBase, subtitulo: 'Wallpaper Golden',
  }, { estatico: true, uid: 'gold14', formato: 'wallpaper' })],
  ['g15-foto-sombra-luz', () => svgFotoDe(FOTO, {
    ...estiloBase,
    ajustes: { sombra: true, luzLocal: { tipo: 'radial', intensidade: 0.5 }, temperatura: 0.4 },
  }, { estatico: true, uid: 'gold15' })],
];
CASOS.push(['g16-palco-sobrepeca-corpo', () => svgDe(cfg({
  camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_gamer', roupa_sobre: 'sob_colete' },
}), { palco: true, enquadramento: 'corpo' })]);

const saida: Record<string, { sha256: string; bytes: number }> = {};
const erros: string[] = [];
for (const [id, gerar] of [...CASOS, ...CASOS_FOTO]) {
  try {
    const svg = gerar();
    if (!svg || !svg.includes('<svg')) erros.push(id + ': saida sem <svg>');
    saida[id] = { sha256: sha(svg), bytes: svg.length };
  } catch (e) { erros.push(id + ': ' + String((e as Error).message).slice(0, 120)); }
}
console.log(JSON.stringify({ erros, hashes: saida }));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const bruto = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' });
rmSync(tmp, { recursive: true, force: true });
const { erros, hashes } = JSON.parse(bruto.trim().split('\n').pop());

const falhas = [...erros];
if (GRAVAR) {
  writeFileSync(BASELINE, `${JSON.stringify({
    descricao: 'GOLDEN AVATARS (lote 1001–1010, decisão #102) — sha256 do SVG por caso canônico. Regenerar: node scripts/avatar/testes/golden-avatars.mjs --gravar (revisar o diff no MESMO commit — doutrina #83).',
    casos: hashes,
  }, null, 2)}\n`);
  console.log(`golden-avatars: baseline gravada com ${Object.keys(hashes).length} casos`);
} else {
  if (!existsSync(BASELINE)) falhas.push('baseline ausente — rode com --gravar e revise o diff');
  else {
    const base = JSON.parse(readFileSync(BASELINE, 'utf8')).casos ?? {};
    for (const id of Object.keys(base)) {
      if (!hashes[id]) falhas.push(`caso sumiu do runner: ${id}`);
      else if (hashes[id].sha256 !== base[id].sha256) {
        falhas.push(`RENDER MUDOU em ${id} (${base[id].bytes}→${hashes[id].bytes} bytes) — se intencional, --gravar e revisar o diff`);
      }
    }
    for (const id of Object.keys(hashes)) if (!base[id]) falhas.push(`caso novo sem baseline: ${id} (--gravar)`);
  }
}

if (falhas.length) { console.error('[golden-avatars] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
if (!GRAVAR) console.log(`[golden-avatars] FALHAS: nenhuma (${Object.keys(hashes).length} casos conferidos)`);
