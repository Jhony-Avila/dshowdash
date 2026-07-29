// COLUNAS DE CAMPOS PERSONALIZADOS (#11) — prova da UI, com dado REAL de produção.
//
// A lógica de banco tem prova própria em `valida-pipedrive-cf-colunas.php` (42 checagens:
// separação personalizado/nativo, validação do cf=, resolução de enum/set, cobertura por
// JSON_TYPE). Aqui o que se prova é o que o usuário vê e faz, em dark e light:
//
//   1. o seletor de colunas ganha a seção "Campos personalizados" com a COBERTURA à vista —
//      é ela que impede adicionar uma coluna vazia (11 dos 26 campos ficam abaixo de 1%);
//   2. marcar um campo faz nascer a coluna, com o NOME do campo no cabeçalho e VALOR
//      resolvido nas células (rótulo, não id) — e a requisição leva cf=;
//   3. a coluna personalizada NÃO é ordenável: clicar no cabeçalho não muda a ordenação.
//      Ordenar por ela seria ORDER BY sobre JSON_EXTRACT sem índice em 20 mil linhas;
//   4. desmarcar remove a coluna e PARA de mandar cf= (quem não usa não paga o JSON);
//   5. a escolha sobrevive a sair e voltar da tela (persistida junto das colunas);
//   6. o CSV exportado inclui a coluna com o valor resolvido;
//   7. Atividades NÃO oferece a seção — não tem campo personalizado nenhum e sua coluna
//      custom_fields está 0% preenchida. Ausência declarada, não bug;
//   8. sem estouro horizontal em 1600 e 480, e 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/2969597e-35bb-482d-aedf-a6e7fd41d9e3/scratchpad/cf-shots';
const log = (...a) => console.log(...a);
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

let ok = 0, fail = 0;
function checa(rotulo, cond, detalhe = '') {
  if (cond) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
}

// ⚠️ isLoginPage() só checa PRESENÇA do form no DOM; numa aba autenticada ele continua
// lá, oculto. Decidir por VISIBILIDADE (ver memória repro-boot-autenticado).
const precisaLogar = async (page) =>
  (await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false);

async function abrirTela(page, label) {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.trim() === l)?.click();
  }, label);
  await page.waitForTimeout(2600);
}

async function abrirPainel(page) {
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await precisaLogar(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const t = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (t) await t.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(1500);
}

const abrirMenuColunas = async (page) => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-pp-react-root] .pp-toolbar button')]
      .find((x) => /colunas/i.test(x.getAttribute('title') ?? '') || /colunas/i.test(x.textContent ?? ''));
    b?.click();
  });
  await page.waitForTimeout(700);
};

/** Lê a seção "Campos personalizados" do popover. */
const lerSecaoCf = (page) => page.evaluate(() => {
  const menu = document.querySelector('[data-pp-react-root] .pp-colmenu');
  if (!menu) return null;
  const cabs = [...menu.querySelectorAll('.pp-colmenu-h')].map((h) => h.textContent.trim());
  const idx = [...menu.children].findIndex((el) => el.classList?.contains('pp-colmenu-h') && /Campos personalizados/i.test(el.textContent));
  if (idx < 0) return { cabecalhos: cabs, temSecao: false, itens: [] };
  const itens = [];
  for (let i = idx + 1; i < menu.children.length; i++) {
    const el = menu.children[i];
    if (el.classList?.contains('pp-colmenu-h')) break;
    const lab = el.querySelector('label');
    if (!lab) { itens.push({ nota: el.textContent.trim() }); continue; }
    itens.push({
      nome: lab.textContent.trim(),
      marcado: !!lab.querySelector('input')?.checked,
      cobertura: el.querySelector('.pp-colmenu-mv')?.textContent.trim() ?? null,
    });
  }
  return { cabecalhos: cabs, temSecao: true, itens };
});

const marcarCf = (page, nome) => page.evaluate((n) => {
  const menu = document.querySelector('[data-pp-react-root] .pp-colmenu');
  const alvo = [...menu.querySelectorAll('.pp-colmenu-item label')].find((l) => l.textContent.trim() === n);
  alvo?.querySelector('input')?.click();
}, nome);

const fecharMenu = async (page) => {
  await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-colmenu-bg')?.click());
  await page.waitForTimeout(1600);
};

/** Cabeçalhos e uma amostra de células da coluna pedida. */
const lerColuna = (page, nome) => page.evaluate((n) => {
  const wrap = document.querySelector('[data-pp-react-root] .pp-gridwrap');
  const ths = [...wrap.querySelectorAll('thead th')].map((t) => t.textContent.trim());
  const i = ths.findIndex((t) => t === n || t.startsWith(n));
  if (i < 0) return { cabecalhos: ths, achou: false };
  const celulas = [...wrap.querySelectorAll('tbody tr')]
    .filter((tr) => !tr.querySelector('td[colspan]'))
    .map((tr) => tr.children[i]?.textContent.trim() ?? '')
    .filter((x) => x !== '');
  return { cabecalhos: ths, achou: true, indice: i, celulas, comValor: celulas.filter((c) => c !== '—').length };
}, nome);

