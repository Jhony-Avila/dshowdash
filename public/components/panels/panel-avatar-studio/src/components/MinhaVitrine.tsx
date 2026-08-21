// components/MinhaVitrine.tsx — MINHA VITRINE (mega 230 · §1076/§1077).
// @version 1.0.0  @created 2026-08-05
//
// Recorte client-side da Parte 14: a área "Minha Vitrine" do perfil, com
// blocos DERIVADOS do que o usuário já tem (avatar atual, presets
// favoritos, coleção preferida, conquista principal, título e projeto
// recente do Photo Studio), reorganizáveis por CONTROLES ACESSÍVEIS
// (§1076 — sem drag obrigatório), e as GALERIAS locais (§1077) que
// agrupam presets/projetos por nome. Flag as5.vitrine_pessoal.
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Crown, FolderHeart, Images, Sparkles, Star, Trophy, User } from 'lucide-react';
import type { AvatarConfig, Conquista } from '../domain/types';
import { colecoesAtivas, dataUriDe, progressoColecao, tituloPorId } from '../services/AvatarCatalog';
import { itensUsados } from '../services/Progresso';
import { listarPresets } from '../services/PresetsPessoais';
import { listarProjetosFoto } from '../services/ProjetosFoto';
import {
  NOME_BLOCO, alternarNaGaleria, criarGaleria, excluirGaleria,
  listarGalerias, moverBloco, ordemVitrine,
} from '../services/VitrinePessoal';
import type { BlocoVitrine } from '../services/VitrinePessoal';

