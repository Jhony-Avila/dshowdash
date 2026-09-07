// testes/hero-import.mjs — decisão A+ §5/§6/§23: PROVA DO PIPELINE DE
// IMPORTAÇÃO DO ATIVO AUTORADO (HeroAsset2D → ParteDef). Roda o motor REAL
// (importarHeroAsset + materiais2d + cores) sobre um SVG autorado de exemplo
// e verifica os invariantes do método novo:
//   [1] uid-scoping: todo id de <defs>/gradiente é prefixado pelo uid (2 avatares
//       na mesma página não colidem).
//   [2] canais: data-channel/data-tone resolvem para a cor da PALETA — trocar a
//       paleta troca a cor (peça continua customizável, §24) SEM tocar no SVG.
//   [3] materiais: data-material injeta defs de material (materiais2d, §25).
//   [4] camadas: data-hero-layer distribui os elementos pelos hooks certos do
//       ParteDef (back→renderAtras, shadow→renderSombra, front→renderFrente).
//   [5] autoria removida: nenhum atributo data-* vaza para o SVG final.
//   [6] determinismo: mesma paleta+uid ⇒ bytes idênticos (byte-stability).
//   [7] NÃO reconstrói: as curvas 'd=' autoradas aparecem intactas na saída.
// Node puro via esbuild (alias @painel), padrão flag-matrix.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-heroimp-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
import { importarHeroAsset, parseAsset } from '@painel/engine/heroAssetImport';
import { paletaDe } from '@painel/engine/cores';
import type { HeroAsset2D } from '@painel/domain/heroAsset';

// SVG AUTORADO de exemplo (como sairia de Illustrator/Figma seguindo a
// convenção). Curvas fictícias mas plausíveis; o ponto é o CONTRATO, não a arte.
const D_BASE = 'M40 120 C 40 60 80 40 120 40 S 200 60 200 120 L 200 380 L 40 380 Z';
const D_LAPELA = 'M104 130 l 16 20 l 16 -20 l 8 10 l -24 34 l -24 -34 z';
const D_COSTURA = 'M120 160 v 180';
const asset: HeroAsset2D = {
  manifesto: {
    id: 'rou_hx_blazer', categoria: 'roupa', nome: 'Blazer Autorado',
    descricao: 'Prova do pipeline de importação.', raridade: 'epico', tema: 'executivo',
    frame: 'corpo', viewBox: [240, 400],
    canais: [{ canal: 'roupa', rotulo: 'Tecido' }, { canal: 'destaque', rotulo: 'Lapela' }],
    zonasMaterial: [{ id: 'corpo', material: 'wool', canal: 'roupa' }],
    fit: 'STRUCTURED',
  },
  svg: [
    '<defs><radialGradient id="halo"><stop offset="0" stop-color="#fff"/></radialGradient></defs>',
    '<ellipse data-hero-layer="back" cx="120" cy="200" rx="110" ry="150" fill="url(#halo)"/>',
    '<ellipse data-hero-layer="shadow" cx="120" cy="384" rx="80" ry="10" fill="#000"/>',
    '<path data-hero-layer="base" data-channel="roupa" data-material="wool" d="' + D_BASE + '"/>',
    '<path data-hero-layer="detail" data-channel="destaque" data-tone="escuro" d="' + D_LAPELA + '"/>',
    '<path data-hero-layer="detail" data-channel="roupa" data-tone="profundo" data-paint="stroke" fill="none" stroke-width="2" d="' + D_COSTURA + '"/>',
    '<g data-hero="anchors"><circle data-anchor="gola" cx="120" cy="130"/><circle data-anchor="barra" cx="120" cy="380"/></g>',
    '<path data-hero-layer="front" fill="#ffffff" opacity="0.2" d="M60 90 q 60 -30 120 0"/>',
  ].join(''),
};

const def = importarHeroAsset(asset);
const parsed = parseAsset(asset);
const pA = paletaDe({ pele:'#e8b58c', cabelo:'#3d2b1f', roupa:'#2b3550', destaque:'#c8892e' } as any);
const pB = paletaDe({ pele:'#e8b58c', cabelo:'#3d2b1f', roupa:'#7a1f1f', destaque:'#1f7a5a' } as any);
const sha = (s:string) => createHash('sha256').update(s).digest('hex').slice(0,12);

const rA1 = def.render(pA, 'uA');
const rA2 = def.render(pA, 'uA');
const rB  = def.render(pB, 'uA');
const rA_uid2 = def.render(pA, 'uZ');
const atras = def.renderAtras ? def.renderAtras(pA, 'uA') : '';
const sombra = def.renderSombra ? def.renderSombra(pA, 'uA') : '';
const frente = def.renderFrente ? def.renderFrente(pA, 'uA') : '';

