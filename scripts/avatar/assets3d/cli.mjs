#!/usr/bin/env node
// assets3d/cli.mjs — onda 1410 (MEGA_BRIEFING_01 §2743–§2767; ASSET-PIPELINE
// §4/§8): CLI ÚNICA do pipeline de assets 3D — wrapper fino sobre as
// ferramentas existentes (nunca duplica lógica), com `--dry-run` em tudo.
//
//   validate <pasta>                     → validar-asset (relatório §488 + notas)
//   build    --fonte --saida --id [...]  → publicar-asset (ingestão segura §2748 + gate §2677)
//   qa       <pasta> [criar|status|ver…] → ficha-qa (status machine §2675)
//   publish  <pasta> [--visibility internal] [--override --motivo "…"]
//            → snapshot da versão anterior (storage/assets-3d-versoes) +
//              gate premium + visibility canary (§2759) + índice regenerado
//   rollback <pasta> [--para vN]         → restaura o snapshot + índice
//   report   <pasta>                     → visão única: validador + perf +
//                                          LODs + health + ficha
//
// Versões anteriores SEMPRE preservadas (§2755): nada é apagado — snapshot
// completo por versão em storage/ (fora do git, é o /backup do pipeline no
// working tree do servidor; o /backup oficial continua sendo o do deploy).
// @version 1.0.0  @created 2026-08-20
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
export const DIR_VERSOES = join(RAIZ, 'storage', 'assets-3d-versoes');
const DRY = process.argv.includes('--dry-run');
const arg = (nome, padrao = null) => { const i = process.argv.indexOf(`--${nome}`); return i > -1 ? process.argv[i + 1] : padrao; };

function indiceDe(pasta) {
  // o índice mora na pasta-mãe (personagens/ ou partes/)
  return resolve(pasta, '..');
}

/** Snapshot completo da pasta publicada (GLBs+manifest+thumbs) por versão. */
export function preservarVersao(pasta, { dry = false, log = (m) => console.log(m) } = {}) {
  const dir = resolve(pasta);
  if (!existsSync(join(dir, 'manifest.json'))) return null;
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const destino = join(DIR_VERSOES, m.id, `v${m.versao ?? 1}`);
  if (dry) { log(`[dry-run] preservaria ${dir} → ${destino}`); return { destino, dry: true }; }
  mkdirSync(destino, { recursive: true });
  cpSync(dir, destino, { recursive: true, force: true });
  log(`versão v${m.versao ?? 1} preservada em ${destino} (§2755)`);
  return { destino, versao: m.versao ?? 1 };
}

/** Restaura o snapshot (rollback §2757). */
export function restaurarVersao(pasta, { para = null, dry = false, log = (m) => console.log(m) } = {}) {
  const dir = resolve(pasta);
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const base = join(DIR_VERSOES, m.id);
  if (!existsSync(base)) throw new Error(`sem snapshots para ${m.id} em ${base}`);
  const versoes = readdirSync(base).filter((v) => /^v\d+$/.test(v)).sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)));
  const alvo = para ?? versoes[0];
  if (!versoes.includes(alvo)) throw new Error(`snapshot ${alvo} inexistente (tem: ${versoes.join(', ')})`);
  if (dry) { log(`[dry-run] restauraria ${base}/${alvo} → ${dir}`); return { alvo, dry: true }; }
  cpSync(join(base, alvo), dir, { recursive: true, force: true });
  log(`ROLLBACK: ${alvo} restaurado em ${dir} — regenere o índice`);
  return { alvo };
}

