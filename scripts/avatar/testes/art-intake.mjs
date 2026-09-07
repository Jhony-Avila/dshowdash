// testes/art-intake.mjs — PROVA do AUTOMATED TECHNICAL ART INTAKE GATE.
// GOLDEN V4.3 FINAL (Track B, decisão #68). Cobre os invariantes do gate:
//   SEGURANÇA P0: <script>/<foreignObject>/handler on*/href externo/raster
//     (<image>)/javascript: → TECHNICAL_FAIL.
//   CONTRATO: viewBox errado, fundo opaco, id duplicado, data-hero-layer /
//     data-channel desconhecidos, âncora obrigatória ausente → TECHNICAL_FAIL.
//   VÁLIDO (fixture real): segurança+contrato OK.
//   MOTOR REAL (via resolver → engine/heroAssetImport): determinismo (2× = mesmos
//     bytes), paleta muda o render (customizável §24), curvas 'd=' autoradas
//     INTACTAS (motor não redesenha §5), sem vazamento de data-*.
//   VEREDITO: só existem TECHNICAL_FAIL e TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW.
// Node puro p/ validadores; resolver usa esbuild+@painel (padrão hero-import).
// @version 1.0.0  @created 2026-08-27
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validarSeguranca } from '../art-intake/validador-svg.mjs';
import { validarContrato } from '../art-intake/validador-contrato.mjs';
import { conteudoInterno, resolverPeloMotor } from '../art-intake/resolver.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const FIX = join(RAIZ, 'scripts', 'avatar', 'art-intake', 'fixtures', 'validos');

let falhas = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ ART INTAKE GATE — segurança + contrato + motor real ━━');

// ── fixture VÁLIDA (blazer) ──────────────────────────────────────────
const blazerSvg = readFileSync(join(FIX, 'blazer.svg'), 'utf8');
const blazerMan = JSON.parse(readFileSync(join(FIX, 'blazer.json'), 'utf8'));
const faceSvg = readFileSync(join(FIX, 'face_male.svg'), 'utf8');
const faceMan = JSON.parse(readFileSync(join(FIX, 'face_male.json'), 'utf8'));

ok(validarSeguranca(blazerSvg, 'blazer.svg').ok, 'VÁLIDO: blazer passa a segurança P0');
ok(validarContrato(blazerSvg, blazerMan, 'blazer.svg').ok, 'VÁLIDO: blazer passa o contrato');
ok(validarSeguranca(faceSvg, 'face.svg').ok && validarContrato(faceSvg, faceMan, 'face.svg').ok, 'VÁLIDO: face_male passa segurança+contrato');

// helper: injeta um trecho antes de </svg>
const inj = (svg, frag) => svg.replace('</svg>', `${frag}</svg>`);
const seg = (svg) => validarSeguranca(svg, 'x.svg');
const con = (svg, man = blazerMan) => validarContrato(svg, man, 'x.svg');
const temGate = (r, g) => r.violacoes.some((v) => v.gate === g);
const temProblema = (r, re) => r.violacoes.some((v) => re.test(v.problema));

// ── SEGURANÇA P0 (cada um deve REPROVAR) ─────────────────────────────
ok(!seg(inj(blazerSvg, '<script>alert(1)</script>')).ok, 'SEG: <script> → FAIL');
ok(!seg(inj(blazerSvg, '<foreignObject width="10" height="10"><div>x</div></foreignObject>')).ok, 'SEG: <foreignObject> → FAIL');
ok(!seg(inj(blazerSvg, '<image href="https://evil.example/x.png" width="10" height="10"/>')).ok, 'SEG: <image> raster → FAIL');
{
  const r = seg(inj(blazerSvg, '<use href="https://evil.example/x.svg#a"/>'));
  ok(!r.ok && temProblema(r, /EXTERNO/), 'SEG: href externo em <use> → FAIL');
}
ok(!seg(blazerSvg.replace('<svg ', '<svg onload="alert(1)" ')).ok, 'SEG: handler on* → FAIL');
ok(!seg(inj(blazerSvg, '<rect width="1" height="1" fill="url(https://evil.example/a.png)"/>')).ok, 'SEG: url() externo → FAIL');
{
  const r = seg(blazerSvg.replace('d="M120 168', 'onclick="x()" d="M120 168'));
  ok(!r.ok && temProblema(r, /handler de evento/), 'SEG: onclick em <path> → FAIL');
}
// javascript: em href
ok(!seg(inj(blazerSvg, '<use href="javascript:alert(1)"/>')).ok, 'SEG: javascript: URI → FAIL');

