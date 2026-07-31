// testes/palco-vivo.mjs — cenários estrelas/dojo + hora + clima (fila #37 item 4).
import { BASE, SAIDA, abrir, abrirAba3d, fotografarCanvas, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true });
await irParaHarness(p, 'avst-harness.html', 600);
await abrirAba3d(p); // carregamento do motor3d + GLBs no swiftshader

const chip = async (nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst-3d-chips button')].find((x) => x.textContent.trim() === n)?.click(); }, nome);
  await p.waitForTimeout(1600);
};
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
ok(await p.locator('canvas').count() >= 1, 'canvas 3D nao montou');

// dojo + entardecer + neve
await chip('Dojo');
await chip('Entardecer');
await chip('Neve');
await p.waitForTimeout(1200);
await fotografarCanvas(p, `${SAIDA}/pv1-dojo-entardecer-neve.png`);

// céu estrelado + noite + vagalumes
await chip('Céu estrelado');
await chip('Noite');
await chip('Vagalumes');
await p.waitForTimeout(1200);
await fotografarCanvas(p, `${SAIDA}/pv2-estrelas-noite-vagalumes.png`);

// grade + dia + chuva
await chip('Grade neon');
await chip('Dia');
await chip('Chuva');
await p.waitForTimeout(1200);
await fotografarCanvas(p, `${SAIDA}/pv3-grade-dia-chuva.png`);

const ok_ = relatorio('palco-vivo', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
