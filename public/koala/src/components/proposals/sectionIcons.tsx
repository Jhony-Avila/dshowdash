import type { ReactNode } from 'react';

// Ícones dos cabeçalhos dos grupos do editor. Mesmo padrão/estilo da sidebar do Koala
// (SVG inline, viewBox 24, stroke currentColor 1.8, traços limpos) — SEM biblioteca nova.
// A cor vem do CSS (.k-sec-ico): cinza discreto, roxo do Koala quando o grupo está aberto.
function ico(paths: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
}

export const SECTION_ICONS: Record<string, ReactNode> = {
  // Dados da proposta = documento/ficha (reusa a forma de "Propostas" da sidebar)
  proposal: ico(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>),
  // Cliente = prédio (pessoa jurídica)
  client: ico(<><path d="M3 21h18" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M9.5 7h.01M14.5 7h.01M9.5 11h.01M14.5 11h.01M9.5 15h.01M14.5 15h.01" /></>),
  // Contatos = pessoas
  contacts: ico(<><circle cx="9" cy="8" r="3" /><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /><path d="M17.5 20c0-2.3-.8-4-2.2-5" /></>),
  // Endereço = pin de mapa
  address: ico(<><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></>),
  // Vendedor = crachá (pessoa identificada)
  seller: ico(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9.5 3h5" /><circle cx="12" cy="10" r="2.4" /><path d="M8 16.5c0-2 1.8-3 4-3s4 1 4 3" /></>),
  // Itens = lista (reusa "Itens" da sidebar)
  items: ico(<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>),
  // Despesas = recibo (distinto de Totais)
  expenses: ico(<><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.4L10 21l-2.5-1.5L5 21z" /><path d="M9 8h6M9 12h5" /></>),
  // Totais = calculadora
  totals: ico(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8" /><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>),
  // Formas de pagamento = cartão (reusa "Pagamentos" da sidebar)
  payments: ico(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
  // Publicação = link/corrente
  publish: ico(<><path d="M9 15l6-6" /><path d="M11 6.5l1-1a4 4 0 0 1 5.7 5.7l-1 1" /><path d="M13 17.5l-1 1a4 4 0 0 1-5.7-5.7l1-1" /></>),
  // Versões = relógio com seta (histórico)
  versions: ico(<><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" /><path d="M3 4v4h4" /><path d="M12 8v4.5l3 1.8" /></>),
  // Atividade = pulso / linha do tempo
  activity: ico(<><path d="M3 12h4l2.5-7 4.5 14 2.5-7H21" /></>),
};
