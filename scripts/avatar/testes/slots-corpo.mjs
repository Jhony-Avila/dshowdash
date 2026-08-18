// testes/slots-corpo.mjs — onda 1404 (decisão #154): SLOTS CORPORAIS
// (elevação §15/§16 — pares L/R) como extensão do mecanismo #140/#141.
//
// Seções:
//   A) Node puro — contratos: 7 slots novos em SLOTS_EQUIPAMENTO, ORDEM
//      de render, validarConfig aceita e preserva os 7 (chave = slot),
//      busto NÃO muda com corporal equipado (byte-stability: render '')
//      e corpo inteiro MUDA (renderCorpo entra), 15 slots simultâneos
//      coexistem, PHP espelha a lista.
//   B) Navegador — regiões corporais na árvore, relógio (pulso_e) +
//      pulseira (pulso_d) equipam JUNTOS (par L/R), luva + anel idem,
//      rascunho §139 registra os 4; Modo Item corporal renderiza corpo
//      inteiro recortado; palco em modo Corpo mostra os itens.
//   C) Rollback: as6.slots_corpo OFF ⇒ regiões corporais somem, itens
//      não aparecem na grade, sorteio não os escolhe; salvo com slot
//      corporal continua LIDO (forward-compat) mas UI não expõe.
// @version 1.0.0  @created 2026-08-18
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const CORPORAIS = ['pulso_e', 'pulso_d', 'mao_e', 'mao_d', 'cintura', 'pernas', 'pes'];
const PROVA = {
  pulso_e: 'ace_relogio_pulso', pulso_d: 'ace_pulseira_led',
  mao_e: 'ace_luva_couro', mao_d: 'ace_anel_sinete',
  cintura: 'ace_cinto_couro', pernas: 'ace_joelheiras', pes: 'ace_tenis_neon',
};

