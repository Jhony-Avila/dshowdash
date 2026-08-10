// shell/CmsRo.tsx — CMS READ-ONLY do catálogo (AS6 Parte 15, lote
// 1061–1070, decisão #108, flag as6.cms_ro).
// @version 1.0.0  @created 2026-08-09
//
// Drawer ADMIN somente-leitura sobre o banco que JÁ existe: assets
// (status/categoria/raridade/biblioteca), licenças e a trilha de
// auditoria do admin.php. Zero escrita daqui — o gate é o MESMO
// AdminGate fail-closed do servidor: sem allowlist, o endpoint devolve
// 403 e o drawer mostra "restrito" (nunca dados). Chunk lazy próprio
// (§275) aberto pela Paleta de Comandos.
import { useCallback, useEffect, useState } from 'react';
import { Database, Download, LoaderCircle, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';

type AbaCms = 'assets' | 'licencas' | 'auditoria';
const ABAS: Array<{ id: AbaCms; nome: string }> = [
  { id: 'assets', nome: 'Assets' },
  { id: 'licencas', nome: 'Licenças' },
  { id: 'auditoria', nome: 'Auditoria' },
];

type Linha = Record<string, unknown>;
interface EstadoCms {
  fase: 'carregando' | 'ok' | 'restrito' | 'erro';
  itens: Linha[];
  total?: number;
}

export function CmsRo({ aoFechar }: { aoFechar: () => void }) {
  const [aba, setAba] = useState<AbaCms>('assets');
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState<EstadoCms>({ fase: 'carregando', itens: [] });
  // lote 1181-1190 (#120, as6.cms_ro2): busca + detalhe (segue leitura pura)
  const fase2 = flag('as6.cms_ro2');
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<Linha | null>(null);

  const carregar = useCallback(async (a: AbaCms, pag: number, filtro = '') => {
    setEstado({ fase: 'carregando', itens: [] });
    try {
      const extra = a === 'assets' && filtro ? `&busca=${encodeURIComponent(filtro)}` : '';
      const r = await fetch(`/api/avatar/cms.php?listar=${a}&pagina=${pag}${extra}`, { credentials: 'include' });
      if (r.status === 401 || r.status === 403) { setEstado({ fase: 'restrito', itens: [] }); return; }
      if (!r.ok) { setEstado({ fase: 'erro', itens: [] }); return; }
      const d = (await r.json())?.data ?? {};
      setEstado({ fase: 'ok', itens: Array.isArray(d.itens) ? d.itens : [], total: d.total });
    } catch { setEstado({ fase: 'erro', itens: [] }); }
  }, []);

  useEffect(() => { void carregar(aba, pagina, busca); }, [aba, pagina, busca, carregar]);
  // #120: export CSV do que está NA TELA (client-side, zero endpoint novo)
  const exportarCsv = useCallback(() => {
    const colunas2 = estado.itens.length ? Object.keys(estado.itens[0]) : [];
    if (!colunas2.length) return;
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [colunas2.join(';'), ...estado.itens.map((l) => colunas2.map((c) => esc(l[c])).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `cms-${aba}-p${pagina}.csv`;
    a.click();
  }, [estado.itens, aba, pagina]);
  // lote 1081-1090 (#110): Escape fecha o diálogo (a11y §297).
  // #126: com a FICHA aberta, o primeiro Escape fecha só a ficha.
  useEffect(() => {
    const ao = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (detalhe) setDetalhe(null); else aoFechar();
    };
    window.addEventListener('keydown', ao);
    return () => window.removeEventListener('keydown', ao);
  }, [aoFechar, detalhe]);

  const colunas = estado.itens.length ? Object.keys(estado.itens[0]) : [];
  return (
    <div className="avst5-detalhe-fundo avst6-cms" role="dialog" aria-modal="true" aria-label="CMS do catálogo (somente leitura)" data-teste="cms-ro">
      <div className="avst6-cms-caixa">
        <header className="avst6-cms-topo">
          <strong><Database size={14} aria-hidden /> {t('CMS do catálogo')} <em>{t('somente leitura')}</em></strong>
          <div role="tablist" aria-label="Seções do CMS" className="avst5-abas">
            {ABAS.map((a) => (
              <button key={a.id} type="button" role="tab" aria-selected={aba === a.id}
                className={aba === a.id ? 'avst5-aba-on' : ''} data-teste={`cms-aba-${a.id}`}
                onClick={() => { setAba(a.id); setPagina(1); }}>{t(a.nome)}</button>
            ))}
          </div>
          {fase2 && aba === 'assets' && (
            <label className="avst6-cms-busca" data-teste="cms-busca">
              <Search size={12} aria-hidden />
              <input type="search" placeholder={t('Buscar por nome ou key…')} value={busca}
                onChange={(e) => { setPagina(1); setBusca(e.target.value); }} />
            </label>
          )}
          {fase2 && (
            <button type="button" className="avst5-painel-btn" title={t('Exportar CSV desta página')}
              data-teste="cms-csv" onClick={exportarCsv}><Download size={13} aria-hidden /></button>
          )}
          <button type="button" className="avst5-painel-btn" title={t('Recarregar')}
            onClick={() => void carregar(aba, pagina, busca)}><RefreshCw size={13} aria-hidden /></button>
          <button type="button" className="avst5-painel-btn" title={t('Fechar')} data-teste="cms-fechar"
            onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>
        {estado.fase === 'carregando' && (
          <p className="avst6-cms-estado"><LoaderCircle size={14} className="avst-girando" aria-hidden /> {t('Carregando…')}</p>
        )}
        {estado.fase === 'restrito' && (
          <p className="avst6-cms-estado" data-teste="cms-restrito">
            <ShieldAlert size={14} aria-hidden /> {t('Restrito a administradores do catálogo (AdminGate fail-closed).')}
          </p>
        )}
        {estado.fase === 'erro' && (
          <p className="avst6-cms-estado" data-teste="cms-erro">{t('Não consegui falar com o servidor do catálogo.')}</p>
        )}
        {estado.fase === 'ok' && (
          <div className="avst6-cms-corpo">
            {estado.itens.length === 0
              ? <p className="avst6-cms-estado">{t('Nada por aqui.')}</p>
              : (
                <table className="avst6-cms-tabela" data-teste="cms-tabela">
                  <thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {estado.itens.map((linha, i) => (
                      <tr key={String(linha.id ?? i)} data-teste="cms-linha"
                        className={fase2 && aba === 'assets' ? 'avst6-cms-clicavel' : undefined}
                        tabIndex={fase2 && aba === 'assets' ? 0 : undefined}
                        onKeyDown={fase2 && aba === 'assets' ? (e) => { if (e.key === 'Enter') setDetalhe(linha); } : undefined}
                        onClick={fase2 && aba === 'assets' ? () => setDetalhe(linha) : undefined}>
                        {colunas.map((c) => <td key={c}>{String(linha[c] ?? '—').slice(0, 80)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            {typeof estado.total === 'number' && estado.total > estado.itens.length && (
              <div className="avst6-cms-pag">
                <button type="button" className="avst-botao" disabled={pagina <= 1}
                  onClick={() => setPagina((v) => v - 1)}>←</button>
                <span>{pagina} / {Math.max(1, Math.ceil(estado.total / 100))} · {estado.total} {t('registros')}</span>
                <button type="button" className="avst-botao" disabled={pagina >= Math.ceil(estado.total / 100)}
                  onClick={() => setPagina((v) => v + 1)}>→</button>
              </div>
            )}
          </div>
        )}
        {fase2 && detalhe && (
          /* #120: FICHA do asset — leitura pura do que já veio na linha */
          <div className="avst6-cms-detalhe" role="region" aria-label={t('Detalhe do asset')} data-teste="cms-detalhe">
            <header>
              <strong>{String(detalhe.name ?? detalhe.id)}</strong>
              <button type="button" className="avst5-painel-btn" title={t('Fechar detalhe')}
                data-teste="cms-detalhe-fechar" onClick={() => setDetalhe(null)}><X size={13} aria-hidden /></button>
            </header>
            <dl>
              {Object.entries(detalhe).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{String(v ?? '—')}</dd></div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
