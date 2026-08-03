// testes/pipeline3d.test.mjs — PIPELINE 3D ponta a ponta (AS5 F5, mega 5).
// @version 1.0.0  @created 2026-08-03
// manequim → publicar (§461/§478/§517) → thumbs §508 (navegador) →
// validador §487 APROVADO → SQL §614 determinístico → corrupção reprova.
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gerarManequim } from '../assets3d/gerar-manequim.mjs';
import { publicarAsset } from '../assets3d/publicar-asset.mjs';
import { gerarThumbs } from '../assets3d/gerar-thumbs-3d.mjs';
import { validarAsset } from '../assets3d/validar-asset.mjs';
import { gerarRegistroSql } from '../assets3d/gerar-registro-sql.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const dir = mkdtempSync(join(tmpdir(), 'avst-pipe3d-'));

try {
  // 1. manequim DENSO (46k tri — os dois simplify trabalham)
  const fonte = join(dir, 'manequim.glb');
  const m = await gerarManequim(fonte, { denso: true });
  ok(m.triangulos > 25_000, `manequim denso deveria passar de 25k tri (${m.triangulos})`);
  ok(m.bones === 16, `esperava 16 bones (${m.bones})`);

  // 2. publica — LODs dentro do gate §631, manifest íntegro
  const pasta = join(dir, 'publicado');
  const { medidas, manifest } = await publicarAsset({
    fonte, saida: pasta, id: 'manequim_dev',
    origem: 'manequim-procedural',
    comprovante: 'scripts/avatar/assets3d/gerar-manequim.mjs',
    data: '2026-08-03', log: () => {},
  });
  ok(medidas.lod1 <= 25_000 && medidas.lod1 > 8_000, `lod1 fora da faixa (${medidas.lod1})`);
  ok(medidas.lod2 <= 8_000, `lod2 acima do gate (${medidas.lod2})`);
  ok(manifest.hashes.lod0.startsWith('sha256:'), 'hash do manifest sem prefixo sha256');

  // 3. thumbs §508 no navegador (porta própria p/ não colidir com a suíte)
  await gerarThumbs(pasta, { porta: 8909 });
  ok(statSync(join(pasta, 'preview.webp')).size > 1500, 'preview.webp suspeito de vazio');
  ok(statSync(join(pasta, 'thumb.webp')).size > 400, 'thumb.webp suspeito de vazio');

  // 4. validador §487 aprova a pasta COMPLETA
  const r = validarAsset(pasta, { rigCanonico: [] });
  ok(r.aprovado, `pasta completa reprovou: ${r.erros.join(' | ')}`);
  ok(r.medidas.bones === 16, 'validador não enxergou os 16 bones');

  // 5. SQL §614: estrutura certa + DETERMINÍSTICO (duas gerações idênticas)
  const sql1 = gerarRegistroSql(pasta);
  const sql2 = gerarRegistroSql(pasta);
  ok(sql1 === sql2, 'SQL de registro não é determinístico');
  ok(sql1.includes('START TRANSACTION;') && sql1.includes('COMMIT;'), 'SQL sem transação');
  ok((sql1.match(/@versao_id, '(model|thumbnail|preview)'/g) ?? []).length === 5,
    'SQL deveria registrar exatamente 5 arquivos (3 modelos + thumb + preview)');
  const sqlSemComentarios = sql1.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');
  ok(sql1.includes("`key` = 'manequim_dev'") && !sqlSemComentarios.includes('NOW()'),
    'SQL sem a key do asset ou com NOW() fora de comentário (quebraria o determinismo)');

  // 6. corrupção: lod2 trocado → hash não confere → REPROVA e o SQL recusa
  writeFileSync(join(pasta, 'modelo.lod2.glb'), readFileSync(join(pasta, 'modelo.lod1.glb')));
  const rCorrompido = validarAsset(pasta, { rigCanonico: [] });
  ok(!rCorrompido.aprovado && rCorrompido.erros.some((e) => e.includes('lod2')),
    'corrupção do lod2 não reprovou');
  let recusou = false;
  try { gerarRegistroSql(pasta); } catch { recusou = true; }
  ok(recusou, 'gerarRegistroSql deveria RECUSAR pasta reprovada no §487');
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`[pipeline3d] FALHAS: ${falhas.length ? falhas.join(' || ') : 'nenhuma'}`);
process.exit(falhas.length ? 1 : 0);