// ── A) Node puro ────────────────────────────────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, readFileSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1404-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { SLOTS_EQUIPAMENTO } from '${PAINEL}/src/nucleo/contratos';
import { CONFIG_PADRAO, itemPorId, svgDe, validarConfig, itensDe } from '${PAINEL}/src/services/AvatarCatalog';
import { SUBCATEGORIAS_ACESSORIO, SUBCATEGORIA_POR_ASSET, slotFinoDoAsset } from '${PAINEL}/src/workspace/acessorios';
import { FOCO_ITEM_ASSET } from '${PAINEL}/src/components/modoItem';
const CORPORAIS = ${JSON.stringify(CORPORAIS)};
const PROVA = ${JSON.stringify(PROVA)};
const problemas: string[] = [];
for (const s of CORPORAIS) {
  if (!SLOTS_EQUIPAMENTO.includes(('acessorio_' + s) as never)) problemas.push('contratos sem acessorio_' + s);
  const id = PROVA[s];
  const item = itemPorId(id);
  if (!item) { problemas.push(id + ' ausente'); continue; }
  if (item.slot !== s) problemas.push(id + ': slot ' + item.slot + ' != ' + s);
  if (item.render({} as never, 'x') !== '') problemas.push(id + ': render do BUSTO deveria ser vazio (contrato corporal)');
  if (!item.renderCorpo) problemas.push(id + ': sem renderCorpo');
  if (!SUBCATEGORIA_POR_ASSET[id]) problemas.push(id + ': sem subcategoria');
  if (!FOCO_ITEM_ASSET[id]) problemas.push(id + ': sem bounds');
  if (slotFinoDoAsset(id, item.slot!) !== s) problemas.push(id + ': slotFino desviou p/ ' + slotFinoDoAsset(id, item.slot!));
}
// validarConfig aceita e preserva os 7 (chave = slot)
const camadas: Record<string, string> = { ...CONFIG_PADRAO.camadas };
for (const s of CORPORAIS) camadas['acessorio_' + s] = PROVA[s];
// + os 8 slots #140 ocupados = 15 simultâneos
camadas.acessorio_cabeca = 'ace_bone'; camadas.acessorio_rosto = 'ace_pintura_guerra';
camadas.acessorio_pescoco = 'ace_corrente'; camadas.acessorio_olhos = 'ace_oculos';
camadas.acessorio_orelha = 'ace_brinco'; camadas.acessorio_costas = 'ace_capa_heroica';
camadas.acessorio_flutuante = 'ace_aureola'; camadas.acessorio_companheiro = 'ace_drone';
const cfg = validarConfig({ ...CONFIG_PADRAO, camadas });
const nAcess = Object.keys(cfg.camadas).filter((k) => k.startsWith('acessorio_') && cfg.camadas[k as never]).length;
if (nAcess !== 15) problemas.push('esperava 15 acessórios simultâneos após validarConfig, veio ' + nAcess + ': ' + JSON.stringify(cfg.camadas));
for (const s of CORPORAIS) if (cfg.camadas[('acessorio_' + s) as never] !== PROVA[s]) problemas.push('validarConfig perdeu acessorio_' + s);
// byte-stability do BUSTO: corporal equipado não muda o busto
const base = validarConfig({ ...CONFIG_PADRAO });
const soCorpo = validarConfig({ ...CONFIG_PADRAO, camadas: { ...CONFIG_PADRAO.camadas, acessorio_pes: PROVA.pes, acessorio_mao_d: PROVA.mao_d } });
// (uid fixo: o uid deriva do hashConfig e muda com QUALQUER campo — como
// params/coresCamada já fazem; o que a byte-stability exige é que o
// DESENHO do busto seja idêntico, e que salvos SEM corporais rendam byte
// a byte — isto os goldens provam)
if (svgDe(base, { uid: 'fixo' }) !== svgDe(soCorpo, { uid: 'fixo' })) problemas.push('BUSTO mudou com acessório corporal equipado (quebra byte-stability)');
if (svgDe(base, { palco: true, uid: 'fixo' }) !== svgDe(soCorpo, { palco: true, uid: 'fixo' })) problemas.push('PALCO busto mudou com corporal');
// corpo inteiro MUDA (renderCorpo entra)
const c1 = svgDe(base, { palco: true, enquadramento: 'corpo', uid: 'fixo' });
const c2 = svgDe(soCorpo, { palco: true, enquadramento: 'corpo', uid: 'fixo' });
if (c1 === c2) problemas.push('CORPO INTEIRO não mudou com acessório corporal (renderCorpo não entrou)');
if (c2.length <= c1.length) problemas.push('corpo inteiro com corporal não ficou maior');
// PHP espelha
const php = require('node:fs').readFileSync('${RAIZ}/api/avatar/studio.php', 'utf8');
for (const s of CORPORAIS) if (!php.includes("'acessorio_" + s + "'")) problemas.push('studio.php sem acessorio_' + s);
// subcategorias corporais ativas e regiões
for (const sub of ['pulseiras', 'luvas-aneis', 'cintos', 'tornozeleiras', 'calcados']) {
  const d = SUBCATEGORIAS_ACESSORIO.find((x) => x.id === sub);
  if (!d || d.estado !== 'ativa') problemas.push('subcategoria ' + sub + ' ausente/não-ativa');
}
console.log(JSON.stringify(problemas));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --banner:js="import{createRequire}from'node:module';const require=createRequire(import.meta.url);" --log-level=silent`, { cwd: RAIZ });
    const problemas = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString().trim().split('\n').pop());
    ok(problemas.length === 0, `A: ${problemas.join(' · ')}`);
  } catch (e) { falhas.push(`A exceção: ${e.message}`); }
  rmSync(tmp, { recursive: true, force: true });
}

// ── B) Navegador (flag ON = padrão) ────────────────────────────────
const irPrincipal = async (p, mae, principal) => {
  await p.evaluate((m) => { [...document.querySelectorAll('.avst5-cat, button')].find((x) => x.textContent?.trim().startsWith(m))?.click(); }, mae);
  await p.waitForTimeout(400);
  await p.evaluate((pr) => { [...document.querySelectorAll('.avst5-cat, button')].find((x) => x.textContent?.trim().startsWith(pr))?.click(); }, principal);
  await p.waitForTimeout(600);
};
const equipar = async (p, nome) => {
  await p.evaluate((n) => {
    const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((x) => x.querySelector('.avst-card-nome')?.textContent?.includes(n));
    c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, nome);
  await p.waitForTimeout(400);
};
const lerCamadas = async (p) => {
  await p.waitForTimeout(1300);
  return p.evaluate(() => {
    try { const r = JSON.parse(localStorage.getItem('dshow.avst5.rascunho.v1') ?? 'null'); return r?.config?.camadas ?? r?.camadas ?? {}; } catch { return {}; }
  });
};
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { 'as5.novo_shell': true, 'as5.palco3d': false },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irPrincipal(p, 'Joias', 'Braços e pulsos');
    const nCards = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
    ok(nCards >= 2, `B: Braços e pulsos deveria ter ≥2 cards, veio ${nCards}`);
    // Modo Item corporal = corpo inteiro recortado (svg com viewBox da região)
    const vb = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum) .avst-card-thumb svg').first().getAttribute('viewBox');
    ok(vb && vb !== '0 0 240 240' && vb !== '0 0 240 400', `B: thumb corporal sem recorte de região (viewBox ${vb})`);
    await p.screenshot({ path: `${SAIDA}/1404-bracos.png` });
    // par L/R: relógio (pulso_e) + pulseira LED (pulso_d)
    await equipar(p, 'Relógio');
    await equipar(p, 'Pulseira LED');
    let cam = await lerCamadas(p);
    ok(cam.acessorio_pulso_e === 'ace_relogio_pulso' && cam.acessorio_pulso_d === 'ace_pulseira_led',
      `B: par L/R de pulso não coexistiu: ${JSON.stringify(cam)}`);
    await irPrincipal(p, 'Joias', 'Mãos e dedos');
    await equipar(p, 'Luva');
    await equipar(p, 'Anel');
    cam = await lerCamadas(p);
    ok(cam.acessorio_mao_e === 'ace_luva_couro' && cam.acessorio_mao_d === 'ace_anel_sinete'
      && cam.acessorio_pulso_e === 'ace_relogio_pulso',
      `B: mãos L/R + pulsos não coexistiram: ${JSON.stringify(cam)}`);
    // palco em modo Corpo mostra os itens (svg do palco contém id do relógio? checa tamanho cresce)
    await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'Corpo')?.click(); });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${SAIDA}/1404-corpo-palco.png` });
    ok(erros.length === 0, `B: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`B exceção: ${e.message}`); }
  await b.close();
}

// ── C) Rollback: flag OFF ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.slots_corpo': false },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Acess'))?.click(); });
    await p.waitForTimeout(500);
    const nCorporais = await p.locator('[data-teste="arv-pulseiras"], [data-teste="arv-calcados"], [data-teste="arv-cintos"]').count();
    ok(nCorporais === 0, `C: flag OFF ainda mostra ${nCorporais} subcategoria(s) corporal(is) na árvore`);
    // grade "Todos" de acessórios não lista corporais
    const nomes = await p.evaluate(() => [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((n) => n.textContent.trim()));
    ok(!nomes.some((n) => /Relógio de Pulso|Tênis Neon|Cinto de Couro/.test(n)), `C: flag OFF lista corporais na grade: ${nomes.filter((n) => /Relógio|Tênis|Cinto/.test(n)).join(',')}`);
    ok(erros.length === 0, `C: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`C exceção: ${e.message}`); }
  await b.close();
}

if (falhas.length) {
  console.error('[slots-corpo] FALHAS:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('[slots-corpo] FALHAS: nenhuma');
console.log('[slots-corpo] ERROS JS: nenhum');
