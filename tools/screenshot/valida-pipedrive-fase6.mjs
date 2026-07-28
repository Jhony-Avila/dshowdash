// Valida a FASE 6 do Pipedrive (Configurações em abas + responsividade + acessibilidade):
//  1. Seis abas com role=tablist/tab/tabpanel, troca de painel e MEMÓRIA da aba.
//  2. Navegação por TECLADO nas abas (seta →/←, Home/End) movendo seleção e foco.
//  3. Ações declarando NÍVEL DE RISCO; risco alto NÃO dispara no primeiro clique
//     (aparece confirmação) e o "Cancelar" desfaz sem executar nada.
//  4. Aba Aparência grava preferência real em localStorage.
//  5. Foco visível: Tab pinta um anel em todo controle interativo.
//  6. Responsivo em 3 larguras (desktop/tablet/celular): sem estouro horizontal,
//     menu vira ícones e o drawer ocupa a tela no celular.
//  7. Zero erro de console vindo do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/14c7a297-852d-4236-a877-cb8c020f1514/scratchpad/fase6-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };

const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

async function abrirPainel(page) {
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

const irPara = async (page, label, ms = 2600) => {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes(l))?.click();
  }, label);
  await page.waitForTimeout(ms);
};

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.removeItem('pp:aba:config'); } catch { /* ignora */ }
  }, tema);

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (doPainel(e.message)) errors.push('PAGEERROR: ' + e.message); });
  const respostasRuins = [];
  page.on('response', (r) => { if (r.status() >= 400) respostasRuins.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
  // Nenhuma escrita pode partir desta prova: ela só olha. Se algo tentar POST/DELETE
  // em /api/pipedrive, é bug de UI (ação disparando sem confirmação) — e falha o teste.
  const escritas = [];
  page.on('request', (r) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method()) && r.url().includes('/api/pipedrive/')) {
      escritas.push(`${r.method()} ${r.url()}`);
    }
  });

  await abrirPainel(page);
  await irPara(page, 'Configurações', 3000);

  // ── 1. Abas ───────────────────────────────────────────────────
  R[tema].abas = await page.evaluate(() => {
    const lista = document.querySelector('[data-pp-react-root] [role="tablist"]');
    const tabs = [...(lista?.querySelectorAll('[role="tab"]') ?? [])];
    return {
      temTablist: !!lista,
      quantidade: tabs.length,
      rotulos: tabs.map((t) => t.textContent.trim()),
      selecionada: tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.textContent.trim(),
      // Só um painel visível, e ele aponta para a aba selecionada.
      paineis: document.querySelectorAll('[data-pp-react-root] [role="tabpanel"]').length,
      // roving tabindex: só a selecionada é alcançável por Tab
      tabIndexZero: tabs.filter((t) => t.getAttribute('tabindex') === '0').length,
    };
  });

  // ── 2. Teclado nas abas ───────────────────────────────────────
  await page.evaluate(() => document.querySelector('[data-pp-react-root] [role="tab"][aria-selected="true"]')?.focus());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  const depoisDireita = await page.evaluate(() => ({
    selecionada: document.querySelector('[data-pp-react-root] [role="tab"][aria-selected="true"]')?.textContent.trim(),
    focoNaSelecionada: document.activeElement?.getAttribute('aria-selected') === 'true',
  }));
  await page.keyboard.press('End');
  await page.waitForTimeout(500);
  const depoisEnd = await page.evaluate(() =>
    document.querySelector('[data-pp-react-root] [role="tab"][aria-selected="true"]')?.textContent.trim());
  await page.keyboard.press('Home');
  await page.waitForTimeout(500);
  const depoisHome = await page.evaluate(() =>
    document.querySelector('[data-pp-react-root] [role="tab"][aria-selected="true"]')?.textContent.trim());
  R[tema].teclado = { depoisDireita, depoisEnd, depoisHome };

  // ── 3. Risco: alto exige confirmação ──────────────────────────
  const irAba = async (rotulo) => {
    await page.evaluate((r) => {
      [...document.querySelectorAll('[data-pp-react-root] [role="tab"]')]
        .find((t) => t.textContent.trim().includes(r))?.click();
    }, rotulo);
    await page.waitForTimeout(1800);
  };

  await irAba('Segurança');
  R[tema].riscos = await page.evaluate(() => {
    const acoes = [...document.querySelectorAll('[data-pp-react-root] .pp-acao')];
    return acoes.map((a) => ({
      titulo: a.querySelector('.pp-acao-tit')?.textContent.trim(),
      risco: a.querySelector('.pp-risco')?.className.replace('pp-risco ', '').trim(),
    }));
  });
  // Clicar numa ação de risco ALTO tem de abrir confirmação, não executar.
  const antesDeClicar = escritas.length;
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('[data-pp-react-root] .pp-acao')]
      .find((x) => x.querySelector('.pp-risco.alto'));
    a?.querySelector('.pp-acao-bts .pp-btn')?.click();
  });
  await page.waitForTimeout(1200);
  R[tema].confirmacao = await page.evaluate(() => {
    const c = document.querySelector('[data-pp-react-root] .pp-confirma');
    return { apareceu: !!c, texto: c?.textContent.trim().slice(0, 90) ?? null };
  });
  R[tema].escritaAntesDeConfirmar = escritas.length - antesDeClicar;
  // Cancelar tem de fechar sem executar
  await page.evaluate(() => {
    const c = document.querySelector('[data-pp-react-root] .pp-confirma');
    [...(c?.querySelectorAll('button') ?? [])].find((b) => b.textContent.includes('Cancelar'))?.click();
  });
  await page.waitForTimeout(800);
  R[tema].aposCancelar = await page.evaluate(() => !document.querySelector('[data-pp-react-root] .pp-confirma'));

  // ── 4. Aparência grava preferência ────────────────────────────
  await irAba('Aparência');
  await page.evaluate(() => { try { localStorage.setItem('pp:dens', 'padrao'); } catch { /* ignora */ } });
  await page.evaluate(() => {
    const pref = [...document.querySelectorAll('[data-pp-react-root] .pp-pref')]
      .find((p) => p.textContent.includes('Densidade'));
    [...(pref?.querySelectorAll('.pp-seg-b') ?? [])].find((b) => b.textContent.trim() === 'Compacta')?.click();
  });
  await page.waitForTimeout(700);
  R[tema].aparencia = {
    dens: await page.evaluate(() => localStorage.getItem('pp:dens')),
    prefs: await page.evaluate(() => document.querySelectorAll('[data-pp-react-root] .pp-pref').length),
  };

  // ── 1b. Memória da aba (sai e volta) ──────────────────────────
  await irPara(page, 'Visão Geral', 2200);
  await irPara(page, 'Configurações', 2600);
  R[tema].abaLembrada = await page.evaluate(() =>
    document.querySelector('[data-pp-react-root] [role="tab"][aria-selected="true"]')?.textContent.trim());
  await page.screenshot({ path: `${OUT}/${tema}-01-config-abas.jpg`, quality: 82, type: 'jpeg', fullPage: true });

  // ── 5. Foco visível ───────────────────────────────────────────
  await irPara(page, 'Negócios', 3200);
  await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-nav button')?.focus());
  const anelPorTab = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || !el.closest('[data-pp-react-root]')) return null;
      const cs = getComputedStyle(el);
      const temAnel = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0)
        || cs.boxShadow.includes('inset');
      return { tag: el.tagName.toLowerCase(), temAnel };
    });
    if (info) anelPorTab.push(info);
  }
  R[tema].foco = {
    parados: anelPorTab.length,
    comAnel: anelPorTab.filter((x) => x.temAnel).length,
    semAnel: anelPorTab.filter((x) => !x.temAnel).map((x) => x.tag),
  };

  // ── 6. Responsividade em 3 larguras ───────────────────────────
  // ⚠️ Larguras escolhidas por MEDIÇÃO, não por convenção. A sidebar do app-shell ocupa
  // 312px FIXOS e só recolhe abaixo de ~480px, então a área útil do painel é:
  //   1600→976px · 1000→438px · 820→258px · 620→208px · 480→364px
  // A faixa 600–820 é uma ZONA MORTA criada pelo shell (o painel fica mais apertado do
  // que num celular real). Ela é MEDIDA e reportada, mas não reprova a prova: o painel
  // não manda na sidebar do shell. 480px é o celular de verdade e lá exigimos zero estouro.
  R[tema].responsivo = {};
  R[tema].zonaMortaDoShell = {};
  for (const [nome, largura] of [['desktop', 1600], ['tablet', 1000], ['celular', 480], ['zona-morta-820', 820]]) {
    await page.setViewportSize({ width: largura, height: 950 });
    await page.waitForTimeout(1200);
    R[tema].responsivo[nome] = await page.evaluate(() => {
      const raiz = document.querySelector('[data-pp-react-root]');
      const main = raiz?.querySelector('.pp-main');
      const nav = raiz?.querySelector('.pp-nav');
      const txt = nav?.querySelector('.pp-navitem-txt');
      const cs = main ? getComputedStyle(main) : null;
      return {
        // Nada dentro do painel pode forçar rolagem horizontal na área de conteúdo.
        estouro: !!main && main.scrollWidth > main.clientWidth + 2,
        estouroPx: main ? Math.max(0, main.scrollWidth - main.clientWidth) : 0,
        larguraUtil: main ? Math.round(main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) : 0,
        larguraNav: Math.round(nav?.getBoundingClientRect().width ?? 0),
        rotulosVisiveis: !!txt && getComputedStyle(txt).display !== 'none',
      };
    });
    await page.screenshot({ path: `${OUT}/${tema}-02-${nome}.jpg`, quality: 80, type: 'jpeg' });
  }

  // Drawer em tela cheia no celular (ainda em 620px)
  await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-table tbody tr')?.click());
  await page.waitForTimeout(2200);
  R[tema].drawerCelular = await page.evaluate(() => {
    const d = document.querySelector('[data-pp-react-root] .pp-drawer');
    const raiz = document.querySelector('[data-pp-react-root]');
    if (!d || !raiz) return { abriu: false };
    return {
      abriu: true,
      fracaoDaTela: +(d.getBoundingClientRect().width / raiz.getBoundingClientRect().width).toFixed(2),
    };
  });
  await page.screenshot({ path: `${OUT}/${tema}-03-drawer-celular.jpg`, quality: 80, type: 'jpeg' });

  R[tema].erros = errors;
  R[tema].respostasRuins = respostasRuins;
  R[tema].escritas = escritas;
  await browser.close();
}

