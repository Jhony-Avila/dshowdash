#!/usr/bin/env node
// testes/rodar-mobile.mjs — TRACK C Marco 9: runner FOCADO da adaptação mobile.
// Roda os E2E mobile (composição as6.mobile_studio) + as regressões V4.3 do
// desktop aprovado (flag OFF) e imprime um veredito consolidado. NÃO dispara a
// suíte inteira (FULL_SUITE_RUN=NO) — é o subconjunto da frente mobile.
//
// Preparação (igual à suíte): build vite do panel-avatar-studio, gerar-harness,
// http.server 8901 em public/, Chromium via PW_CHROME. Ver RUNBOOK-TESTES.md.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { acharChromium } from './navegador.mjs';

const chrome = acharChromium();
if (!chrome) { console.error('✗ Chromium não encontrado (defina PW_CHROME).'); process.exit(2); }
console.log(`preflight OK · chromium: ${chrome}`);

// E2E da composição mobile (Marcos 1-8) — flag as6.mobile_studio ON + viewport estreito
const MOBILE = [
  'mobile-shell-layout.mjs',        // M1/M2: reflow do grid → stack; palco visível; sem overflow
  'mobile-touch-navigation.mjs',    // M2: trilho horizontal fino + troca por toque
  'mobile-category-flow.mjs',       // M2: cada categoria alcançável + palco reenquadra
  'mobile-tools-overlays.mjs',      // M3: ferramentas como full-screen sheet acessível
  'mobile-asset-selection.mjs',     // M4: grade de assets por toque
  'mobile-color-controls.mjs',      // M4: swatches/sliders com alvo de toque
  'mobile-save-flow.mjs',           // M5: barra de salvar fixa inferior + POST real
  'mobile-safe-area.mjs',           // M5: safe-area (notch/gesto) respeitada
  'mobile-orientation-change.mjs',  // M5: retrato↔paisagem sem quebrar
  'mobile-landscape.mjs',           // M5: paisagem de celular (altura baixa) cabe
  'mobile-keyboard-viewport.mjs',   // M5: teclado virtual (VisualViewport) não cobre campo
  'mobile-legacy-compat.mjs',       // M6: avatar legado abre/renderiza/salva no mobile
  'mobile-accessibility-smoke.mjs', // M7: alvos ≥44, aria, zoom livre, reduced-motion
  'mobile-performance-smoke.mjs',   // M8: estabilidade (sem vazamento) + churn de resize
  'mobile-small-screen-320.mjs',    // cert: menor viewport (320×568) sem overflow/inalcançável
  'mobile-tablet-layout.mjs',       // cert: fronteira tablet (768 mobile / 1024 desktop)
  'mobile-viewport-matrix.mjs',     // cert: 14 viewports + varredura progressiva 300→1600
  'mobile-touch-inventory.mjs',     // cert corretiva: alvos ≥44×44 em 14 viewports
  'mobile-contrast-audit.mjs',      // cert corretiva: contraste WCAG (0 introduzido pelo mobile)
  'mobile-color-flow.mjs',          // cert corretiva: fluxo de cor (loop+CSS; variantes §73 = device)
  'mobile-catalog-density.mjs',     // cert corretiva: densidade — ≥1 linha de assets acima da dobra
  'desktop-responsive-regression.mjs', // cert: flag ON não vaza p/ desktop (1280/1440/1600)
];
// Regressões do desktop aprovado (Track A / V4.3) — flag OFF, byte-estabilidade
const REGRESSAO_V43 = [
  'v43-single2d-parity.mjs',
  'v43-single2d-flow.mjs',
  'v43-legacy-compat.mjs',
  'v43-category-focus.mjs',
];

function rodar(lista, titulo) {
  console.log(`\n═════ ${titulo} (${lista.length}) ═════`);
  const vermelhos = [];
  for (const t of lista) {
    console.log(`\n━━ ${t} ━━`);
    const r = spawnSync('node', [resolve(import.meta.dirname, t)], { stdio: 'inherit' });
    if (r.status !== 0) vermelhos.push(t);
  }
  return vermelhos;
}

const redMobile = rodar(MOBILE, 'E2E MOBILE (Track C)');
const redReg = rodar(REGRESSAO_V43, 'REGRESSÃO DESKTOP V4.3 (flag OFF)');
const total = MOBILE.length + REGRESSAO_V43.length;
const red = [...redMobile, ...redReg];
console.log(`\n${'─'.repeat(52)}`);
console.log(`MOBILE: ${MOBILE.length - redMobile.length}/${MOBILE.length} · REGRESSÃO V4.3: ${REGRESSAO_V43.length - redReg.length}/${REGRESSAO_V43.length}`);
console.log(`TOTAL: ${total - red.length}/${total} verdes`);
if (red.length) console.log(`VERMELHOS: ${red.join(' · ')}`);
else console.log('✓ Track C mobile — E2E + regressões V4.3 TODOS VERDES · TRACK_A_DESKTOP_REGRESSION=ZERO');
process.exit(red.length ? 1 : 0);
