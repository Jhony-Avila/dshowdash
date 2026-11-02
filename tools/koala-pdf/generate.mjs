#!/usr/bin/env node
// generate.mjs — Conversor HTML -> PDF do Koala Docs (F3).
// Recebe um HTML self-contained JÁ renderizado pelo renderizador único (PHP) e produz um PDF A4.
// NÃO acessa banco nem sessão: é um conversor PURO. A fidelidade preview==PDF vem de usar o MESMO HTML.
// Reusa o Playwright/Chromium instalado (node_modules -> ../screenshot/node_modules).
// Requer env PLAYWRIGHT_BROWSERS_PATH apontando para o Chromium compartilhado (opção B).
// @module koala.tool.pdf @version 1.0.0-F3
//
// Uso: node generate.mjs --html=/caminho/in.html --out=/caminho/out.pdf

import { chromium } from 'playwright';
import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function argVal(name) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : null;
}

const htmlPath = argVal('html');
const outPath = argVal('out');

if (!htmlPath || !outPath) {
  console.error('ERRO: --html=<path> e --out=<path> são obrigatórios');
  process.exit(2);
}
if (!existsSync(htmlPath)) {
  console.error('ERRO: html não encontrado: ' + htmlPath);
  process.exit(2);
}

const TIMEOUT_MS = 30000;
let browser;

(async () => {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  // file:// honra qualquer referência relativa; o HTML do renderer é self-contained mesmo assim.
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load', timeout: TIMEOUT_MS });
  // emulateMedia('print') ativa o @media print do base.css (margin 0, sem sombra) e @page A4.
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: outPath,
    printBackground: true,       // fundos/tabelas/marca d'água
    preferCSSPageSize: true,     // honra @page { size: A4 portrait; margin: 0 } do renderer
    format: 'A4',                // fallback caso @page não seja aplicado
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  browser = null;
  const bytes = statSync(outPath).size;
  process.stdout.write('OK bytes=' + bytes + '\n');
  process.exit(0);
})().catch(async (e) => {
  try { if (browser) await browser.close(); } catch { /* ignore */ }
  console.error('FAIL: ' + (e && e.message ? String(e.message).split('\n')[0] : String(e)));
  process.exit(1);
});
