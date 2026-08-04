// testes/manifest.test.mjs — mega 84 (§267): o manifest unificado é
// DETERMINÍSTICO (2 gerações = byte-idêntico) e consistente com o repo.
// @version 1.0.0  @created 2026-08-04
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ARQ = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'manifest-assets.json');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

execSync(`node "${join(RAIZ, 'scripts/avatar/gerar-manifest.mjs')}"`, { stdio: 'pipe' });
const a = readFileSync(ARQ, 'utf8');
execSync(`node "${join(RAIZ, 'scripts/avatar/gerar-manifest.mjs')}"`, { stdio: 'pipe' });
const b = readFileSync(ARQ, 'utf8');
ok(a === b, 'manifest NÃO determinístico (2 gerações diferem)');

const m = JSON.parse(a);
ok(m.formato === 'dshow-avatar-manifest' && m.versao === 1, 'cabeçalho do manifest errado');
ok(m.resumo.itens2d > 300, `itens 2D suspeitos (${m.resumo.itens2d})`);
ok(m.resumo.personagens3d === 6, `personagens 3D deveriam ser 6 (${m.resumo.personagens3d})`);
ok(m.itens.length === m.resumo.itens2d, 'resumo × lista divergem');
ok(!a.includes('"geradoEm"') && !/20\d\d-\d\d-\d\dT/.test(a.slice(0, 200)), 'timestamp vazou no manifest (§267 determinismo)');

console.log(`[manifest] FALHAS: ${falhas.length ? falhas.join(' || ') : 'nenhuma'}`);
process.exit(falhas.length ? 1 : 0);
