// Totais ao vivo: itens (líquido) + despesas operacionais − desconto da proposta.
// Frete/instalação/deslocamento são LEGADOS (generalizados pelas Despesas Operacionais):
// exibidos só como nota read-only quando a proposta antiga tiver algum valor.
import { money } from '../../format';
const fmt = money;   // F6: formatação de dinheiro unificada

export function PricingPanel({ p, onField }: { p: any; onField: (f: string, v: any) => void }) {
  const cur = p.currency;
  const legacy = Number(p.freight_value || 0) + Number(p.installation_value || 0) + Number(p.displacement_value || 0);
  return (
    <div className="k-pricing">
      <label className="k-label">Totais ({cur})</label>
      <div className="k-price-tot"><span>Subtotal itens (bruto)</span><b>{fmt(p.total_gross, cur)}</b></div>
      <div className="k-price-tot"><span>Descontos de itens</span><b>− {fmt(p.total_discount, cur)}</b></div>
      <div className="k-price-tot"><span>Subtotal itens (líquido)</span><b>{fmt(p.total_net, cur)}</b></div>
      <div className="k-price-tot"><span>Despesas operacionais</span><b>+ {fmt(p.total_expenses, cur)}</b></div>
      {legacy > 0 && (
        <div className="k-price-tot k-muted"><span>Frete/instal./desloc. (legado)</span><b>+ {fmt(legacy, cur)}</b></div>
      )}
      <div className="k-price-in k-price-disc"><span>Desconto da proposta</span>
        <input className="k-input k-mini" defaultValue={p.proposal_discount_value ?? ''} placeholder="valor"
          onBlur={(e) => onField('proposal_discount_value', e.target.value === '' ? null : Number(e.target.value) || 0)} />
      </div>
      <div className="k-price-final"><span>VALOR TOTAL</span><b>{fmt(p.total_final, cur)}</b></div>
    </div>
  );
}
