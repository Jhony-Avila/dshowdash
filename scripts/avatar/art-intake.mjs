#!/usr/bin/env node
// art-intake.mjs — ORQUESTRADOR do AUTOMATED TECHNICAL ART INTAKE GATE.
// GOLDEN V4.3 FINAL (Track B) — decisão #68.
//
// O QUE É (e o que NÃO é): um GATE TÉCNICO AUTOMÁTICO para o ativo autorado que
// chega de fora. Ele **não é crítico de arte**. Não decide nota, não aprova, não
// diz “8/10”. Ele só responde, de forma determinística e auditável:
//   “este SVG é SEGURO e segue o CONTRATO — e o MOTOR REAL consegue integrá-lo
//    sem redesenhar nada?”
// Se sim, gera os renders (FINAL/TARGET/BLACK/GRAYSCALE/APPLIED) para o **olho
// humano do Jhony** julgar a ARTE — e o status é
//   `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW`.
// Se não, é `TECHNICAL_FAIL` com arquivo/elemento/problema/como-corrigir — e o
// motor NÃO renderiza (nada de “consertar” arte ruim em silêncio, §30/§38).
//
// AUTOMATED TECHNICAL GATE ≠ ART QUALITY GATE. Os únicos veredictos possíveis
// são TECHNICAL_FAIL e TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW. NUNCA
// ART_APPROVED / “nota ≥8” / GATE-A — isso é do Jhony (§37/§42).
//
// REUSO (não cria pipeline novo): validador-svg + validador-contrato (deste
// dir) → engine/heroAssetImport REAL (via resolver.mjs, padrão hero-import) →
// captura determinística (testes/visual/captura) + sharp (já deps). Diagnóstico
// de identidade em art-intake/identity.mjs (reusa comparar-visual).
//
// USO: node scripts/avatar/art-intake.mjs [dirDeEntrada]
//   dirDeEntrada = pasta com pares <nome>.svg + <nome>.json (manifesto).
//   Default: scripts/avatar/art-intake/fixtures/validos  (prova técnica —
//   enquanto ART STATUS = BLOCKED_ON_ART_SOURCE não há .svg real de artista).
// SAÍDA: OUTDIR/ART_INTAKE_REPORT.{json,md} + <asset>_INTAKE.png + board.
// @version 1.0.0  @created 2026-08-27
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import { validarSeguranca } from './art-intake/validador-svg.mjs';
import { validarContrato } from './art-intake/validador-contrato.mjs';
import { conteudoInterno, resolverPeloMotor } from './art-intake/resolver.mjs';
import { abrirDeterministico, congelarAnimacoes } from './testes/visual/captura.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const ENTRADA = resolve(process.argv[2] || join(RAIZ, 'scripts', 'avatar', 'art-intake', 'fixtures', 'validos'));
const OUTDIR = process.env.INTAKE_OUT || join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'art-intake');
mkdirSync(OUTDIR, { recursive: true });

