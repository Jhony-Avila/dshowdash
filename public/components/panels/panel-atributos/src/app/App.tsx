// panel-atributos/src/app/App.tsx — casca do painel: lista ⇄ ficha, carregamento e erros. Só leitura (E1).
import React from 'react';
import type { FichaProduto, Vitrine } from '../lib/tipos';
import { ErroApi, FonteDados, fonteApi } from '../services/fonte';
import { FILTROS_INICIAIS, FiltrosLista, Lista } from '../screens/Lista';
import { Ficha } from '../screens/Ficha';
import { BlocoCarregando, EstadoErro } from '@shared';

type Estado<T> = { situacao: 'carregando' } | { situacao: 'ok'; dados: T } | { situacao: 'erro'; erro: string; http?: number };

export interface PropsApp { fonte?: FonteDados; produtoInicial?: number | null; filtrosIniciais?: Partial<FiltrosLista> }

const CHAVE_PREF = 'dshow.atributos.lista';
function lerPreferencia(): Partial<FiltrosLista> {
  try { const p = JSON.parse(localStorage.getItem(CHAVE_PREF) || '{}'); return p && (p.modo === 'grade' || p.modo === 'tabela') ? { modo: p.modo } : {}; } catch { return {}; }
}

export function App({ fonte = fonteApi, produtoInicial = null, filtrosIniciais = {} }: PropsApp) {
  const [vitrine, setVitrine] = React.useState<Estado<Vitrine>>({ situacao: 'carregando' });
  const [aberto, setAberto] = React.useState<number | null>(produtoInicial);
  const [ficha, setFicha] = React.useState<Estado<FichaProduto> | null>(null);
  const [filtros, setFiltros] = React.useState<FiltrosLista>({ ...FILTROS_INICIAIS, ...lerPreferencia(), ...filtrosIniciais });
  const [tentativa, setTentativa] = React.useState(0);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setVitrine({ situacao: 'carregando' });
    fonte.vitrine(ctrl.signal).then((d) => setVitrine({ situacao: 'ok', dados: d }))
      .catch((e) => { if (!ctrl.signal.aborted) setVitrine({ situacao: 'erro', erro: e instanceof Error ? e.message : String(e), http: e instanceof ErroApi ? e.http : undefined }); });
    return () => ctrl.abort();
  }, [fonte, tentativa]);

  React.useEffect(() => {
    if (aberto === null) { setFicha(null); return; }
    const ctrl = new AbortController();
    setFicha({ situacao: 'carregando' });
    fonte.ficha(aberto, ctrl.signal).then((d) => setFicha({ situacao: 'ok', dados: d }))
      .catch((e) => { if (!ctrl.signal.aborted) setFicha({ situacao: 'erro', erro: e instanceof Error ? e.message : String(e) }); });
    return () => ctrl.abort();
  }, [fonte, aberto]);

  const mudar = (p: Partial<FiltrosLista>) => setFiltros((f) => {
    const n = { ...f, ...p };
    if (p.modo) { try { localStorage.setItem(CHAVE_PREF, JSON.stringify({ modo: p.modo })); } catch { /* sem armazenamento: só não lembra */ } }
    return n;
  });

  return (
    <div data-bl-root className="at-raiz">
      <header className="at-cabecalho">
        <div>
          <h1>Produtos &amp; Atributos</h1>
          <p>Especificação técnica dos produtos (banco de atributos DSHOW) ao lado da ficha do Precifica · somente leitura</p>
        </div>
        <span className="at-piloto" title="Piloto atrás da flag panel_atributos_enabled">piloto</span>
      </header>
      <main className="at-conteudo">
        {aberto !== null ? (
          ficha === null || ficha.situacao === 'carregando' ? <div className="bl-cartao" style={{ padding: 16 }}><BlocoCarregando linhas={8} rotulo="Carregando a ficha" /></div>
            : ficha.situacao === 'erro' ? <div className="bl-cartao"><EstadoErro erro={ficha.erro} aoTentarNovamente={() => setAberto((x) => x)} /><div style={{ padding: '0 16px 16px' }}><button type="button" className="bl-botao" onClick={() => setAberto(null)}>Voltar à lista</button></div></div>
            : <Ficha ficha={ficha.dados} aoVoltar={() => setAberto(null)} />
        ) : vitrine.situacao === 'carregando' ? <div className="bl-cartao" style={{ padding: 16 }}><BlocoCarregando linhas={10} rotulo="Carregando produtos" /></div>
          : vitrine.situacao === 'erro' ? <div className="bl-cartao"><EstadoErro erro={vitrine.erro} aoTentarNovamente={() => setTentativa((t) => t + 1)} /></div>
          : <Lista dados={vitrine.dados} filtros={filtros} aoMudar={mudar} aoAbrir={setAberto} />}
      </main>
    </div>
  );
}
