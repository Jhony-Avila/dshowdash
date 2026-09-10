// catalogo-contrato.mjs — teste CONTRATUAL (Node puro, sem browser) do catálogo V2 (#54).
// Garante que o VisualComposer usa a FONTE ÚNICA de enquadramento (focoItemDe) e NÃO volta a
// chamar svgItemIsolado(it.id) cru nas grades. Falha (exit 1) se o contrato for violado.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VC = join(RAIZ, 'public/components/panels/panel-avatar-studio/src/vc/VisualComposer.tsx');
const src = readFileSync(VC, 'utf8');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// 1) importa focoItemDe (fonte única de enquadramento)
ok(/import\s*\{[^}]*focoItemDe[^}]*\}\s*from\s*['"][^'"]*modoItem['"]/.test(src), 'VC não importa focoItemDe de components/modoItem');
// 2) NÃO chama svgItemIsolado(it.id) cru (sem foco) — as grades devem usar o helper com foco
ok(!/svgItemIsolado\(it\.id\)\s*\}\}/.test(src), 'VC ainda chama svgItemIsolado(it.id) CRU numa grade (sem foco canônico)');
// 3) usa o foco canônico via focoItemDe no thumbnail
ok(/foco:\s*focoItemDe\(/.test(src), 'VC não passa foco: focoItemDe(...) ao svgItemIsolado');
// 4) o flag gating existe (rollback §651) e não é enquadramento hardcoded
ok(/flag\(['"]as6\.catalogo_v2['"]\)/.test(src), 'VC não gate por as6.catalogo_v2');
ok(!/focoRecorteCatalogo/.test(src), 'VC contém foco hardcoded (focoRecorteCatalogo) — proibido, usar focoItemDe');

console.log('[catalogo-contrato] ' + (falhas.length ? 'FALHAS: ' + falhas.join(' || ') : 'contrato OK (foco canônico, sem hardcode, gated)'));
process.exit(falhas.length ? 1 : 0);
