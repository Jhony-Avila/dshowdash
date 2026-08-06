// shell/foco.ts — FOCUS TRAP acessível (mega 301 · P10/§548).
// @version 1.0.0  @created 2026-08-05
//
// Um listener de keydown DELEGADO no documento prende o Tab dentro do
// último dialog aberto ([role="dialog"][aria-modal="true"]) — padrão
// WAI-ARIA. Delegação = os dialogs existentes (11 no shell) ganham o
// trap SEM tocar em cada componente; abrir/fechar continua deles.
// Desligável junto com o lote (flag as5.microinteracoes — P10 faz parte
// da onda; sem a flag o comportamento volta ao de antes, §651).
import { flag } from '../nucleo/flags';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let instalado = false;

function aoTab(e: KeyboardEvent): void {
  if (e.key !== 'Tab' || !flag('as5.microinteracoes')) return;
  const dialogos = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]');
  const topo = dialogos[dialogos.length - 1];
  if (!topo) return;
  const focaveis = [...topo.querySelectorAll<HTMLElement>(FOCAVEIS)]
    .filter((el) => el.offsetParent !== null); // visíveis
  if (focaveis.length === 0) return;
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  const ativo = document.activeElement as HTMLElement | null;
  const dentro = ativo ? topo.contains(ativo) : false;
  if (!dentro) { e.preventDefault(); primeiro.focus(); return; }
  if (e.shiftKey && ativo === primeiro) { e.preventDefault(); ultimo.focus(); return; }
  if (!e.shiftKey && ativo === ultimo) { e.preventDefault(); primeiro.focus(); }
}

/** Instala o trap uma única vez (idempotente); devolve o desinstalador. */
export function instalarFocoPreso(): () => void {
  if (instalado) return () => { /* já ativo */ };
  instalado = true;
  document.addEventListener('keydown', aoTab, true);
  return () => {
    instalado = false;
    document.removeEventListener('keydown', aoTab, true);
  };
}
