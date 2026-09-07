// shell/Ferramentas2D.tsx — GOLDEN V4.3 TRACK A (§5/§6-10): absorve no
// SHELL ÚNICO as ferramentas que só existiam no App clássico (Coleções,
// Conquistas, Criar com IA, Vitrine, Arquétipos, Títulos, Presets prontos, Foto,
// Histórico). REUSA os componentes de components/* (não duplica, não cria outro
// shell — §12). Cada um recebe config do store e aplica pelo mesmo adaptador
// (aoAplicar -> aplicarComando). Gate: só monta quando as6.single_2d (produção
// intocada). Overlay modal leve; nada aqui toca byte-estabilidade do render.
import { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import type { Vida } from '../services/VidaService';
import { t } from '../nucleo/i18n';

const Colecoes = lazy(() => import('../components/Colecoes').then((m) => ({ default: m.Colecoes })));
const Conquistas = lazy(() => import('../components/Conquistas').then((m) => ({ default: m.Conquistas })));
const CriarIA = lazy(() => import('../components/CriarIA').then((m) => ({ default: m.CriarIA })));
const Vitrine = lazy(() => import('../components/Vitrine').then((m) => ({ default: m.Vitrine })));
const Arquetipos = lazy(() => import('../components/Arquetipos').then((m) => ({ default: m.Arquetipos })));
const Titulos = lazy(() => import('../components/Titulos').then((m) => ({ default: m.Titulos })));
const Presets = lazy(() => import('../components/Presets').then((m) => ({ default: m.Presets })));
const Foto = lazy(() => import('../components/Foto').then((m) => ({ default: m.Foto })));
const Historico = lazy(() => import('../components/Historico').then((m) => ({ default: m.Historico })));

export type Ferramenta2D =
  | 'colecoes' | 'conquistas' | 'ia' | 'vitrine'
  | 'arquetipos' | 'titulos' | 'presets' | 'foto' | 'historico';

const TITULOS: Record<Ferramenta2D, string> = {
  colecoes: 'Coleções', conquistas: 'Conquistas', ia: 'Criar com IA', vitrine: 'Vitrine',
  arquetipos: 'Arquétipos', titulos: 'Títulos', presets: 'Presets prontos', foto: 'Foto', historico: 'Histórico',
};

interface Props {
  aberta: Ferramenta2D | null;
  config: AvatarConfig;
  desbloqueados: Set<string>;
  vida: Vida | null;
  vidaCarregando: boolean;
  versao: number;
  fotoAtiva: boolean;
  aoAplicar: (novo: AvatarConfig) => void;
  aoAbrirColecoes: () => void;
  aoSalvarFoto: (novaVersao: number) => void;
  aoReativarHistorico: (novaVersao: number, tipo: 'camadas' | 'foto' | '3d') => void;
  aoFechar: () => void;
}

/** Roteia a ferramenta clássica ativa para o componente REUSADO, dentro do shell. */
export function Ferramentas2D(props: Props) {
  const { aberta, config, desbloqueados, vida, vidaCarregando, versao, fotoAtiva, aoAplicar, aoAbrirColecoes, aoSalvarFoto, aoReativarHistorico, aoFechar } = props;
  if (!aberta) return null;
  return (
    <div className="avst5-modal-fundo avst5-ferr-fundo" role="dialog" aria-modal="true" aria-label={TITULOS[aberta]}>
      <div className="avst5-modal avst5-ferr-modal">
        <header className="avst5-ferr-cab">
          <h2 className="avst5-ferr-titulo">{t(TITULOS[aberta])}</h2>
          <button type="button" className="avst-botao avst5-ferr-fechar" aria-label={t('Fechar')} onClick={aoFechar}>
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="avst5-ferr-corpo">
          <Suspense fallback={<div className="avst5-ferr-carregando">{t('Carregando…')}</div>}>
            {aberta === 'colecoes' && <Colecoes config={config} aoAplicar={aoAplicar} />}
            {aberta === 'conquistas' && <Conquistas vida={vida} carregando={vidaCarregando} config={config} />}
            {aberta === 'ia' && <CriarIA config={config} iaDisponivel={vida?.iaDisponivel ?? false} aoAplicar={aoAplicar} desbloqueados={desbloqueados} />}
            {aberta === 'vitrine' && <Vitrine config={config} desbloqueados={desbloqueados} aoAplicar={aoAplicar} aoAbrirColecoes={aoAbrirColecoes} />}
            {aberta === 'arquetipos' && <Arquetipos config={config} aoAplicar={aoAplicar} />}
            {aberta === 'titulos' && <Titulos config={config} aoAplicar={aoAplicar} />}
            {aberta === 'presets' && <Presets aoAplicar={aoAplicar} />}
            {aberta === 'foto' && <Foto versao={versao} fotoAtiva={fotoAtiva} desbloqueados={desbloqueados} aoSalvar={aoSalvarFoto} configAtual={config} />}
            {aberta === 'historico' && <Historico key={`h-${versao}`} versaoBase={versao} aoAplicar={aoAplicar} aoReativar={aoReativarHistorico} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
