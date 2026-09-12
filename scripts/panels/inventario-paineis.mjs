// scripts/panels/inventario-paineis.mjs — INVENTÁRIO DERIVADO dos painéis (lote chore/dshow-cleanup-dedup-v2).
// Não é um registro: lê as fontes canônicas existentes — (1) diretórios public/components/panels/*, (2) o registro de
// rotas do router (definitions/routes-*.js, os mesmos que o bundle inlina), (3) tabelas do panel-loader (panel-paths.js),
// (4) fallbacks de sidebar/nav-rail, header (manifest + componentes), dashboard, footer, index.html, sw.js e api/ do
// servidor, (5) snapshot SÓ LEITURA do banco (scripts/panels/dump-registros-nav.php) — e emite a matriz como documentação.
// Uso: node scripts/panels/inventario-paineis.mjs --db docs/ELEVACAO-BASAL/evidencias/registros-nav-<data>.json \
//        --out docs/ELEVACAO-BASAL/inventario-paineis-101.md [--json <arquivo.json>] [--served /var/www/dshowdash]
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';
register('../router/_loader-public-root.mjs', import.meta.url);

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const ROOT = process.cwd();
const SERVED = String(opt('served', process.env.DSHOW_SERVED_ROOT || '/var/www/dshowdash'));
const DBJ = JSON.parse(readFileSync(String(opt('db')), 'utf8')).tabelas;
const OUT = String(opt('out', 'docs/ELEVACAO-BASAL/inventario-paineis-101.md'));
const OUTJ = opt('json', null);
const PANELS_DIR = join(ROOT, 'public/components/panels');
const MANUAL0 = JSON.parse(readFileSync(join(ROOT, 'scripts/panels/classificacao-manual.json'), 'utf8'));

// ── universo da auditoria (101) ─────────────────────────────────────────────────────────────────────
const AUDIT = {
  numeric: Array.from({ length: 19 }, (_, i) => 'panel-' + String(i + 1).padStart(2, '0')),
  footer: ['activity', 'api', 'cpu', 'database', 'disk', 'docs', 'file', 'financial', 'globe', 'memory', 'registry', 'server', 'settings', 'shield', 'status', 'support', 'wifi'].map((s) => 'panel-footer-' + s),
  integration: ['adwords', 'alfinete', 'asaas', 'bling', 'calendar', 'chatgpt', 'google-drive', 'loja-integrada', 'mercado-livre', 'pipedrive'].map((s) => 'panel-integration-' + s),
  status: ['currency-btc', 'currency-usd-brl', 'currency-usd-cny', 'email-integration', 'instagram-messenger', 'weather-sp', 'wechat-integration', 'whatsapp-integration'].map((s) => 'panel-status-' + s),
  other: ['account-security', 'ads', 'analytics', 'anuncios', 'audit-trail', 'avatar-studio', 'bling', 'cards', 'charts', 'code', 'cotacao', 'cotacao-shared', 'criacao-botoes', 'dashboard', 'datahub', 'datatables', 'enterprise', 'feature-flags-admin', 'files', 'gestao-paineis', 'google-analytics', 'google-calendar', 'header-admin', 'health-dashboard', 'location', 'lotties-management', 'mercadolivre', 'metaads', 'nav-admin', 'navrail-admin', 'observability', 'orchestrator', 'orchestrator-manager', 'outlook', 'permissions-admin', 'pipedrive', 'relogio-mundial', 'session-admin', 'status', 'stub-dev', 'transito-sp', 'uarps-monitor', 'user-management', 'user-notifications', 'user-preferences', 'user-profile', 'user-sessions'].map((s) => 'panel-' + s),
};
const AUDIT_ALL = new Set(Object.values(AUDIT).flat());
const familyOf = (id) => /^panel-\d\d$/.test(id) ? 'numeric' : id.startsWith('panel-footer-') ? 'footer' : id.startsWith('panel-integration-') ? 'integration' : id.startsWith('panel-status-') ? 'status' : 'other';

