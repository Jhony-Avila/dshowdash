// components/Pessoal.tsx — widgets PESSOAIS da Home (§23) + recentes (§24).
// @version 1.0.0  @created 2026-07-30
//
// Notas rápidas (autosave com debounce) e Meus links (http/https apenas).
// São pessoais por definição: vivem no localStorage via PessoalService e
// nunca sobem ao servidor. Cada widget é independente (§32).
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Link2, Plus, StickyNote, Trash2 } from 'lucide-react';
import {
  adicionarLink, lerNotas, linksPessoais, removerLink, salvarNotas,
} from '../services/PessoalService';
import type { LinkPessoal } from '../services/PessoalService';
import { Secao } from './ui';

// ── Notas rápidas (§23) ─────────────────────────────────────────────

export function NotasWidget() {
  const [texto, setTexto] = useState<string>(() => lerNotas());
  const [salvoEm, setSalvoEm] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  // autosave com debounce — sem botão "salvar" para não virar formulário
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      salvarNotas(texto);
      setSalvoEm(Date.now());
    }, 500);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [texto]);

  return (
    <Secao titulo="Notas rápidas" sub="rascunho pessoal — fica só neste navegador"
      acoes={salvoEm ? <span className="ger-notas-salvo" role="status">salvo ✓</span> : undefined}>
      <textarea
        className="ger-notas"
        value={texto}
        maxLength={4000}
        placeholder={'Anote aqui lembretes do dia, pendências, ideias…\nSalva sozinho enquanto você digita.'}
        onChange={(e) => setTexto(e.target.value)}
        aria-label="Notas rápidas"
      />
      <p className="ger-pers-nota"><StickyNote size={11} aria-hidden /> {texto.length}/4000 caracteres</p>
    </Secao>
  );
}

// ── Meus links (§23) ────────────────────────────────────────────────

export function LinksWidget() {
  const [links, setLinks] = useState<LinkPessoal[]>(() => linksPessoais());
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const incluir = () => {
    const resultado = adicionarLink(nome, url.startsWith('http') ? url : `https://${url.trim()}`);
    if (!resultado) {
      setErro(links.length >= 12 ? 'Limite de 12 links atingido.' : 'Preencha um nome e uma URL http(s) válida.');
      return;
    }
    setLinks(resultado);
    setNome(''); setUrl(''); setErro(null);
  };

  return (
    <Secao titulo="Meus links" sub="seus atalhos externos — pessoais deste navegador">
      <form className="ger-links-form" onSubmit={(e) => { e.preventDefault(); incluir(); }}>
        <input className="ger-input" value={nome} placeholder="Nome (ex.: Planilha de metas)"
          maxLength={40} onChange={(e) => setNome(e.target.value)} aria-label="Nome do link" />
        <input className="ger-input" value={url} placeholder="https://…" inputMode="url"
          onChange={(e) => setUrl(e.target.value)} aria-label="Endereço do link" />
        <button type="submit" className="ger-btn ger-btn-mini" title="Adicionar link">
          <Plus size={12} aria-hidden /> Adicionar
        </button>
      </form>
      {erro && <p className="ger-links-erro" role="alert">{erro}</p>}
      {links.length === 0 ? (
        <p className="ger-vazio-inline">Nenhum link ainda — adicione os endereços que você abre todo dia.</p>
      ) : (
        <div className="ger-links">
          {links.map((l) => (
            <span key={l.id} className="ger-link-chip">
              <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
                <Link2 size={12} aria-hidden /> {l.nome} <ExternalLink size={10} aria-hidden />
              </a>
              <button type="button" title={`Remover ${l.nome}`}
                onClick={() => setLinks(removerLink(l.id))}>
                <Trash2 size={11} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </Secao>
  );
}
