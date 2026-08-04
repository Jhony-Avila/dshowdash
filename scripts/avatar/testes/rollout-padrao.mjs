// testes/rollout-padrao.mjs — rollout §650: SEM chave de flags no storage
// (usuário real de primeira visita), os PADRÕES do código valem — shell
// novo ABERTO, botão 3D presente, "Modo clássico" como saída §651 e as
// flags dev (HUD/telemetria) seguem OFF.
// @version 1.0.0  @created 2026-08-04
import { abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  // remove a chave DEPOIS do helper (init scripts rodam na ordem): este
  // teste vê exatamente o que um usuário sem localStorage vê
  init: () => { localStorage.removeItem('dshow.avst.flags.v1'); },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// shell NOVO por padrão (§650) + palco 3D disponível (opt-in no clique)
ok(await p.locator('.avst5-corpo').count() === 1, 'padrão deveria abrir o shell NOVO (§650)');
ok(await p.locator('[data-teste="botao-3d"]').count() === 1, 'botão 3D deveria existir por padrão');
// saída de emergência §651 continua a um clique
ok(await p.locator('button', { hasText: 'Modo clássico' }).count() >= 1, 'saída "Modo clássico" ausente');
// flags dev seguem OFF por padrão
ok(await p.locator('[data-teste="p3d-hud"]').count() === 0, 'HUD dev não deveria aparecer por padrão');
await p.keyboard.press('Control+k');
await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
await p.locator('[data-teste="paleta-comandos"] input').fill('telemetria');
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="paleta-comandos"] li button', { hasText: 'Telemetria' }).count() === 0,
  'viewer de telemetria não deveria existir por padrão');
await p.keyboard.press('Escape');

// o modo clássico segue FUNCIONAL como fallback (§651)
await p.locator('button', { hasText: 'Modo clássico' }).first().click();
await p.waitForTimeout(900);
ok(await p.locator('.avst-shell').count() === 1, 'Modo clássico não abriu como fallback');

const ok_ = relatorio('rollout-padrao', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
