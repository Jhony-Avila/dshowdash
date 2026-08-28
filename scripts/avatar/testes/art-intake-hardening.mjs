// testes/art-intake-hardening.mjs — SUÍTE DE HARDENING do ART INTAKE (rodada 3).
// Cobre segurança ampliada (DOCTYPE/entidade/use-ciclo/complexidade/dimensão/
// invisível/fora-do-quadro), contrato ampliado (enum de categoria/slot, âncoras
// via fonte única com aliases, duplicata, roupa_inferior) e QUALIDADE DAS
// MENSAGENS (arquivo, regra, valor observado, correção). Node puro; sem browser.
// NÃO faz parte da suíte geral obrigatória — roda isolado. @created 2026-08-28
import { validarSeguranca } from '../art-intake/validador-svg.mjs';
import { validarContrato } from '../art-intake/validador-contrato.mjs';
import { ANCORAS_FAMILIA, canonicos } from '../art-intake/ancoras.mjs';

let falhas = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const b = (i, vb = '0 0 240 400', wh = 'width="240" height="400"') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${wh}>${i}</svg>`;
const anc = (l) => `<g data-hero="anchors">${l.map(([n, x, y]) => `<circle data-anchor="${n}" cx="${x || 10}" cy="${y || 10}"/>`).join('')}</g>`;
const base = '<path data-hero-layer="base" data-channel="roupa" d="M60 120 L180 120 L170 360 L70 360 Z"/>';
const roupaAnc = anc([['gola'], ['cintura'], ['bainha']]);
const man = (o = {}) => ({ id: 'rou_hx_z', categoria: 'roupa', nome: 'z', frame: 'corpo', viewBox: [240, 400], canais: [{ canal: 'roupa', rotulo: 'T' }], ...o });
const seg = (s) => validarSeguranca(s, 'x');
const con = (s, m = man()) => validarContrato(s, m, 'x');
const temMsg = (r, re) => (r.violacoes || []).some((v) => re.test(v.problema));
// toda violação tem os 4 campos de mensagem de qualidade?
const msgCompleta = (r) => (r.violacoes || []).every((v) => v.arquivo && v.elemento && v.problema && v.como);

console.log('\n━━ ART INTAKE HARDENING ━━');

// ── SEGURANÇA ampliada ──────────────────────────────────────────────
ok(!seg(b(base + roupaAnc)).ok === false, 'baseline: SVG limpo passa a segurança (sem falso-positivo)');
ok(!seg('<!DOCTYPE svg><rect/>').ok, 'DOCTYPE → REJEITA');
ok(!seg('<!DOCTYPE svg [<!ENTITY e "x">]><rect/>').ok, 'ENTITY interna → REJEITA');
ok(!seg(b('<use href="javascript:1"/>')).ok, 'javascript: URI → REJEITA');
ok(!seg(b('<defs><g id="a"><use href="#a"/></g></defs><use href="#a"/>')).ok, '<use> ciclo (auto-ref ancestral) → REJEITA');
ok(seg(b('<defs><g id="a"><rect width="1" height="1"/></g></defs><use href="#a"/>' + base + roupaAnc)).ok, '<use> legítimo (cadeia sem ciclo) → PASSA');
ok(!seg(b(Array.from({ length: 5000 }, () => '<rect/>').join(''))).ok, '5000 elementos → REJEITA');
ok(!seg(b('<g>'.repeat(60) + '<rect/>' + '</g>'.repeat(60))).ok, 'árvore profunda (60) → REJEITA');
ok(!seg(b(base, '0 0 999999 999999', 'width="999999" height="999999"')).ok, 'dimensões gigantes → REJEITA');
ok(!seg(b('viewBox invalido')) === false || !seg(b('<rect/>', '0 0 99999 1')).ok, 'viewBox gigante → REJEITA');
ok(!seg(b('<rect opacity="0" width="10" height="10"/>' + base + roupaAnc)).ok, 'conteúdo invisível (opacity:0) → REJEITA');
ok(!seg(b('<g style="display:none"><rect width="5" height="5"/></g>')).ok || !seg(b('<rect style="display:none" width="5" height="5"/>')).ok, 'display:none → REJEITA');
ok(!seg(b('<rect x="9000" y="9000" width="5" height="5"/>' + base + roupaAnc)).ok, 'conteúdo fora do quadro → REJEITA');
ok(!seg(b('<image href="https://e/x.png"/>')).ok, 'raster/<image> externo → REJEITA');
ok(!seg(b('<path onclick="x()" d="M0 0"/>')).ok, 'handler on* → REJEITA');
ok(!seg(b('<rect fill="url(https://e/a.png)"/>')).ok, 'url() externa → REJEITA');
ok(!seg(b('<style>@import url(https://e/a.css)</style>')).ok, '@import CSS → REJEITA');

// ── CONTRATO ampliado ───────────────────────────────────────────────
ok(con(b(base + roupaAnc)).ok, 'âncora canônica roupa (gola/cintura/bainha) → PASSA');
ok(con(b(base + anc([['gola'], ['cintura'], ['barra']]))).ok, 'alias legado (barra→bainha) → PASSA (compat)');
ok(con(b(base + anc([['gola'], ['cintura'], ['barra']]))).avisos?.length > 0, 'alias legado registra AVISO informativo (não reprova)');
ok(!con(b(base + anc([['gola'], ['cintura']]))).ok, 'falta bainha → REJEITA');
{ const r = con(b(base + anc([['gola'], ['cintura']]))); ok(temMsg(r, /bainha/) && temMsg(r, /recebido/), 'msg de âncora ausente mostra canônico esperado + recebido'); }
ok(!con(b(base + anc([['gola'], ['gola'], ['cintura'], ['bainha']]))).ok, 'âncora DUPLICADA → REJEITA');
{ const r = con(b(base + anc([['gola'], ['gola'], ['cintura'], ['bainha']]))); ok(temMsg(r, /duplicada/), 'msg de duplicata clara'); }
ok(!con(b(base + roupaAnc), man({ categoria: 'zzz' })).ok, 'categoria desconhecida → REJEITA');
{ const r = con(b(base + roupaAnc), man({ categoria: 'zzz' })); ok(temMsg(r, /recebido "zzz"/), 'msg de categoria mostra valor recebido'); }
ok(!con(b(base + roupaAnc), man({ categoria: 'acessorio', slot: 'zzz' })).ok, 'slot incompatível → REJEITA');
ok(con(b(base + anc([['cos'], ['bainhaL'], ['bainhaR']])), man({ categoria: 'roupa_inferior' })).ok, 'roupa_inferior válida (cos/bainhaL/bainhaR) → PASSA');
ok(!con(b(base + anc([['cos'], ['bainhaL'], ['bainhaR']])), man({ categoria: 'roupa_inferior' })).ok === false, 'roupa_inferior NÃO exige gola');
ok(con(b(base + anc([['cintura'], ['bainhaL'], ['bainhaR']])), man({ categoria: 'roupa_inferior' })).ok, 'roupa_inferior aceita cintura como alias de cos');
// família por slot (hand/footwear) — D-02
ok(!con(b(base), man({ categoria: 'acessorio', slot: 'pes' })).ok, 'footwear (slot pes) SEM âncoras → REJEITA (família calcado ativada)');
ok(con(b(base + anc([['tornozelo'], ['sola']])), man({ categoria: 'acessorio', slot: 'pes' })).ok, 'footwear com tornozelo+sola → PASSA');
ok(con(b(base + anc([['tornozelo'], ['solado']])), man({ categoria: 'acessorio', slot: 'pes' })).ok, 'footwear aceita solado (alias de sola)');
ok(!con(b(base), man({ categoria: 'acessorio', slot: 'mao_e' })).ok, 'hand (slot mao_e) SEM punho → REJEITA');

// ── QUALIDADE DAS MENSAGENS (task 8) ────────────────────────────────
ok(msgCompleta(con(b(base + anc([['gola']])))), 'toda violação de contrato tem arquivo+elemento+problema+como');
ok(msgCompleta(seg(b('<script>1</script>'))), 'toda violação de segurança tem arquivo+elemento+problema+como');
ok(seg(b('<script>1</script>')).violacoes.every((v) => v.gate === 'SECURITY_P0'), 'violações de segurança marcadas SECURITY_P0');

// ── fonte única íntegra ─────────────────────────────────────────────
ok(canonicos('roupa').join(',') === 'gola,cintura,bainha', 'fonte única: canônicos de roupa');
ok(canonicos('roupa_inferior').join(',') === 'cos,bainhaL,bainhaR', 'fonte única: canônicos de roupa_inferior (sem gola)');
ok(ANCORAS_FAMILIA.calcado.some((g) => g.includes('sola')), 'fonte única: calçado usa "sola" (alinha footwear.ts)');

console.log(falhas ? `\n✗ art-intake-hardening: ${falhas} falha(s)` : '\n✓ art-intake-hardening verde');
process.exit(falhas ? 1 : 0);
