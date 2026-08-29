// nav-registry-contract.mjs — Track D onda 2 (item 5): VALIDADOR DE CONTRATO do
// registro de navegação. Determinístico, sem browser, sem auth, portátil (Node
// 18+). Lê os configs REAIS (nav-rail items.ts + sidebar items.manifest.ts) por
// parse de texto (não depende de TS-strip nem dos .js irmãos) e detecta as
// violações que o item 5 exige: IDs/rotas duplicados, item sem nome acessível,
// item mobile sem destino, essencial ausente da bottom-nav, divergência de rota.
//
// NOTA HONESTA: valida o CONTRATO ESTÁTICO (fallback configs). A unificação real
// de fonte única exige reconciliar DOIS backends distintos (/api/ui/navigation.php
// e /api/ui/navrail/) + dois modelos de permissão (UARPS × nível) — fora do escopo
// deste sandbox. O validador de runtime (contra os registros vivos) vai no
// nav-registry-contract-runtime.mjs (entregue p/ a sessão autenticada do Jhony).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));
const NAVRAIL = root('public/components/nav-rail/registry/items.ts');
const SIDEBAR = root('public/components/sidebar/registry/items.manifest.ts');

let erros = 0, avisos = 0;
const err = (m) => { console.log(`  ✗ ERRO: ${m}`); erros++; };
const warn = (m) => { console.log(`  ⚠ aviso: ${m}`); avisos++; };
const okmsg = (m) => console.log(`  ✓ ${m}`);

// extrai objetos { ... } de um bloco `const/export const NOME = [ ... ];`
function parseItens(arquivo, nomeArray) {
  const txt = readFileSync(arquivo, 'utf8');
  const re = new RegExp(`(?:export\\s+)?const\\s+${nomeArray}\\s*=\\s*\\[([\\s\\S]*?)\\n\\];`, 'm');
  const m = txt.match(re);
  if (!m) throw new Error(`array ${nomeArray} não encontrado em ${arquivo}`);
  const corpo = m[1];
  const itens = [];
  // cada item é uma linha começando com { ... }
  for (const linha of corpo.split('\n')) {
    const s = linha.trim();
    if (!s.startsWith('{')) continue;
    const campo = (nome) => {
      const mm = s.match(new RegExp(`${nome}:\\s*'([^']*)'`)) || s.match(new RegExp(`${nome}:\\s*"([^"]*)"`));
      if (mm) return mm[1];
      if (new RegExp(`${nome}:\\s*null`).test(s)) return null;
      return undefined;
    };
    itens.push({
      id: campo('id'),
      route: campo('route'),
      label: campo('label') ?? campo('title'),
      panelId: campo('panelId'),
      actionType: campo('actionType'),
      sectionId: campo('sectionId'),
      group: campo('group'),
    });
  }
  return itens;
}

function parseMobileIds(arquivo) {
  const txt = readFileSync(arquivo, 'utf8');
  const m = txt.match(/const\s+MOBILE_ITEMS\s*=\s*\[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

console.log('== VALIDADOR DE CONTRATO — registro de navegação (estático) ==');
const navrail = parseItens(NAVRAIL, 'ITEMS');
const sidebar = parseItens(SIDEBAR, 'ITEMS');
const mobileIds = parseMobileIds(NAVRAIL);
okmsg(`carregados: nav-rail=${navrail.length} itens · sidebar=${sidebar.length} itens · MOBILE_ITEMS=${mobileIds.length}`);

// 1) IDs duplicados dentro de cada registro
for (const [nome, lista] of [['nav-rail', navrail], ['sidebar', sidebar]]) {
  const vistos = new Set(), dup = new Set();
  for (const it of lista) { if (vistos.has(it.id)) dup.add(it.id); vistos.add(it.id); }
  if (dup.size) err(`${nome}: IDs duplicados: ${[...dup].join(', ')}`);
  else okmsg(`${nome}: sem IDs duplicados`);
}

// 2) rotas duplicadas dentro de cada registro (ignora rotas nulas = ações)
for (const [nome, lista] of [['nav-rail', navrail], ['sidebar', sidebar]]) {
  const vistos = new Set(), dup = new Set();
  for (const it of lista) { if (!it.route) continue; if (vistos.has(it.route)) dup.add(it.route); vistos.add(it.route); }
  if (dup.size) err(`${nome}: rotas duplicadas: ${[...dup].join(', ')}`);
  else okmsg(`${nome}: sem rotas duplicadas`);
}

// 3) item sem nome acessível
for (const [nome, lista] of [['nav-rail', navrail], ['sidebar', sidebar]]) {
  const semNome = lista.filter((it) => !it.label || !it.label.trim());
  if (semNome.length) err(`${nome}: itens sem nome acessível: ${semNome.map((x) => x.id).join(', ')}`);
  else okmsg(`${nome}: todos os itens têm nome acessível`);
}

// 4) itens mobile: cada id deve existir na nav-rail; cada um deve ter destino OU ser ação
const byId = Object.fromEntries(navrail.map((i) => [i.id, i]));
for (const id of mobileIds) {
  const it = byId[id];
  if (!it) { err(`bottom-nav: MOBILE_ITEMS aponta para '${id}' que NÃO existe na nav-rail`); continue; }
  const temDestino = !!(it.route || it.panelId);
  const ehAcao = !!it.actionType;
  if (!temDestino && !ehAcao) err(`bottom-nav: item mobile '${id}' sem destino (rota/painel) e não é ação`);
}
okmsg('bottom-nav: itens mobile resolvidos (toggle-sidebar = ação, esperado sem rota)');

// 5) itens essenciais presentes na bottom-nav
const ESSENCIAIS = ['home', 'dashboard'];
const faltam = ESSENCIAIS.filter((e) => !mobileIds.includes(e));
if (faltam.length) err(`bottom-nav: itens essenciais ausentes: ${faltam.join(', ')}`);
else okmsg(`bottom-nav: essenciais presentes (${ESSENCIAIS.join(', ')})`);

// 6) DIVERGÊNCIAS entre registros (avisos p/ reconciliação — não bloqueiam)
const sideById = Object.fromEntries(sidebar.map((i) => [i.id, i]));
const idsComuns = navrail.filter((i) => sideById[i.id]).map((i) => i.id);
for (const id of idsComuns) {
  const r1 = byId[id].route, r2 = sideById[id].route;
  if (r1 && r2 && r1 !== r2) warn(`id '${id}' com ROTAS divergentes: nav-rail ${r1} × sidebar ${r2}`);
}
if (idsComuns.length) warn(`${idsComuns.length} IDs presentes nos DOIS registros (${idsComuns.join(', ')}) — candidatos à fonte única`);
// divergência de esquema admin
const adminNav = navrail.filter((i) => /admin/i.test(i.id)).map((i) => i.route).filter(Boolean);
const adminSide = sidebar.filter((i) => /admin/i.test(i.route || '')).map((i) => i.route);
if (adminNav.length && adminSide.length) warn(`esquema admin divergente: nav-rail [${adminNav.join(', ')}] × sidebar [${adminSide.join(', ')}] — reconciliar no registro canônico (router)`);

console.log(`\n== RESUMO: ${erros} erro(s) · ${avisos} aviso(s) ==`);
console.log(erros ? '✗ contrato de navegação FALHOU' : '✓ contrato de navegação estático VERDE (avisos = reconciliação para a unificação de backend)');
process.exit(erros ? 1 : 0);
