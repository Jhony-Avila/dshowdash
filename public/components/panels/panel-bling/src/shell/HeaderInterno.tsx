// panel-bling/src/shell/HeaderInterno.tsx — cabeçalho do módulo (§12)
// @version 1.0.0  @created 2026-07-30
//
// Título, subtítulo, seletor de conta/unidade, período, busca global, estado da
// conexão, última sincronização e as ações de atualizar/exportar/configurar.
//
// A busca global (§56) usa Ctrl+K. A paleta de comandos do app-shell é a da
// sidebar (`sidebar/features/command-palette.js`) — este campo NÃO tenta criar
// uma paleta concorrente; é uma busca local ao módulo, e o atalho só é capturado
// quando o foco está dentro do painel.

import React from 'react';
import { Badge, haQuantoTempo } from '@shared';
import { Icone } from './Icone';
import { TELAS, TelaSpec } from '../screens/catalog';

export interface Conta {
  id: string; nome: string; cnpj_mascarado: string; unidade: string;
  ambiente: string; ultima_sync: string; pendencias: number; padrao?: boolean;
}

export interface PropsHeader {
  tela: TelaSpec;
  contas: Conta[];
  contaAtiva: string;
  aoTrocarConta: (id: string) => void;
  estadoConexao: { chave: string; rotulo: string; cor: string } | null;
  ultimaSync: string | null;
  aoAtualizar: () => void;
  atualizando: boolean;
  aoNavegar: (id: string) => void;
  aoExportar?: (formato: 'csv' | 'xlsx' | 'pdf') => void;
  /** false = a tela não tem tabela; só a impressão faz sentido. */
  exportaDados?: boolean;
  larguraPainel: number;
}

