// shell/DetalheAsset.tsx — DRAWER DE DETALHES do asset (briefing §67, AS5).
// @version 1.0.0  @created 2026-08-01
//
// Pendência registrada da F3, fechada agora. Conteúdo §67.1: hero com o
// item APLICADO ao avatar atual (preview animado), nome, raridade, lore,
// tema, coleção que o contém (com progresso), canais de cor que a arte
// usa, slot, compatibilidades/incompatibilidades e origem do desbloqueio.
// Ações §67.2: Experimentar (SEGURAR = preview §608, mesma semântica do
// botão Original), Equipar/Remover, Favoritar, Salvar como preset e Ver
// coleção. Itens relacionados: mesmo tema, navegáveis dentro do drawer.
import { useMemo, useState } from 'react';
import { BookmarkPlus, Check, Eye, Layers, Lock, Star, X } from 'lucide-react';
import type { AvatarConfig, SlotCor } from '../domain/types';
import {
  COLECOES, RARIDADES, itemPorId, itensDe, progressoColecao, validarConfig,
} from '../services/AvatarCatalog';
import { comItem, FOCO_THUMB } from '../components/GradeItens';
import { alternarFavorito, favoritos, itensUsados } from '../services/Progresso';
import { salvarPreset } from '../services/PresetsPessoais';
import { AvatarSvg } from '../components/AvatarSvg';

const NOME_CANAL: Record<SlotCor, string> = {
  pele: 'Pele', cabelo: 'Cabelo', roupa: 'Cor principal', destaque: 'Detalhes',
};

export function DetalheAsset({ id, config, desbloqueados, aoEscolher, aoPrever, aoFechar, aoVerColecao }: {
  id: string;
  config: AvatarConfig;
  desbloqueados: Set<string>;
  aoEscolher: (novo: AvatarConfig) => void;
  aoPrever: (novo: AvatarConfig | null) => void;
  aoFechar: () => void;
  /** leva à aba Coleções do modo clássico não existe no shell — rola p/ a categoria */
  aoVerColecao?: (colecaoId: string) => void;
}) {
  const [atual, setAtual] = useState(id);
  const [salvo, setSalvo] = useState(false);
  const [, setTic] = useState(0);
  const item = itemPorId(atual);

  const preview = useMemo(
    () => (item ? validarConfig(comItem(config, item.categoria, item.id)) : config),
    [config, item],
  );
  if (!item) return null;

  const rar = RARIDADES[item.raridade];
  const bloqueado = Boolean(item.bloqueadoPor) && !desbloqueados.has(item.id);
  const equipado = config.base === item.id || Object.values(config.camadas).includes(item.id);
  const colecao = COLECOES.find((c) => c.itens.includes(item.id));
  const prog = colecao ? progressoColecao(colecao, itensUsados()) : null;
  const favorito = favoritos().has(item.id);
  const relacionados = itensDe(item.categoria)
    .filter((i) => i.id !== item.id && i.tema === item.tema).slice(0, 4);
  const incompativeis = (item.incompativelCom ?? [])
    .map((x) => itemPorId(x)?.nome).filter(Boolean);
  const bases = (item.requerBase ?? []).map((x) => itemPorId(x)?.nome).filter(Boolean);

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label={`Detalhes de ${item.nome}`}>
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar detalhes" onClick={aoFechar} />
      <aside className="avst5-detalhe" data-teste="drawer-detalhe" style={{ '--avst-rar': rar.cor } as React.CSSProperties}>
        <header className="avst5-det-cab">
          <strong>{item.nome}</strong>
          <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>
        {/* hero: o item aplicado AO SEU avatar, animado (§67.1) */}
        <div className="avst5-det-hero">
          <AvatarSvg config={preview} uid={`det-${item.id}`} foco={FOCO_THUMB[item.categoria]} />
        </div>
        <p className="avst5-det-rar" style={{ color: rar.cor }}>{rar.nome} · {item.tema}{bloqueado && <> · <Lock size={11} aria-hidden /> bloqueado</>}</p>
        <p className="avst5-det-lore">{item.lore ?? item.descricao}</p>
        {item.bloqueadoPor && (
          <p className="avst5-det-meta">Origem: {item.bloqueadoPor.startsWith('evento:') ? 'item de evento sazonal' : 'recompensa de conquista'}{bloqueado ? ' (ainda não desbloqueado)' : ' (desbloqueado ✓)'}</p>
        )}
        {colecao && prog && (
          <button type="button" className="avst5-det-colecao" onClick={() => aoVerColecao?.(colecao.id)}>
            <Layers size={12} aria-hidden /> Coleção <strong>{colecao.nome}</strong> · {prog.usados}/{prog.total}
          </button>
        )}
        {(item.usaCores?.length ?? 0) > 0 && (
          <p className="avst5-det-meta">Canais de cor: {item.usaCores!.map((c) => NOME_CANAL[c]).join(', ')}</p>
        )}
        {item.slot && <p className="avst5-det-meta">Slot: {item.slot}</p>}
        {bases.length > 0 && <p className="avst5-det-meta">Só combina com: {bases.join(', ')}</p>}
        {incompativeis.length > 0 && <p className="avst5-det-meta">Incompatível com: {incompativeis.join(', ')}</p>}

        <div className="avst5-det-acoes">
          <button type="button" className="avst-botao" title="Segure para ver no palco"
            onPointerDown={() => aoPrever(preview)} onPointerUp={() => aoPrever(null)} onPointerLeave={() => aoPrever(null)}>
            <Eye size={13} aria-hidden /> Experimentar
          </button>
          <button type="button" className={`avst-botao${favorito ? ' avst-botao-ativo' : ''}`}
            onClick={() => { alternarFavorito(item.id); setTic((t) => t + 1); }}>
            <Star size={13} aria-hidden /> {favorito ? 'Favorito' : 'Favoritar'}
          </button>
          <button type="button" className="avst-botao" disabled={salvo}
            title="Salva o avatar COM este item como preset"
            onClick={() => { if (salvarPreset(`Com ${item.nome}`, preview)) setSalvo(true); }}>
            <BookmarkPlus size={13} aria-hidden /> {salvo ? 'Preset salvo ✓' : 'Salvar preset'}
          </button>
          <button type="button" className="avst-botao avst-botao-primario" disabled={bloqueado}
            onClick={() => { aoEscolher(comItem(config, item.categoria, item.id)); aoFechar(); }}>
            <Check size={13} aria-hidden /> {equipado ? (item.categoria === 'acessorio' ? 'Remover' : 'Equipado') : 'Equipar'}
          </button>
        </div>

        {relacionados.length > 0 && (
          <div className="avst5-det-rel">
            <h4 className="avst5-props-titulo">Relacionados ({item.tema})</h4>
            <div className="avst5-det-rel-lista">
              {relacionados.map((r) => (
                <button key={r.id} type="button" title={r.nome} onClick={() => { setAtual(r.id); setSalvo(false); }}>
                  <AvatarSvg config={validarConfig(comItem(config, r.categoria, r.id))} estatico
                    uid={`rel-${r.id}`} foco={FOCO_THUMB[r.categoria]} />
                  <span>{r.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
