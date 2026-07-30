// app/App.tsx — casca do módulo: sub-sidebar, header interno, filtros e roteamento de telas.
// @version 1.0.0  @created 2026-07-30
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GRUPOS, PERIODOS, CENARIOS, TELAS, acharTela } from '../shell/types';
import type { TelaId, MetaProcedencia } from '../shell/types';
import { ApiGoogleAnalyticsService } from '../services/GoogleAnalyticsService';
import type { FiltrosAnalytics } from '../services/GoogleAnalyticsService';
import { Icone, Badge, Vazio } from '../components/UI';
import { Telas } from '../screens';
import '../styles/tokens.css';
import '../styles/shell.css';

const CHAVE_COLAPSO = 'dshow.google-analytics.sidebar.collapsed';   // §11.3
const CHAVE_TELA    = 'dshow.google-analytics.ultima-tela';         // §9.1: reabre onde parou
const PREFIXO_HASH  = '#/panel-google-analytics';

function telaDoHash(): TelaId | null {
  const h = window.location.hash;
  if (!h.startsWith(PREFIXO_HASH)) return null;
  const resto = h.slice(PREFIXO_HASH.length).replace(/^\//, '').split('?')[0];
  const t = acharTela(resto);
  return t ? t.id : null;
}

export default function App() {
  const [colapsada, setColapsada] = useState<boolean>(() => {
    try { return localStorage.getItem(CHAVE_COLAPSO) === '1'; } catch { return false; }
  });

  const [tela, setTela] = useState<TelaId>(() => {
    const doHash = telaDoHash();
    if (doHash) return doHash;
    try {
      const salva = localStorage.getItem(CHAVE_TELA);
      if (salva && acharTela(salva)) return salva as TelaId;
    } catch { /* sem storage: cai no default */ }
    return 'visao-geral';
  });

  const [periodo, setPeriodo] = useState('28d');
  const [cenario, setCenario] = useState('saudavel');
  const [comparar, setComparar] = useState('anterior');
  const [recarga, setRecarga] = useState(0);

  // Cross-filter global (§63): a seleção feita numa tela filtra as outras.
  const [corte, setCorte] = useState<{ canal?: string | null; campanha?: string | null; dispositivo?: string | null; pagina?: string | null }>({});

  // Procedência da última resposta — alimenta o rodapé e a faixa de mock.
  const [meta, setMeta] = useState<MetaProcedencia | null>(null);

  const [status, setStatus] = useState<{ provedor: string; pronto: boolean; measurement_id?: string; property_id?: string } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(CHAVE_COLAPSO, colapsada ? '1' : '0'); } catch { /* ignora */ }
  }, [colapsada]);

  useEffect(() => {
    try { localStorage.setItem(CHAVE_TELA, tela); } catch { /* ignora */ }
    // Mantém a URL em sincronia sem empilhar histórico a cada clique.
    const alvo = `${PREFIXO_HASH}/${tela}`;
    if (window.location.hash !== alvo) {
      window.history.replaceState(null, '', alvo);
    }
  }, [tela]);

  // Navegação por hash (voltar/avançar e links contextuais de outros módulos, §7).
  useEffect(() => {
    const onHash = () => {
      const t = telaDoHash();
      if (t && t !== tela) setTela(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [tela]);

  const svc = useMemo(() => new ApiGoogleAnalyticsService(), []);

  useEffect(() => {
    let vivo = true;
    svc.getStatus()
      .then((r) => { if (vivo) setStatus(r.dados); })
      .catch(() => { /* o status não bloqueia o módulo; as telas mostram o próprio erro */ });
    return () => { vivo = false; };
  }, [svc]);

  const filtros: FiltrosAnalytics = useMemo(() => ({
    periodo, comparar, cenario,
    canal: corte.canal ?? null,
    campanha: corte.campanha ?? null,
    dispositivo: corte.dispositivo ?? null,
    pagina: corte.pagina ?? null,
  }), [periodo, comparar, cenario, corte]);

  const irPara = useCallback((t: TelaId) => setTela(t), []);
  const limparCorte = useCallback(() => setCorte({}), []);

  const telaAtual = acharTela(tela);
  const ehMock = (meta?.fonte ?? status?.provedor) === 'mock';
  const cortesAtivos = Object.entries(corte).filter(([, v]) => !!v);

  const Componente = Telas[tela];

  return (
    <div className="ga-shell">
      {/* ── Sub-sidebar (§10, §11) ─────────────────────────────────── */}
      <nav className="ga-sub" data-colapsada={colapsada ? 'true' : 'false'} aria-label="Seções do Google Analytics">
        <div className="ga-sub__topo">
          {!colapsada && (
            <div className="ga-sub__marca">
              <span className="ga-sub__marca-txt">Google Analytics</span>
              <span className="ga-sub__ga4">GA4</span>
            </div>
          )}
          <button
            className="ga-sub__toggle"
            onClick={() => setColapsada((v) => !v)}
            aria-label={colapsada ? 'Expandir menu do módulo' : 'Recolher menu do módulo'}
            aria-expanded={!colapsada}
            title={colapsada ? 'Expandir' : 'Recolher'}
          >
            <Icone nome={colapsada ? 'PanelLeftOpen' : 'PanelLeftClose'} tam={15} />
          </button>
        </div>

        <div className="ga-sub__rolagem">
          {GRUPOS.map((g) => (
            <div key={g.id}>
              <div className="ga-sub__grupo-titulo"><span>{g.titulo}</span></div>
              {g.telas.map((t) => (
                <button
                  key={t.id}
                  className="ga-item"
                  aria-current={t.id === tela ? 'page' : undefined}
                  onClick={() => irPara(t.id)}
                  title={colapsada ? t.titulo : (t.disponivel ? t.titulo : `${t.titulo} — ${t.motivo ?? 'em desenvolvimento'}`)}
                  data-badge={!t.disponivel ? 'true' : undefined}
                >
                  <span className="ga-item__ico"><Icone nome={t.icone} tam={16} /></span>
                  <span className="ga-item__txt">{t.titulo}</span>
                  {!t.disponivel && <span className="ga-item__badge" title={t.motivo}>fase 2</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* ── Área principal ─────────────────────────────────────────── */}
      <div className="ga-main">
        {/* Faixa de demonstração (§69.5) — nunca escondida quando a fonte é simulada. */}
        {ehMock && (
          <div className="ga-faixa-mock">
            <Icone nome="Info" tam={14} />
            <span>
              <strong>Ambiente de demonstração</strong> — os dados apresentados são simulados.
              Os identificadores <b>{status?.measurement_id ?? 'G-WGDR8WJ7G8'}</b> e <b>GTM-M8KJKVV</b> são reais,
              auditados na Fase 0; os números, não.
            </span>
          </div>
        )}

        <header className="ga-header">
          <div className="ga-header__t">
            <div className="ga-header__titulo">{telaAtual?.titulo ?? 'Google Analytics'}</div>
            <div className="ga-header__sub">
              Análise integrada de aquisição, comportamento, conversão e receita dos canais digitais.
            </div>
          </div>

          {/* Seletores (§13) — propriedade/stream vêm da tela Propriedades nesta fase. */}
          <div className="ga-sel-campo">
            <label htmlFor="ga-periodo">Período</label>
            <select id="ga-periodo" className="ga-sel" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
            </select>
          </div>

          <div className="ga-sel-campo">
            <label htmlFor="ga-comparar">Comparar</label>
            <select id="ga-comparar" className="ga-sel" value={comparar} onChange={(e) => setComparar(e.target.value)}>
              <option value="anterior">Período anterior</option>
              <option value="ano">Mesmo período do ano anterior</option>
            </select>
          </div>

          {/* O seletor de cenário só existe no mock — não é controle de produção. */}
          {ehMock && (
            <div className="ga-sel-campo">
              <label htmlFor="ga-cenario">Cenário</label>
              <select id="ga-cenario" className="ga-sel" value={cenario} onChange={(e) => setCenario(e.target.value)}>
                {CENARIOS.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
              </select>
            </div>
          )}

          <button className="ga-btn" onClick={() => setRecarga((n) => n + 1)} title="Recarregar os dados desta tela">
            <Icone nome="RefreshCw" tam={13} /> Atualizar
          </button>
        </header>

        {/* Chips de cross-filter (§66) */}
        {cortesAtivos.length > 0 && (
          <div className="ga-header" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ga-txt-3)' }}>Filtros ativos:</span>
            {cortesAtivos.map(([k, v]) => (
              <Badge key={k} tipo="marca">{k}: {String(v)}</Badge>
            ))}
            <button className="ga-btn" onClick={limparCorte}>Limpar seleção</button>
          </div>
        )}

        <main className="ga-conteudo">
          {Componente ? (
            <Componente
              filtros={filtros}
              svc={svc}
              recarga={recarga}
              onMeta={setMeta}
              onIrPara={irPara}
              onCorte={(c) => setCorte((atual) => ({ ...atual, ...c }))}
              corte={corte}
            />
          ) : (
            <Vazio
              titulo={`${telaAtual?.titulo ?? 'Tela'} — ainda não implementada`}
              detalhe={telaAtual?.motivo ?? 'Esta tela entra numa fase seguinte.'}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/** Contrato que toda tela do módulo recebe. */
export interface PropsTela {
  filtros: FiltrosAnalytics;
  svc: ApiGoogleAnalyticsService;
  recarga: number;
  onMeta: (m: MetaProcedencia | null) => void;
  onIrPara: (t: TelaId) => void;
  onCorte: (c: Partial<{ canal: string | null; campanha: string | null; dispositivo: string | null; pagina: string | null }>) => void;
  corte: { canal?: string | null; campanha?: string | null; dispositivo?: string | null; pagina?: string | null };
}

export { TELAS };