const PALETA_A = { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#2b3550', destaque: '#c8892e' };
const PALETA_B = { pele: '#c98a5e', cabelo: '#101018', roupa: '#7a1f1f', destaque: '#1f7a5a' };
const FUNDO_PALCO = { r: 11, g: 13, b: 20 }; // #0b0d14 (tokens do palco)

const STATUS = { FAIL: 'TECHNICAL_FAIL', PASS: 'TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW' };

// IDs de hero JÁ no catálogo (para G-03: colisão de id). Lê heroes.ts (não
// importa TS: só extrai os ids `_hx_` declarados). Best-effort; vazio se não achar.
function idsCatalogo() {
  try {
    const p = resolve(RAIZ, 'public/components/panels/panel-avatar-studio/src/engine/partes/heroes.ts');
    const txt = readFileSync(p, 'utf8');
    return new Set([...txt.matchAll(/id:\s*'([a-z]+_hx_[a-z0-9_]+)'/gi)].map((m) => m[1]));
  } catch { return new Set(); }
}
const CATALOGO_IDS = idsCatalogo();

// ── descoberta de pacotes <nome>.svg + <nome>.json ───────────────────
//   Indexa .svg E .json. G-01: um .json SEM .svg par = SVG declarado e ausente
//   (FAIL explícito, nunca ignorado). Ordenação por code-point (determinístico,
//   independente de locale — D-08).
function descobrir(dir) {
  if (!existsSync(dir)) return [];
  const arquivos = readdirSync(dir);
  const bases = new Map(); // base → { temSvg, temJson }
  for (const f of arquivos) {
    const mSvg = f.match(/^(.*)\.svg$/i); const mJson = f.match(/^(.*)\.json$/i);
    if (mSvg) { const b = mSvg[1]; bases.set(b, { ...(bases.get(b) || {}), temSvg: true }); }
    else if (mJson) { const b = mJson[1]; bases.set(b, { ...(bases.get(b) || {}), temJson: true }); }
  }
  const pacotes = [];
  for (const [base, { temSvg, temJson }] of bases) {
    pacotes.push({
      nome: base,
      svgPath: join(dir, `${base}.svg`),
      manPath: join(dir, `${base}.json`),
      temMan: !!temJson,
      svgAusente: !temSvg && !!temJson, // G-01: manifesto sem SVG
    });
  }
  return pacotes.sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));
}

