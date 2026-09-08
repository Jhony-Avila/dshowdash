// testes/migracao-vest.mjs — provas de MIGRAÇÃO, SERIALIZAÇÃO e IDEMPOTÊNCIA do
// vestuário separado, SEM tocar backend/DB (só código puro). Argv: bundles de
// AvatarCatalog (validarConfig) e adaptadores (deLegado2d/paraLegado2d).
//   node migracao-vest.mjs /tmp/cat_probe.mjs /tmp/adap_probe.mjs
import { writeFileSync } from 'node:fs';
const C = await import(process.argv[2]);
const A = await import(process.argv[3]);
const validarConfig = C.validarConfig || C.default?.validarConfig;
const deLegado2d = A.deLegado2d || A.default?.deLegado2d;
const paraLegado2d = A.paraLegado2d || A.default?.paraLegado2d;

const CORES = { pele: '#e0ac69', cabelo: '#3b2a1e', roupa: '#2d4a8a', destaque: '#7c5cff' };
const base = (camadas) => ({ formato: 'camadas', versao: 1, base: 'bas_classica', camadas, cores: { ...CORES } });
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const R = {}; const det = [];
const check = (k, cond, info) => { R[k] = cond ? 'PASS' : 'FAIL'; det.push(`${cond ? 'PASS' : 'FAIL'} ${k}${info ? ' — ' + info : ''}`); };

// slots que devem sobreviver
const slot = (cfg, k) => cfg?.camadas?.[k] ?? null;

// 1) avatar antigo só com roupa (superior) — preserva, sem inventar calça/calçado
let c = validarConfig(base({ roupa: 'rou_camiseta' }));
check('MIG_ONLY_TOP', slot(c, 'roupa') === 'rou_camiseta' && !slot(c, 'roupa_inferior'), `roupa=${slot(c, 'roupa')} inf=${slot(c, 'roupa_inferior')}`);

// 2) sem roupa_inferior / sem calçado — não quebra
c = validarConfig(base({ roupa: 'rou_social', cabelo: 'cab_curto' }));
check('MIG_NO_LOWER_NO_SHOE', !!c && slot(c, 'roupa') === 'rou_social', 'abriu ok');

// 3) tênis legado (acessorio_pes)
c = validarConfig(base({ roupa: 'rou_hoodie', acessorio_pes: 'ace_tenis_neon' }));
check('MIG_LEGACY_SHOE', slot(c, 'acessorio_pes') === 'ace_tenis_neon', `pes=${slot(c, 'acessorio_pes')}`);

// 4) calça + calçado premium + top juntos (modelo novo)
c = validarConfig(base({ roupa: 'rou_camiseta', roupa_inferior: 'rin_jeans', acessorio_pes: 'ace_px_tenis' }));
check('MIG_THREE_SLOTS', slot(c, 'roupa') === 'rou_camiseta' && slot(c, 'roupa_inferior') === 'rin_jeans' && slot(c, 'acessorio_pes') === 'ace_px_tenis', JSON.stringify(c.camadas));

// 5) IDs inexistentes — descartados fail-safe, sem quebrar, sem perder os válidos
c = validarConfig(base({ roupa: 'rou_camiseta', roupa_inferior: 'rin_NAO_EXISTE', acessorio_pes: 'ace_NAO' }));
check('MIG_UNKNOWN_IDS_SAFE', slot(c, 'roupa') === 'rou_camiseta' && !slot(c, 'roupa_inferior') && !slot(c, 'acessorio_pes'), JSON.stringify(c.camadas));

// 6) payload parcialmente antigo + novo
c = validarConfig(base({ roupa: 'rou_terno', roupa_inferior: 'rin_social', acessorio: 'ace_oculos' }));
check('MIG_MIXED_PAYLOAD', slot(c, 'roupa') === 'rou_terno' && slot(c, 'roupa_inferior') === 'rin_social', JSON.stringify(c.camadas));

// 7) IDEMPOTÊNCIA — validar 2x = validar 1x
const uma = validarConfig(base({ roupa: 'rou_camiseta', roupa_inferior: 'rin_jeans', acessorio_pes: 'ace_px_bota' }));
const duas = validarConfig(uma);
check('MIG_IDEMPOTENT', eq(uma, duas), 'validar(validar(x))==validar(x)');

// 8) ROUNDTRIP domínio (deLegado2d→paraLegado2d) preserva os 3 slots
if (deLegado2d && paraLegado2d) {
  const cfg = validarConfig(base({ roupa: 'rou_polo', roupa_inferior: 'rin_jogger', acessorio_pes: 'ace_px_social' }));
  const volta = paraLegado2d(deLegado2d(cfg));
  const v = validarConfig({ ...volta, cores: cfg.cores });
  check('SAVE_LOAD_ROUNDTRIP', slot(v, 'roupa') === 'rou_polo' && slot(v, 'roupa_inferior') === 'rin_jogger' && slot(v, 'acessorio_pes') === 'ace_px_social', JSON.stringify(v.camadas));
  // idempotência do roundtrip (não duplica/troca)
  const volta2 = paraLegado2d(deLegado2d(validarConfig({ ...volta, cores: cfg.cores })));
  check('ROUNDTRIP_IDEMPOTENT', eq(volta.camadas, volta2.camadas), 'roundtrip estável');
} else { check('SAVE_LOAD_ROUNDTRIP', false, 'adaptadores indisponíveis'); }

// 9) cores independentes por slot (§73 coresCamada) sobrevivem à validação.
// IMPORTANTE: cada cor de camada deve DIFERIR da global (cores.roupa='#2d4a8a'),
// pois o §73 OMITE valor igual ao global por byte-stability (isso é correto).
c = validarConfig({ ...base({ roupa: 'rou_camiseta', roupa_inferior: 'rin_jeans', acessorio_pes: 'ace_px_tenis' }),
  coresCamada: { roupa: { roupa: '#c0392b' }, roupa_inferior: { roupa: '#101820' }, acessorio_pes: { roupa: '#e8e8e8' } } });
const cc = c.coresCamada || {};
check('INDEPENDENT_COLORS', (cc.roupa?.roupa === '#c0392b') && (cc.roupa_inferior?.roupa === '#101820') && (cc.acessorio_pes?.roupa === '#e8e8e8'), JSON.stringify(cc));

const falhas = det.filter((d) => d.startsWith('FAIL'));
writeFileSync(process.argv[4] || '/tmp/vest-migra.json', JSON.stringify({ R, det }, null, 2));
console.log('[migra] ' + det.join('\n[migra] '));
console.log('[migra] BOOLEANS: ' + JSON.stringify(R));
process.exit(falhas.length ? 1 : 0);
