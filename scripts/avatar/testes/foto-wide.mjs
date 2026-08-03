// testes/foto-wide.mjs — AS5 §325: FOTO WIDE (header 3:1, banner 4:1,
// wallpaper 16:9) — seletor de formato, preview redimensionado, moldura
// desabilitada fora do Perfil e export dimensionado.
// @version 1.0.0  @created 2026-08-03
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 940 } });
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// PNG 96×96 gerado em memória (mesmo padrão do foto-f6)
const png = await p.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#e8734c'; g.fillRect(0, 0, 96, 96);
  return c.toDataURL('image/png').split(',')[1];
});

await p.evaluate(() => { localStorage.removeItem('dshow.avst.foto.estilo.v1'); });
await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
await p.waitForTimeout(600);
await p.locator('input[type="file"]').first().setInputFiles({
  name: 'wide.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
});
await p.waitForTimeout(800);
await p.locator('button', { hasText: 'Estilizar' }).click();
await p.waitForTimeout(600);

// R1: seletor com os 4 formatos, Perfil ativo por padrão, preview 1:1
ok(await p.locator('[data-teste="formatos-foto"] .avst-ft-chip').count() === 4,
  'esperava 4 chips de formato');
ok(await p.locator('[data-teste="formatos-foto"] .avst-ft-chip[aria-checked="true"]').textContent()
  .then((t) => t?.includes('Perfil')), 'Perfil deveria ser o formato padrão');
const vb = (f) => p.locator('.avst-ft-preview svg').getAttribute('viewBox').then((v) => v?.split(' ').map(Number));
const vbPerfil = await vb();
ok(vbPerfil?.[2] === 240 && vbPerfil?.[3] === 240, `perfil deveria ser 240×240 (${vbPerfil})`);

// R2: template + formato HEADER → viewBox 720×240 (3:1), medalhão presente
await p.locator('.avst-ft-template', { hasText: 'Cyber Profile' }).click();
await p.waitForTimeout(400);
await p.locator('[data-teste="formatos-foto"] .avst-ft-chip', { hasText: 'Header' }).click();
await p.waitForTimeout(500);
const vbHeader = await vb();
ok(vbHeader?.[2] === 720 && vbHeader?.[3] === 240, `header deveria ser 720×240 (${vbHeader})`);
const svgHeader = await p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);
ok(svgHeader.includes('<image'), 'header deveria conter a foto (medalhão à esquerda)');
ok(svgHeader.includes('scale(3 1)'), 'fundo do header deveria esticar 3× na largura');
ok(await p.locator('[data-teste="nota-wide"]').count() === 1, 'nota do formato wide ausente');
await p.screenshot({ path: `${SAIDA}/wide-header.png` });

// R3: moldura DESABILITADA fora do Perfil (a composição a omite)
const molduraDesabilitada = await p.evaluate(() => {
  const grupo = [...document.querySelectorAll('.avst-ft-grupo')]
    .find((g) => g.querySelector('.avst-ft-rotulo')?.textContent?.includes('Moldura'));
  const chips = [...(grupo?.querySelectorAll('.avst-ft-chip') ?? [])];
  return chips.length > 0 && chips.every((c) => c.disabled);
});
ok(molduraDesabilitada, 'chips de moldura deveriam estar desabilitados no formato wide');

// R4: BANNER 4:1 e WALLPAPER 16:9 mudam a caixa; escala 1×/2×/4× some no wide
await p.locator('[data-teste="formatos-foto"] .avst-ft-chip', { hasText: 'Banner' }).click();
await p.waitForTimeout(400);
const vbBanner = await vb();
ok(vbBanner?.[2] === 960, `banner deveria ter caixa 960 de largura (${vbBanner})`);
await p.locator('[data-teste="formatos-foto"] .avst-ft-chip', { hasText: 'Wallpaper' }).click();
await p.waitForTimeout(400);
const vbWall = await vb();
ok(Math.abs((vbWall?.[2] ?? 0) - 426.7) < 0.01, `wallpaper deveria ter caixa 426.7 (${vbWall})`);
ok(await p.locator('.avst-ft-escala').count() === 0, 'escala 1×/2×/4× deveria sumir nos formatos wide');

// R5: EXPORT dimensionado — intercepta o clique de download (data-url PNG)
const download = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let capturado = null;
  HTMLAnchorElement.prototype.click = function () { capturado = { href: this.href, nome: this.download }; };
  [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Baixar PNG'))?.click();
  for (let i = 0; i < 60 && !capturado; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!capturado) return null;
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = capturado.href; });
  return { nome: capturado.nome, w: img.naturalWidth, h: img.naturalHeight };
});
ok(download?.w === 1920 && download?.h === 1080,
  `wallpaper deveria exportar 1920×1080 (saiu ${download?.w}×${download?.h})`);
ok(download?.nome === 'dshow-wallpaper-1920x1080.png', `nome do arquivo inesperado (${download?.nome})`);

// R6: voltar ao Perfil restaura o quadrado e reabilita moldura
await p.locator('[data-teste="formatos-foto"] .avst-ft-chip', { hasText: 'Perfil' }).click();
await p.waitForTimeout(400);
const vbVolta = await vb();
ok(vbVolta?.[2] === 240, `voltar ao Perfil deveria restaurar 240 (${vbVolta})`);
ok(await p.locator('.avst-ft-escala').count() === 1, 'escala deveria voltar no Perfil');

const ok_ = relatorio('foto-wide', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