const out = {
  usaCores: def.usaCores,
  temHooks: { atras: !!def.renderAtras, sombra: !!def.renderSombra, frente: !!def.renderFrente, corpoV2: !!def.renderCorpoV2 },
  anchors: (asset.anchors||[]).map(a=>a.nome),
  // [1] uid-scoping (def no hook dono + referência no atras, ambos escopados)
  idEscopado: (rA1+atras).includes('id="uAhalo"') && (rA1+atras).includes('url(#uAhalo)'),
  idNaoCru: !(rA1+atras).includes('id="halo"') && !(rA1+atras).includes('url(#halo)'),
  idOutroUid: (rA_uid2+def.renderAtras(pA,'uZ')).includes('id="uZhalo"'),
  // [2] canais resolvem cor da paleta e MUDAM com a paleta
  corRoupaA: rA1.includes('#2b3550') || /url\(#uAroupa_m2_wool\)/.test(rA1),
  lapelaMudou: rA1 !== rB,
  // [3] material: defs de wool presentes e escopados por canal
  temDefsWool: /uAroupa_m2_wool/.test(rA1),
  // [4] camadas nos hooks certos (o 'd' de cada uma no lugar)
  atrasTemHalo: atras.includes('url(#uAhalo)') && atras.includes('ellipse'),
  sombraTemChao: sombra.includes('rx="80"'),
  frenteTemFio: frente.includes('M60 90'),
  baseNaoNoAtras: !atras.includes(D_BASE),
  // [5] sem vazamento de data-*
  semDataAttr: !/data-(hero|hero-layer|channel|tone|paint|material|anchor)=/.test(rA1+atras+sombra+frente),
  // [6] determinismo
  determinista: sha(rA1) === sha(rA2),
  // [7] não reconstrói: curvas autoradas intactas
  curvaBaseIntacta: rA1.includes(D_BASE),
  curvaLapelaIntacta: rA1.includes(D_LAPELA),
  curvaCosturaIntacta: rA1.includes(D_COSTURA),
  // buckets
  nBase: parsed.buckets.base.length, nDetail: parsed.buckets.detail.length,
  nBack: parsed.buckets.back.length, nShadow: parsed.buckets.shadow.length, nFront: parsed.buckets.front.length,
};
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ HERO IMPORT — pipeline de ativo autorado (A+ §5/§6/§23) ━━');
ok(JSON.stringify(r.usaCores) === JSON.stringify(['roupa', 'destaque']), `usaCores derivado dos canais: ${r.usaCores}`);
ok(r.temHooks.atras && r.temHooks.sombra && r.temHooks.frente && r.temHooks.corpoV2, `hooks derivados das camadas: ${JSON.stringify(r.temHooks)}`);
ok(JSON.stringify(r.anchors) === JSON.stringify(['gola', 'barra']), `âncoras extraídas: ${r.anchors}`);
ok(r.idEscopado && r.idNaoCru, `[1] uid-scoping: id/url prefixados (halo→uAhalo), nada cru`);
ok(r.idOutroUid, `[1] uid distinto p/ outro avatar (uZhalo) — sem colisão`);
ok(r.corRoupaA, `[2] canal roupa resolve p/ material/paleta`);
ok(r.lapelaMudou, `[2] trocar paleta muda o SVG (peça customizável, §24)`);
ok(r.temDefsWool, `[3] material wool: defs injetados e escopados por canal`);
ok(r.atrasTemHalo, `[4] camada back → renderAtras (halo)`);
ok(r.sombraTemChao, `[4] camada shadow → renderSombra (elipse de chão)`);
ok(r.frenteTemFio, `[4] camada front → renderFrente (fio solto)`);
ok(r.semDataAttr, `[5] nenhum atributo data-* vaza p/ o SVG final`);
ok(r.determinista, `[6] determinístico (mesma paleta+uid ⇒ mesmos bytes)`);
ok(r.curvaBaseIntacta && r.curvaLapelaIntacta && r.curvaCosturaIntacta, `[7] curvas autoradas INTACTAS — motor não reconstrói (§5)`);
ok(r.nBase === 1 && r.nDetail === 2 && r.nBack === 1 && r.nShadow === 1 && r.nFront === 1,
  `buckets corretos: base=${r.nBase} detail=${r.nDetail} back=${r.nBack} shadow=${r.nShadow} front=${r.nFront}`);
console.log(falhas ? `\n✗ HERO IMPORT: ${falhas} falha(s)` : '\n✓ hero-import verde');
process.exit(falhas ? 1 : 0);