async function rodar(tema) {
  const browser = await chromium.launch({
    args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--no-sandbox'],
  });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  // Estado limpo: colunas do grid de negócios são persistidas em localStorage.
  await ctx.addInitScript(() => {
    try { Object.keys(localStorage).filter((k) => k.startsWith('pp:cols:')).forEach((k) => localStorage.removeItem(k)); } catch { /* */ }
  });
  const cookies = await getSessionCookies();
  if (cookies?.length) await ctx.addCookies(cookies);

  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));

  const pedidos = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/\/api\/pipedrive\/deals\?/.test(u)) pedidos.push(new URL(u).searchParams.get('cf'));
  });

  log(`\n===== TEMA ${tema.toUpperCase()} =====`);
  await abrirPainel(page);
  await abrirTela(page, 'Negócios');

  // ── 1. A seção existe e mostra cobertura ────────────────────────
  await abrirMenuColunas(page);
  const sec = await lerSecaoCf(page);
  checa('1 seletor tem seção de campos personalizados', sec?.temSecao === true, (sec?.cabecalhos ?? []).join(' | '));
  const campos = (sec?.itens ?? []).filter((i) => i.nome);
  checa('2 lista os campos personalizados', campos.length >= 20, `${campos.length} campos`);
  checa('3 todos trazem a cobertura', campos.every((c) => c.cobertura), campos.slice(0, 3).map((c) => `${c.nome}=${c.cobertura}`).join(' · '));
  checa('4 ordenado do mais preenchido para o menos',
    (() => {
      const n = (s) => (s === '<1%' ? 0 : Number(String(s).replace('%', '')));
      return campos.every((c, i) => i === 0 || n(campos[i - 1].cobertura) >= n(c.cobertura));
    })(), campos.map((c) => c.cobertura).slice(0, 6).join(' ≥ '));
  checa('5 campos quase vazios são sinalizados (<1%)', campos.some((c) => c.cobertura === '<1%'));
  // A trap do #31: se a cobertura fosse por JSON_LENGTH, tudo daria 100%.
  checa('6 nenhum campo aparece com 100% (sintoma do JSON_LENGTH)', !campos.some((c) => c.cobertura === '100%'));
  await page.screenshot({ path: `${OUT}/${tema}-1-seletor.png` });

  // ── 2. Marcar cria a coluna com valor resolvido ─────────────────
  const alvo = campos[0].nome;
  await marcarCf(page, alvo);
  await fecharMenu(page);
  const col = await lerColuna(page, alvo);
  checa(`7 a coluna "${alvo}" apareceu`, col.achou === true, (col.cabecalhos ?? []).join(' | ').slice(0, 110));
  checa('8 as células trazem valor', (col.comValor ?? 0) > 0, `${col.comValor}/${col.celulas?.length} preenchidas`);
  checa('9 valor é rótulo, não id cru',
    (col.celulas ?? []).filter((c) => c !== '—').every((c) => !/^\d+(,\s*\d+)*$/.test(c)),
    'ex.: ' + (col.celulas ?? []).filter((c) => c !== '—')[0]);
  checa('10 a requisição levou cf=', pedidos.some((c) => c && c.length === 40), `último cf=${String(pedidos[pedidos.length - 1]).slice(0, 12)}…`);
  await page.screenshot({ path: `${OUT}/${tema}-2-coluna.png` });

  // ── 3. Não é ordenável ──────────────────────────────────────────
  const antes = await page.evaluate(() => {
    const wrap = document.querySelector('[data-pp-react-root] .pp-gridwrap');
    return [...wrap.querySelectorAll('tbody tr')].slice(0, 3).map((tr) => tr.children[1]?.textContent.trim()).join('|');
  });
  await page.evaluate((i) => {
    const th = document.querySelectorAll('[data-pp-react-root] .pp-gridwrap thead th')[i];
    th?.querySelector('button')?.click() ?? th?.click();
  }, col.indice);
  await page.waitForTimeout(1800);
  const depois = await page.evaluate(() => {
    const wrap = document.querySelector('[data-pp-react-root] .pp-gridwrap');
    return [...wrap.querySelectorAll('tbody tr')].slice(0, 3).map((tr) => tr.children[1]?.textContent.trim()).join('|');
  });
  checa('11 clicar no cabeçalho não reordena', antes === depois);

  // ── 4. CSV da SELEÇÃO inclui a coluna ───────────────────────────
  // De propósito o export da seleção, não o do grid inteiro: aquele pagina até 5.000
  // registros (10 requisições que seguem chegando depois) e contaminaria a checagem 15,
  // que exige que o cf= PARE de ser enviado. Prova a mesma coisa — o CSV sai de
  // `colsVisiveis`, o mesmo caminho dos dois botões.
  const csv = await page.evaluate(async () => {
    const wrap = document.querySelector('[data-pp-react-root] .pp-gridwrap');
    [...wrap.querySelectorAll('tbody input[type=checkbox]')].slice(0, 3).forEach((cb) => cb.click());
    await new Promise((r) => setTimeout(r, 400));
    return new Promise((resolve) => {
      const orig = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        blob.text().then((t) => resolve(t.slice(0, 600)));
        URL.createObjectURL = orig;
        return orig.call(this, blob);
      };
      const b = [...document.querySelectorAll('[data-pp-react-root] .pp-selbar button')]
        .find((x) => /exportar/i.test(x.textContent ?? ''));
      b?.click();
      setTimeout(() => resolve(''), 8000);
    });
  });
  checa('12 CSV traz a coluna personalizada', csv.includes(alvo), (csv.split('\r\n')[0] ?? '').slice(0, 130));
  checa('12b CSV traz o VALOR resolvido, não o id',
    csv !== '' && (csv.split('\r\n')[1] ?? '').split(';').some((c) => c && !/^\d+$/.test(c)));

  // ── 5. A escolha persiste ───────────────────────────────────────
  await abrirTela(page, 'Organizações');
  await abrirTela(page, 'Negócios');
  const persistiu = await lerColuna(page, alvo);
  checa('13 a coluna sobrevive a sair e voltar', persistiu.achou === true);

  // ── 6. Remover pelo × e parar de pedir ──────────────────────────
  // A remoção vive na lista de COLUNAS (onde a coluna passou a morar), não na seção de
  // campos disponíveis — que agora só lista os que ainda não foram adicionados. Antes o
  // campo aparecia nos dois lugares, com dois checkboxes de efeito diferente: um ocultava
  // a coluna, o outro removia o campo. Esta checagem existe por causa disso.
  await abrirMenuColunas(page);
  const secDepois = await lerSecaoCf(page);
  checa('13b campo adicionado sai da lista de disponíveis',
    !(secDepois?.itens ?? []).some((i) => i.nome === alvo),
    `${(secDepois?.itens ?? []).filter((i) => i.nome).length} disponíveis`);
  const removeu = await page.evaluate((n) => {
    const menu = document.querySelector('[data-pp-react-root] .pp-colmenu');
    const item = [...menu.querySelectorAll('.pp-colmenu-item')]
      .find((el) => el.querySelector('label')?.textContent.trim() === n);
    const btn = [...(item?.querySelectorAll('.pp-colmenu-mv button') ?? [])]
      .find((b) => /remover/i.test(b.getAttribute('title') ?? ''));
    btn?.click();
    return !!btn;
  }, alvo);
  checa('13c a coluna personalizada tem botão de remover', removeu === true);
  await fecharMenu(page);
  await page.waitForTimeout(1500);   // deixa assentar o refetch do desmarque
  pedidos.length = 0;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-pp-react-root] .pp-toolbar button')]
      .find((x) => /atualizar/i.test(x.getAttribute('title') ?? ''));
    b?.click();
  });
  await page.waitForTimeout(2500);
  const semCol = await lerColuna(page, alvo);
  checa('14 desmarcar remove a coluna', semCol.achou === false);
  checa('15 e para de mandar cf= (quem não usa não paga)',
    pedidos.length > 0 && pedidos.every((c) => !c), JSON.stringify(pedidos.slice(0, 3)));

  // ── 7. Atividades não oferece a seção ───────────────────────────
  await abrirTela(page, 'Atividades');
  await abrirMenuColunas(page);
  const secAtiv = await lerSecaoCf(page);
  checa('16 Atividades não mostra campos personalizados', secAtiv?.temSecao === false,
    (secAtiv?.cabecalhos ?? []).join(' | '));
  await fecharMenu(page);

  // ── 8. Layout e console ─────────────────────────────────────────
  await abrirTela(page, 'Negócios');
  await abrirMenuColunas(page);
  await marcarCf(page, alvo);
  await fecharMenu(page);
  const estouro = (p) => p.evaluate(() => {
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    return main ? main.scrollWidth > main.clientWidth + 2 : false;
  });
  checa('17 sem estouro horizontal em 1600', (await estouro(page)) === false);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(1200);
  checa('18 sem estouro horizontal em 480', (await estouro(page)) === false);
  await page.screenshot({ path: `${OUT}/${tema}-3-480.png` });
  checa('19 zero erro de console do painel', erros.length === 0, erros.slice(0, 2).join(' | '));

  await browser.close();
}

const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });
for (const tema of ['dark', 'light']) await rodar(tema);
log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);