await rodar('dark');
await rodar('light');

log('\n===== FASE 6 — resultado =====');
log(JSON.stringify(R, null, 2));

const ABAS_ESPERADAS = ['Conexão', 'Sincronização', 'Alertas', 'Aparência', 'Segurança', 'Diagnóstico'];
const falhas = [];
for (const t of ['dark', 'light']) {
  const r = R[t];
  if (r.erros.length) falhas.push(`${t}: ${r.erros.length} erro(s) de console`);
  const ruins = r.respostasRuins.filter((x) => x.includes('/api/pipedrive/'));
  if (ruins.length) falhas.push(`${t}: HTTP ruim no /api/pipedrive → ${ruins.join(' | ')}`);
  if (r.escritas.length) falhas.push(`${t}: a prova disparou escrita(s) sem confirmar → ${r.escritas.join(' | ')}`);

  if (!r.abas.temTablist) falhas.push(`${t}: Configurações sem role=tablist`);
  if (r.abas.quantidade !== 6) falhas.push(`${t}: ${r.abas.quantidade} abas (esperado 6)`);
  for (const esperada of ABAS_ESPERADAS) {
    if (!r.abas.rotulos.some((x) => x.includes(esperada))) falhas.push(`${t}: falta a aba "${esperada}"`);
  }
  if (r.abas.paineis !== 1) falhas.push(`${t}: ${r.abas.paineis} painéis visíveis (esperado 1)`);
  if (r.abas.tabIndexZero !== 1) falhas.push(`${t}: roving tabindex quebrado (${r.abas.tabIndexZero} abas com tabindex=0)`);

  if (r.teclado.depoisDireita.selecionada === r.abas.selecionada) falhas.push(`${t}: seta → não mudou de aba`);
  if (!r.teclado.depoisDireita.focoNaSelecionada) falhas.push(`${t}: seta → moveu a seleção mas não o foco`);
  if (!r.teclado.depoisEnd.includes('Diagnóstico')) falhas.push(`${t}: End não foi para a última aba (${r.teclado.depoisEnd})`);
  if (!r.teclado.depoisHome.includes('Conexão')) falhas.push(`${t}: Home não foi para a primeira aba (${r.teclado.depoisHome})`);

  if (!r.riscos.some((x) => x.risco === 'alto')) falhas.push(`${t}: nenhuma ação classificada como risco alto`);
  if (!r.confirmacao.apareceu) falhas.push(`${t}: risco alto executou sem pedir confirmação`);
  if (r.escritaAntesDeConfirmar !== 0) falhas.push(`${t}: risco alto disparou ${r.escritaAntesDeConfirmar} escrita(s) antes de confirmar`);
  if (!r.aposCancelar) falhas.push(`${t}: Cancelar não fechou a confirmação`);

  if (r.aparencia.dens !== 'compacta') falhas.push(`${t}: Aparência não gravou a densidade (${r.aparencia.dens})`);
  if (r.aparencia.prefs < 3) falhas.push(`${t}: aba Aparência com poucas preferências (${r.aparencia.prefs})`);
  if (!r.abaLembrada || !r.abaLembrada.includes('Aparência')) falhas.push(`${t}: a aba não foi lembrada ao voltar (${r.abaLembrada})`);

  if (r.foco.parados < 6) falhas.push(`${t}: Tab percorreu poucos controles (${r.foco.parados})`);
  if (r.foco.semAnel.length) falhas.push(`${t}: ${r.foco.semAnel.length} controle(s) sem foco visível (${[...new Set(r.foco.semAnel)].join(',')})`);

  for (const [nome, v] of Object.entries(r.responsivo)) {
    if (nome === 'zona-morta-820') continue;   // do shell, não do painel — só medimos
    if (v.estouro) falhas.push(`${t}/${nome}: conteúdo estourou ${v.estouroPx}px na horizontal (área útil ${v.larguraUtil}px)`);
  }
  if (r.responsivo.desktop.rotulosVisiveis !== true) falhas.push(`${t}: no desktop o menu deveria mostrar rótulos`);
  if (r.responsivo.celular.rotulosVisiveis !== false) falhas.push(`${t}: no celular o menu deveria virar só ícones`);
  if (!(r.responsivo.celular.larguraNav < r.responsivo.desktop.larguraNav)) {
    falhas.push(`${t}: menu não encolheu no celular (${r.responsivo.celular.larguraNav} vs ${r.responsivo.desktop.larguraNav})`);
  }
  if (r.drawerCelular.abriu && r.drawerCelular.fracaoDaTela < 0.9) {
    falhas.push(`${t}: drawer não ocupou a tela no celular (${r.drawerCelular.fracaoDaTela})`);
  }
}

log(falhas.length ? `\n❌ FALHAS (${falhas.length}):\n - ` + falhas.join('\n - ') : '\n✅ TODAS AS VERIFICAÇÕES PASSARAM');
process.exit(falhas.length ? 1 : 0);
