// shell/TourGuiado.tsx — ONBOARDING guiado do estúdio (briefing §568–§571).
// @version 1.0.0  @created 2026-08-03
//
// Coach marks (§570) na sequência do §569: palco → categorias → catálogo →
// salvar → extras. Dispara na PRIMEIRA visita (localStorage) e pode ser
// reaberto pelo botão "?" do cabeçalho. Realce por anel posicionado sobre
// o alvo real (getBoundingClientRect); Pular sempre disponível (§568 —
// onboarding nunca prende o usuário). Acessível: dialog + foco no card.
import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { flag } from '../nucleo/flags';

export const CHAVE_TOUR = 'dshow.avst5.tour.v1';

export function tourJaVisto(): boolean {
  try { return localStorage.getItem(CHAVE_TOUR) === 'feito'; } catch { return true; }
}
export function marcarTourVisto(): void {
  try { localStorage.setItem(CHAVE_TOUR, 'feito'); } catch { /* sem storage */ }
}

interface Passo { alvo: string; titulo: string; texto: string; }

const PASSOS: Passo[] = [
  { alvo: '.avst5-viewport', titulo: 'Seu palco', texto: 'O avatar vive aqui, sempre em destaque. A câmera aproxima sozinha conforme a categoria que você edita.' },
  { alvo: '.avst5-sidebar', titulo: 'Categorias', texto: 'Rosto, cabelo, roupa, aura… navegue por aqui. Dica: Ctrl+K abre a paleta de comandos para ir a qualquer lugar.' },
  { alvo: '.avst5-painel', titulo: 'Catálogo', texto: 'Passe o mouse num item para EXPERIMENTAR no palco sem aplicar. O ⓘ abre os detalhes completos, com comparação lado a lado.' },
  { alvo: '.avst5-salvar', titulo: 'Salvar', texto: 'Suas mudanças ficam aqui até você salvar — com Desfazer/Refazer (Ctrl+Z) e rascunho automático se algo der errado.' },
  { alvo: '.avst5-header-acoes', titulo: 'Extras', texto: 'Aleatório inteligente (respeita seus bloqueios), Apresentar (showcase cinematográfico) e o modo clássico a um clique.' },
];

// lote 1121-1130 (decisão #114, flag as6.tour_v6 — §568 v2): o tour
// APRESENTA o layout do #112 (dock inferior). Mesmo motor de coach
// marks; só a LISTA muda — off = passos anteriores byte a byte.
const PASSOS_V6: Passo[] = [
  { alvo: '.avst5-viewport', titulo: 'Seu palco', texto: 'O avatar aparece INTEIRO e centralizado — e respira de verdade. Os botões Auto/Rosto/Busto/Corpo (canto de baixo) aproximam a câmera quando você quiser.' },
  { alvo: '.avst5-sidebar', titulo: 'Categorias', texto: 'Rosto, cabelo, roupa, aura… navegue por aqui. Dica: Ctrl+K abre a paleta de comandos para ir a qualquer lugar.' },
  { alvo: '.avst5-painel', titulo: 'Dock de assets', texto: 'A biblioteca virou uma VITRINE aqui embaixo: arraste para o lado (tem inércia!), use as setas nas pontas ou a rodinha do mouse. Clique num card para equipar.' },
  { alvo: '[data-teste="dock-altura"]', titulo: 'Altura da dock', texto: 'Este botão cicla a dock entre compacta, padrão e expandida (grade completa com rolagem). Sua escolha fica salva.' },
  { alvo: '[data-teste="cen-tool"]', titulo: 'Cenário', texto: 'Cenário, hora do dia, iluminação e clima moram neste botão — organizados num painel, longe do rosto do avatar.' },
  { alvo: '.avst5-salvar', titulo: 'Salvar', texto: 'Suas mudanças ficam aqui até você salvar — com Desfazer/Refazer (Ctrl+Z), diff campo a campo em "Detalhes" e rascunho automático.' },
  { alvo: '.avst5-header-acoes', titulo: 'Extras', texto: 'Aleatório inteligente, Apresentar (showcase cinematográfico), prévia 3D e o modo clássico a um clique.' },
];

// mega 299 (§568 v2): passo extra do poder — só com a flag do lote ligada
// (o alvo .avst5-viewport sempre existe; o texto apresenta a novidade)
const PASSO_PODER: Passo = {
  alvo: '.avst5-viewport',
  titulo: 'Poderes por família',
  texto: 'Equipe um efeito ou aura e ative o PODER no modo Studio (tecla A): cada família — Dshow Originals, Tecnológico, Elemental, Cósmico — tem partículas próprias na sua cor.',
};

export function TourGuiado({ aoFechar }: { aoFechar: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const refCard = useRef<HTMLDivElement>(null);
  // mega 299 (§568 v2): a lista cresce com a flag do lote 291-300;
  // #114: com o layout novo (#112) o roteiro é o PASSOS_V6
  const passos = useMemo(() => {
    const base = flag('as6.tour_v6') && flag('as6.dock_inferior') ? PASSOS_V6 : PASSOS;
    return flag('as5.microinteracoes') ? [...base, PASSO_PODER] : base;
  }, []);
  const passo = passos[i];

  useEffect(() => {
    const el = document.querySelector(passo.alvo);
    setRect(el ? el.getBoundingClientRect() : null);
    refCard.current?.focus();
  }, [passo]);

  const fechar = () => { marcarTourVisto(); aoFechar(); };
  const estiloAnel = useMemo(() => (rect ? {
    top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
  } : undefined), [rect]);
  const cardEmCima = rect ? rect.top > window.innerHeight / 2 : false;

  return (
    <div className="avst5-tour" role="dialog" aria-modal="true" aria-label="Tour do estúdio" data-teste="tour">
      {estiloAnel && <div className="avst5-tour-anel" style={estiloAnel} aria-hidden />}
      <div ref={refCard} tabIndex={-1} className={`avst5-tour-card${cardEmCima ? ' avst5-tour-card-cima' : ''}`}
        onKeyDown={(e) => { if (e.key === 'Escape') fechar(); }}>
        <header>
          <em>{i + 1}/{passos.length}</em>
          <strong>{passo.titulo}</strong>
          <button type="button" title="Fechar tour" onClick={fechar}><X size={13} aria-hidden /></button>
        </header>
        <p>{passo.texto}</p>
        <footer>
          <button type="button" className="avst-botao" onClick={fechar}>Pular</button>
          {i > 0 && <button type="button" className="avst-botao" onClick={() => setI(i - 1)}>Voltar</button>}
          <button type="button" className="avst-botao avst-botao-primario" data-teste="tour-proximo"
            onClick={() => (i + 1 < passos.length ? setI(i + 1) : fechar())}>
            {i + 1 < passos.length ? 'Próximo' : 'Começar!'}
          </button>
        </footer>
      </div>
    </div>
  );
}
