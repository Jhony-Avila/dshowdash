// vc/VisualComposer.tsx — Avatar Studio Visual Composer (frente ux, flag as6.visual_composer).
// Marco 2.1 — Modo Visual (esqueleto): palco dominante + trilho de grupos + catálogo visual.
// Reusa AvatarStore + comItem + itensDe + svgItemIsolado + AvatarSvg (zero store novo, zero 2ª fonte).
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, Undo2, Redo2, Save, User, Scissors, Eye, Shirt, Glasses, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { AvatarStore } from '../nucleo/estado';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { validarConfig, itensDe, svgItemIsolado } from '../services/AvatarCatalog';
import { comItem } from '../components/GradeItens';
import { AvatarSvg } from '../components/AvatarSvg';
import { salvarAvatar } from '../services/AvatarService';
import '../styles/visual-composer.css';

interface GrupoVisual { id: string; nome: string; Icone: typeof User; cats: CategoriaId[]; }
const GRUPOS_VISUAIS: GrupoVisual[] = [
  { id: 'base', nome: 'Base', Icone: User, cats: ['base'] },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors, cats: ['cabelo', 'barba'] },
  { id: 'rosto', nome: 'Rosto', Icone: Eye, cats: ['olhos', 'boca', 'sobrancelha', 'nariz'] },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt, cats: ['roupa', 'roupa_inferior', 'roupa_sobre'] },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses, cats: ['acessorio'] },
  { id: 'cenario', nome: 'Cenário', Icone: ImageIcon, cats: ['fundo'] },
  { id: 'estilo', nome: 'Estilo', Icone: Sparkles, cats: ['efeito', 'aura', 'moldura', 'emblema', 'banner'] },
];

export interface PropsVisualComposer {
  configInicial: AvatarConfig;
  versaoBase: number;
  aoVoltar?: () => void;
}

export default function VisualComposer({ configInicial, versaoBase, aoVoltar }: PropsVisualComposer) {
  const store = useMemo(() => new AvatarStore(deLegado2d(validarConfig(configInicial)), versaoBase), [configInicial, versaoBase]);
  const estadoVisivel = useSyncExternalStore(store.assinar, () => store.estadoVisivel);
  const config = useMemo(() => validarConfig(paraLegado2d(estadoVisivel)), [estadoVisivel]);

  const [grupoId, setGrupoId] = useState<string>('base');
  const grupo = GRUPOS_VISUAIS.find((g) => g.id === grupoId) ?? GRUPOS_VISUAIS[0];
  const [pendente, setPendente] = useState(false);
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');

  const aplicar = useCallback((novo: AvatarConfig) => {
    const antes = store.estadoDraft;
    const alvo = deLegado2d(validarConfig(novo));
    store.executar({ nome: 'vc:aplicar', executar: () => alvo, desfazer: () => antes });
    setPendente(true); setSalv('idle');
  }, [store]);

  const itens = useMemo(
    () => grupo.cats.flatMap((c) => itensDe(c).map((it) => ({ it, cat: c }))),
    [grupo],
  );

  const salvar = useCallback(async () => {
    setSalv('salvando');
    try {
      const r = await salvarAvatar(config, versaoBase);
      if (r.ok) { setSalv('salvo'); setPendente(false); } else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [config, versaoBase]);

  const camadas = config.camadas as Record<string, string | undefined>;

  return (
    <div className="vc-root" data-vc>
      <header className="vc-barra">
        <button className="vc-acao" type="button" onClick={() => aoVoltar?.()} aria-label="Voltar">
          <ChevronLeft size={18} aria-hidden /><span>Voltar</span>
        </button>
        <div className="vc-titulo">Avatar Studio</div>
        <div className="vc-globais">
          <button className="vc-acao vc-icone" type="button" onClick={() => { store.desfazer(); setPendente(true); }} aria-label="Desfazer"><Undo2 size={18} aria-hidden /></button>
          <button className="vc-acao vc-icone" type="button" onClick={() => { store.refazer(); setPendente(true); }} aria-label="Refazer"><Redo2 size={18} aria-hidden /></button>
          <button className="vc-salvar" type="button" onClick={() => void salvar()} data-estado={salv} aria-label="Salvar">
            <Save size={16} aria-hidden />
            <span>{salv === 'salvando' ? 'Salvando…' : salv === 'salvo' ? 'Salvo' : salv === 'erro' ? 'Repetir' : 'Salvar'}</span>
            {pendente && salv !== 'salvo' && <span className="vc-ponto" aria-hidden />}
          </button>
        </div>
      </header>
      <div className="vc-corpo">
        <nav className="vc-trilho" aria-label="Categorias">
          {GRUPOS_VISUAIS.map((g) => {
            const Ic = g.Icone;
            return (
              <button key={g.id} type="button" className={`vc-cat ${g.id === grupoId ? 'vc-cat-ativa' : ''}`}
                aria-pressed={g.id === grupoId} onClick={() => setGrupoId(g.id)}>
                <Ic size={22} aria-hidden /><span>{g.nome}</span>
              </button>
            );
          })}
        </nav>
        <main className="vc-palco" aria-label="Palco do avatar">
          <AvatarSvg config={config} uid="vc-palco" palco />
        </main>
        <aside className="vc-painel" aria-label={`Catálogo: ${grupo.nome}`}>
          <div className="vc-painel-cab">{grupo.nome}</div>
          <div className="vc-grade">
            {itens.map(({ it, cat }) => {
              const equipado = cat === 'base' ? config.base === it.id : camadas?.[cat] === it.id;
              return (
                <button key={`${cat}:${it.id}`} type="button" className={`vc-card ${equipado ? 'vc-card-on' : ''}`}
                  aria-pressed={equipado} title={it.nome}
                  onClick={() => aplicar(validarConfig(comItem(config, cat, it.id)))}>
                  <span className="vc-thumb" aria-hidden dangerouslySetInnerHTML={{ __html: svgItemIsolado(it.id) }} />
                  <span className="vc-card-nome">{it.nome}</span>
                </button>
              );
            })}
            {itens.length === 0 && <div className="vc-vazio">Sem itens nesta categoria.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
