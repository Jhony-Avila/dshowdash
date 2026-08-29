// sidebar-wiring-proof.mjs — Track D onda 2 (item 3 / #D-m15): PROVA determinística
// (contrato de origem) do bug de wiring do setup-coordinator e da correção.
// O handler real importa caminhos web-absolutos (/core/...) não resolvíveis no
// Node, então a prova é por CONTRATO DE ORIGEM: lê os arquivos reais e confirma
// que os SHAPES passados batem com a desestruturação do handler.
//   Bug: setupOverlayClick recebia a FUNÇÃO onCloseMobile, mas o handler faz
//        `const {container,eventBus,onClose} = deps` → onClose undefined → o
//        backdrop escondia mas o engine nunca fechava. setupMobileDetect recebia
//        {onMobileChange,onCloseMobile}, mas o handler lê {container,eventBus,
//        breakpoint} e ignorava os callbacks + container undefined.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));
const COORD = readFileSync(root('public/components/sidebar/lifecycle/setup-coordinator.ts'), 'utf8');
const HANDLER = readFileSync(root('public/components/sidebar/features/mobile-handler.ts'), 'utf8');
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

// contrato do handler (o que ele espera receber)
ok(/setupOverlayClick\(dependencies[^)]*\)\s*\{[\s\S]*?const\s*\{\s*container\s*,\s*eventBus\s*,\s*onClose\s*\}\s*=\s*dependencies/.test(HANDLER),
  'handler: setupOverlayClick desestrutura {container, eventBus, onClose}');
ok(/setupMobileHandler\(dependencies[^)]*\)\s*\{[\s\S]*?const\s*\{\s*container\s*,\s*eventBus\s*,\s*breakpoint[^}]*onMobileChange\s*\}\s*=\s*dependencies/.test(HANDLER),
  'handler: setupMobileHandler agora desestrutura onMobileChange (antes ignorado)');
ok(/if\s*\(\s*typeof\s+onMobileChange\s*===\s*'function'\s*\)\s*\{\s*try\s*\{\s*onMobileChange\(_isMobile\)/.test(HANDLER),
  'handler: setupMobileHandler CHAMA onMobileChange(_isMobile) ao cruzar o breakpoint');

// contrato do coordenador (o que ele passa) — DEVE bater com o handler
ok(/setupOverlayClick\(\s*\{\s*container:\s*sidebar\s*,\s*onClose:\s*onCloseMobile\s*\}\s*\)/.test(COORD),
  'coordenador: setupOverlayClick recebe {container: sidebar, onClose: onCloseMobile} (correto)');
ok(!/setupOverlayClick\(\s*onCloseMobile\s*\)/.test(COORD),
  'coordenador: NÃO passa mais a função crua a setupOverlayClick (bug removido)');
ok(/setupMobileDetect\(\s*\{[\s\S]*?container:\s*sidebar[\s\S]*?onMobileChange/.test(COORD),
  'coordenador: setupMobileDetect recebe {container: sidebar, ..., onMobileChange} (correto)');

// prova lógica do bug antigo: uma função não tem propriedade .onClose
const fn = () => {}; ok(fn.onClose === undefined,
  'BUG comprovado: destructuring {onClose} de uma FUNÇÃO → undefined (por isso o engine não fechava)');

console.log(falhas ? `\n✗ sidebar-wiring-proof: ${falhas} falha(s)` : '\n✓ sidebar-wiring-proof verde (bug provado + correção provada por contrato de origem)');
process.exit(falhas ? 1 : 0);
