// art-intake/resolver.mjs — passa o ativo LIMPO pelo MOTOR REAL de importação.
//
// Regra de ouro do intake (§): o gate NÃO tem parser paralelo nem “mock” do
// pipeline. Depois que segurança+contrato passam, o SVG autorado atravessa o
// MESMÍSSIMO engine/heroAssetImport.ts que a produção usa (importarHeroAsset) —
// via esbuild+@painel, o padrão já provado em testes/hero-import.mjs. O que sai
// daqui são os fragmentos RESOLVIDOS (uid/cores/materiais aplicados, data-*
// removidos) por hook e por paleta — exatamente o que o catálogo renderiza.
//
// Determinismo: mesma entrada ⇒ mesmos bytes (o teste art-intake cobre 2×).
// @version 1.0.0  @created 2026-08-27  (GOLDEN V4.3 FINAL — ART INTAKE GATE)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');

/** Remove a casca externa <svg>…</svg>: o import consome o CONTEÚDO INTERNO. */
export function conteudoInterno(svg) {
  const m = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i);
  return (m ? m[1] : svg).replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Resolve um ativo pelo motor real, em duas paletas (A default / B usuário).
 * @param {{manifesto:object, svg:string}} asset  — svg = conteúdo INTERNO.
 * @param {{A?:object,B?:object}} paletas — cores por slot.
 * @returns {{ok:boolean, erro?:string, dados?:object}}
 */
export function resolverPeloMotor(asset, paletas = {}) {
  const A = paletas.A || { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#2b3550', destaque: '#c8892e' };
  const B = paletas.B || { pele: '#c98a5e', cabelo: '#101018', roupa: '#7a1f1f', destaque: '#1f7a5a' };
  const tmp = mkdtempSync(join(tmpdir(), 'avst-intake-'));
  try {
    writeFileSync(join(tmp, 'asset.json'), JSON.stringify(asset));
    writeFileSync(join(tmp, 'pal.json'), JSON.stringify({ A, B }));
    writeFileSync(join(tmp, 'prova.ts'), `
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { importarHeroAsset, parseAsset } from '@painel/engine/heroAssetImport';
import { paletaDe } from '@painel/engine/cores';
import type { HeroAsset2D } from '@painel/domain/heroAsset';
const asset = JSON.parse(readFileSync(${JSON.stringify(join(tmp, 'asset.json'))}, 'utf8')) as HeroAsset2D;
const { A, B } = JSON.parse(readFileSync(${JSON.stringify(join(tmp, 'pal.json'))}, 'utf8'));
const def = importarHeroAsset(asset);
const parsed = parseAsset(asset);
const pA = paletaDe(A); const pB = paletaDe(B);
const sha = (s:string) => createHash('sha256').update(s).digest('hex');
const uid = 'ai';
const hooks = (p:any) => ({
  render: def.render(p, uid),
  atras: def.renderAtras ? def.renderAtras(p, uid) : '',
  sombra: def.renderSombra ? def.renderSombra(p, uid) : '',
  frente: def.renderFrente ? def.renderFrente(p, uid) : '',
});
const hA = hooks(pA); const hB = hooks(pB); const hA2 = hooks(pA);
const junta = (h:any) => h.atras + h.sombra + h.render + h.frente;
const out = {
  usaCores: def.usaCores,
  anchors: (asset.anchors || []).map((a:any) => ({ nome:a.nome, x:a.x, y:a.y })),
  temHooks: { atras: !!def.renderAtras, sombra: !!def.renderSombra, frente: !!def.renderFrente, corpoV2: !!def.renderCorpoV2 },
  buckets: Object.fromEntries(Object.entries(parsed.buckets).map(([k,v]:any)=>[k,(v as any[]).length])),
  A: hA, B: hB,
  shaA: sha(junta(hA)), shaA2: sha(junta(hA2)), shaB: sha(junta(hB)),
  semDataAttr: !/data-(hero|hero-layer|channel|tone|paint|material|anchor)=/.test(junta(hA)+junta(hB)),
};
process.stdout.write(JSON.stringify(out));
`);
    const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
    execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'pipe'] });
    const dados = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
    return { ok: true, dados };
  } catch (e) {
    return { ok: false, erro: (e && e.message ? e.message : String(e)).slice(0, 400) };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
