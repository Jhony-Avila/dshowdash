import { useEffect, useRef, useState, type ReactNode } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { money, parseNum } from '../../format';   // F6: formatação de dinheiro unificada (era duplicada aqui)

// Entrada de desconto com toggle %/R$. Reporta {discount_value, discount_percent} (um é null).
function DiscountInput(
  { row, onCommit, autoFocusReset }:
  { row: any; onCommit: (patch: { discount_value: number | null; discount_percent: number | null }) => void; autoFocusReset?: number }
) {
  const initialMode = row?.discount_percent != null && row?.discount_percent !== '' ? 'percent' : 'value';
  const [mode, setMode] = useState<'percent' | 'value'>(initialMode);
  const initialVal = initialMode === 'percent' ? (row?.discount_percent ?? '') : (row?.discount_value ?? '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(initialMode);
    if (ref.current) ref.current.value = String(initialVal ?? '');
  }, [autoFocusReset, row?.id]);

  function commit() {
    const raw = ref.current?.value ?? '';
    if (raw === '') { onCommit({ discount_value: null, discount_percent: null }); return; }
    const n = parseNum(raw) ?? 0;
    if (mode === 'percent') onCommit({ discount_value: null, discount_percent: n });
    else onCommit({ discount_value: n, discount_percent: null });
  }

  return (
    <div className="k-disc">
      <button type="button" className="k-disc-toggle" title="Alternar % / R$"
        onClick={() => { setMode((m) => (m === 'percent' ? 'value' : 'percent')); if (ref.current) ref.current.focus(); }}>
        {mode === 'percent' ? '%' : 'R$'}
      </button>
      <input ref={ref} className="k-input k-mini k-disc-in" defaultValue={String(initialVal ?? '')}
        placeholder={mode === 'percent' ? '0' : '0,00'} inputMode="decimal"
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
    </div>
  );
}

// Mostra o desconto como foi definido (readonly em texto — usado só se preferir célula estática; aqui usamos DiscountInput sempre).
export type LineTableProps = {
  proposalId: number;
  resource: 'items' | 'expenses'; // endpoint base
  currency: string;
  onChange: () => void;           // recarrega os totais da proposta (PricingPanel)
  addLabel?: string;
  catalogSlot?: ReactNode;        // itens: linha extra "adicionar do catálogo" acima do form manual
  reloadSignal?: number;          // bump para forçar reload (ex.: após add via catálogo)
};

