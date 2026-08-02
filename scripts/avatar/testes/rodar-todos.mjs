#!/usr/bin/env node
// testes/rodar-todos.mjs — roda a suíte inteira em sequência.
// @version 1.0.0  @created 2026-07-30
//
// Preparação (uma vez por build):
//   1. npx vite build nos painéis (panel-avatar-studio e panel-dashboard)
//   2. node scripts/avatar/gerar-harness.mjs        (da raiz do repo)
//   3. python3 -m http.server 8901                  (de public/, em background)
//   4. npm i playwright-core (onde a suíte rodar) + Chromium (PW_CHROME)
// Screenshots caem em testes/saida/ (fora do git).
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const TESTES = ['palco-vivo.mjs', 'sockets-3d.mjs', 'retomada-3d.mjs', 'home-pessoal.mjs', 'home-compacto.mjs', 'shell-s1.mjs', 'shell-s2.mjs', 'shell-s3.mjs', 'shell-s4.mjs', 'shell-c1.mjs', 'shell-c2.mjs', 'shell-c3.mjs', 'shell-p1.mjs', 'shell-f4.mjs', 'foto-f6.mjs', 'conquistas-f7.mjs', 'shell-f3d.mjs'];
let falhas = 0;
for (const t of TESTES) {
  console.log(`\n━━ ${t} ━━`);
  const r = spawnSync('node', [resolve(import.meta.dirname, t)], { stdio: 'inherit' });
  if (r.status !== 0) falhas += 1;
}
console.log(`\n${TESTES.length - falhas}/${TESTES.length} testes verdes`);
process.exit(falhas ? 1 : 0);
