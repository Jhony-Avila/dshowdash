// testes/portabilidade.mjs — lote 371–380 (§254/§255/§309/§310, flag
// as5.portabilidade): export/import COMPLETOS.
//   • no SHELL (aba Presets): Exportar TUDO baixa JSON versionado com as
//     chaves dshow.*; Importar TUDO valida estrito (formato/versão/
//     whitelist) e aplica; arquivo inválido é RECUSADO sem tocar nada
//   • roundtrip real: semeia chaves → exporta (intercepta) → limpa →
//     importa → chaves voltam
//   • rollback §651: flag off = sem botões novos (backup clássico fica)
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
    localStorage.setItem('dshow.avst5.contadores.v1', JSON.stringify({ poderes: 7 }));
    localStorage.setItem('dshow.avst5.recordes.v1', JSON.stringify({ poderes: 7, capturas: 0, apresentacoes: 0, presets: 0, marcos: 0 }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p.waitForSelector('.avst5-presets', { timeout: 8000 });

  ok(await p.locator('[data-teste="port-exportar"]').count() === 1, 'botão Exportar TUDO ausente (§310)');
  // intercepta o download e captura o JSON
  const pacote = await p.evaluate(async () => new Promise((resolve) => {
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      URL.createObjectURL = origCreate;
      blob.text().then((t) => resolve(t));
      return 'blob:teste';
    };
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function c() { HTMLAnchorElement.prototype.click = origClick; };
    document.querySelector('[data-teste="port-exportar"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => resolve('TIMEOUT'), 6000);
  }));
  ok(pacote !== 'TIMEOUT', 'export não produziu arquivo');
  const obj = JSON.parse(String(pacote));
  ok(obj.formato === 'dshow-avatar-studio' && obj.v === 1, 'pacote sem formato/versão (§310)');
  ok(typeof obj.chaves['dshow.avst5.contadores.v1'] === 'string', 'chave semeada fora do pacote');
  ok(Object.keys(obj.chaves).every((k) => k.startsWith('dshow.')), 'chave fora da whitelist no export');

  // limpa uma chave e IMPORTA de volta
  await p.evaluate(() => localStorage.removeItem('dshow.avst5.contadores.v1'));
  await p.locator('[data-teste="port-arquivo"]').setInputFiles({
    name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(String(pacote)),
  });
  await p.waitForTimeout(600);
  const devolta = await p.evaluate(() => localStorage.getItem('dshow.avst5.contadores.v1') ?? '');
  ok(devolta.includes('"poderes":7'), 'import não devolveu a chave (§309)');

  // arquivo INVÁLIDO é recusado sem aplicar nada
  await p.evaluate(() => localStorage.setItem('dshow.avst5.contadores.v1', '{"poderes":9}'));
  await p.locator('[data-teste="port-arquivo"]').setInputFiles({
    name: 'lixo.json', mimeType: 'application/json', buffer: Buffer.from('{"formato":"outro","chaves":{"x":"1"}}'),
  });
  await p.waitForTimeout(600);
  ok((await p.locator('[data-teste="backup-aviso"]').textContent())?.includes('recusado'),
    'inválido deveria ser RECUSADO com aviso (§309)');
  const intacto = await p.evaluate(() => localStorage.getItem('dshow.avst5.contadores.v1') ?? '');
  ok(intacto.includes('"poderes":9'), 'import inválido não podia tocar o storage');
  await p.screenshot({ path: `${SAIDA}/portabilidade.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as5.portabilidade': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p2.waitForSelector('.avst5-presets', { timeout: 8000 });
  ok(await p2.locator('[data-teste="port-exportar"]').count() === 0, 'flag off com Exportar TUDO (§651)');
  ok(await p2.locator('[data-teste="backup-exportar"], button:has-text("Exportar backup")').count() >= 1,
    'backup clássico deveria continuar');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('portabilidade', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