// ── utilitários ──────────────────────────────────────────────────────────────────────────────────────
const SKIP = /(^|\/)(node_modules|dist|\.git|\.vite)(\/|$)/;
function walk(dir, acc = []) { if (!existsSync(dir)) return acc; for (const n of readdirSync(dir)) { const p = join(dir, n); if (SKIP.test(p)) continue; const s = statSync(p); if (s.isDirectory()) walk(p, acc); else acc.push(p); } return acc; }
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const rel = (p) => p.slice(ROOT.length + 1);
// corpus de código fora de panels/ (para referências externas), uma vez só
const CORPUS = [];
for (const d of ['public/components', 'public/index.html', 'app', 'api', 'scripts', 'core']) {
  const p = join(ROOT, d); if (!existsSync(p)) continue;
  if (statSync(p).isFile()) { CORPUS.push({ f: rel(p), t: read(p) }); continue; }
  for (const f of walk(p)) { if (!/\.(m?js|ts|tsx|json|html|php|css|sh)$/.test(f)) continue; if (rel(f).startsWith('public/components/panels/')) continue; CORPUS.push({ f: rel(f), t: read(f) }); }
}
const SW = read(join(SERVED, 'public/sw.js'));
const INDEX_HTML = read(join(ROOT, 'public/index.html'));
const SERVED_API = existsSync(join(SERVED, 'api')) ? walk(join(SERVED, 'api')).filter((f) => f.endsWith('.php')).map((f) => ({ f: f.slice(SERVED.length + 1), t: read(f) })) : [];
const INVENTORY_TS = read(join(ROOT, 'public/components/_shared/permissions/inventory.ts'));
const GUARD_MODULES = read(join(ROOT, 'public/components/permissions-guard/registry/modules.ts'));
const HEADER_MANIFEST = read(join(ROOT, 'public/components/header/components/manifest.json'));
const FOOTER_CONFIG = read(join(ROOT, 'public/components/footer/config.json'));
const DASH = walk(join(ROOT, 'public/components/panels/panel-dashboard/src')).map((f) => read(f)).join('\n');
const SIDEBAR_FB = read(join(ROOT, 'public/components/sidebar/registry/items.manifest.ts'));
const NAVRAIL_FB = read(join(ROOT, 'public/components/nav-rail/registry/items.ts'));
const HEADER_SRC = walk(join(ROOT, 'public/components/header')).filter((f) => /\.(ts|js|json)$/.test(f)).map((f) => read(f)).join('\n');

// ── registro de rotas (fonte canônica no código) ─────────────────────────────────────────────────────
const DEFS = join(ROOT, 'public/components/router/registry/definitions');
const MODS = { 'routes-dashboard': 'dashboardRoutes', 'routes-business': 'businessRoutes', 'routes-integrations': 'integrationRoutes', 'routes-admin': 'adminRoutes', 'routes-system': 'systemRoutes' };
const ROUTES = {};
for (const [m, ex] of Object.entries(MODS)) { const mod = await import(pathToFileURL(join(DEFS, m + '.js')).href); for (const [path, cfg] of Object.entries(mod[ex] || {})) ROUTES[path] = { ...cfg, _mod: m }; }
const PP = await import(pathToFileURL(join(ROOT, 'public/components/main/adapters/panel-loader/panel-paths.js')).href);
const PANEL_ID_PATHS = PP.PANEL_ID_PATHS || {}; const ITEM_TO_PANEL = PP.ITEM_TO_PANEL || {};

