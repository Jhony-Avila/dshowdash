// components/Biblioteca.tsx — Metodologia Dshow navegável (Biblioteca).
// @version 1.0.0  @created 2026-07-28
//
// Navega as ~1.500 unidades da base: filtro por domínio e segmento, busca
// BM25 e leitura completa no drawer de fontes (reuso do FonteDrawer).
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { listarSegmentos, listarUnidades } from '../lib/api';
import { ROTULO_DOMINIO, rotuloDominio } from './Resposta';
import { rotuloSegmento } from './Qualificacao';
import type { Unidade } from '../shell/types';

const POR_PAGINA = 20;

export function Biblioteca({ onAbrirUnidade }: {
  onAbrirUnidade: (unidade: Unidade) => void;
}) {
  const [dominio, setDominio] = useState('');
  const [segmento, setSegmento] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [segmentos, setSegmentos] = useState<string[]>([]);
  const requisicao = useRef(0);

  useEffect(() => {
    listarSegmentos().then(setSegmentos).catch(() => { /* dropdown fica vazio */ });
  }, []);

  const carregar = async (offset: number) => {
    const id = ++requisicao.current;
    setCarregando(true); setErro(false);
    try {
      const pagina = await listarUnidades({
        domain: dominio || undefined,
        segment: segmento || undefined,
        q: buscaAtiva || undefined,
        offset,
        limit: POR_PAGINA,
      });
      if (id !== requisicao.current) return; // resposta antiga — descarta
      setTotal(pagina.total);
      setUnidades((u) => (offset === 0 ? pagina.units : [...u, ...pagina.units]));
    } catch {
      if (id === requisicao.current) setErro(true);
    } finally {
      if (id === requisicao.current) setCarregando(false);
    }
  };

  useEffect(() => { void carregar(0); /* eslint-disable-next-line */ }, [dominio, segmento, buscaAtiva]);

  const dominios = Object.entries(ROTULO_DOMINIO)
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

  return (
    <div className="anx-learn anx-bib">
      <div className="anx-learn-head">
        <h2><BookOpen size={17} aria-hidden style={{ verticalAlign: '-2px' }} /> Metodologia Dshow</h2>
        <p>As ~1.500 regras da base, navegáveis por domínio, segmento e busca. Clique numa unidade para ler na íntegra.</p>
      </div>

      <div className="anx-bib-filtros">
        <select value={dominio} onChange={(e) => setDominio(e.target.value)} aria-label="Filtrar por domínio">
          <option value="">Todos os domínios</option>
          {dominios.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
        </select>
        <select value={segmento} onChange={(e) => setSegmento(e.target.value)} aria-label="Filtrar por segmento">
          <option value="">Todos os segmentos</option>
          {segmentos.map((s) => <option key={s} value={s}>{rotuloSegmento(s)}</option>)}
        </select>
        <div className="anx-bib-busca">
          <Search size={14} aria-hidden />
          <input value={busca} placeholder="Buscar na metodologia… (Enter)"
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setBuscaAtiva(busca.trim()); }} />
          {buscaAtiva && (
            <button className="anx-bib-limpar" onClick={() => { setBusca(''); setBuscaAtiva(''); }}>limpar</button>
          )}
        </div>
      </div>

      <div className="anx-bib-meta">
        {carregando && unidades.length === 0
          ? <span className="anx-loading"><span className="anx-spinner" /> Carregando…</span>
          : buscaAtiva
            ? `${unidades.length} resultado${unidades.length === 1 ? '' : 's'} mais relevantes para “${buscaAtiva}”`
            : `${total} unidade${total === 1 ? '' : 's'}`}
      </div>

      {erro && <div className="anx-error">⚠️ Não foi possível consultar a base. Tente novamente.</div>}

      <div className="anx-bib-lista">
        {unidades.map((u) => (
          <button key={u.id} className="anx-bib-item" onClick={() => onAbrirUnidade(u)}>
            <span className="anx-bib-q">{u.question}</span>
            <span className="anx-unit-badges">
              <span className="anx-badge anx-badge-dom">{rotuloDominio(u.domain)}</span>
              {u.segment && <span className="anx-badge anx-badge-seg">{rotuloSegmento(u.segment)}</span>}
              <span className="anx-badge">F{u.source.logical_phase} · Q{u.source.question_number}</span>
            </span>
          </button>
        ))}
      </div>

      {!buscaAtiva && unidades.length < total && (
        <button className="anx-topbtn" disabled={carregando}
          onClick={() => void carregar(unidades.length)}>
          {carregando ? 'Carregando…' : `Carregar mais (${unidades.length} de ${total})`}
        </button>
      )}
    </div>
  );
}