export function MinhaVitrine({ config, conquistas }: {
  config: AvatarConfig;
  conquistas: Conquista[];
}) {
  const [ordem, setOrdem] = useState<BlocoVitrine[]>(ordemVitrine);
  const [tic, setTic] = useState(0);
  const [galeriaAberta, setGaleriaAberta] = useState<string | null>(null);
  void tic;

  const presetsFav = useMemo(() => {
    const todos = listarPresets();
    const favs = todos.filter((p) => p.favorito);
    return (favs.length ? favs : todos).slice(0, 3); // §1076: três presets
  }, []);

  const colecaoPreferida = useMemo(() => {
    const usados = itensUsados();
    return colecoesAtivas()
      .map((col) => ({ col, p: progressoColecao(col, usados) }))
      .filter(({ p }) => p.usados > 0)
      .sort((a, b) => (b.p.usados / b.p.total) - (a.p.usados / a.p.total))[0] ?? null;
  }, []);

  const conquistaPrincipal = useMemo(() => (
    conquistas
      .filter((c) => c.conquistada && c.em)
      .sort((a, b) => String(b.em).localeCompare(String(a.em)))[0] ?? null
  ), [conquistas]);

  const titulo = tituloPorId(config.titulo);
  const projetoRecente = useMemo(() => listarProjetosFoto()[0] ?? null, []);
  const galerias = listarGalerias();
  const presetsTodos = useMemo(listarPresets, [tic]);
  const projetosTodos = useMemo(listarProjetosFoto, [tic]);

  const conteudoBloco = (b: BlocoVitrine): React.ReactNode => {
    switch (b) {
      case 'avatar':
        return <img src={dataUriDe(config, { estatico: true, tamanho: 120 })} alt="Avatar atual" width={88} height={88} />;
      case 'presets':
        return presetsFav.length
          ? (
            <span className="avst-mv-presets">
              {presetsFav.map((p) => (
                <img key={p.id} src={dataUriDe(p.config, { estatico: true, tamanho: 64 })}
                  alt={p.nome} title={p.nome} width={44} height={44} />
              ))}
            </span>
          )
          : <em>Salve presets para exibi-los aqui.</em>;
      case 'colecao':
        return colecaoPreferida
          ? <em><Sparkles size={11} aria-hidden /> {colecaoPreferida.col.nome} · {colecaoPreferida.p.usados}/{colecaoPreferida.p.total} explorada</em>
          : <em>Explore itens para eleger sua coleção.</em>;
      case 'conquista':
        return conquistaPrincipal
          ? <em><Trophy size={11} aria-hidden /> {conquistaPrincipal.nome}</em>
          : <em>Sua primeira conquista aparecerá aqui.</em>;
      case 'titulo':
        return titulo
          ? <em><Crown size={11} aria-hidden /> {titulo.nome}</em>
          : <em>Equipe um título para exibi-lo.</em>;
      case 'projeto':
        return projetoRecente
          ? <img src={projetoRecente.foto} alt={projetoRecente.nome} title={projetoRecente.nome} width={64} height={64} />
          : <em>Guarde um projeto no Photo Studio.</em>;
      default:
        return null;
    }
  };

  const ICONE: Record<BlocoVitrine, React.ReactNode> = {
    avatar: <User size={12} aria-hidden />,
    presets: <Star size={12} aria-hidden />,
    colecao: <Sparkles size={12} aria-hidden />,
    conquista: <Trophy size={12} aria-hidden />,
    titulo: <Crown size={12} aria-hidden />,
    projeto: <Images size={12} aria-hidden />,
  };

  return (
    <section className="avst-mv" aria-label="Minha Vitrine" data-teste="minha-vitrine">
      <h3 className="avst-cores-titulo"><FolderHeart size={14} aria-hidden /> Minha Vitrine</h3>
      <p className="avst-foto-nota">
        Seu perfil num relance — reorganize os blocos na ordem que conta a SUA história (§1076).
      </p>

      <ol className="avst-mv-blocos">
        {ordem.map((b, i) => (
          <li key={b} className="avst-mv-bloco" data-teste={`mv-bloco-${b}`}>
            <header>
              <strong>{ICONE[b]} {NOME_BLOCO[b]}</strong>
              <span className="avst-mv-mover" role="group" aria-label={`Mover ${NOME_BLOCO[b]}`}>
                <button type="button" className="avst5-painel-btn" disabled={i === 0}
                  aria-label={`Subir ${NOME_BLOCO[b]}`} data-teste={`mv-subir-${b}`}
                  onClick={() => setOrdem(moverBloco(b, -1))}><ArrowUp size={12} aria-hidden /></button>
                <button type="button" className="avst5-painel-btn" disabled={i === ordem.length - 1}
                  aria-label={`Descer ${NOME_BLOCO[b]}`} data-teste={`mv-descer-${b}`}
                  onClick={() => setOrdem(moverBloco(b, 1))}><ArrowDown size={12} aria-hidden /></button>
              </span>
            </header>
            <div className="avst-mv-conteudo">{conteudoBloco(b)}</div>
          </li>
        ))}
      </ol>

      {/* §1077: GALERIAS locais — presets/projetos agrupados por nome */}
      <div className="avst-mv-galerias" data-teste="mv-galerias">
        <h4 className="avst-cores-titulo"><Images size={13} aria-hidden /> Galerias</h4>
        <div className="avst-ft-chips">
          {galerias.map((g) => (
            <span key={g.id} className="avst5-lista-chip-grupo">
              <button type="button" className={`avst-ft-chip${galeriaAberta === g.id ? ' avst-ft-chip-ativo' : ''}`}
                aria-pressed={galeriaAberta === g.id} data-teste={`mv-gal-${g.id}`}
                onClick={() => setGaleriaAberta((v) => (v === g.id ? null : g.id))}>
                {g.nome} · {g.itens.length}
              </button>
              {g.itens.length === 0 && (
                <button type="button" className="avst5-painel-btn" aria-label={`Excluir galeria ${g.nome}`}
                  onClick={() => { excluirGaleria(g.id); if (galeriaAberta === g.id) setGaleriaAberta(null); setTic((t) => t + 1); }}>×</button>
              )}
            </span>
          ))}
          {galerias.length < 6 && (
            <input className="avst5-lista-nova" placeholder="+ nova galeria" maxLength={24} data-teste="mv-gal-nova"
              aria-label="Criar galeria (§1077)"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  const alvo = ev.target as HTMLInputElement;
                  const nova = criarGaleria(alvo.value);
                  if (nova) { alvo.value = ''; setGaleriaAberta(nova.id); setTic((t) => t + 1); }
                }
              }} />
          )}
        </div>
        {galeriaAberta && (() => {
          const gal = galerias.find((g) => g.id === galeriaAberta);
          if (!gal) return null;
          return (
            <div className="avst-mv-gal-corpo" data-teste="mv-gal-corpo">
              <p className="avst-foto-nota">Toque numa criação para guardá-la (ou tirá-la) desta galeria.</p>
              <div className="avst-mv-gal-grade">
                {presetsTodos.map((p) => {
                  const ref = `preset:${p.id}`;
                  const dentro = gal.itens.includes(ref);
                  return (
                    <button key={ref} type="button" className={`avst-mv-gal-item${dentro ? ' ativo' : ''}`}
                      aria-pressed={dentro} title={`${dentro ? 'Tirar' : 'Guardar'} o preset "${p.nome}"`}
                      data-teste={`mv-gal-item-${ref}`}
                      onClick={() => { alternarNaGaleria(gal.id, ref); setTic((t) => t + 1); }}>
                      <img src={dataUriDe(p.config, { estatico: true, tamanho: 64 })} alt={p.nome} width={48} height={48} />
                      <span>{p.nome}</span>
                    </button>
                  );
                })}
                {projetosTodos.map((pj) => {
                  const ref = `projeto:${pj.id}`;
                  const dentro = gal.itens.includes(ref);
                  return (
                    <button key={ref} type="button" className={`avst-mv-gal-item${dentro ? ' ativo' : ''}`}
                      aria-pressed={dentro} title={`${dentro ? 'Tirar' : 'Guardar'} o projeto "${pj.nome}"`}
                      data-teste={`mv-gal-item-${ref}`}
                      onClick={() => { alternarNaGaleria(gal.id, ref); setTic((t) => t + 1); }}>
                      <img src={pj.foto} alt={pj.nome} width={48} height={48} />
                      <span>{pj.nome}</span>
                    </button>
                  );
                })}
                {presetsTodos.length === 0 && projetosTodos.length === 0 && (
                  <em className="avst-foto-nota">Nada para guardar ainda — salve presets ou projetos primeiro.</em>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
