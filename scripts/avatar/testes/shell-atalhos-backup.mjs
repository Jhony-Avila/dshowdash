// testes/shell-atalhos-backup.mjs — lote 31–40 no SHELL: paleta com o 3D
// (35), folha de atalhos "?" (37) e backup export/import validado (38).
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// R1 (mega 37): "?" abre a folha de atalhos; Esc fecha; grupos presentes
await p.keyboard.press('?');
await p.waitForSelector('[data-teste="atalhos"]', { timeout: 5000 });
const texto = await p.locator('[data-teste="atalhos"]').textContent();
ok(texto.includes('Palco 3D') && texto.includes('Ctrl'), 'folha de atalhos sem os grupos esperados');
ok((await p.locator('[data-teste="atalhos"] kbd').count()) >= 10, 'folha com poucos atalhos listados');
await p.screenshot({ path: `${SAIDA}/atalhos.png` });
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
ok(await p.locator('[data-teste="atalhos"]').count() === 0, 'Esc não fechou a folha de atalhos');

// R2 (mega 35): paleta §566 ganhou o 3D e a folha de atalhos
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('prévia 3d');
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="paleta-comandos"] li button', { hasText: 'Ligar a prévia 3D' }).count() === 1,
  'comando Ligar a prévia 3D ausente na paleta');
await p.locator('[data-teste="paleta-comandos"] input').fill('atalhos');
await p.waitForTimeout(300);
await p.keyboard.press('Enter');
await p.waitForSelector('[data-teste="atalhos"]', { timeout: 5000 });
await p.keyboard.press('Escape');
await p.waitForTimeout(300);

// R3 (mega 38): EXPORT — JSON com formato/versão/config/presets/cenas3d
await p.locator('.avst5-abas button', { hasText: 'Presets' }).click();
await p.waitForSelector('[data-teste="backup-exportar"]', { timeout: 5000 });
const exportado = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="backup-exportar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 50 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const texto = await fetch(pego.href).then((r) => r.text());
  return { nome: pego.nome, corpo: JSON.parse(texto) };
});
ok(exportado?.corpo?.formato === 'dshow-avatar-backup', 'export sem o formato esperado');
ok(exportado?.corpo?.versao === 1 && !!exportado?.corpo?.config, 'export sem versão/config');
ok(/^dshow-avatar-backup-\d{4}-\d{2}-\d{2}\.json$/.test(exportado?.nome ?? ''),
  `nome do backup inesperado (${exportado?.nome})`);

// R4 (mega 38): IMPORT — válido entra (preset + cena), malformado é
// DESCARTADO e contado no aviso; config aplicada vira comando
const backup = {
  formato: 'dshow-avatar-backup',
  versao: 1,
  criadoEm: '2026-08-04T12:00:00.000Z',
  config: exportado.corpo.config,
  presets: [
    {
      id: 'pp_teste_import', nome: 'Trazido do Backup', tags: ['import'], favorito: true,
      criadoEm: '2026-08-04T12:00:00.000Z', renderizador: '2d', config: exportado.corpo.config,
    },
    { id: 12345, nome: null }, // malformado — precisa ser descartado
  ],
  cenas3d: [
    {
      id: 'c3_teste_import', nome: 'Neon na Grade', criadoEm: '2026-08-04T12:00:00.000Z',
      personagem: 'androide', fundo: 'grade', luz: 'neon', camera: 'corpo',
      animacao: 'Idle', marca: true, qualidade: 'auto',
    },
    { nome: '' }, // malformada — descartada
  ],
};
await p.locator('[data-teste="backup-arquivo"]').setInputFiles({
  name: 'backup.json', mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(backup)),
});
await p.waitForSelector('[data-teste="backup-aviso"]', { timeout: 5000 });
const aviso = await p.locator('[data-teste="backup-aviso"]').textContent();
ok(aviso.includes('Backup importado'), `aviso inesperado: ${aviso}`);
ok(aviso.includes('1 preset(s) malformado(s)') && aviso.includes('1 cena(s) malformada(s)'),
  `avisos de descarte ausentes: ${aviso}`);
ok(await p.locator('[data-teste="preset"]', { hasText: 'Trazido do Backup' }).count() === 1,
  'preset importado não apareceu na biblioteca');
const cenaNoStorage = await p.evaluate(() => localStorage.getItem('dshow.avst5.p3d.cenas.v1') ?? '');
ok(cenaNoStorage.includes('Neon na Grade') && !cenaNoStorage.includes('""'),
  'cena importada não chegou ao storage validada');
await p.screenshot({ path: `${SAIDA}/backup-importado.png` });

// R5 (mega 38): import de arquivo INVÁLIDO nunca aplica nada
await p.locator('[data-teste="backup-arquivo"]').setInputFiles({
  name: 'lixo.json', mimeType: 'application/json',
  buffer: Buffer.from('{"formato":"outra-coisa"}'),
});
await p.waitForTimeout(600);
const aviso2 = await p.locator('[data-teste="backup-aviso"]').textContent();
ok(aviso2.includes('não é um backup'), `arquivo inválido deveria ser recusado: ${aviso2}`);
ok(await p.locator('[data-teste="preset"]').count() === 1, 'import inválido mexeu na biblioteca');

const ok_ = relatorio('shell-atalhos-backup', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
