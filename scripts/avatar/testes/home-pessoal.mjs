// testes/home-pessoal.mjs — Home §23 (notas/links) + §24 (favoritos/recentes) + §45 (cenários QA).
import { BASE, SAIDA, abrir, abrirAba3d, fotografarCanvas, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1440, height: 1400 }, webgl: false, init: () => {
  if (sessionStorage.getItem('ger-seeded')) return; // reload NÃO re-semeia
  sessionStorage.setItem('ger-seeded', '1');
  localStorage.setItem('dshow.home.favoritos.v1', JSON.stringify(['pipedrive']));
  localStorage.setItem('dshow.home.recentes.v1', JSON.stringify([
    { rota: '#/panel-mercadolivre/pedidos', quando: new Date(Date.now() - 300000).toISOString() },
    { rota: '#/panel-ads', quando: new Date(Date.now() - 3600000).toISOString() },
  ]));
  localStorage.setItem('dshow.home.notas.v1', JSON.stringify('Ligar para o fornecedor às 15h'));
  localStorage.setItem('dshow.home.links.v1', JSON.stringify([{ id: 'lk1', nome: 'Planilha de metas', url: 'https://docs.google.com/x' }]));
} });
await irParaHarness(p, 'ger-harness.html', 1500);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// §24 — favorito vem primeiro e estrela marcada
const primeiroAtalho = await p.locator('.ger-atalho-wrap .ger-atalho').first().textContent();
ok(primeiroAtalho?.includes('Pipedrive'), `favorito deveria vir 1º (veio: ${primeiroAtalho})`);
ok(await p.locator('.ger-fav.is-on').count() === 1, 'esperava 1 estrela ligada');

// §24 — recentes visíveis com nome resolvido
const recentes = await p.locator('.ger-recente').allTextContents();
ok(recentes.some((t) => t.includes('Mercado Livre')), 'recente Mercado Livre ausente');
ok(recentes.some((t) => t.includes('Ads Intelligence')), 'recente Ads ausente');

// §24 — favoritar outro módulo ao vivo
await p.locator('.ger-atalho-wrap:nth-child(3) .ger-fav').click();
await p.waitForTimeout(300);
ok(await p.locator('.ger-fav.is-on').count() === 2, 'favoritar ao vivo falhou');

// §23 — notas restauradas + link semeado
ok((await p.locator('.ger-notas').inputValue()).includes('fornecedor'), 'notas não restauraram');
ok((await p.locator('.ger-link-chip').count()) === 1, 'link semeado ausente');

// §23 — adicionar link válido e rejeitar inválido
await p.locator('.ger-links-form input').first().fill('Painel interno');
await p.locator('.ger-links-form input').nth(1).fill('https://intranet.dshow.com.br');
await p.locator('.ger-links-form button').click();
await p.waitForTimeout(300);
ok(await p.locator('.ger-link-chip').count() === 2, 'adicionar link falhou');
await p.locator('.ger-links-form input').first().fill('Ruim');
await p.locator('.ger-links-form input').nth(1).fill('javascript:alert(1)');
await p.locator('.ger-links-form button').click();
await p.waitForTimeout(300);
ok(await p.locator('.ger-link-chip').count() === 2, 'URL javascript: deveria ser rejeitada');
ok(await p.locator('.ger-links-erro').count() === 1, 'erro de validação não apareceu');

// §23 — notas com autosave (digita, espera, recarrega)
await p.locator('.ger-notas').fill('Persistência ok 123');
await p.waitForTimeout(900);

// screenshot do estado normal
await p.screenshot({ path: `${SAIDA}/hp1-dashboard-pessoal.png`, fullPage: false });

// §45 — 5 cliques no título → cenário vazio; badge aparece
for (let i = 0; i < 5; i++) await p.locator('.ger-controles-tit').click({ delay: 40 });
await p.waitForTimeout(1800);
ok((await p.locator('.ger-cenario').textContent())?.includes('vazio'), 'badge QA:vazio não apareceu');
ok((await p.locator('text=Nenhum alerta crítico').count()) === 1, 'cenário vazio deveria zerar alertas');

// badge → crítico; alertas sev-1 extras aparecem
await p.locator('.ger-cenario').click();
await p.waitForTimeout(1800);
ok((await p.locator('.ger-cenario').textContent())?.includes('critico'), 'badge QA:critico não apareceu');
ok(await p.locator('.ger-alerta.ger-prio-1').count() >= 3, 'cenário crítico deveria ter ≥3 alertas sev-1');
await p.screenshot({ path: `${SAIDA}/hp2-cenario-critico.png`, fullPage: false });

// badge → padrão; badge some
await p.locator('.ger-cenario').click();
await p.waitForTimeout(800);
ok(await p.locator('.ger-cenario').count() === 0, 'voltar ao padrão deveria esconder o badge');

// reload: notas autosalvas + link novo persistem
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p.waitForTimeout(1200);
ok((await p.locator('.ger-notas').inputValue()).includes('Persistência ok 123'), 'autosave das notas falhou no reload');
ok(await p.locator('.ger-link-chip').count() === 2, 'links não persistiram no reload');
ok(await p.locator('.ger-fav.is-on').count() === 2, 'favoritos não persistiram no reload');

const ok_ = relatorio('home-pessoal', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
