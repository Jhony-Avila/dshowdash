// shell/BarraContexto.tsx — BARRA CONTEXTUAL da categoria ativa (onda
// 1291, decisão #134, flag as6.ctx_barra; AS6 §322–§325 + briefing UX
// do Jhony 2026-08-10 §12–§15).
// @version 1.0.0  @created 2026-08-10
//
// Substitui a dica "Contexto: …" que aparecia na pill de anúncio do
// canto (fundo escuro FIXO + texto por token — ilegível no tema claro).
// Aqui: superfície e texto 100% por tokens (--avst-painel/--avst-texto,
// legível nos DOIS temas), posição estável ABAIXO da toolbar no fluxo do
// viewport (nunca cobre o avatar, nunca desloca layout ao trocar de
// categoria), título curto + texto orientado à ação (§14) e dispensa
// persistida (dicas são não-essenciais — o X desliga para sempre; a
// preferência é local e reversível limpando a chave).
// aria-live="polite" no texto: o screen reader segue anunciando a troca
// de contexto (paridade com o anúncio antigo), sem excesso — só muda
// quando a categoria muda (§322).
import { useState } from 'react';
import { Info, X } from 'lucide-react';
import type { CategoriaId } from '../domain/types';
import { CONTEXTOS } from '../workspace/contexto';
import { t } from '../nucleo/i18n';

const CHAVE_CTXBAR = 'dshow.avst6.ctxbar.v1';

function dispensada(): boolean {
  try { return localStorage.getItem(CHAVE_CTXBAR) === '0'; } catch { return false; }
}

export function BarraContexto({ categoria }: { categoria: CategoriaId }) {
  const [oculta, setOculta] = useState(dispensada);
  if (oculta) return null;
  const ctx = CONTEXTOS[categoria];
  if (!ctx) return null;
  return (
    <div className="avst6-ctx-barra" data-teste="ctx-barra" role="status" aria-live="polite">
      <Info size={13} aria-hidden />
      <strong>{t(ctx.titulo)}</strong>
      <span title={ctx.texto}>{t(ctx.texto)}</span>
      <button type="button" data-teste="ctx-barra-fechar"
        title={t('Dispensar dicas de contexto')} aria-label={t('Dispensar dicas de contexto')}
        onClick={() => {
          setOculta(true);
          try { localStorage.setItem(CHAVE_CTXBAR, '0'); } catch { /* sem storage */ }
        }}><X size={12} aria-hidden /></button>
    </div>
  );
}
