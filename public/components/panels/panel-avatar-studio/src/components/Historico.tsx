// components/Historico.tsx — linha do tempo das versões salvas.
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30 (4.6 §22, decisão #42)
//
// v2 — HISTÓRICO COMPLETO: 100 versões, NOMEAR (lápis, inline), FIXAR
// (fixadas nunca são apagadas pela poda de retenção), COMPARAR (2 lado a
// lado), EXPORTAR (camadas → JSON; foto/3D → imagem), FILTRAR por origem
// (camadas/foto/3D) e REATIVAR fotos/3D direto daqui. "Usar" reaplica uma
// versão em camadas no editor — a original continua no histórico; salvar
// cria uma NOVA versão (é assim que se duplica sem destruir nada).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight, Box, Camera, Check, Download, History, Layers, LoaderCircle,
  Pencil, Pin, RotateCcw, Sparkles, X,
} from 'lucide-react';
import type { AvatarConfig, HistoricoItem } from '../domain/types';
import { carregarHistorico, reativarVersao, salvarMetaHistorico } from '../services/AvatarService';
import { telemetria } from '../services/Telemetria';
import { AvatarSvg } from './AvatarSvg';

function fmtData(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type Filtro = 'todos' | 'camadas' | 'foto' | '3d';
const FILTROS: Array<{ id: Filtro; nome: string }> = [
  { id: 'todos', nome: 'Todas' },
  { id: 'camadas', nome: 'Camadas' },
  { id: 'foto', nome: 'Fotos' },
  { id: '3d', nome: '3D' },
];
const TIPO_NOME: Record<HistoricoItem['tipo'], string> = { camadas: 'Camadas', foto: 'Foto', '3d': '3D' };

function Thumb({ item, uid }: { item: HistoricoItem; uid: string }) {
  if (item.config) return <AvatarSvg config={item.config} estatico uid={uid} />;
  if (item.url) return <img src={item.url} alt="" loading="lazy" />;
  return <Camera size={20} aria-hidden />;
}

function nomeDe(item: HistoricoItem): string {
  return item.nome ?? `Versão v${item.versao || item.id}`;
}

export function Historico({ versaoBase, aoAplicar, aoReativar }: {
  versaoBase: number;
  aoAplicar: (config: AvatarConfig) => void;
  /** reativação concluída no servidor: sincroniza versão/tipo no App */
  aoReativar: (novaVersao: number, tipo: HistoricoItem['tipo']) => void;
}) {
  const [itens, setItens] = useState<HistoricoItem[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [comparar, setComparar] = useState<number[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    void carregarHistorico().then(setItens);
  }, []);
  useEffect(() => { recarregar(); }, [recarregar]);

  const visiveis = useMemo(
    () => (itens ?? []).filter((i) => filtro === 'todos' || i.tipo === filtro),
    [itens, filtro]
  );
  const porId = useMemo(() => new Map((itens ?? []).map((i) => [i.id, i])), [itens]);
  const parComparar = comparar.map((id) => porId.get(id)).filter(Boolean) as HistoricoItem[];

  const mudarMeta = (id: number, meta: { nome?: string | null; fixado?: boolean }) => {
    // otimista: aplica já; se o servidor recusar, recarrega a verdade
    setItens((atual) => (atual ?? []).map((i) => (i.id === id
      ? { ...i, nome: meta.nome !== undefined ? (meta.nome ?? null) : i.nome, fixado: meta.fixado ?? i.fixado }
      : i)));
    void salvarMetaHistorico(id, meta).then((ok) => {
      if (!ok) { setAviso('Não deu para salvar a alteração — tente de novo.'); recarregar(); }
    });
  };

  const fixar = (item: HistoricoItem) => {
    mudarMeta(item.id, { fixado: !item.fixado });
    telemetria('historico_fixou', { fixado: !item.fixado });
  };

  const confirmarNome = (item: HistoricoItem) => {
    const nome = rascunho.trim();
    setEditando(null);
    if (nome !== (item.nome ?? '')) {
      mudarMeta(item.id, { nome: nome === '' ? null : nome.slice(0, 60) });
      telemetria('historico_nomeou');
    }
  };

  const alternarComparar = (id: number) => {
    setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  };

  const exportar = (item: HistoricoItem) => {
    telemetria('historico_exportou', { tipo: item.tipo });
    if (item.config) {
      const blob = new Blob([JSON.stringify(item.config, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `avatar-${nomeDe(item).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = '';
      a.click();
    }
  };

  const reativar = async (item: HistoricoItem) => {
    setOcupado(item.id);
    setAviso(null);
    const r = await reativarVersao(item.id, versaoBase);
    setOcupado(null);
    if (r.ok && r.versao !== undefined) {
      aoReativar(r.versao, item.tipo);
      telemetria('historico_reativou', { tipo: item.tipo });
      recarregar();
    } else {
      setAviso(r.mensagem ?? 'Não foi possível reativar esta versão.');
    }
  };

  if (itens === null) {
    // §557: skeleton no formato REAL da lista (não spinner genérico)
    return (
      <div className="avst-historico" role="status" aria-label="Carregando histórico"
        data-teste="esqueleto-historico">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="avst-esqueleto" style={{ height: 74 }} />
        ))}
      </div>
    );
  }
  if (itens.length === 0) {
    return (
      <div className="avst-vazio">
        <History size={28} aria-hidden />
        <p>Seu histórico aparece aqui depois do primeiro salvamento.</p>
      </div>
    );
  }

  return (
    <div className="avst-historico2">
      {/* filtros por origem (§22) */}
      <div className="avst-hist-filtros" role="radiogroup" aria-label="Filtrar por origem">
        {FILTROS.map((f) => {
          const n = f.id === 'todos' ? itens.length : itens.filter((i) => i.tipo === f.id).length;
          return (
            <button key={f.id} type="button" role="radio" aria-checked={filtro === f.id}
              className={`avst-hist-chip ${filtro === f.id ? 'avst-hist-chip-ativo' : ''}`}
              onClick={() => setFiltro(f.id)}>
              {f.nome} <em>{n}</em>
            </button>
          );
        })}
      </div>

      {aviso && <p className="avst-hist-aviso" role="alert">{aviso}</p>}

      {/* comparação lado a lado (§22) */}
      {parComparar.length === 2 && (
        <div className="avst-hist-comparar" role="region" aria-label="Comparação de versões">
          {parComparar.map((c) => (
            <figure key={c.id}>
              <span className="avst-hist-comp-thumb"><Thumb item={c} uid={`hc-${c.id}`} /></span>
              <figcaption>
                <strong>{nomeDe(c)}</strong>
                <em>{TIPO_NOME[c.tipo]} · {fmtData(c.criadoEm)}</em>
              </figcaption>
            </figure>
          ))}
          <button type="button" className="avst-hist-comp-fechar" title="Fechar comparação"
            onClick={() => setComparar([])}>
            <X size={14} aria-hidden />
          </button>
        </div>
      )}
      {parComparar.length === 1 && (
        <p className="avst-conquistas-resumo">
          <ArrowLeftRight size={13} aria-hidden /> Escolha a segunda versão para comparar com <strong>{nomeDe(parComparar[0])}</strong>.
        </p>
      )}

      <div className="avst-historico" role="list" aria-label="Histórico de avatares">
        {visiveis.map((item) => (
          <div key={item.id} role="listitem"
            className={`avst-hist-item ${item.ativo ? 'avst-hist-ativo' : ''} ${comparar.includes(item.id) ? 'avst-hist-comparando' : ''}`}>
            <span className="avst-hist-thumb"><Thumb item={item} uid={`hi-${item.id}`} /></span>
            <span className="avst-hist-info">
              {editando === item.id ? (
                <input type="text" className="avst-hist-nome-input" value={rascunho} maxLength={60}
                  autoFocus aria-label="Nome da versão"
                  onChange={(e) => setRascunho(e.target.value)}
                  onBlur={() => confirmarNome(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmarNome(item);
                    if (e.key === 'Escape') setEditando(null);
                  }} />
              ) : (
                <strong>
                  {nomeDe(item)}
                  {item.ativo && <span className="avst-hist-badge avst-hist-badge-ativo"><Check size={9} aria-hidden /> Ativa</span>}
                  {item.fixado && <span className="avst-hist-badge avst-hist-badge-fixa"><Pin size={9} aria-hidden /> Fixada</span>}
                </strong>
              )}
              <em>
                {item.tipo === 'foto' ? <Camera size={10} aria-hidden /> : item.tipo === '3d' ? <Box size={10} aria-hidden /> : <Layers size={10} aria-hidden />}
                {' '}{TIPO_NOME[item.tipo]} · {fmtData(item.criadoEm)}
              </em>
            </span>
            <span className="avst-hist-acoes">
              <button type="button" className={`avst-hist-mini ${item.fixado ? 'avst-hist-mini-on' : ''}`}
                title={item.fixado ? 'Desafixar (volta a valer a retenção)' : 'Fixar — nunca é apagada pela retenção'}
                aria-pressed={item.fixado} onClick={() => fixar(item)}>
                <Pin size={13} aria-hidden />
              </button>
              <button type="button" className="avst-hist-mini" title="Nomear esta versão"
                onClick={() => { setEditando(item.id); setRascunho(item.nome ?? ''); }}>
                <Pencil size={13} aria-hidden />
              </button>
              <button type="button" className={`avst-hist-mini ${comparar.includes(item.id) ? 'avst-hist-mini-on' : ''}`}
                title="Comparar com outra versão" aria-pressed={comparar.includes(item.id)}
                onClick={() => alternarComparar(item.id)}>
                <ArrowLeftRight size={13} aria-hidden />
              </button>
              <button type="button" className="avst-hist-mini"
                title={item.config ? 'Exportar o config JSON desta versão' : 'Baixar a imagem desta versão'}
                onClick={() => exportar(item)}>
                <Download size={13} aria-hidden />
              </button>
              {item.config ? (
                <button type="button" className="avst-botao"
                  title="Carrega uma CÓPIA no editor — salvar cria uma nova versão; esta continua aqui"
                  onClick={() => { aoAplicar(item.config as AvatarConfig); telemetria('historico_usou'); }}>
                  <RotateCcw size={14} aria-hidden /> Usar
                </button>
              ) : !item.ativo && item.url ? (
                <button type="button" className="avst-botao" disabled={ocupado === item.id}
                  title="Torna esta versão o seu avatar ativo de novo"
                  onClick={() => { void reativar(item); }}>
                  {ocupado === item.id
                    ? <LoaderCircle className="avst-girando" size={14} aria-hidden />
                    : <Sparkles size={14} aria-hidden />} Reativar
                </button>
              ) : null}
            </span>
          </div>
        ))}
        {visiveis.length === 0 && (
          <p className="avst-grade-vazia">Nenhuma versão desse tipo ainda.</p>
        )}
      </div>

      <p className="avst-hist-retencao">
        Guardamos as últimas 100 versões. <Pin size={10} aria-hidden /> Fixadas nunca são apagadas.
      </p>
    </div>
  );
}
