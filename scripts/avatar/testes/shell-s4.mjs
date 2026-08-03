// testes/shell-s4.mjs — AS5 F2 S4: modos foco/studio, responsivo e R12 integral.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const avatarVisivel = () => p.locator('.avst5-palco svg').isVisible();

// R7: tecla F entra no foco — painéis somem, avatar segue visível (R12)
await p.keyboard.press('f');
await p.waitForTimeout(500);
ok(await p.locator('.avst5-shell[data-modo="foco"]').count() === 1, 'F não ativou o foco');
ok(await p.locator('.avst5-sidebar').isHidden(), 'sidebar deveria sumir no foco');
ok(await avatarVisivel(), 'R12: avatar sumiu no modo foco');
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
ok(await p.locator('.avst5-shell[data-modo="edicao"]').count() === 1, 'Esc não voltou à edição');

// R8: modo studio — painéis/barra ocultos, selo do título quando houver, sair volta
await p.locator('.avst5-header-acoes button[title^="Modo Studio"]').click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-shell[data-modo="studio"]').count() === 1, 'Studio não ativou');
ok(await p.locator('.avst5-salvar').isHidden(), 'barra deveria sumir no Studio');
ok(await avatarVisivel(), 'R12: avatar sumiu no Studio');
await p.screenshot({ path: `${SAIDA}/s4-studio.png` });
await p.locator('.avst5-sair-modo').click();
await p.waitForTimeout(400);
ok(await p.locator('.avst5-shell[data-modo="edicao"]').count() === 1, 'Sair do Studio falhou');

// R9: responsivo — em 900px o painel vira drawer com botão flutuante
await p.setViewportSize({ width: 900, height: 800 });
await p.waitForTimeout(600);
ok(await p.locator('.avst5-drawer-abrir').isVisible(), 'botão do drawer não apareceu <1024px');
await p.locator('.avst5-painel-btn[title="Recolher catálogo"]').click().catch(() => {});
await p.waitForTimeout(300);
await p.locator('.avst5-drawer-abrir').click();
await p.waitForTimeout(500);
ok(await p.locator('.avst5-abas').isVisible(), 'drawer não abriu o catálogo');
ok(await avatarVisivel(), 'R12: avatar sumiu no mobile com drawer');
await p.screenshot({ path: `${SAIDA}/s4-drawer.png` });

// R10: aba Favoritos vazia mostra estado vazio com orientação
await p.locator('.avst5-abas button', { hasText: 'Favoritos' }).click();
await p.waitForTimeout(500);
ok((await p.locator('.avst5-painel .avst-grade-vazia').count()) === 1, 'estado vazio de Favoritos ausente');

const ok_ = relatorio('shell-s4', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