async function main() {
  const [cmd, alvoArg] = process.argv.slice(2);
  const log = (m) => console.log(m);
  if (cmd === 'validate') {
    const { relatorioDeValidacao } = await import('./validar-asset.mjs');
    if (DRY) { log(`[dry-run] validaria ${alvoArg}`); return; }
    const r = relatorioDeValidacao(resolve(alvoArg));
    console.log(r.linhas.join('\n'));
    process.exitCode = r.aprovado ? 0 : 1;
  } else if (cmd === 'build') {
    const { publicarAsset } = await import('./publicar-asset.mjs');
    const opcoes = {
      fonte: arg('fonte'), saida: arg('saida'), id: arg('id'),
      tipo: arg('tipo', 'personagem_base'), rig: arg('rig', 'ubc-v1'),
      origem: arg('origem', 'ubc-standard-v1'), licencaTipo: arg('licenca', 'CC0'),
      comprovante: arg('comprovante', 'storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt'),
      familia: arg('familia', null), data: arg('data', null),
      override: process.argv.includes('--override'), motivo: arg('motivo', null),
    };
    if (DRY) { log(`[dry-run] publicaria ${opcoes.id} de ${opcoes.fonte} em ${opcoes.saida} (ingestão §2748 + gate §2677 + validador §487)`); return; }
    const r = await publicarAsset(opcoes);
    log(`BUILD_OK ${r.pasta} · ${JSON.stringify(r.medidas)}`);
  } else if (cmd === 'qa') {
    const sub = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : 'ver';
    const { criarFicha, transicionar, lerFicha } = await import('./ficha-qa.mjs');
    if (DRY) { log(`[dry-run] qa ${sub} em ${alvoArg}`); return; }
    if (sub === 'criar') { const r = criarFicha(alvoArg); log(`${r.criada ? 'FICHA_CRIADA' : 'FICHA_EXISTE'} ${r.arquivo}`); }
    else if (sub === 'ver') { const r = lerFicha(alvoArg); log(r ? JSON.stringify(r.ficha, null, 2) : 'sem ficha'); }
    else { const r = transicionar(alvoArg, sub, { reviewer: arg('reviewer'), data: arg('data') }); log(`FICHA_${r.ficha.status.toUpperCase()} ${r.arquivo}`); }
  } else if (cmd === 'publish') {
    const dir = resolve(alvoArg);
    const { validarAsset, relatorioDeValidacao } = await import('./validar-asset.mjs');
    const { verificarGatePublicacao } = await import('./publicar-asset.mjs');
    const { gerarIndice3d } = await import('./gerar-indice-3d.mjs');
    const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const visibility = arg('visibility', null); // §2759: canary = internal
    if (visibility && !['internal', 'beta', 'production'].includes(visibility)) throw new Error(`visibility "${visibility}" fora do enum`);
    if (DRY) {
      log(`[dry-run] publish ${manifest.id}: preservaria v${manifest.versao ?? 1} → gate §2677 (${manifest.qualidadeVisual ?? 'production'}/${manifest.qaVisual?.status ?? '—'})${visibility ? ` → visibility=${visibility}` : ''} → validador → índice`);
      return;
    }
    preservarVersao(dir, { log });
    verificarGatePublicacao(manifest, { override: process.argv.includes('--override'), motivo: arg('motivo'), log });
    if (visibility) {
      manifest.visibility = visibility;
      writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      log(`visibility=${visibility} (§2759 canary)`);
    }
    const r = validarAsset(dir);
    if (!r.aprovado) { console.error(relatorioDeValidacao(dir).linhas.join('\n')); throw new Error('validador reprovou — publish abortado'); }
    gerarIndice3d(indiceDe(dir));
    log(`PUBLISH_OK ${manifest.id} · índice regenerado — commit + colar/webhook fazem o resto (deploy SEMPRE pelo script, decisão #47)`);
  } else if (cmd === 'rollback') {
    const r = restaurarVersao(alvoArg, { para: arg('para'), dry: DRY });
    if (!DRY) {
      const { gerarIndice3d } = await import('./gerar-indice-3d.mjs');
      gerarIndice3d(indiceDe(resolve(alvoArg)));
      console.log(`ROLLBACK_OK ${r.alvo} · índice regenerado`);
    }
  } else if (cmd === 'report') {
    const dir = resolve(alvoArg);
    const { relatorioDeValidacao } = await import('./validar-asset.mjs');
    const { medirAsset } = await import('./medir-perf-asset.mjs');
    const { auditarPasta } = await import('./auditar-lods.mjs');
    const { healthDe } = await import('./gerar-indice-3d.mjs');
    const { lerFicha } = await import('./ficha-qa.mjs');
    if (DRY) { console.log(`[dry-run] report de ${dir}`); return; }
    const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const val = relatorioDeValidacao(dir);
    const perf = medirAsset(dir);
    const lods = auditarPasta(dir, manifest);
    const ficha = lerFicha(dir);
    console.log([
      `═══ ${manifest.id} v${manifest.versao ?? 1} · ${manifest.tipo} · ${manifest.qualidadeVisual ?? 'production'} · health ${healthDe(dir, manifest)}/100 ═══`,
      ...val.linhas,
      `LODs: classe ${lods.classe} · redução lod1 ${lods.reducao.lod1 ?? '—'} / lod2 ${lods.reducao.lod2 ?? '—'}`,
      `Perf [${perf.classe ?? 'sem classe'}]: ${perf.dentroDoOrcamento ? 'dentro do orçamento' : `fora (${perf.avisos.length + perf.erros.length} itens)`}`,
      `QA: ${manifest.qaVisual?.status ?? 'sem qaVisual'}${ficha ? ` · ficha ${ficha.ficha.status} (${ficha.ficha.evidencias.length} evidências)` : ' · sem ficha em storage/'}`,
    ].join('\n'));
  } else {
    console.error('uso: cli.mjs validate|build|qa|publish|rollback|report <pasta|--flags> [--dry-run]');
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