// ── CONTRATO (cada um deve REPROVAR) ─────────────────────────────────
{
  const r = con(blazerSvg.replace('viewBox="0 0 240 400"', 'viewBox="0 0 300 500"'));
  ok(!r.ok && temProblema(r, /viewBox/), 'CONTRATO: viewBox errado → FAIL');
}
{
  const r = con(inj(blazerSvg, '<rect x="0" y="0" width="240" height="400" fill="#123456"/>'));
  ok(!r.ok && temProblema(r, /cobrindo o canvas/), 'CONTRATO: fundo opaco → FAIL');
}
{
  const r = con(inj(blazerSvg, '<path id="halo_blz" d="M0 0"/>')); // halo_blz já existe nos defs
  ok(!r.ok && temProblema(r, /duplicad/), 'CONTRATO: id duplicado → FAIL');
}
{
  const r = con(inj(blazerSvg, '<path data-hero-layer="hiperluz" data-channel="roupa" d="M0 0"/>'));
  ok(!r.ok && temProblema(r, /data-hero-layer/), 'CONTRATO: data-hero-layer desconhecido → FAIL');
}
{
  const r = con(inj(blazerSvg, '<path data-hero-layer="base" data-channel="plutonio" d="M0 0"/>'));
  ok(!r.ok && temProblema(r, /data-channel/), 'CONTRATO: data-channel desconhecido → FAIL');
}
{
  // remove o bloco de âncoras inteiro do rosto → família rosto sem olhos
  const semAnc = faceSvg.replace(/<g data-hero="anchors">[\s\S]*?<\/g>/, '');
  const r = con(semAnc, faceMan);
  ok(!r.ok && temProblema(r, /âncora/), 'CONTRATO: âncoras obrigatórias ausentes (rosto) → FAIL');
}
{
  // rosto sem a âncora "boca" (tem olhos, falta boca)
  const semBoca = faceSvg.replace(/<circle data-anchor="boca"[^>]*\/>/, '');
  const r = con(semBoca, faceMan);
  ok(!r.ok && temProblema(r, /boca/), 'CONTRATO: âncora "boca" faltando → FAIL');
}

// ── MOTOR REAL (determinismo, paleta, curvas intactas, sem data-*) ───
const D_BASE_BLZ = 'M120 118 C 92 118 74 128 66 150';
const asset = { manifesto: blazerMan, svg: conteudoInterno(blazerSvg) };
const res = resolverPeloMotor(asset, {
  A: { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#2b3550', destaque: '#c8892e' },
  B: { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#7a1f1f', destaque: '#1f7a5a' },
});
ok(res.ok, `MOTOR: importarHeroAsset resolve a fixture (${res.ok ? 'ok' : res.erro})`);
if (res.ok) {
  const d = res.dados;
  ok(d.shaA === d.shaA2, 'MOTOR: determinístico (2× mesma paleta+uid = mesmos bytes)');
  ok(d.shaA !== d.shaB, 'MOTOR: trocar a paleta MUDA o render (customizável §24)');
  ok(d.A.render.includes(D_BASE_BLZ), 'MOTOR: curva "d=" autorada INTACTA (motor não redesenha §5)');
  ok(d.semDataAttr, 'MOTOR: nenhum atributo data-* de autoria vaza p/ o SVG final');
  ok(JSON.stringify(d.usaCores) === JSON.stringify(['roupa', 'destaque']), 'MOTOR: usaCores derivado dos canais do manifesto');
  ok(d.temHooks.atras && d.temHooks.sombra && d.temHooks.frente, 'MOTOR: camadas back/shadow/front viram hooks renderAtras/Sombra/Frente');
}

// ── VEREDITO: vocabulário de status é FECHADO (nunca "APPROVED"/"8/10") ─
{
  const orqBruto = readFileSync(join(RAIZ, 'scripts', 'avatar', 'art-intake.mjs'), 'utf8');
  // remove COMENTÁRIOS (o cabeçalho legitimamente NOMEIA os tokens proibidos para
  // dizer que são proibidos) — o veto é ao CÓDIGO que emitiria tais status.
  const orq = orqBruto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const STATUS_PROIBIDOS = /ART_APPROVED|GATE[_ -]?A[_ -]?APPROVED|8[_ /-]?10[_ -]?APPROVED|APPROVED_?8/i;
  ok(!STATUS_PROIBIDOS.test(orq),
    'VEREDITO: código do orquestrador não define status de aprovação de arte (ART_APPROVED / GATE_A_APPROVED / 8-10-APPROVED)');
  ok(/TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW/.test(orq) && /TECHNICAL_FAIL/.test(orq),
    'VEREDITO: os dois únicos status técnicos existem no orquestrador');
}

console.log(falhas ? `\n✗ art-intake: ${falhas} falha(s)` : '\n✓ art-intake verde');
process.exit(falhas ? 1 : 0);
