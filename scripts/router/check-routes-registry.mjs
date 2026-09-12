// scripts/router/check-routes-registry.mjs — prova estática do registro de rotas (lote chore/dshow-cleanup-dedup-v2).
// Importa os 5 módulos de definição (public/components/router/registry/definitions/routes-*.js — os MESMOS arquivos
// que o bundle `main`/`app-router` inlina) e verifica, ANTES do spread de definitions/index.js:
//   1. COLISÃO DE CHAVE entre módulos (a mesma rota definida em dois arquivos ⇒ o resultado dependeria da ordem do spread);
//   2. ALIAS × PATH: alias igual a um path real (o alias esconderia a rota) e alias definido por mais de uma rota;
//   3. ALIAS CIRCULAR: alias igual ao próprio path (exceto a forma hash '#/<path>', convenção do registro);
//   4. cada rota tem painel de destino (defaultView) e id único no conjunto final.
// Uso: node scripts/router/check-routes-registry.mjs   (exit 1 se houver FAIL)
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { register } from 'node:module';
register('./_loader-public-root.mjs', import.meta.url); // '/core/…' → public/core/…
const DIR = resolve(process.cwd(), 'public/components/router/registry/definitions');
const MODS = ['routes-dashboard', 'routes-business', 'routes-integrations', 'routes-admin', 'routes-system'];
const EXPORT = { 'routes-dashboard': 'dashboardRoutes', 'routes-business': 'businessRoutes', 'routes-integrations': 'integrationRoutes', 'routes-admin': 'adminRoutes', 'routes-system': 'systemRoutes' };
const owner = new Map(); const fails = []; const infos = [];
const all = {};
for (const m of MODS) {
  const mod = await import(pathToFileURL(resolve(DIR, m + '.js')).href);
  const table = mod[EXPORT[m]];
  if (!table || typeof table !== 'object') { fails.push(`${m}: export ${EXPORT[m]} ausente`); continue; }
  for (const [path, cfg] of Object.entries(table)) {
    if (owner.has(path)) fails.push(`COLISÃO DE CHAVE ${path}: ${owner.get(path)} × ${m} (painel ${all[path]?.defaultView} × ${cfg?.defaultView})`);
    else { owner.set(path, m); all[path] = cfg; }
  }
}
const paths = new Set(Object.keys(all));
const aliasOwner = new Map();
for (const [path, cfg] of Object.entries(all)) {
  if (!cfg || (!cfg.defaultView && owner.get(path) !== 'routes-system')) fails.push(`SEM PAINEL DE DESTINO: ${path}`); // rotas de sistema (login/logout/404…) montam página, não painel
  for (const a of cfg?.aliases || []) {
    const norm = a.startsWith('#') ? a.slice(1) : a;
    if (norm === path) { if (a !== '#' + path) fails.push(`ALIAS CIRCULAR ${a} → ${path}`); continue; } // '#/x' é a forma hash da própria rota (convenção do registro), não é alias
    if (paths.has(norm) && norm !== path) fails.push(`ALIAS × PATH ${a} (de ${path}) colide com a rota real ${norm}`);
    if (aliasOwner.has(norm) && aliasOwner.get(norm) !== path) fails.push(`ALIAS DUPLICADO ${a}: ${aliasOwner.get(norm)} × ${path}`);
    aliasOwner.set(norm, path);
  }
}
const ids = new Map();
for (const [path, cfg] of Object.entries(all)) { if (cfg?.id) { if (ids.has(cfg.id)) infos.push(`id repetido ${cfg.id}: ${ids.get(cfg.id)} × ${path}`); else ids.set(cfg.id, path); } }
for (const p of ['/preferencias', '/meu-perfil']) infos.push(`${p} → ${all[p]?.defaultView} (${owner.get(p)}; aliases ${JSON.stringify(all[p]?.aliases || [])})`);
console.log(`rotas=${paths.size} módulos=${MODS.length}`);
for (const i of infos) console.log('INFO ' + i);
for (const f of fails) console.log('FAIL ' + f);
console.log(fails.length ? `# ${fails.length} FAIL` : '# TODOS PASS');
process.exit(fails.length ? 1 : 0);
