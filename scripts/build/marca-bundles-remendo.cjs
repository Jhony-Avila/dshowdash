// marca-bundles-remendo.cjs — IDENTIDADE (ESQUERDA, 23/11/2026; decisão Q-ID.7 em DECISOES-PARA-O-JHONY.md)
// Os bundles do CARREGAMENTO, do LOGIN e do RODAPÉ não têm receita a partir da fonte: a entrada da config de componentes
// (components/<x>/index.ts) reexporta o próprio bundle e a entrada original (PreloaderSystem, startPreloader…) nunca foi
// versionada. Este script é a receita AUDITÁVEL do remendo da marca nesses três bundles, no molde do remendo de 16/09 do
// cabeçalho, porém versionado: (1) exige que o bundle de ENTRADA tenha o sha256 do servido na 1e5db249; (2) faz cada troca
// EXATAMENTE o número de vezes esperado (senão falha e não grava nada); (3) imprime o sha256 de saída.
// Só troca marca (logo, alt, medidas) e o vídeo de fundo que não existe (404) — nenhuma outra lógica.
// Uso: node scripts/build/marca-bundles-remendo.cjs <RAIZ do clone>   (nunca a produção)
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const RAIZ = path.resolve(process.argv[2] || '');
if (!process.argv[2] || /^\/(var\/www|srv\/dshow-releases)\//.test(RAIZ + '/')) { console.error('uso: marca-bundles-remendo.cjs <RAIZ de um clone> — nunca produção/release'); process.exit(2); }
const BR = '/assets/brand/dshow-logo-branco.svg', BRC = '/assets/brand/dshow-logo.svg';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PLANO = {
  'public/components/preloader/dist/preloader.bundle.js': {
    entrada: '5e4ac81d0b6cd8429259de1cbc5b5bc5d6068e48e671ec5efefc460cb6333e57',
    trocas: [
      ['video: { enabled: !0, required: !1, preload: "metadata", autoplay: !0, loop: !0, muted: !0 }',
       'video: { enabled: !1, required: !1, preload: "metadata", autoplay: !0, loop: !0, muted: !0 }', 1],
      ['<video id="loading-video" autoplay loop muted playsinline preload="metadata"><source src="/assets/videos/video_background_site_web.mp4" type="video/mp4">Seu navegador não suporta vídeo HTML5.</video><div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168"',
       `<div class="loading-logo-container dsd-marca-area"><img src="${BR}" alt="DShow" class="loading-logo dsd-marca-logo" width="240" height="81"`, 1],
      ['videoSrc: i = "/assets/videos/video_background_site_web.mp4", logoSrc: a = "/assets/icons/logo-square.png", logoAlt: h = "DshowDash Logo"',
       `videoSrc: i = "", logoSrc: a = "${BR}", logoAlt: h = "DShow"`, 1],
      ['${t ? `<video data-preloader-video', '${t && i ? `<video data-preloader-video', 1],
      ['<div class="preloader-logo-container" data-preloader-logo><img src="${a}" alt="${h}" class="preloader-logo" width="180" height="168"',
       '<div class="preloader-logo-container dsd-marca-area" data-preloader-logo><img src="${a}" alt="${h}" class="preloader-logo dsd-marca-logo" width="240" height="81"', 1],
      ['<div class="loading-logo-container"><img src="/assets/icons/logo-square.png" alt="DshowDash Logo" class="loading-logo" width="180" height="168">',
       `<div class="loading-logo-container dsd-marca-area"><img src="${BR}" alt="DShow" class="loading-logo dsd-marca-logo" width="240" height="81">`, 1],
    ],
  },
  'public/components/login-modal/dist/login-modal.bundle.js': {
    entrada: '5b2c974e70c698e81eb04dfa052884be484f4f6cb3e799afd8abc68d98998e06',
    trocas: [
      ['this._videoSrc = i.src || "/assets/videos/video_background_site_web.mp4"', 'this._videoSrc = i.src || ""', 1],
      ['t.videoSrc || "/assets/videos/video_background_site_web.mp4"', 't.videoSrc || ""', 1],
      ['\n      <video\n        id="${u}-video"\n        class="login-video lm-video"\n        autoplay\n        loop\n        muted\n        playsinline\n        ${E ? \'preload="none"\' : \'preload="metadata"\'}\n        ${E ? "" : `src="${c}"`}\n        loading="lazy"\n        aria-hidden="true"\n        data-testid="login-video"\n        data-video-src="${c}">\n        ${E ? "" : `<source src="${c}" type="video/mp4">`}\n      </video>\n', '\n', 1],
      ['<img src="/assets/icons/logo-horizontal.png" alt="DSHOW DASH" class="lm-logo" loading="lazy" decoding="async" width="120" height="40">',
       `<img src="${BR}" alt="DShow" class="lm-logo dsd-marca-logo" loading="lazy" decoding="async" width="120" height="41">`, 1],
      ['>Login DSHOW DASH</h2>', '>Login DShow</h2>', 1],
      ['this.modal.videoManager = new O(e, { video: i.video, logger: o })',
       'this.modal.videoManager = e && !(i.video && i.video.enabled === !1) ? new O(e, { video: i.video, logger: o }) : null', 1],
    ],
  },
  'public/components/footer/dist/footer.bundle.js': {
    entrada: '707b5b8d4320ea8ad79113c2d73e8a0d2b25c8a6caddd5bbe541d1cfd18b4585',
    trocas: [
      ['<img src="/assets/icons/logo-horizontal.png" alt="Logotipo Dshow" class="dsd-footer__brand-logo-img" loading="lazy" width="120" height="28" />',
       `<img src="${BRC}" alt="DShow" class="dsd-footer__brand-logo-img dsd-marca-logo dsd-marca--claro" loading="lazy" width="83" height="28" /><img src="${BR}" alt="DShow" class="dsd-footer__brand-logo-img dsd-marca-logo dsd-marca--escuro" loading="lazy" width="83" height="28" />`, 1],
    ],
  },
};
const saidas = {}; let erros = 0;
for (const [rel, p] of Object.entries(PLANO)) {
  const f = path.join(RAIZ, rel); let s = fs.readFileSync(f, 'utf8');
  if (sha(Buffer.from(s, 'utf8')) !== p.entrada) { console.error(`✗ ${rel}: entrada não é o bundle servido da 1e5db249 (sha diferente) — nada gravado`); erros++; continue; }
  for (const [de, para, n] of p.trocas) {
    const k = s.split(de).length - 1;
    if (k !== n) { console.error(`✗ ${rel}: "${de.slice(0, 60)}…" aparece ${k}× (esperado ${n})`); erros++; continue; }
    s = s.split(de).join(para);
  }
  saidas[f] = s;
}
if (erros) { console.error(`REMENDO RECUSADO: ${erros} problema(s); nenhum arquivo gravado`); process.exit(1); }
for (const [f, s] of Object.entries(saidas)) { fs.writeFileSync(f, s); console.log(`✓ ${path.relative(RAIZ, f)} · sha256 ${sha(Buffer.from(s, 'utf8'))}`); }
console.log('REMENDO OK');