export function HeaderInterno({
  tela, contas, contaAtiva, aoTrocarConta, estadoConexao, ultimaSync,
  aoAtualizar, atualizando, aoNavegar, aoExportar, exportaDados = true, larguraPainel,
}: PropsHeader) {
  const [buscaAberta, setBuscaAberta] = React.useState(false);
  const [menuExportar, setMenuExportar] = React.useState(false);
  const compacto = larguraPainel < 980;

  // Ctrl+K / Cmd+K abre a busca do módulo.
  //
  // A condição é "o painel está montado e visível", NÃO "o foco está dentro do
  // painel". Exigir foco quebrava o atalho no caso mais comum: usuário abre o
  // módulo pela sidebar, o foco fica no body, e o Ctrl+K não respondia.
  //
  // O listener só existe enquanto este componente está montado — quando o painel
  // fecha, o atalho volta a pertencer à paleta da sidebar do app-shell
  // (`sidebar/features/command-palette.js`), que é a paleta global do projeto.
  // Este campo é uma busca LOCAL de seções, não uma segunda paleta.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) return;
      const raiz = document.querySelector('[data-bl-root]');
      if (!raiz || !(raiz as HTMLElement).offsetParent) return;   // painel oculto
      e.preventDefault();
      e.stopPropagation();
      setBuscaAberta(true);
    };
    // Fase de captura: chega antes do handler global da sidebar, então o atalho
    // pertence ao painel enquanto ele estiver aberto.
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  const conta = contas.find(c => c.id === contaAtiva) ?? contas[0];

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '9px 14px', borderBottom: '1px solid var(--bl-borda)',
        background: 'var(--bl-bg-elevado)', flex: '0 0 auto', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--bl-verde-suave)', border: '1px solid var(--bl-verde-borda)',
            color: 'var(--bl-verde)', flex: '0 0 auto',
          }}>
            <Icone nome="Package" tamanho={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.15 }}>Bling</div>
            {!compacto && (
              <div style={{
                fontSize: 11, color: 'var(--bl-texto-3)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 420,
              }}>
                Gestão integrada de vendas, estoque, fiscal, compras, logística e financeiro
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb: onde estou dentro do módulo */}
        <nav aria-label="Trilha" style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5,
          color: 'var(--bl-texto-3)', minWidth: 0,
        }}>
          <span aria-hidden>/</span>
          <span style={{ color: 'var(--bl-texto-2)' }}>
            {tela.grupo.charAt(0).toUpperCase() + tela.grupo.slice(1)}
          </span>
          <span aria-hidden>/</span>
          <span style={{ color: 'var(--bl-texto)', fontWeight: 600 }}>{tela.titulo}</span>
        </nav>

        <div style={{ flex: 1, minWidth: 8 }} />

        {contas.length > 0 && (
          <select
            value={contaAtiva}
            onChange={e => aoTrocarConta(e.target.value)}
            aria-label="Conta e unidade"
            title={conta ? `${conta.nome} — ${conta.cnpj_mascarado} · ${conta.pendencias} pendência(s)` : undefined}
            style={{
              height: 28, maxWidth: 200, padding: '0 8px', font: 'inherit', fontSize: 12,
              color: 'var(--bl-texto)', background: 'var(--bl-superficie-2)',
              border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
            }}
          >
            <option value="todas">Todas as contas</option>
            {contas.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome} · {c.unidade}{c.pendencias > 0 ? ` (${c.pendencias})` : ''}
              </option>
            ))}
          </select>
        )}

        {estadoConexao && <Badge info={estadoConexao as any} />}

        {ultimaSync && !compacto && (
          <span style={{ fontSize: 11, color: 'var(--bl-texto-3)', whiteSpace: 'nowrap' }}>
            sincronizado {haQuantoTempo(ultimaSync)}
          </span>
        )}

        <button type="button" className="bl-botao" onClick={() => setBuscaAberta(true)}
          title="Buscar no módulo (Ctrl+K)">
          <span aria-hidden>⌕</span>{!compacto && ' Buscar'}
        </button>

        <button type="button" className="bl-botao bl-botao--icone" onClick={aoAtualizar}
          disabled={atualizando} aria-label="Atualizar dados" title="Atualizar dados">
          <Icone nome="RefreshCw" tamanho={13} />
        </button>

        {aoExportar && (
          <div style={{ position: 'relative' }}>
            <button type="button" className="bl-botao" onClick={() => setMenuExportar(v => !v)}
              aria-expanded={menuExportar} aria-haspopup="menu" title="Exportar a tela atual">
              Exportar
            </button>
            {menuExportar && (
              <>
                <div onClick={() => setMenuExportar(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <div role="menu" style={{
                  position: 'absolute', right: 0, top: 34, zIndex: 31, width: 232, padding: 6,
                  background: 'var(--bl-overlay)', border: '1px solid var(--bl-borda)',
                  borderRadius: 'var(--bl-raio)', boxShadow: 'var(--bl-sombra)',
                }}>
                  {([
                    ['xlsx', 'Excel (.xlsx)', 'Números e datas de verdade — soma e ordena', exportaDados],
                    ['csv',  'CSV',           'Texto separado por ponto e vírgula',        exportaDados],
                    ['pdf',  'Imprimir / PDF','Usa a impressão do navegador',              true],
                  ] as const).map(([id, rotulo, nota, habilitado]) => (
                    <button
                      key={id} type="button" role="menuitem" disabled={!habilitado}
                      onClick={() => { setMenuExportar(false); aoExportar(id); }}
                      title={habilitado ? nota : 'Esta tela não tem tabela para exportar'}
                      style={{
                        display: 'block', width: '100%', padding: '7px 9px', textAlign: 'left',
                        font: 'inherit', fontSize: 12, color: habilitado ? 'var(--bl-texto)' : 'var(--bl-texto-3)',
                        background: 'transparent', border: 'none',
                        borderRadius: 'var(--bl-raio-sm)',
                        cursor: habilitado ? 'pointer' : 'not-allowed',
                        opacity: habilitado ? 1 : .55,
                      }}
                      onMouseEnter={e => { if (habilitado) e.currentTarget.style.background = 'var(--bl-superficie-2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ display: 'block', fontWeight: 500 }}>{rotulo}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: 'var(--bl-texto-3)' }}>{nota}</span>
                    </button>
                  ))}
                  <div style={{
                    padding: '6px 9px 2px', fontSize: 10, color: 'var(--bl-texto-3)',
                    borderTop: '1px solid var(--bl-borda)', marginTop: 4,
                  }}>
                    O arquivo leva o período, os filtros ativos e o aviso de dados simulados.
                    Exportação é registrada na auditoria.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button type="button" className="bl-botao bl-botao--icone"
          onClick={() => aoNavegar('configuracoes')}
          aria-label="Configurações do módulo" title="Configurações do módulo">
          <Icone nome="Settings" tamanho={13} />
        </button>
      </header>

      {buscaAberta && (
        <BuscaModulo aoFechar={() => setBuscaAberta(false)} aoNavegar={id => { aoNavegar(id); setBuscaAberta(false); }} />
      )}
    </>
  );
}

/** Busca de telas do módulo (§56). Navegação, não consulta de dados. */
function BuscaModulo({ aoFechar, aoNavegar }: { aoFechar: () => void; aoNavegar: (id: string) => void }) {
  const [termo, setTermo] = React.useState('');
  const [indice, setIndice] = React.useState(0);
  const refInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { refInput.current?.focus(); }, []);

  // Busca sem acento: quem digita "deposito" tem que achar "Depósitos".
  // Sem a normalização, o resultado é zero e a busca parece quebrada.
  const semAcento = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const resultados = React.useMemo(() => {
    const t = semAcento(termo.trim());
    if (!t) return TELAS.slice(0, 12);
    return TELAS.filter(x =>
      semAcento(x.titulo).includes(t)
      || semAcento(x.subtitulo).includes(t)
      || semAcento(x.grupo).includes(t)
    ).slice(0, 14);
  }, [termo]);

  React.useEffect(() => { setIndice(0); }, [termo]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { aoFechar(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndice(i => Math.min(i + 1, resultados.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndice(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && resultados[indice]) { e.preventDefault(); aoNavegar(resultados[indice].id); }
  };

  return (
    <>
      <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 5000 }} />
      <div
        role="dialog" aria-modal="true" aria-label="Buscar no módulo Bling"
        style={{
          position: 'fixed', top: '14vh', left: '50%', transform: 'translateX(-50%)',
          width: 'min(560px, 92vw)', zIndex: 5001,
          background: 'var(--bl-overlay)', border: '1px solid var(--bl-borda)',
          borderRadius: 'var(--bl-raio)', boxShadow: '0 16px 48px rgba(0,0,0,.42)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={refInput}
          value={termo}
          onChange={e => setTermo(e.target.value)}
          onKeyDown={onKey}
          placeholder="Buscar seção do Bling…"
          aria-label="Termo de busca"
          style={{
            width: '100%', height: 44, padding: '0 16px', font: 'inherit', fontSize: 14,
            color: 'var(--bl-texto)', background: 'transparent',
            border: 'none', borderBottom: '1px solid var(--bl-borda)', outline: 'none',
          }}
        />
        <div role="listbox" style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {resultados.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--bl-texto-2)' }}>
              Nenhuma seção corresponde a “{termo}”.
            </div>
          ) : resultados.map((r, i) => (
            <button
              key={r.id} type="button" role="option" aria-selected={i === indice}
              onMouseEnter={() => setIndice(i)}
              onClick={() => aoNavegar(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 16px', font: 'inherit', textAlign: 'left',
                background: i === indice ? 'var(--bl-superficie-2)' : 'transparent',
                border: 'none', cursor: 'pointer', color: 'var(--bl-texto)',
              }}
            >
              <Icone nome={r.icone} tamanho={15} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13 }}>{r.titulo}</span>
                <span style={{
                  display: 'block', fontSize: 11, color: 'var(--bl-texto-3)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{r.subtitulo}</span>
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', textTransform: 'capitalize' }}>
                {r.grupo}
              </span>
            </button>
          ))}
        </div>
        <div style={{
          padding: '7px 16px', fontSize: 10.5, color: 'var(--bl-texto-3)',
          borderTop: '1px solid var(--bl-borda)',
        }}>
          ↑↓ navegar · Enter abrir · Esc fechar
        </div>
      </div>
    </>
  );
}
