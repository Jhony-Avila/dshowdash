#!/usr/bin/env node
// scripts/avatar/exportar-motor.mjs — exporta o MOTOR do Avatar Studio como artefato VERSIONADO (Programa "Avatar nativo", Onda 1).
//   saída: public/assets/avatars/motor/motor-<versao>.js + motor.json  (versao = 12 primeiros hex do sha256 do bundle)
//   DETERMINISMO: roda SEMPRE com cwd = raiz do Dash e caminhos RELATIVOS (o esbuild embute "// caminho/do/modulo.ts";
//   com cwd variável o hash mudaria). Mesmo fonte → mesmo sha256 (teste motor-export.mjs). Versões antigas não são apagadas.
//   uso: node scripts/avatar/exportar-motor.mjs [--saida DIR] [--quieto]      (ESBUILD=/caminho/esbuild para apontar outro binário)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const quieto = args.includes('--quieto');
const iSaida = args.indexOf('--saida');
const SAIDA = iSaida >= 0 ? resolve(args[iSaida + 1]) : join(RAIZ, 'public', 'assets', 'avatars', 'motor');
const PAINEL_SRC = 'public/components/panels/panel-avatar-studio/src';
const ENTRY = 'scripts/avatar/motor/entry.ts';
const esbuild = process.env.ESBUILD || [join(RAIZ, 'node_modules', '.bin', 'esbuild'), join(RAIZ, PAINEL_SRC, '..', 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c));
if (!esbuild || !existsSync(esbuild)) { console.error('[exportar-motor] esbuild não encontrado (defina ESBUILD=…)'); process.exit(2); }
for (const p of [ENTRY, PAINEL_SRC, 'public/components/panels/panel-avatar-studio/tsconfig.json']) {
  if (!existsSync(join(RAIZ, p))) { console.error(`[exportar-motor] ausente: ${p}`); process.exit(2); }
}
mkdirSync(SAIDA, { recursive: true });
const tmp = join(SAIDA, `.motor-${process.pid}.tmp.js`);
execFileSync(esbuild, [
  ENTRY, '--bundle', '--format=iife', '--global-name=DSHOWAvatarMotor', '--platform=neutral', '--target=es2020',
  '--legal-comments=none', '--charset=utf8', `--alias:@painel=./${PAINEL_SRC}`,
  `--tsconfig=public/components/panels/panel-avatar-studio/tsconfig.json`, `--outfile=${relative(RAIZ, tmp)}`,
], { cwd: RAIZ, stdio: quieto ? 'ignore' : ['ignore', 'ignore', 'inherit'] });
const bytes = readFileSync(tmp);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const versao = sha256.slice(0, 12);
const arquivo = `motor-${versao}.js`;
renameSync(tmp, join(SAIDA, arquivo));
// metadados: flags remotas e padrões de render lidos da FONTE (nucleo/flags.ts), não digitados
const flagsTs = readFileSync(join(RAIZ, PAINEL_SRC, 'nucleo', 'flags.ts'), 'utf8');
const mRem = flagsTs.match(/export const FLAGS_REMOTAS = \[([^\]]*)\]/);
const flagsRemotas = mRem ? [...mRem[1].matchAll(/'([a-z0-9_.]+)'/g)].map((m) => m[1]) : [];
const padroes = {};
for (const k of ['as6.classico_premium', 'as6.arte_v2', 'as6.face_v2', 'as6.fit_v2', 'as6.vestuario_separado', 'as6.hero_2d', 'as6.slots_corpo', 'as6.acess_v2', 'as6.derivados', 'as6.estado_vnext']) {
  const m = flagsTs.match(new RegExp(`'${k.replace('.', '\\.')}':\\s*(true|false)`));
  padroes[k] = m ? m[1] === 'true' : null;
}
let commit = 'desconhecido';
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).trim(); } catch { /* fora de git */ }
const meta = {
  versao, sha256, bytes: bytes.length, arquivo, url: `/assets/avatars/motor/${arquivo}`, gerado_em: new Date().toISOString(), commit,
  global: 'DSHOWAvatarMotor', flags_remotas: flagsRemotas, flags_padrao_render: padroes, chave_flags_local: 'dshow.avst.flags.v1',
};
writeFileSync(join(SAIDA, 'motor.json'), JSON.stringify(meta, null, 2) + '\n');
if (!quieto) console.log(`[exportar-motor] ${arquivo} ${bytes.length} bytes sha256=${sha256.slice(0, 16)}… commit=${commit} (${statSync(join(SAIDA, arquivo)).size} B gravados em ${relative(RAIZ, SAIDA) || '.'})`);