export function EditableLineTable({ proposalId, resource, currency, onChange, addLabel = '+ adicionar', catalogSlot, reloadSignal = 0 }: LineTableProps) {
  const base = `/proposals/${proposalId}/${resource}`;
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [rowErr, setRowErr] = useState<{ id: number; msg: string } | null>(null);
  const [addErr, setAddErr] = useState('');
  const [nw, setNw] = useState<any>({ description: '', quantity: '1', unit_measure: '', unit_price: '', observation: '' });
  const [ndv, setNdv] = useState<{ discount_value: number | null; discount_percent: number | null }>({ discount_value: null, discount_percent: null });
  const [resetTick, setResetTick] = useState(0);
  const descRef = useRef<HTMLInputElement>(null);

  async function load() {
    try { setRows(await apiGet(base)); } catch (e: any) { setAddErr('Erro ao carregar: ' + e.message); }
  }
  useEffect(() => { load(); }, [proposalId, resource, reloadSignal]);

  async function add() {
    if (!nw.description.trim()) { descRef.current?.focus(); return; }
    try {
      await apiSend('POST', base, {
        description: nw.description, quantity: parseNum(nw.quantity) ?? 1,
        unit_measure: nw.unit_measure || null, unit_price: parseNum(nw.unit_price) ?? 0,
        discount_value: ndv.discount_value, discount_percent: ndv.discount_percent,
        observation: nw.observation || null,
      });
      setNw({ description: '', quantity: '1', unit_measure: '', unit_price: '', observation: '' });
      setNdv({ discount_value: null, discount_percent: null });
      setResetTick((t) => t + 1);
      setAddErr('');
      await load(); onChange();
      descRef.current?.focus();
    } catch (e: any) { setAddErr(e?.meta?.message || 'Erro: ' + e.message); }
  }

  // PUT parcial de um patch; o backend mescla com os demais campos (fonte única).
  async function patch(row: any, body: any) {
    setSaving(row.id); setRowErr(null);
    try {
      await apiSend('PUT', `${base}/${row.id}`, body);
      await load(); onChange();
    } catch (e: any) {
      setRowErr({ id: row.id, msg: e?.meta?.message || e.message });
      await load(); // restaura os valores do servidor (desfaz o input inválido)
    } finally { setSaving(null); }
  }

  async function remove(row: any) {
    setSaving(row.id);
    try { await apiSend('DELETE', `${base}/${row.id}`); await load(); onChange(); }
    catch (e: any) { setRowErr({ id: row.id, msg: e.message }); }
    finally { setSaving(null); setConfirmDel(null); }
  }
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= rows.length) return;
    const order = rows.map((r) => r.id);
    [order[idx], order[j]] = [order[j], order[idx]];
    setRows((prev) => { const c = [...prev]; [c[idx], c[j]] = [c[j], c[idx]]; return c; }); // otimista
    try { await apiSend('POST', `${base}/reorder`, { order }); await load(); } catch { await load(); }
  }

  const enterAdds = (e: any) => { if (e.key === 'Enter') add(); };

  return (
    <div className="k-field">
      {addErr && <div className="k-msg k-msg-err">{addErr}</div>}
      {catalogSlot}

      <div className="k-linetable-wrap">
        <table className="k-table k-items k-linetable">
          <thead><tr>
            <th>Descrição</th><th className="k-num">Qtd</th><th>Un</th><th className="k-num">Valor</th>
            <th>Desconto</th><th className="k-num">Subtotal</th><th className="k-num k-col-total">Total</th><th>Obs.</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className={(saving === r.id ? 'is-saving' : '') + (rowErr?.id === r.id ? ' is-error' : '')}>
                <td><input className="k-input k-mini k-w-full" defaultValue={r.description} key={'d' + r.id + resetTick}
                  onBlur={(e) => e.target.value !== r.description && patch(r, { description: e.target.value })} /></td>
                <td className="k-num"><input className="k-input k-mini k-qty" defaultValue={r.quantity} key={'q' + r.id + resetTick}
                  onBlur={(e) => { const q = parseNum(e.target.value) ?? 1; if (q !== Number(r.quantity)) patch(r, { quantity: q }); }} /></td>
                <td><input className="k-input k-mini k-un" defaultValue={r.unit_measure ?? ''} key={'u' + r.id + resetTick}
                  onBlur={(e) => e.target.value !== (r.unit_measure ?? '') && patch(r, { unit_measure: e.target.value })} /></td>
                <td className="k-num"><input className="k-input k-mini k-val" defaultValue={r.unit_price} key={'p' + r.id + resetTick}
                  onBlur={(e) => { const v = parseNum(e.target.value) ?? 0; if (v !== Number(r.unit_price)) patch(r, { unit_price: v }); }} /></td>
                <td><DiscountInput row={r} autoFocusReset={resetTick} onCommit={(pt) => patch(r, pt)} /></td>
                <td className="k-num k-cell-sub">{money(r.line_subtotal ?? r.subtotal, currency)}</td>
                <td className="k-num k-col-total"><b>{money(r.line_total ?? r.subtotal, currency)}</b></td>
                <td><input className="k-input k-mini k-w-full" defaultValue={r.observation ?? ''} key={'o' + r.id + resetTick}
                  onBlur={(e) => e.target.value !== (r.observation ?? '') && patch(r, { observation: e.target.value })} /></td>
                <td className="k-line-actions">
                  <button className="k-ord" title="Subir" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
                  <button className="k-ord" title="Descer" onClick={() => move(idx, 1)} disabled={idx === rows.length - 1}>↓</button>
                  {confirmDel === r.id
                    ? <button className="k-btn-x k-confirm" title="Confirmar remoção" onClick={() => remove(r)}>✓?</button>
                    : <button className="k-btn-x" title="Remover" onClick={() => setConfirmDel(r.id)}>×</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="k-muted">
                {resource === 'items' ? 'Sem itens. Adicione do catálogo, avulso, ou importe de um orçamento.' : 'Sem despesas operacionais. Adicione abaixo.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rowErr && <div className="k-msg k-msg-err">{rowErr.msg}</div>}

      <div className="k-row k-addrow">
        <input ref={descRef} className="k-input" placeholder="Descrição*" value={nw.description}
          onChange={(e) => setNw({ ...nw, description: e.target.value })} onKeyDown={enterAdds} />
        <input className="k-input k-num" placeholder="Qtd" value={nw.quantity} onChange={(e) => setNw({ ...nw, quantity: e.target.value })} onKeyDown={enterAdds} />
        <input className="k-input k-un" placeholder="un" value={nw.unit_measure} onChange={(e) => setNw({ ...nw, unit_measure: e.target.value })} onKeyDown={enterAdds} />
        <input className="k-input k-num" placeholder="Valor*" value={nw.unit_price} onChange={(e) => setNw({ ...nw, unit_price: e.target.value })} onKeyDown={enterAdds} />
        <DiscountInput row={{}} autoFocusReset={resetTick} onCommit={setNdv} />
        <input className="k-input" placeholder="Observação" value={nw.observation} onChange={(e) => setNw({ ...nw, observation: e.target.value })} onKeyDown={enterAdds} />
        <button className="k-btn k-btn-sm" onClick={add} disabled={!nw.description.trim()}>{addLabel}</button>
      </div>
    </div>
  );
}
