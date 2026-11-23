// scripts/geral/teste-geral-servico.mjs — tela Geral (panel-dashboard): Pipedrive REAL, "Aguardando conexão" sem números inventados, Outlook fora.
// Testa o GeralService.ts REAL empacotado (sem rede, sem navegador; fetch e localStorage falsos):
//   ESB=<node_modules do build>/.bin/esbuild; $ESB public/components/panels/panel-dashboard/src/services/GeralService.ts --bundle \
//     --platform=node --format=esm --outfile=<temporário fora de /tmp>/G.mjs && node scripts/geral/teste-geral-servico.mjs <temporário>/G.mjs
// Contraprova: o GeralService da produção d714c6bc reprova (mostra 47 negócios, R$ 842.000, 18% de demonstração).
// teste do GeralService REAL (empacotado do .ts) com fetch falso — sem rede, sem navegador
const mem = new Map(); globalThis.window = { localStorage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) } };
let rotas = {};
globalThis.fetch = async (url) => {
  const k = Object.keys(rotas).find((p) => url.startsWith(p));
  const r = k ? rotas[k] : { status: 404, body: {} };
  return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body };
};
const S = await import(process.argv[2]);
let falhas = 0, total = 0; const ok = (n, c, d = '') => { total++; if (!c) falhas++; console.log((c ? 'ok    ' : 'FALHA ') + n + (d ? `  (${d})` : '')); };
const PD = { ok: true, data: { overview: { deals: { abertos: 324, valor_aberto: 13612618, taxa_conversao: 18.7 }, atividades: { atrasadas: 201 } },
  runs: [{ status: 'completed', finished_at: '2026-11-23 13:00:32' }] } };
const BASE = { '/api/traffic/summary.php': { status: 200, body: { ok: true, data: {} } }, '/api/ads/status': { status: 200, body: { ok: true, data: { provider: 'mock', accounts: [] } } },
  '/api/anuncios/stats.php': { status: 200, body: { ok: true, data: {} } }, '/api/google-calendar/header/summary': { status: 200, body: { ok: true, data: {} } } };
// (A) Pipedrive real
rotas = { ...BASE, '/api/pipedrive/overview': { status: 200, body: PD } };
const p = await S.getResumoModulo('pipedrive', '30d');
const v = Object.fromEntries(p.metricas.map((m) => [m.rotulo, m.valor]));
ok('A · Pipedrive SEM selo simulado', p.simulado === false);
ok('A · negócios abertos = 324', v['Negócios abertos'] === (324).toLocaleString('pt-BR'), v['Negócios abertos']);
ok('A · valor do funil = R$ 13.612.618', /13\.612\.618/.test(v['Valor do funil']), v['Valor do funil']);
ok('A · atividades atrasadas = 201 (em vermelho)', v['Ativ. atrasadas'] === '201' && p.metricas.find((m) => m.rotulo === 'Ativ. atrasadas').ruim === true);
ok('A · conversão = 18,7%', v['Conversão'] === '18,7%', v['Conversão']);
ok('A · atualizado = a última sincronização (13:00:32 −03:00)', p.atualizadoEm === new Date('2026-11-23T13:00:32-03:00').toISOString(), p.atualizadoEm);
ok('A · status atenção com atrasadas', p.status === 'atencao' && /201/.test(p.statusRotulo), p.statusRotulo);
const al = await S.getAlertas();
const alp = al.find((a) => a.modulo === 'Pipedrive');
ok('A · alerta do Pipedrive REAL (201), sem o "6 atividades" de demonstração', alp && alp.simulado === false && /201/.test(alp.descricao) && !al.some((a) => /^6 atividades/.test(a.descricao)), alp && alp.descricao);
const integ = await S.getIntegracoes();
const ip = integ.find((i) => i.nome === 'Pipedrive');
ok('A · integração Pipedrive = conectada, com a última sincronização', ip && ip.estado === 'conectada' && ip.ultimaSync !== null, ip && ip.estado);
// Pipedrive sem permissão / fora
rotas = { ...BASE, '/api/pipedrive/overview': { status: 403, body: { ok: false } } };
const p403 = await S.getResumoModulo('pipedrive', '30d');
ok('A · sem permissão (403): "Sem acesso", nenhum número', p403.statusRotulo === 'Sem acesso' && p403.metricas.length === 0 && p403.simulado === false);
ok('A · sem permissão: nenhum alerta do Pipedrive', !(await S.getAlertas()).some((a) => a.modulo === 'Pipedrive'));
rotas = { ...BASE, '/api/pipedrive/overview': { status: 500, body: {} } };
const p500 = await S.getResumoModulo('pipedrive', '30d');
ok('A · fonte fora (500): "Indisponível", nenhum número', p500.statusRotulo === 'Indisponível' && p500.metricas.length === 0);
// (B) cartões sem fonte real
for (const id of ['metaads', 'mercadolivre', 'ecommerce', 'compras', 'financeiro', 'datatables']) {
  const r = await S.getResumoModulo(id, '30d');
  ok(`B · ${id}: "Aguardando conexão", sem número de demonstração, sem selo`, r.statusRotulo === 'Aguardando conexão' && r.metricas.length === 0 && r.simulado === false && !r.alerta && r.atualizadoEm === null);
}
// (C) Outlook fora
ok('C · Outlook fora das integrações', !integ.some((i) => /Outlook/.test(i.nome)), integ.map((i) => i.nome).join(','));
console.log(`== ${total} verificações, ${falhas} falha(s)`); process.exit(falhas ? 1 : 0);
