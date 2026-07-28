// components/Sidebar.tsx — sidebar interna do workspace (Fase 2).
// @version 1.0.0  @created 2026-07-28
//
// Seções: Modos de análise (perfis do engine), Conversas (busca, favoritas,
// renomear inline, arquivar) e Biblioteca (Aprendizado; demais em breve).
// Colapsável: vira um trilho de ícones.
import { useEffect, useState, type ReactNode } from 'react';
import {
  Archive, ArchiveRestore, BarChart3, BookOpen, HeartHandshake,
  MessageSquareText, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Star,
} from 'lucide-react';
import { listarConversas, acaoConversa } from '../lib/api';
import { FERRAMENTAS } from './Ferramentas';
import type { Conversa, Perfil } from '../shell/types';

/** Ícone pequeno por perfil, para a lista de conversas. */
function iconePerfil(perfil: Perfil): ReactNode {
  if (perfil === 'qualificacao') return <HeartHandshake size={11} aria-label="Qualificação" />;
  const ferramenta = FERRAMENTAS.find((f) => f.perfil === perfil);
  return ferramenta ? <span className="anx-side-conv-fico" title={ferramenta.curto}>{ferramenta.icone}</span> : null;
}

function fmtData(mysqlDt: string): string {
  const d = new Date(mysqlDt.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return mysqlDt;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function Sidebar({
  aberta, onToggle, perfilAtivo, onPerfil, conversaAtualId,
  onAbrirConversa, onNovaConversa, onAprendizado, aprendizadoAtivo,
  onBiblioteca, bibliotecaAtiva, ocupado, atualizacao,
}: {
  aberta: boolean;
  onToggle: () => void;
  perfilAtivo: Perfil;
  onPerfil: (p: Perfil) => void;
  conversaAtualId: number | null;
  onAbrirConversa: (id: number) => void;
  onNovaConversa: () => void;
  onAprendizado: () => void;
  aprendizadoAtivo: boolean;
  onBiblioteca: () => void;
  bibliotecaAtiva: boolean;
  ocupado: boolean;
  atualizacao: number;
}) {
  const emTela = aprendizadoAtivo || bibliotecaAtiva;
  const [lista, setLista] = useState<Conversa[]>([]);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [novoTitulo, setNovoTitulo] = useState('');

  const recarregar = (arquivadas = mostrarArquivadas) => {
    listarConversas(arquivadas).then(setLista).catch(() => setLista([]));
  };

  useEffect(() => { recarregar(); /* eslint-disable-next-line */ }, [atualizacao, mostrarArquivadas]);

  const filtradas = busca.trim() === ''
    ? lista
    : lista.filter((c) => c.titulo.toLowerCase().includes(busca.trim().toLowerCase()));

  const executar = async (id: number, acao: 'favoritar' | 'desfavoritar' | 'arquivar' | 'desarquivar') => {
    try { await acaoConversa(id, acao); recarregar(); } catch { /* silencioso */ }
  };

  const salvarTitulo = async (id: number) => {
    const t = novoTitulo.trim();
    setEditando(null);
    if (!t) return;
    try { await acaoConversa(id, 'renomear', t); recarregar(); } catch { /* silencioso */ }
  };

  if (!aberta) {
    return (
      <div className="anx-side anx-side-mini">
        <button className="anx-side-ic" onClick={onToggle} title="Expandir painel lateral">
          <PanelLeftOpen size={16} />
        </button>
        <button className="anx-side-ic" onClick={onNovaConversa} disabled={ocupado} title="Nova conversa">
          <Plus size={16} />
        </button>
        <button className={`anx-side-ic${perfilAtivo === 'consultor' && !emTela ? ' is-on' : ''}`}
          onClick={() => onPerfil('consultor')} title="Modo Consultoria">
          <MessageSquareText size={16} />
        </button>
        <button className={`anx-side-ic${perfilAtivo === 'qualificacao' && !emTela ? ' is-on' : ''}`}
          onClick={() => onPerfil('qualificacao')} title="Modo Qualificação comercial">
          <HeartHandshake size={16} />
        </button>
        <button className={`anx-side-ic${bibliotecaAtiva ? ' is-on' : ''}`}
          onClick={onBiblioteca} title="Metodologia Dshow (Biblioteca)">
          <BookOpen size={16} />
        </button>
        <button className={`anx-side-ic${aprendizadoAtivo ? ' is-on' : ''}`}
          onClick={onAprendizado} title="Aprendizado contínuo">
          <BarChart3 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="anx-side">
      <div className="anx-side-top">
        <span className="anx-side-titulo">Workspace</span>
        <button className="anx-side-ic" onClick={onToggle} title="Recolher painel lateral">
          <PanelLeftClose size={15} />
        </button>
      </div>

      <div className="anx-side-sec">
        <div className="anx-side-h">Modos de análise</div>
        <button className={`anx-side-item${perfilAtivo === 'consultor' && !emTela ? ' is-on' : ''}`}
          onClick={() => onPerfil('consultor')} disabled={ocupado}>
          <MessageSquareText size={15} aria-hidden /> Consultoria
        </button>
        <button className={`anx-side-item${perfilAtivo === 'qualificacao' && !emTela ? ' is-on' : ''}`}
          onClick={() => onPerfil('qualificacao')} disabled={ocupado}
          title="Roteiro de qualificação de leads pelas Fases 14/15 da metodologia">
          <HeartHandshake size={15} aria-hidden /> Qualificação comercial
        </button>
      </div>

      <div className="anx-side-sec">
        <div className="anx-side-h">Ferramentas</div>
        {FERRAMENTAS.map((f) => (
          <button key={f.perfil}
            className={`anx-side-item${perfilAtivo === f.perfil && !emTela ? ' is-on' : ''}`}
            onClick={() => onPerfil(f.perfil)} disabled={ocupado} title={f.descricao}>
            {f.icone} {f.curto}
          </button>
        ))}
      </div>

      <div className="anx-side-sec anx-side-sec-conversas">
        <div className="anx-side-h anx-side-h-row">
          <span>Conversas</span>
          <button className="anx-side-ic" onClick={onNovaConversa} disabled={ocupado} title="Nova conversa">
            <Plus size={14} />
          </button>
        </div>
        <input className="anx-side-busca" placeholder="Buscar conversa…"
          value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="anx-side-lista">
          {filtradas.length === 0 && (
            <div className="anx-side-vazio">
              {mostrarArquivadas ? 'Nenhuma conversa arquivada.' : 'Nenhuma conversa ainda.'}
            </div>
          )}
          {filtradas.map((c) => (
            <div key={c.id} className={`anx-side-conv${c.id === conversaAtualId ? ' is-on' : ''}`}>
              {editando === c.id ? (
                <input className="anx-side-busca" autoFocus value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void salvarTitulo(c.id);
                    if (e.key === 'Escape') setEditando(null);
                  }}
                  onBlur={() => void salvarTitulo(c.id)} />
              ) : (
                <>
                  <button className="anx-side-conv-main" onClick={() => onAbrirConversa(c.id)} disabled={ocupado}
                    title={c.titulo}>
                    <span className="anx-side-conv-tit">
                      {c.is_favorita && <Star size={11} className="anx-star" aria-label="Favorita" />}
                      {iconePerfil(c.profile)}
                      {c.titulo || `Conversa #${c.id}`}
                    </span>
                    <span className="anx-side-conv-meta">{fmtData(c.updated_at)} · {c.perguntas}p</span>
                  </button>
                  <span className="anx-side-conv-acoes">
                    <button className="anx-side-ic" title={c.is_favorita ? 'Remover dos favoritos' : 'Favoritar'}
                      onClick={() => void executar(c.id, c.is_favorita ? 'desfavoritar' : 'favoritar')}>
                      <Star size={13} fill={c.is_favorita ? 'currentColor' : 'none'} />
                    </button>
                    <button className="anx-side-ic" title="Renomear"
                      onClick={() => { setEditando(c.id); setNovoTitulo(c.titulo); }}>
                      <Pencil size={13} />
                    </button>
                    <button className="anx-side-ic" title={mostrarArquivadas ? 'Restaurar' : 'Arquivar'}
                      onClick={() => void executar(c.id, mostrarArquivadas ? 'desarquivar' : 'arquivar')}>
                      {mostrarArquivadas ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    </button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        <button className="anx-side-link" onClick={() => setMostrarArquivadas((v) => !v)}>
          {mostrarArquivadas ? '← Voltar às ativas' : 'Ver arquivadas'}
        </button>
      </div>

      <div className="anx-side-sec">
        <div className="anx-side-h">Biblioteca</div>
        <button className={`anx-side-item${bibliotecaAtiva ? ' is-on' : ''}`} onClick={onBiblioteca}
          title="Navegue pelas ~1.500 regras da metodologia">
          <BookOpen size={15} aria-hidden /> Metodologia Dshow
        </button>
        <button className={`anx-side-item${aprendizadoAtivo ? ' is-on' : ''}`} onClick={onAprendizado}>
          <BarChart3 size={15} aria-hidden /> Aprendizado contínuo
        </button>
      </div>
    </div>
  );
}
