// testes/sockets-3d.mjs — leva 1 dos 14 sockets: 7 simultâneos + 3 rigs (decisão #41).
import { BASE, SAIDA, abrir, abrirAba3d, fotografarCanvas, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true });
await irParaHarness(p, 'avst-harness.html', 600);
await abrirAba3d(p);

// chip genérico (arquétipo/câmera) — 1º botão da página com o texto exato
const chip = async (nome, espera = 1200) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst-3d-chips button')].find((x) => x.textContent.trim() === n)?.click(); }, nome);
  await p.waitForTimeout(espera);
};
// chip DE SOCKET — mira a fileira certa (sockets persistem entre arquétipos
// e re-clicar um item equipado faz TOGGLE; aqui somos determinísticos)
const socketChip = async (rotulo, nome) => {
  await p.evaluate(({ r, n }) => {
    const fila = [...document.querySelectorAll('.avst-3d-socket')]
      .find((f) => f.querySelector('.avst-3d-socket-nome')?.textContent.trim() === r);
    [...(fila?.querySelectorAll('.avst-3d-chips button') ?? [])]
      .find((x) => x.textContent.trim() === n)?.click();
  }, { r: rotulo, n: nome });
  await p.waitForTimeout(1100);
};
const limparSockets = async () => {
  for (const r of ['Cabeça', 'Rosto', 'Pescoço', 'Costas', 'Mão direita', 'Companheiro', 'Pet']) {
    await socketChip(r, '—');
  }
};

const shot = (arquivo) => fotografarCanvas(p, arquivo);
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
ok(await p.locator('canvas').count() >= 1, 'canvas 3D nao montou');
ok(await p.locator('.avst-3d-socket').count() === 7, 'esperava 7 fileiras de socket');

// HUMANO frente: 7 sockets simultâneos (>=3 exigidos pela decisão #41)
await socketChip('Cabeça', 'Coroa Dourada');
await socketChip('Rosto', 'Óculos Neon');
await socketChip('Pescoço', 'Colar Estelar');
await socketChip('Costas', 'Jetpack');
await socketChip('Mão direita', 'Cetro Arcano');
await socketChip('Companheiro', 'Drone Fiel');
await socketChip('Pet', 'Bit (robô-pet)');
await p.waitForTimeout(1500);
await shot(`${SAIDA}/sk1-humano-7sockets.png`);

// HUMANO ¾: confere jetpack nas costas + cetro na mão
await chip('¾', 1800);
await shot(`${SAIDA}/sk1b-humano-tresquartos.png`);
await chip('Corpo', 1200);

// ANDROIDE: halo + asas + drone (rig diferente)
await limparSockets();
await chip('Androide', 6000);
await socketChip('Cabeça', 'Halo de Energia');
await socketChip('Costas', 'Asas de Energia');
await socketChip('Companheiro', 'Drone Fiel');
await p.waitForTimeout(1500);
await shot(`${SAIDA}/sk2-androide-halo-asas.png`);

// ANIMAL (pug): coroa + óculos + pet (rig menor, crânio gigante)
await limparSockets();
await chip('Animal', 6000);
await socketChip('Cabeça', 'Coroa Dourada');
await socketChip('Rosto', 'Óculos Neon');
await socketChip('Pet', 'Bit (robô-pet)');
await p.waitForTimeout(1500);
await shot(`${SAIDA}/sk3-pug-coroa-oculos.png`);

const ok_ = relatorio('sockets-3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
