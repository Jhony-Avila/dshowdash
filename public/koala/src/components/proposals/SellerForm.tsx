// Grupo VENDEDOR: nome/e-mail/telefone (default do usuário logado, editável na proposta).
export function SellerForm({ p, onField }: { p: any; onField: (f: string, v: any) => void }) {
  return (
    <div>
      <div className="k-field">
        <label className="k-label">Nome do vendedor</label>
        <input className="k-input k-w-full" defaultValue={p.seller_name ?? ''} onBlur={(e) => onField('seller_name', e.target.value)} />
      </div>
      <div className="k-row">
        <div className="k-field k-f-half">
          <label className="k-label">E-mail do vendedor</label>
          <input className="k-input k-w-full" defaultValue={p.seller_email ?? ''} onBlur={(e) => onField('seller_email', e.target.value)} />
        </div>
        <div className="k-field k-f-half">
          <label className="k-label">Telefone do vendedor</label>
          <input className="k-input k-w-full" defaultValue={p.seller_phone ?? ''} onBlur={(e) => onField('seller_phone', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