// ── render determinístico (reusa captura): transparente → derivados ──
function envolver(svgInterno, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`;
}
async function capturarTransparente(pagina, svg, caminho, wCss, hCss) {
  await pagina.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block;width:${wCss}px;height:${hCss}px}</style></head><body>${svg}</body></html>`,
    { waitUntil: 'load' },
  );
  await congelarAnimacoes(pagina);
  await pagina.locator('svg').first().screenshot({ path: caminho, omitBackground: true, animations: 'disabled' });
}
// BLACK: rgb→0 preservando alpha (silhueta). Volta como buffer PNG.
async function silhuetaPreta(caminhoTransp) {
  const { data, info } = await sharp(caminhoTransp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function processar() {
  const pacotes = descobrir(ENTRADA);
  const relatorio = { versao: '1.0.0', entrada: ENTRADA, geradoPor: 'art-intake.mjs', assets: [] };

  // sessão de captura só é aberta se houver pelo menos 1 asset tecnicamente OK
  let sessao = null;
  const abrir = async () => (sessao ||= await abrirDeterministico({ flags: { 'as5.novo_shell': true } }));

  try {
    for (const p of pacotes) {
      const item = { nome: p.nome, status: STATUS.FAIL, violacoes: [], renders: {}, motor: null };

      // G-01: manifesto declarado SEM .svg par → FAIL explícito (nunca ignorado)
      if (p.svgAusente) {
        item.violacoes.push({ arquivo: `${p.nome}.svg`, elemento: 'arquivo', problema: `SVG declarado (existe ${p.nome}.json) mas ${p.nome}.svg está AUSENTE`, como: `Entregue ${p.nome}.svg junto do manifesto, ou remova ${p.nome}.json do batch.`, gate: 'CONTRACT' });
        relatorio.assets.push(item);
        console.log(`  ✗ ${p.nome}: TECHNICAL_FAIL (SVG ausente)`);
        continue;
      }
      const svgTexto = readFileSync(p.svgPath, 'utf8');

      // 0) manifesto presente e parseável
      let man = null;
      if (!p.temMan) {
        item.violacoes.push({ arquivo: `${p.nome}.json`, elemento: 'manifesto', problema: 'manifesto ausente', como: `Crie ${p.nome}.json com { id, categoria, nome, frame, viewBox, canais, ... }.`, gate: 'CONTRACT' });
      } else {
        try { man = JSON.parse(readFileSync(p.manPath, 'utf8')); }
        catch (e) { item.violacoes.push({ arquivo: `${p.nome}.json`, elemento: 'manifesto', problema: `JSON inválido: ${e.message}`, como: 'Corrija a sintaxe do manifesto.', gate: 'CONTRACT' }); }
      }

      // 1) SEGURANÇA P0
      const seg = validarSeguranca(svgTexto, `${p.nome}.svg`);
      item.violacoes.push(...seg.violacoes);

      // 2) CONTRATO (precisa de manifesto)
      let familia = null;
      if (man) {
        const con = validarContrato(svgTexto, man, `${p.nome}.svg`);
        item.violacoes.push(...con.violacoes);
        if (con.avisos && con.avisos.length) item.avisos = con.avisos;
        familia = con.familia;
        item.familia = familia;
        item.frame = man.frame;

        // G-03: colisão de id com o catálogo. id novo que bate com um `_hx_` já
        // registrado só passa se declarar substituição INTENCIONAL (substitui:true).
        if (man.id && CATALOGO_IDS.has(man.id) && man.substitui !== true) {
          item.violacoes.push({ arquivo: `${p.nome}.json`, elemento: 'manifesto.id', problema: `id "${man.id}" JÁ EXISTE no catálogo (colisão incompatível)`, como: `Use um id novo, OU (se for substituição intencional do asset existente) declare "substitui": true no manifesto.`, gate: 'CONTRACT' });
        } else if (man.id && CATALOGO_IDS.has(man.id) && man.substitui === true) {
          item.substituicao = man.id; // substituição declarada (equivalente/intencional)
        }
      }

      // 3) tripwire: qualquer violação ⇒ TECHNICAL_FAIL, sem render (§30/§38)
      if (item.violacoes.length) {
        item.status = STATUS.FAIL;
        relatorio.assets.push(item);
        console.log(`  ✗ ${p.nome}: TECHNICAL_FAIL (${item.violacoes.length} violação(ões)) — sem render`);
        continue;
      }

      // 4) MOTOR REAL: integra sem redesenhar (importarHeroAsset)
      const asset = { manifesto: man, svg: conteudoInterno(svgTexto) };
      const res = resolverPeloMotor(asset, { A: PALETA_A, B: PALETA_B });
      if (!res.ok) {
        item.status = STATUS.FAIL;
        item.violacoes.push({ arquivo: `${p.nome}.svg`, elemento: 'motor', problema: `importarHeroAsset falhou: ${res.erro}`, como: 'A arte quebra o motor real — revise a estrutura/manifesto conforme o template.', gate: 'ENGINE' });
        relatorio.assets.push(item);
        console.log(`  ✗ ${p.nome}: TECHNICAL_FAIL (motor) — ${res.erro}`);
        continue;
      }
      item.motor = {
        usaCores: res.dados.usaCores,
        anchors: res.dados.anchors.map((a) => a.nome),
        temHooks: res.dados.temHooks,
        buckets: res.dados.buckets,
        determinista: res.dados.shaA === res.dados.shaA2,
        paletaMuda: res.dados.shaA !== res.dados.shaB,
        semDataAttr: res.dados.semDataAttr,
        shaFinal: res.dados.shaA.slice(0, 12),
      };
      // invariantes técnicos do motor (não são arte): se algum quebrar, FAIL
      const inv = [];
      if (!item.motor.determinista) inv.push('render NÃO-determinístico (mesma paleta+uid deu bytes diferentes)');
      if (!item.motor.paletaMuda) inv.push('trocar a paleta NÃO muda o render (peça não é customizável §24)');
      if (!item.motor.semDataAttr) inv.push('atributos data-* de autoria vazaram para o SVG final');
      if (inv.length) {
        item.status = STATUS.FAIL;
        for (const problema of inv) item.violacoes.push({ arquivo: `${p.nome}.svg`, elemento: 'motor', problema, como: 'Invariante técnico do pipeline — revise conforme o template/convenção.', gate: 'ENGINE' });
        relatorio.assets.push(item);
        console.log(`  ✗ ${p.nome}: TECHNICAL_FAIL (invariante do motor)`);
        continue;
      }

      // 5) RENDERS técnicos p/ REVISÃO HUMANA (não é nota — é evidência)
      const [w, h] = man.viewBox;
      const escala = h > 300 ? { fw: 480, fh: 800, tw: 128, th: 213 } : { fw: 480, fh: 480, tw: 128, th: 128 };
      const pagina = (await abrir()).pagina;
      const svgA = envolver(res.dados.A.atras + res.dados.A.sombra + res.dados.A.render + res.dados.A.frente, w, h);
      const svgB = envolver(res.dados.B.atras + res.dados.B.sombra + res.dados.B.render + res.dados.B.frente, w, h);

      const fTransp = join(OUTDIR, `${p.nome}_A_transp.png`);
      const fTranspB = join(OUTDIR, `${p.nome}_B_transp.png`);
      const fTargetTransp = join(OUTDIR, `${p.nome}_target_transp.png`);
      await capturarTransparente(pagina, svgA, fTransp, escala.fw, escala.fh);
      await capturarTransparente(pagina, svgB, fTranspB, escala.fw, escala.fh);
      await capturarTransparente(pagina, svgA, fTargetTransp, escala.tw, escala.th);

      // FINAL (paleta A, flatten no palco) · TARGET (tamanho real) ·
      // BLACK (silhueta) · GRAYSCALE (valor) · APPLIED (paleta B — recolor)
      const finalPng = join(OUTDIR, `${p.nome}_1_FINAL.png`);
      const targetPng = join(OUTDIR, `${p.nome}_2_TARGET.png`);
      const blackPng = join(OUTDIR, `${p.nome}_3_BLACK.png`);
      const grayPng = join(OUTDIR, `${p.nome}_4_GRAYSCALE.png`);
      const appliedPng = join(OUTDIR, `${p.nome}_5_APPLIED.png`);
      await sharp(fTransp).flatten({ background: FUNDO_PALCO }).png().toFile(finalPng);
      await sharp(fTargetTransp).flatten({ background: FUNDO_PALCO }).png().toFile(targetPng);
      await sharp(await silhuetaPreta(fTransp)).flatten({ background: { r: 232, g: 236, b: 242 } }).png().toFile(blackPng); // silhueta preta em fundo claro
      await sharp(finalPng).grayscale().png().toFile(grayPng);
      await sharp(fTranspB).flatten({ background: FUNDO_PALCO }).png().toFile(appliedPng);

      item.renders = {
        FINAL: basename(finalPng), TARGET: basename(targetPng), BLACK: basename(blackPng),
        GRAYSCALE: basename(grayPng), APPLIED: basename(appliedPng),
      };
      item.status = STATUS.PASS;
      relatorio.assets.push(item);

      // strip por asset (5 painéis rotulados)
      await stripAsset(p.nome, [finalPng, targetPng, blackPng, grayPng, appliedPng],
        ['FINAL (paleta A)', 'TARGET (tamanho de card)', 'BLACK (silhueta)', 'GRAYSCALE (valor)', 'APPLIED (paleta B — recolor §24)'], item);
      console.log(`  ✓ ${p.nome}: ${STATUS.PASS} — renders OK (aguardando olho humano)`);
    }
  } finally {
    if (sessao) await sessao.navegador.close();
  }

  // ── status agregado ────────────────────────────────────────────────
  const houve = relatorio.assets.length;
  const falhou = relatorio.assets.filter((a) => a.status === STATUS.FAIL).length;
  relatorio.resumo = {
    total: houve, falharam: falhou, passaram: houve - falhou,
    statusAgregado: houve === 0 ? 'SEM_ENTRADA' : (falhou ? STATUS.FAIL : STATUS.PASS),
    lembrete: 'AUTOMATED TECHNICAL GATE ≠ ART QUALITY GATE. PASS = tecnicamente pronto; a nota da ARTE é do Jhony (nunca deste script).',
  };

  writeFileSync(join(OUTDIR, 'ART_INTAKE_REPORT.json'), JSON.stringify(relatorio, null, 2));
  writeFileSync(join(OUTDIR, 'ART_INTAKE_REPORT.md'), montarMd(relatorio));
  console.log(`\n  relatório → ${join(OUTDIR, 'ART_INTAKE_REPORT.json')} (+ .md)`);
  console.log(`\n  STATUS AGREGADO: ${relatorio.resumo.statusAgregado}  (${relatorio.resumo.passaram}/${houve} técnico-OK)`);
  return relatorio;
}

// ── strip visual por asset ───────────────────────────────────────────
async function stripAsset(nome, pngs, rotulos, item) {
  const cell = 220, pad = 12, head = 54, lab = 34;
  const metas = await Promise.all(pngs.map((f) => sharp(f).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
  const cw = cell + pad, BW = pngs.length * cw + pad, BH = head + cell + lab + pad;
  const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
  svg += `<text x="16" y="26" font-family="Segoe UI" font-size="18" font-weight="800" fill="#fff">ART INTAKE · ${nome} — ${item.status}</text>`;
  svg += `<text x="16" y="44" font-family="Segoe UI" font-size="11" fill="#9fb0c8">gate técnico (segurança+contrato+motor real). A NOTA da arte é do Jhony — este strip é evidência p/ o olho humano.</text>`;
  rotulos.forEach((r, i) => {
    svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 20}" text-anchor="middle" font-family="Segoe UI" font-size="12" font-weight="700" fill="#9fe6bf">${r}</text>`;
  });
  svg += `</svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
  const out = join(OUTDIR, `${nome}_INTAKE.png`);
  await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toFile(out);
}

// ── relatório markdown ───────────────────────────────────────────────
function montarMd(r) {
  const L = [];
  L.push('# ART_INTAKE_REPORT — Automated Technical Art Intake Gate');
  L.push('');
  L.push(`> **STATUS AGREGADO: \`${r.resumo.statusAgregado}\`** · ${r.resumo.passaram}/${r.resumo.total} tecnicamente OK.`);
  L.push('>');
  L.push('> **AUTOMATED TECHNICAL GATE ≠ ART QUALITY GATE.** Este relatório é gerado por');
  L.push('> `art-intake.mjs`. Ele **não julga arte**: só atesta que o SVG é seguro, segue o');
  L.push('> contrato e o **motor real** o integra. Os únicos veredictos são');
  L.push('> `TECHNICAL_FAIL` e `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW`. A nota da arte');
  L.push('> (≥8, aprovar/reprovar, Gate A) é **exclusivamente do Jhony**.');
  L.push('');
  L.push(`- Entrada: \`${r.entrada}\``);
  L.push('');
  for (const a of r.assets) {
    L.push(`## ${a.nome} — \`${a.status}\``);
    if (a.familia || a.frame) L.push(`- família: \`${a.familia || '—'}\` · frame: \`${a.frame || '—'}\``);
    if (a.status === STATUS.PASS && a.motor) {
      L.push(`- motor real: usaCores=[${a.motor.usaCores.join(', ')}] · âncoras=[${a.motor.anchors.join(', ')}] · hooks=${JSON.stringify(a.motor.temHooks)}`);
      L.push(`- invariantes: determinístico=${a.motor.determinista} · paleta muda render=${a.motor.paletaMuda} · sem data-* vazado=${a.motor.semDataAttr} · sha=${a.motor.shaFinal}`);
      L.push(`- renders p/ REVISÃO HUMANA: ${Object.entries(a.renders).map(([k, v]) => `${k} (\`${v}\`)`).join(' · ')}`);
      L.push('- ⚠️ **PASS técnico não é aprovação de arte.** Julgar FINAL/TARGET/BLACK/GRAYSCALE/APPLIED a olho.');
    } else {
      L.push(`- ❌ **TECHNICAL_FAIL** — motor NÃO renderizou (nada é consertado em silêncio). Corrija na origem:`);
      L.push('');
      L.push('| gate | arquivo | elemento | problema | como corrigir |');
      L.push('|---|---|---|---|---|');
      for (const v of a.violacoes) L.push(`| ${v.gate} | \`${v.arquivo}\` | \`${v.elemento}\` | ${v.problema} | ${v.como} |`);
    }
    L.push('');
  }
  return L.join('\n');
}

processar().then(() => process.exit(0)).catch((e) => { console.error('✗ EXCEÇÃO:', e); process.exit(1); });
