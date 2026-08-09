// testes/contextos-v6.mjs — lote 1201–1210 (decisão #122, flag
// as6.contextos_v6): Universal Avatar Component fase 1 (AS6 Parte 13).
//   A) flag ON: window.AvatarStudioUniversal.montarAvatar existe; monta
//      avatar SALVO (espelho §619) num elemento vanilla; sem espelho =
//      placeholder determinístico; atualiza AO VIVO quando o espelho
//      muda (evento de save); o drawer de contextos ganha o card
//      "Como o dash monta (produção)".
//   B) rollback §651: flag OFF = sem API global e sem card.
// @version 1.0.0  @created 2026-08-09
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const CONFIG = { base: 'rosto_redondo', camadas: {}, cores: { pele: '#e8b88a', cabelo: '#4a3628', roupa: '#3b5bd9', destaque: '#7c5cff' } };

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.evaluate(() => typeof window.AvatarStudioUniversal?.montarAvatar === 'function'),
      'API global ausente com a flag ON');
    // monta num elemento vanilla SEM espelho salvo → placeholder
    const semSalvo = await p.evaluate(() => {
      localStorage.removeItem('dshow.avatar.config.v1');
      const el = document.createElement('span');
      document.body.appendChild(el);
      window.__desligarUni = window.AvatarStudioUniversal.montarAvatar(el, { tamanho: 44 });
      window.__elUni = el;
      return { attr: el.getAttribute('data-avatar-universal'), temSvg: !!el.querySelector('svg'), largura: el.style.width };
    });
    ok(semSalvo.attr === 'placeholder' && semSalvo.temSvg && semSalvo.largura === '44px',
      `sem espelho deveria montar placeholder 44px (${JSON.stringify(semSalvo)})`);
    // grava o espelho §619 e dispara o evento de save → atualiza ao vivo
    const aoVivo = await p.evaluate((cfg) => {
      localStorage.setItem('dshow.avatar.config.v1', JSON.stringify(cfg));
      window.dispatchEvent(new CustomEvent('avst:salvou', { detail: {} }));
      const el = window.__elUni;
      return { attr: el.getAttribute('data-avatar-universal'), svg: el.innerHTML.length };
    }, CONFIG);
    ok(aoVivo.attr === 'salvo' && aoVivo.svg > 500, `espelho salvo deveria re-renderizar ao vivo (${JSON.stringify(aoVivo)})`);
    // desmontar remove listeners (não re-renderiza mais)
    await p.evaluate(() => {
      window.__desligarUni();
      localStorage.removeItem('dshow.avatar.config.v1');
      window.dispatchEvent(new CustomEvent('avst:salvou', { detail: {} }));
    });
    ok(await p.evaluate(() => window.__elUni.getAttribute('data-avatar-universal')) === 'salvo',
      'desmontar deveria congelar o componente (listener removido)');
    // drawer de contextos mostra o card do componente universal
    await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Todos os contextos'))?.click(); });
    await p.waitForTimeout(600);
    ok(await p.locator('[data-teste="ctx-universal"]').count() === 1, 'card do componente universal ausente no drawer');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as6.contextos_v6': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.evaluate(() => typeof window.AvatarStudioUniversal === 'undefined'),
      'flag OFF ainda expõe a API global');
    await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Todos os contextos'))?.click(); });
    await p.waitForTimeout(600);
    ok(await p.locator('[data-teste="ctx-universal"]').count() === 0, 'flag OFF ainda mostra o card universal');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[contextos-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[contextos-v6] FALHAS: nenhuma');
console.log('[contextos-v6] ERROS JS: nenhum');
