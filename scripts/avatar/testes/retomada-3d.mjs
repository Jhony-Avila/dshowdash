// testes/retomada-3d.mjs — o Estúdio 3D reabre onde o usuário parou (fila #37).
// Prepara um harness derivado com config_3d_recente mockado (punk + 4 sockets
// + dojo/entardecer/neve/neon) e confere que a UI reabre com os chips certos.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SAIDA, abrir, abrirAba3d, fotografarCanvas, irParaHarness, relatorio } from './navegador.mjs';

// harness derivado: injeta o 3D salvo no mock do GET (o gerado tem null)
const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const base = readFileSync(resolve(RAIZ, 'public', 'avst-harness.html'), 'utf8');
const MOCK = `{ formato: '3d', arquetipo: 'humano', roupa: 'punk', cabeca: 'casual', mochila: false, sockets: { head: 'soc_coroa', face: 'soc_oculos_neon', back: 'soc_jetpack', pet: 'soc_pet_bit' }, cores: { pele: '#c68642', cabelo: '#7c5cff', roupa: '#ff5230', detalhe: '#ffd98a' }, material: { metal: 0.6, brilho: 0.7 }, morfos: { bravo: 0, surpreso: 0, triste: 0 }, iluminacao: 'neon', cenario: 'dojo', hora: 'entardecer', clima: 'neve', camera: 'corpo' }`;
if (!base.includes('config_3d_recente: null')) {
  console.error('[retomada-3d] harness base sem config_3d_recente — regenere com gerar-harness.mjs');
  process.exit(1);
}
writeFileSync(resolve(RAIZ, 'public', 'avst-harness-retomada.html'),
  base.replaceAll('config_3d_recente: null', `config_3d_recente: ${MOCK}`)); // onda 1423: mock studio.php tem 2 ramos (seed avst.harness.config)

const { navegador: b, pagina: p, erros } = await abrir({ webgl: true });
await irParaHarness(p, 'avst-harness-retomada.html', 600);
await abrirAba3d(p);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const ligados = await p.evaluate(() =>
  [...document.querySelectorAll('.avst-3d-chips button')]
    .filter((x) => x.className.includes('avst-3d-chip-on'))
    .map((x) => x.textContent.trim()));
for (const esperado of ['Punk', 'Coroa Dourada', 'Óculos Neon', 'Jetpack', 'Bit (robô-pet)', 'Neon', 'Dojo', 'Entardecer', 'Neve']) {
  ok(ligados.includes(esperado), `chip '${esperado}' deveria estar ligado (retomada)`);
}
ok(ligados.filter((t) => t === '—').length === 3, 'esperava 3 sockets vazios em —');
await fotografarCanvas(p, `${SAIDA}/rt1-retomada.png`);

const ok_ = relatorio('retomada-3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
