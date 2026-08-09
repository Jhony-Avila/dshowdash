// testes/cms-ro.mjs — lote 1061–1070 (decisão #108, flag as6.cms_ro):
// CMS READ-ONLY do catálogo (AS6 Parte 15).
//   A) flag ON: a Paleta (Ctrl+K) ganha "CMS do catálogo"; executar abre
//      o drawer com as 3 abas; no harness (sem backend real) o estado
//      degrada p/ restrito/erro SEM vazar dados nem quebrar; fecha no X.
//   B) rollback §651: flag OFF = comando ausente da paleta.
//   C) php -l no endpoint + prova estática de que cms.php é GET-only
//      com AdminGate (zero escrita).
// @version 1.0.0  @created 2026-08-09
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── C) endpoint ─────────────────────────────────────────────────────
execSync(`php -l "${join(RAIZ, 'api', 'avatar', 'cms.php')}"`, { stdio: 'pipe' });
const php = readFileSync(join(RAIZ, 'api', 'avatar', 'cms.php'), 'utf8');
ok(php.includes("['GET', 'OPTIONS']") && php.includes('AdminGate::autorizado'),
  'cms.php deveria ser GET-only com AdminGate');
ok(!/INSERT|UPDATE|DELETE|REPLACE/i.test(php.replace(/\/\*[\s\S]*?\*\//g, '')),
  'cms.php não pode conter escrita (read-only por construção)');

const abrirPaleta = async (p) => {
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(400);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPaleta(p);
    await p.keyboard.type('CMS');
    await p.waitForTimeout(400);
    const temCmd = await p.evaluate(() => document.body.textContent.includes('CMS do catálogo'));
    ok(temCmd, 'comando do CMS ausente da paleta com a flag ON');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(800);
    ok(await p.locator('[data-teste="cms-ro"]').count() === 1, 'drawer do CMS não abriu');
    ok(await p.locator('[data-teste^="cms-aba-"]').count() === 3, 'esperava 3 abas no CMS');
    // harness sem backend admin → restrito OU erro, nunca tabela com dados
    await p.waitForTimeout(600);
    const estado = await p.evaluate(() => ({
      restrito: !!document.querySelector('[data-teste="cms-restrito"]'),
      erro: !!document.querySelector('[data-teste="cms-erro"]'),
      tabela: !!document.querySelector('[data-teste="cms-tabela"]'),
      vazio: document.querySelector('[data-teste="cms-ro"]')?.textContent?.includes('Nada por aqui') ?? false,
    }));
    // no harness o fetch é mockado genérico: aceita restrito/erro/vazio —
    // o que NUNCA pode acontecer sem backend real é tabela com dados
    ok((estado.restrito || estado.erro || estado.vazio) && !estado.tabela,
      `sem backend deveria degradar p/ restrito/erro/vazio (${JSON.stringify(estado)})`);
    await p.screenshot({ path: `${SAIDA}/cms-ro.png` });
    await p.locator('[data-teste="cms-fechar"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cms-ro"]').count() === 0, 'X não fechou o drawer');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.cms_ro': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPaleta(p);
    await p.keyboard.type('CMS');
    await p.waitForTimeout(400);
    ok(!(await p.evaluate(() => document.body.textContent.includes('CMS do catálogo'))),
      'flag OFF ainda lista o comando do CMS (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[cms-ro] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[cms-ro] FALHAS: nenhuma');
console.log('[cms-ro] ERROS JS: nenhum');
