// scripts/avatar/testes/navegador.mjs — helper compartilhado da suíte.
// @version 1.0.0  @created 2026-07-30
//
// Pré-requisitos (uma vez, em qualquer pasta com node): npm i playwright-core
// e um Chromium local. Configure por ambiente quando os padrões não valerem:
//   PW_CHROME=/caminho/do/chrome   BASE_URL=http://127.0.0.1:8901
// Antes de rodar: build dos painéis + `node scripts/avatar/gerar-harness.mjs`
// + servidor estático em public/ (python3 -m http.server 8901).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8901';
export const SAIDA = resolve(import.meta.dirname, 'saida');
mkdirSync(SAIDA, { recursive: true });

export async function abrir({ viewport = { width: 1440, height: 900 }, webgl = false, init, initArg } = {}) {
  const args = ['--no-sandbox'];
  if (webgl) args.push('--enable-unsafe-swiftshader'); // WebGL por software no headless
  const navegador = await chromium.launch({
    executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args,
  });
  const contexto = await navegador.newContext({ viewport });
  // tour §568 auto-abre em storage limpo — testes marcam VISTO por padrão
  // (o shell-tour.mjs remove a marca no próprio init para testar a 1ª visita)
  await contexto.addInitScript(() => {
    try { if (!localStorage.getItem('dshow.avst5.tour.v1')) localStorage.setItem('dshow.avst5.tour.v1', 'feito'); } catch { /* sem storage */ }
    // rollout §650: novo_shell/palco3d agora são padrão ON no código — os
    // testes LEGADOS (sem flags no init) continuam cobrindo o modo CLÁSSICO
    // (fallback §651). Quem quer o padrão real remove a chave no próprio
    // init (rollout-padrao.mjs); quem quer o shell declara as flags.
    try {
      if (!localStorage.getItem('dshow.avst.flags.v1')) {
        // lote 671-680 (#68): classico_aaa também é padrão ON no código —
        // os testes legados seguem cobrindo o clássico PRÉ-AAA (fallback
        // §651); o layout AAA tem teste próprio (classico-aaa.mjs)
        localStorage.setItem('dshow.avst.flags.v1', '{"as5.novo_shell":false,"as5.palco3d":false,"as5.classico_aaa":false}');
      }
    } catch { /* sem storage */ }
  });
  if (init) await contexto.addInitScript(init, initArg); // initArg: dado serializável p/ o init (lote 801-810)
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message.slice(0, 160)));
  return { navegador, pagina, erros };
}

export async function irParaHarness(pagina, arquivo, esperaMs = 600) {
  await pagina.goto(`${BASE}/${arquivo}`, { waitUntil: 'networkidle' });
  await pagina.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
  await pagina.waitForTimeout(esperaMs);
}

/** Abre a aba "Estúdio 3D" e espera motor3d + GLBs (lento no SwiftShader). */
export async function abrirAba3d(pagina) {
  await pagina.evaluate(() => {
    [...document.querySelectorAll('nav.avst-categorias button.avst-cat')]
      .find((x) => x.textContent.includes('Estúdio'))?.click();
  });
  await pagina.waitForTimeout(9000);
}

/** Captura o canvas 3D via toDataURL (screenshot de elemento sai BRANCO no
 *  SwiftShader) com double-RAF para garantir quadro fresco. */
export async function fotografarCanvas(pagina, caminho) {
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const data = await pagina.evaluate(() => document.querySelector('.avst-3d-palco canvas')?.toDataURL('image/png'));
  if (data && data.length > 2000) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(caminho, Buffer.from(data.split(',')[1], 'base64'));
    return true;
  }
  await pagina.locator('.avst-3d-palco, canvas').first().screenshot({ path: caminho });
  return false;
}

export function relatorio(nome, falhas, erros) {
  console.log(`[${nome}] FALHAS:`, falhas.length ? falhas.join(' || ') : 'nenhuma');
  console.log(`[${nome}] ERROS JS:`, erros.length ? erros.join(' | ') : 'nenhum');
  return falhas.length === 0;
}