// ── banco (snapshot) ─────────────────────────────────────────────────────────────────────────────────
const T = (n) => Array.isArray(DBJ[n]) ? DBJ[n] : [];
const dbFor = (id) => {
  const reg = T('panel_registry').filter((r) => r.panel_id === id);
  const nav = T('ui_nav_items').filter((r) => r.panel_id === id || (r.route_path || '').replace(/^#/, '') === '/' + id);
  const navi = T('navigation_items').filter((r) => r.panel_id === id);
  const rail = T('navrail_items').filter((r) => (r.action_data || '').includes('"' + id + '"'));
  const dest = T('app_nav_destination').filter((r) => r.destination_key === id);
  const routes = T('app_nav_route').filter((r) => r.destination_key === id);
  const shots = T('panel_screenshots').filter((r) => r.panel_id === id);
  const foot = T('footer_items').filter((r) => JSON.stringify(r).includes(id));
  const side = T('sidebar_items').filter((r) => JSON.stringify(r).includes(id));
  const head = T('header_components').filter((r) => JSON.stringify(r).includes(id));
  return { reg, nav, navi, rail, dest, routes, shots, foot, side, head };
};

// ── coleta por painel ────────────────────────────────────────────────────────────────────────────────
const dirs = readdirSync(PANELS_DIR).filter((n) => statSync(join(PANELS_DIR, n)).isDirectory() && n !== '_shared');
const panels = {};
for (const id of dirs) {
  const dir = join(PANELS_DIR, id);
  const files = walk(dir);
  const bytes = files.reduce((a, f) => a + statSync(f).size, 0);
  const indexJs = join(dir, 'index.js'); const hasIndex = existsSync(indexJs); const idx = read(indexJs);
  const mount = /export\s+(async\s+)?function\s+mount\b|export\s*\{[^}]*\bmount\b|export\s+const\s+mount\b|export\s+default\s+\{[\s\S]{0,800}?\bmount\b/.test(idx) || /return\s*\{[\s\S]{0,600}?\bmount\b/.test(idx) || /export\s*\{[^}]*\bmount\b/.test(read(join(dir, 'index.ts')));
  const cfg = (() => { try { return JSON.parse(read(join(dir, 'config.json')) || read(join(dir, 'schema.json')) || 'null'); } catch { return null; } })();
  const nameFromIdx = (idx.match(/index\.js\s*[—–-]\s*([^\n(]{4,80})/) || idx.match(/@(?:module|name|title)\s+([^\n*]+)/) || [])[1];
  let name = String((cfg && (cfg.title || cfg.name || cfg.label)) || '').trim();
  const GENERIC = /^(Footer|Status|Integração|Integracao)$/i;
  const desc = cfg && (cfg.description || cfg.subtitle) || '';
  const react = files.some((f) => /vite\.config\.(ts|js)$/.test(f)) || files.some((f) => f.endsWith('.tsx'));
  const servedDist = join(SERVED, 'public/components/panels', id, 'dist');
  const manifestPath = ['.vite/manifest.json', 'manifest.json'].map((m) => join(servedDist, m)).find((p) => existsSync(p));
  const distInfo = manifestPath ? { manifest: manifestPath.slice(SERVED.length + 1), mtime: statSync(manifestPath).mtime.toISOString().slice(0, 10) } : null;
  const body = files.filter((f) => /\.(m?js|ts|tsx)$/.test(f)).map((f) => read(f)).join('\n');
  const apis = [...new Set((body.match(/['"`](\/api\/[a-z0-9_./-]+)/gi) || []).map((m) => m.slice(1)))].slice(0, 8);
  const flagKey = (body.match(/FLAG_KEY\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  const flagsAs = [...new Set(body.match(/as[56]\.[a-z0-9_]+/g) || [])];
  const flagsOther = [...new Set((body.match(/['"](panel_[a-z0-9_]+_enabled)['"]/g) || []).map((s) => s.slice(1, -1)))];
  const flags = [...new Set([flagKey, ...flagsOther, ...(flagsAs.length ? ['as5/as6: ' + flagsAs.length + ' flags'] : [])].filter(Boolean))];
  // rotas do registro do código que montam este painel
  const routesFor0 = Object.entries(ROUTES).filter(([, c]) => c.defaultView === id).map(([p, c]) => ({ path: p, aliases: c.aliases || [], mod: c._mod, title: c.title }));
  const routesFor = routesFor0;
  const official = routesFor.find((r) => r.path === '/' + id) || routesFor[0] || null;
  if (!name || GENERIC.test(name)) name = (official && official.title) || (nameFromIdx || '').trim() || name || id;
  if (MANUAL0[id] && MANUAL0[id].name) name = MANUAL0[id].name;
  const convention = /^panel-[a-z0-9-]+$/i.test(id); // extractPanelId monta #/<id> por convenção, sem rota
  const inPanelPaths = Object.keys(PANEL_ID_PATHS).filter((k) => (PANEL_ID_PATHS[k] || '').includes('/panels/' + id + '/'));
  const itemAliases = Object.entries(ITEM_TO_PANEL).filter(([, v]) => v === id).map(([k]) => k);
  const legacyIdsPointingHere = inPanelPaths.filter((k) => k !== id);
  // entradas de UI
  const suf = id.replace(/^panel-/, '');
  const entries = [];
  if (HEADER_MANIFEST.includes('"' + id + '"') || HEADER_MANIFEST.includes('"' + suf + '"')) entries.push('header:manifest');
  if (HEADER_SRC.includes('#/' + id)) entries.push('header:link #/' + id);
  if (SIDEBAR_FB.includes('#/' + id)) entries.push('sidebar:fallback');
  if (NAVRAIL_FB.includes("'" + id + "'")) entries.push('nav-rail:fallback');
  if (DASH.includes('#/' + id)) entries.push('dashboard');
  if (FOOTER_CONFIG.includes('"' + suf + '"') && id.startsWith('panel-footer-')) entries.push('footer:config');
  if (INDEX_HTML.includes(id)) entries.push('index.html');
  const swHits = (SW.match(new RegExp('/panels/' + id.replace(/[-]/g, '\\-') + '/', 'g')) || []).length; if (swHits) entries.push('sw.js precache ×' + swHits);
  const db = dbFor(id);
  if (db.nav.some((r) => r.is_active == 1)) entries.push('db:ui_nav_items ativo ×' + db.nav.filter((r) => r.is_active == 1).length);
  if (db.navi.some((r) => r.is_active == 1 && !r.deleted_at)) entries.push('db:navigation_items');
  if (db.rail.some((r) => r.is_active == 1 && r.is_deleted == 0)) entries.push('db:navrail_items');
  if (db.routes.some((r) => r.is_active == 1)) entries.push('db:app_nav_route ' + db.routes.filter((r) => r.is_active == 1).map((r) => '#/' + r.route_clean).join(','));
  if (db.foot.length) entries.push('db:footer_items'); if (db.side.length) entries.push('db:sidebar_items'); if (db.head.length) entries.push('db:header_components');
  // referências externas (código fora de panels/)
  const extRefs = CORPUS.filter(({ f, t }) => t.includes('panels/' + id + '/') || t.includes("'" + id + "'") || t.includes('"' + id + '"') || t.includes('#/' + id)).map((c) => c.f);
  const importedBy = dirs.filter((o) => o !== id && walk(join(PANELS_DIR, o)).filter((f) => /\.(m?js|ts|tsx)$/.test(f)).some((f) => read(f).includes('/panels/' + id + '/')));
  const phpRefs = SERVED_API.filter(({ t }) => t.includes(id)).map((c) => c.f).slice(0, 5);
  const permRegion = (INVENTORY_TS.match(new RegExp("'(region:panel:" + suf + "|trigger:[a-z-]+:" + (id) + "|trigger:[a-z-]+:" + suf + ")'", 'g')) || []).map((s) => s.slice(1, -1));
  const guardModule = GUARD_MODULES.includes("'" + id + "'");
  const routePolicy = official ? (read(join(ROOT, 'public/components/permissions-guard/registry/routes.ts')).includes("'" + official.path.replace(/^\//, '') + "'")) : false;
  // imports relativos quebrados dentro do painel (loader válido?)
  let broken = 0;
  for (const f of files.filter((f) => /\.(m?js)$/.test(f))) { const s = read(f); const re = /(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g; let m; while ((m = re.exec(s))) { const spec = (m[1] || m[2]).split('?')[0]; const base = resolve(f, '..', spec); if (![base, base + '.js', base + '/index.js'].some((c) => existsSync(c))) broken++; } }
  panels[id] = { id, family: familyOf(id), name, desc, files: files.length, bytes, react, hasIndex, mount, distInfo, apis, flags, routesFor, official, convention, inPanelPaths, itemAliases, legacyIdsPointingHere, entries, db, extRefs, importedBy, phpRefs, permRegion, guardModule, routePolicy, broken, inAudit: AUDIT_ALL.has(id) };
}

// ── classificação ────────────────────────────────────────────────────────────────────────────────────
// Regras automáticas (evidência) + decisões manuais com justificativa (apenas onde a evidência exige interpretação).
const MANUAL = MANUAL0;
function classify(p) {
  const m = MANUAL[p.id] || {};
  const auto = classifyAuto(p);
  return { status: m.status || auto.status, why: m.why || auto.why, action: m.action || auto.action, modern: m.modern || '', legacy: m.legacy || '', product: m.product || '', role: m.role || '' };
}
function classifyAuto(p) {
  const reach = p.entries.length > 0 || !!p.official || p.extRefs.length > 0 || p.phpRefs.length > 0;
  if (!p.hasIndex && p.importedBy.length) return { status: 'SHARED_LIBRARY', why: `sem index.js; importado por ${p.importedBy.join(', ')}`, action: 'mantido (biblioteca)' };
  if (p.hasIndex && p.mount && p.broken === 0 && reach) return { status: 'CANONICAL_ACTIVE', why: `index.js com mount, 0 imports quebrados; alcance: ${[...(p.official ? ['rota ' + p.official.path] : []), ...p.entries].join(' · ') || 'referências externas'}`, action: 'mantido' };
  if (p.hasIndex && p.mount && p.broken === 0 && !reach) return { status: 'INTERNAL_UTILITY', why: 'carregável por convenção, sem rota/entrada/referência externa — decisão manual pendente', action: '—' };
  if (p.hasIndex && (!p.mount || p.broken > 0)) return { status: 'INCOMPLETE', why: `index.js ${p.mount ? '' : 'sem export mount'} ${p.broken ? p.broken + ' imports quebrados' : ''}`.trim(), action: '—' };
  return { status: 'ORPHAN_CONFIRMED', why: 'sem index.js e sem importador', action: '—' };
}
for (const p of Object.values(panels)) Object.assign(p, classify(p));

// ── reconciliação com a auditoria (101) ──────────────────────────────────────────────────────────────
const current = Object.keys(panels).filter((id) => id.startsWith('panel-'));
const added = current.filter((id) => !AUDIT_ALL.has(id));
const removed = [...AUDIT_ALL].filter((id) => !panels[id]);
const nonPrefixed = Object.keys(panels).filter((id) => !id.startsWith('panel-'));

// ── integridade (rotas, loaders, navegação do banco) e famílias de produto ───────────────────────────
const isDir = (id) => !!panels[id];
const brokenRoutes = Object.entries(ROUTES).filter(([, c]) => c.defaultView && /^panel-/.test(c.defaultView) && !isDir(c.defaultView)).map(([p, c]) => `${p} → ${c.defaultView}`);
const brokenLoaders = Object.values(panels).filter((p) => p.hasIndex && (!p.mount || p.broken > 0)).map((p) => p.id);
const navBroken = [];
for (const r of T('ui_nav_items')) if (r.is_active == 1 && r.panel_id && /^panel-/.test(r.panel_id) && !isDir(r.panel_id)) navBroken.push(`ui_nav_items ${r.item_key} → ${r.panel_id}`);
const navNotes = [];
for (const r of T('navigation_items')) if (r.is_active == 1 && !r.deleted_at && r.panel_id && !isDir(r.panel_id)) navNotes.push(`navigation_items ${r.item_key} → ${r.panel_id} (tabela SEM consumidor em api/ e public/ — não é navegação viva)`);
for (const r of T('navrail_items')) { const m = (r.action_data || '').match(/"panelId"\s*:\s*"([^"]+)"/); if (r.is_active == 1 && r.is_deleted == 0 && m && !isDir(m[1])) navNotes.push(`navrail_items ${r.item_key} → panelId ${m[1]} (informativo: o nav-rail navega por intent → navigation-map → rota #/${r.item_key})`); }
for (const r of T('app_nav_route')) if (r.is_active == 1 && r.destination_key && /^panel-/.test(r.destination_key) && !isDir(r.destination_key)) navBroken.push(`app_nav_route ${r.route_clean} → ${r.destination_key}`);
const families = {};
for (const p of Object.values(panels)) if (p.product) (families[p.product] ||= []).push(p);
const dupFamilies = Object.entries(families).filter(([, ps]) => ps.filter((p) => p.role === 'canonical').length !== 1).map(([f]) => f);

// ── saída ────────────────────────────────────────────────────────────────────────────────────────────
const ALLOWED = ['CANONICAL_ACTIVE', 'COMPATIBILITY_ALIAS', 'SHARED_LIBRARY', 'INTERNAL_UTILITY', 'DEV_ONLY', 'INCOMPLETE', 'ORPHAN_CONFIRMED', 'REMOVED'];
const badStatus = Object.values(panels).filter((p) => p.inAudit && (typeof p.status !== 'string' || !ALLOWED.includes(p.status)));
if (badStatus.length) { console.error('classificação inválida/ausente: ' + badStatus.map((p) => p.id + '=' + p.status).join(', ')); process.exit(1); }
const counts = {}; for (const p of Object.values(panels)) counts[p.status] = (counts[p.status] || 0) + 1;
const fam = (f) => Object.values(panels).filter((p) => p.family === f && p.inAudit);
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const md = [];
md.push(`# Inventário dos painéis (documentação derivada) — lote chore/dshow-cleanup-dedup-v2`);
md.push(`Gerado por \`scripts/panels/inventario-paineis.mjs\` em ${new Date().toISOString()} a partir das fontes canônicas existentes: diretórios \`public/components/panels/*\`, registro de rotas (\`router/registry/definitions/routes-*.js\`), \`panel-loader/panel-paths.js\`, header/sidebar/nav-rail/dashboard/footer/index.html do repo, \`sw.js\` e \`api/\` do servidor (só leitura) e snapshot do banco (\`${String(opt('db'))}\`). **Não é um segundo registro**: mudanças de rota/painel devem ser feitas nas fontes acima e o inventário regenerado.\n`);
md.push('## Reconciliação com a auditoria (101)\n```ini');
md.push(`AUDIT_BASELINE_PANELS=101\nCURRENT_PANELS=${current.length}\nADDED_SINCE_BASELINE=${added.join(',') || 'nenhum'}\nREMOVED_SINCE_BASELINE=${removed.join(',') || 'nenhum'}\nRECONCILED_TOTAL=${current.length}\nNON_PREFIXED_DIRS=${nonPrefixed.join(',') || 'nenhum'}`);
md.push('```\n');
md.push('## Totais\n```ini');
md.push(`PANELS_DISCOVERED=${current.length}\nPANELS_CLASSIFIED=${Object.values(panels).filter((p) => p.inAudit && p.status).length}\nPANELS_UNCLASSIFIED=${Object.values(panels).filter((p) => p.inAudit && !p.status).length}`);
for (const [k, v] of [['NUMERIC', 'numeric'], ['FOOTER', 'footer'], ['INTEGRATION', 'integration'], ['STATUS', 'status'], ['OTHER_NAMED', 'other']]) md.push(`${k}_PANELS_MAPPED=${fam(v).length}/${AUDIT[v].length}`);
for (const k of ALLOWED) md.push(`${k}=${counts[k] || 0}`);
md.push(`PRIMARY_CLASSIFICATION_UNIQUE=${badStatus.length === 0 && Object.values(panels).filter((p) => p.inAudit).every((p) => ALLOWED.filter((k) => k === p.status).length === 1) ? 'YES' : 'NO'} (1 status por painel, entre os 8 permitidos; soma=${ALLOWED.reduce((a, k) => a + (Object.values(panels).filter((p) => p.inAudit && p.status === k).length), 0)})`);
md.push(`DUPLICATE_PRODUCT_FAMILIES_REMAINING=${dupFamilies.length}\nBROKEN_ROUTES=${brokenRoutes.length}\nBROKEN_LOADERS=${brokenLoaders.length}\nBROKEN_NAVIGATION_ENTRIES=${navBroken.length}`);
md.push('```');
if (brokenRoutes.length) md.push('\nRotas quebradas: ' + brokenRoutes.join('; '));
if (brokenLoaders.length) md.push('\nLoaders quebrados: ' + brokenLoaders.join('; '));
if (navBroken.length) md.push('\nEntradas de navegação (banco) apontando para painel inexistente: ' + navBroken.join('; '));
if (navNotes.length) md.push('\nNotas de dados (não contam como navegação quebrada): ' + navNotes.join('; '));
md.push('');
md.push('## Registro canônico por produto (derivado do registro de rotas + classificação)\n');
md.push('| produto | painel canônico | rota oficial | aliases | widgets/status (não confundir com o produto) | compatibilidade / legado | API | flags |');
md.push('|---|---|---|---|---|---|---|---|');
for (const [f, ps] of Object.entries(families).sort()) {
  const c = ps.find((p) => p.role === 'canonical');
  const others = (role) => ps.filter((p) => p.role === role).map((p) => p.id + (p.official ? ' (' + p.official.path + ')' : '')).join(', ') || '—';
  md.push(`| ${f} | ${c ? c.id : '**NENHUM**'} | ${c && c.official ? esc(c.official.path) : '—'} | ${c && c.official ? esc(c.official.aliases.join(', ')) : '—'} | ${esc(others('widget'))}${ps.some((p) => p.role === 'status') ? ' · status: ' + esc(others('status')) : ''} | ${esc(others('compat'))}${c && c.legacy ? ' · ' + esc(c.legacy) : ''} | ${c ? esc(c.apis.slice(0, 3).join(', ')) || '—' : '—'} | ${c ? esc(c.flags.join(', ')) || '—' : '—'} |`);
}
md.push('');
const FAMN = { numeric: '19 painéis numéricos', footer: '17 painéis do footer', integration: '10 painéis de integração', status: '8 painéis específicos de status', other: '47 painéis nomeados restantes' };
for (const f of ['numeric', 'footer', 'integration', 'status', 'other']) {
  md.push(`## ${FAMN[f]}\n`);
  md.push('| ID | nome funcional | rota oficial (código) | aliases | entradas (header/sidebar/dashboard/footer/DB/sw) | loader | componente | APIs | permissões | flags | refs ext. | convenção | moderno equivalente | legado relacionado | status | justificativa | ação |');
  md.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of fam(f).sort((a, b) => a.id.localeCompare(b.id))) {
    const loader = p.hasIndex ? (p.mount ? 'index.js + mount' : 'index.js sem mount') : 'sem index.js';
    const comp = p.react ? `React/Vite (${p.distInfo ? 'dist ' + p.distInfo.mtime : 'SEM dist no servidor'})` : 'vanilla ESM';
    const perms = [...p.permRegion, p.guardModule ? 'guard:modules' : '', p.routePolicy ? 'guard:route' : ''].filter(Boolean).join(', ') || '—';
    const modern = p.modern;
    md.push(`| ${p.id} | ${esc(p.name)} | ${p.official ? esc(p.official.path) : (p.convention ? '(convenção #/' + p.id + ')' : '—')} | ${esc([...(p.official ? p.official.aliases : []), ...p.itemAliases.map((a) => 'item:' + a), ...p.legacyIdsPointingHere.map((a) => 'id:' + a)].join(', ')) || '—'} | ${esc(p.entries.join(' · ')) || '—'} | ${loader}${p.broken ? ' (' + p.broken + ' imports quebrados)' : ''} | ${comp} | ${esc(p.apis.join(', ')) || '—'} | ${esc(perms)} | ${esc(p.flags.join(', ')) || '—'} | ${p.extRefs.length}${p.phpRefs.length ? ' + php ' + p.phpRefs.length : ''} | ${p.convention ? 'sim' : 'não'} | ${esc(modern) || '—'} | ${esc(p.legacy) || '—'} | **${p.status}** | ${esc(p.why)} | ${esc(p.action)} |`);
  }
  md.push('');
}
if (nonPrefixed.length || added.length) {
  md.push('## Fora do universo de 101 (encontrados no diretório)\n');
  for (const id of [...added, ...nonPrefixed]) { const p = panels[id]; md.push(`- **${id}** — ${esc(p.name)} · ${p.hasIndex ? 'index.js' : 'sem index.js'} · entradas: ${p.entries.join(' · ') || '—'} · refs ext.: ${p.extRefs.length} · **${p.status}** — ${esc(p.why)}`); }
  md.push('');
}
writeFileSync(OUT, md.join('\n'));
if (OUTJ) writeFileSync(String(OUTJ), JSON.stringify(Object.values(panels).map(({ db, ...p }) => ({ ...p, db: { reg: db.reg.length, nav: db.nav.length, rail: db.rail.length, dest: db.dest.length, routes: db.routes.map((r) => r.route_clean), shots: db.shots.map((s) => s.ultimo) } })), null, 1));
console.log(`painéis=${current.length} classificados=${Object.values(panels).filter((p) => p.status).length} ` + Object.entries(counts).map(([k, v]) => k + '=' + v).join(' '));
console.log(`adicionados=${added.join(',') || '-'} removidos=${removed.join(',') || '-'} nao-prefixados=${nonPrefixed.join(',') || '-'}`);
