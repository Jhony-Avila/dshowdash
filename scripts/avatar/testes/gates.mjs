// testes/gates.mjs — decisão A+ §17/§18: dois portões INDEPENDENTES. Prova que
// a apresentação pode estar 100% verde SEM que a arte fique aprovada (é
// impossível maquiar arte fraca com apresentação); o gate de arte é HUMAN_ONLY
// e, nesta fase, REWORK.
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-gates-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { gateApresentacao, gateArte, apresentacaoNaoMaquiaArte } from '@painel/engine/gates';
const apres = gateApresentacao({ focoFonteUnica:true, cardVsPalco:true, thumbnailPorCategoria:true, materialDeclarado:true });
const arte = gateArte();
const out = {
  apresStatus: apres.status, apresAprovador: apres.aprovador,
  arteStatus: arte.status, arteAprovador: arte.aprovador,
  invariante: apresentacaoNaoMaquiaArte(apres, arte),
  // sanity: apresentação incompleta cai p/ REWORK
  apresParcial: gateApresentacao({ focoFonteUnica:true, cardVsPalco:false, thumbnailPorCategoria:true, materialDeclarado:true }).status,
};
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ GATES — apresentação ≠ arte (A+ §17/§18) ━━');
ok(r.apresStatus === 'MET' && r.apresAprovador === 'motor', `apresentação MET pelo motor (infra A+ pronta)`);
ok(r.arteStatus === 'REWORK' && r.arteAprovador === 'humano', `arte REWORK e só o humano aprova`);
ok(r.invariante === true, `§18: apresentação verde NÃO maquia arte (invariante mantido)`);
ok(r.apresParcial === 'REWORK', `apresentação incompleta → REWORK`);
console.log(falhas ? `\n✗ GATES: ${falhas} falha(s)` : '\n✓ gates verde');
process.exit(falhas ? 1 : 0);
