// testes/feminino-save-reload.mjs — Golden V3.2 §4 (#219-R2):
// PROVA do caminho de persistência REAL do corpo feminino.
//
//   raw client payload
//     → validarConfig (TS, gate do cliente)              [perfil ANTES]
//     → avst_validar_config (PHP REAL de studio.php)      [o que o BANCO grava]
//     → GET/reload
//     → validarConfig (TS, revalida no load)              [perfil DEPOIS]
//     → perfilCorpoDe(reloaded) === 'feminino'
//     → corpoV2.preset sobrevive TODOS os saltos
//
// O PHP é a MESMA função avst_validar_config que o handler POST chama
// (studio.php: `$config = avst_validar_config(...)`); extraída byte a byte
// por _php-sanitize-runner.php e executada fora do fluxo HTTP/DB. Prova
// também a ASSIMETRIA correta: `corpo` legado='feminino' (decoy) é DROPADO
// dos dois lados; só corpoV2.preset='feminino' sobrevive.
// @version 1.0.0  @created 2026-08-23 (V3.2)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const STUDIO_PHP = join(RAIZ, 'api', 'avatar', 'studio.php');
const RUNNER_PHP = join(import.meta.dirname, '_php-sanitize-runner.php');
const tmp = mkdtempSync(join(tmpdir(), 'avst-fem-'));
let falhas = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

// ── payload CRU do cliente (com decoys: corpo legado feminino + junk) ──
const RAW = {
  formato: 'camadas', versao: 1, base: 'bas_px_coracao', acabamento: 'premium',
  cores: { pele: '#f0c69e', cabelo: '#40261a', roupa: '#7b4fc4', destaque: '#d98cc0' },
  camadas: { cabelo: 'cab_px_longo_liso', olhos: 'olh_px_gentil', boca: 'boc_px_suave', roupa: 'rou_px_camiseta', fundo: 'fun_px_estudio' },
  corpo: 'feminino',                                  // DECOY: legado não aceita → deve cair
  corpoV2: { preset: 'feminino', morfos: { cintura: -0.3, lixo: 9 } }, // canônico
};
// controle: standard (sem preset) — pra provar que o SVG feminino difere
const RAW_STD = { ...RAW, base: 'bas_px_oval', corpo: undefined, corpoV2: undefined };
writeFileSync(join(tmp, 'raw.json'), JSON.stringify(RAW));

// ── prova.ts: valida um JSON e imprime {perfil, validated} ──
writeFileSync(join(tmp, 'prova.ts'), `
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validarConfig, svgDe } from '@painel/services/AvatarCatalog';
import { perfilCorpoDe } from '@painel/engine/partes/corpo';
import type { AvatarConfig } from '@painel/domain/types';
const cfgIn = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const v = validarConfig(cfgIn as any) as AvatarConfig;
const perfil = perfilCorpoDe(v);
// assinatura semântica do CORPO: svgDe determinístico com uid fixo, isolando
// só a geometria do corpo (premium+palco+corpo). uid constante → ids estáveis.
const svg = svgDe(v, { premium: true, palco: true, enquadramento: 'corpo', estatico: true, uid: 'femprova' });
const bodySig = createHash('sha256').update(svg).digest('hex').slice(0, 16);
process.stdout.write(JSON.stringify({ perfil, corpoV2: v.corpoV2 ?? null, corpoLegado: v.corpo ?? null, bodySig }));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const tsValida = (jsonPath) => JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}" "${jsonPath}"`, { encoding: 'utf8' }));
const phpSanitiza = (jsonPath) => {
  const out = execSync(`php "${RUNNER_PHP}" "${STUDIO_PHP}" "${jsonPath}"`, { encoding: 'utf8' });
  return JSON.parse(out);
};

console.log('\n━━ Golden V3.2 §4 — feminino save/reload (caminho real) ━━');

// [1] config inicial + [2] validarConfig TS (gate cliente) → perfil ANTES
const antes = tsValida(join(tmp, 'raw.json'));
ok(antes.perfil === 'feminino', `[2] validarConfig TS(raw) → perfil = ${antes.perfil} (esperado feminino)`);
ok(antes.corpoV2 && antes.corpoV2.preset === 'feminino', `[2] TS preservou corpoV2.preset = ${antes.corpoV2 && antes.corpoV2.preset}`);
ok(antes.corpoLegado == null, `[2] TS DROPOU corpo legado='feminino' (decoy) → ${antes.corpoLegado} (contrato l.535)`);

// [3] POST real → sanitização PHP (o que o BANCO grava) — sobre o CRU
const persisted = phpSanitiza(join(tmp, 'raw.json'));
writeFileSync(join(tmp, 'persisted.json'), JSON.stringify(persisted));
ok(persisted.corpoV2 && persisted.corpoV2.preset === 'feminino', `[3][4] PHP avst_validar_config persistiu corpoV2.preset = ${persisted.corpoV2 && persisted.corpoV2.preset}`);
ok(persisted.corpo === undefined, `[4] PHP DROPOU corpo legado='feminino' (decoy) → ${persisted.corpo} (espelho l.192)`);
ok(persisted.corpoV2 && persisted.corpoV2.morfos && persisted.corpoV2.morfos.cintura === -0.3 && persisted.corpoV2.morfos.lixo === undefined, `[4] PHP clampou morfos (cintura=-0.3, lixo dropado)`);

// [5] GET/reload → [6] validarConfig TS de novo → perfil DEPOIS
const depois = tsValida(join(tmp, 'persisted.json'));
ok(depois.perfil === 'feminino', `[6][7] validarConfig TS(persisted) → perfilCorpoDe = ${depois.perfil} (esperado feminino)`);
ok(depois.corpoV2 && depois.corpoV2.preset === 'feminino', `[7] corpoV2.preset sobreviveu ao reload = ${depois.corpoV2 && depois.corpoV2.preset}`);

// [8] SVG antes === semanticamente mesmo profile após reload
ok(antes.perfil === depois.perfil, `[8] perfil ANTES(${antes.perfil}) === DEPOIS(${depois.perfil})`);
ok(antes.bodySig === depois.bodySig, `[8] assinatura SVG do corpo idêntica antes/depois (${antes.bodySig})`);

// controle: standard difere do feminino no SVG do corpo (prova que o preset MUDA a arte)
writeFileSync(join(tmp, 'std.json'), JSON.stringify(RAW_STD));
const std = tsValida(join(tmp, 'std.json'));
ok(std.perfil !== 'feminino', `[ctrl] standard → perfil = ${std.perfil} (≠ feminino)`);
ok(std.bodySig !== depois.bodySig, `[ctrl] SVG corpo feminino ≠ standard (fem=${depois.bodySig} std=${std.bodySig})`);

rmSync(tmp, { recursive: true, force: true });
console.log(falhas ? `\n✗ FALHAS: ${falhas}` : '\n✓ feminino save/reload — cadeia real verde');
process.exit(falhas ? 1 : 0);
