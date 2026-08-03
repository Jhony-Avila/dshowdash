// shell/Palco3d.tsx — PRÉVIA 3D no viewport do shell (AS5 · megas 7+9).
// @version 2.0.0  @created 2026-08-03  @updated 2026-08-03 (mega 9)
//
// Wrapper React fino do Renderizador3d (§401) via fábrica: o three só
// atravessa a rede quando o usuário LIGA o 3D (import dinâmico → motor3d).
// Mega 9: personagens vêm do ÍNDICE publicado (index.json derivado da
// publicação; fallback embutido), a BASE 2D escolhida decide o personagem
// (auto-mapeamento com OVERRIDE manual + chip "Auto"), e as ANIMAÇÕES
// REAIS do GLB viram seletor (Idle/Walk/Wave/Dance…). Pendências §481
// continuam honestas; flag as5.palco3d fail-safe OFF; erro nunca derruba
// o shell.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Clapperboard, PersonStanding, Sparkles, UserRound, Wand2 } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import type { EstadoCamera, RenderizadorAvatar } from '../nucleo/renderizador';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { carregarIndice3d, personagemParaBase } from '../services/Personagens3d';
import type { EntradaIndice3d } from '../services/Personagens3d';

/** Fallback embutido (índice indisponível — ex.: publicação parcial). */
const CURADOS_FALLBACK: EntradaIndice3d[] = [
  { slug: 'humano_casual', nome: 'Casual', thumb: '', animacoes: [] },
  { slug: 'humano_aventureiro', nome: 'Aventureiro', thumb: '', animacoes: [] },
  { slug: 'humano_terno', nome: 'Executivo', thumb: '', animacoes: [] },
  { slug: 'humano_punk', nome: 'Punk', thumb: '', animacoes: [] },
  { slug: 'androide', nome: 'Androide', thumb: '', animacoes: [] },
  { slug: 'animal_pug', nome: 'Pug', thumb: '', animacoes: [] },
];

/** Animações em destaque no seletor (ordem de preferência §174-friendly). */
const ANIMACOES_DESTAQUE = ['Idle', 'Walk', 'Walking', 'Running', 'Wave', 'Dance', 'Jump', 'Victory', 'ThumbsUp'];

const CHAVE_OVERRIDE = 'dshow.avst5.p3d.personagem.v1';

function overrideGuardado(): string | null {
  try { return localStorage.getItem(CHAVE_OVERRIDE); } catch { return null; }
}

export function Palco3d({ estado, movReduzido }: {
  estado: EstadoAvatar;
  movReduzido: boolean;
}) {
  const refAlvo = useRef<HTMLDivElement>(null);
  const refR = useRef<RenderizadorAvatar | null>(null);
  // mega 9: override manual (null = AUTO — segue a base 2D do estado)
  const [override, setOverride] = useState<string | null>(overrideGuardado);
  const [indice, setIndice] = useState<EntradaIndice3d[]>(CURADOS_FALLBACK);
  const [fase, setFase] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [pendencias, setPendencias] = useState(0);
  const [cameraModo, setCameraModo] = useState<EstadoCamera['modo']>('corpo');
  const [animacao, setAnimacao] = useState('Idle');

  const personagem = override ?? personagemParaBase(estado.body.base);
  const refPersonagem = useRef(personagem);
  refPersonagem.current = personagem;

  // índice publicado (derivado) — fallback embutido se indisponível
  useEffect(() => {
    let vivo = true;
    void carregarIndice3d().then((i) => { if (vivo && i) setIndice(i); });
    return () => { vivo = false; };
  }, []);

  // monta o renderer UMA vez; descarta ao sair do modo 3D
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await criarRenderizador('3d', {
          resolverPersonagem: () => refPersonagem.current,
        });
        if (!vivo) { void r.descartar(); return; }
        refR.current = r;
        await r.inicializar({ qualidade: 'auto', pixelRatioMax: 2 });
        if (!refAlvo.current) throw new Error('alvo desmontado');
        await r.montar(refAlvo.current as unknown as { innerHTML: string });
        if (vivo) setFase('pronto');
      } catch {
        if (vivo) setFase('indisponivel');
      }
    })();
    return () => {
      vivo = false;
      void refR.current?.descartar();
      refR.current = null;
    };
  }, []);

  // estado do DRAFT + personagem (auto ou override) → renderer
  useEffect(() => {
    const r = refR.current;
    if (!r || fase !== 'pronto') return;
    void r.aplicarEstado(estado).then((res) => {
      if (!res.ok) { setFase('indisponivel'); return; }
      setPendencias(res.pendencias.length);
      r.definirCamera({ modo: cameraModo, distancia: 2.15 });
      // personagem novo pode não ter a animação atual → volta ao Idle
      void r.tocarAnimacao({ id: movReduzido ? 'nenhum' : animacao });
    });
  }, [estado, personagem, fase, cameraModo, animacao, movReduzido]);

  const animacoesDoAtual = useMemo(() => {
    const doIndice = indice.find((p) => p.slug === personagem)?.animacoes ?? [];
    const destaque = ANIMACOES_DESTAQUE.filter((a) => doIndice.includes(a));
    return destaque.length ? destaque.slice(0, 6) : doIndice.slice(0, 6);
  }, [indice, personagem]);

  const trocarPersonagem = useCallback((slug: string | null) => {
    setOverride(slug);
    setAnimacao('Idle');
    try {
      if (slug) localStorage.setItem(CHAVE_OVERRIDE, slug);
      else localStorage.removeItem(CHAVE_OVERRIDE);
    } catch { /* sem storage */ }
  }, []);

  const trocarCamera = useCallback((modo: EstadoCamera['modo']) => {
    setCameraModo(modo);
    refR.current?.definirCamera({ modo, distancia: 2.15 });
  }, []);

  if (fase === 'indisponivel') {
    return (
      <div className="avst5-p3d-vazio" role="status" data-teste="p3d-indisponivel">
        <Box size={26} aria-hidden />
        <p>
          Prévia 3D indisponível neste ambiente — os personagens publicados não
          foram encontrados (ou o WebGL está desligado).
        </p>
      </div>
    );
  }

  return (
    <div className="avst5-p3d" data-teste="palco-3d">
      <div ref={refAlvo} className="avst5-p3d-tela" aria-label="Palco 3D (prévia)" />
      {fase === 'pronto' && (<>
        <div className="avst5-p3d-personagens" role="radiogroup" aria-label="Personagem da prévia 3D">
          <button type="button" role="radio" aria-checked={override === null}
            className={`avst5-p3d-chip${override === null ? ' avst5-p3d-chip-on' : ''}`}
            title="Segue a espécie escolhida no 2D" data-teste="p3d-auto"
            onClick={() => trocarPersonagem(null)}>
            <Wand2 size={11} aria-hidden /> Auto
          </button>
          {indice.map((p) => (
            <button key={p.slug} type="button" role="radio"
              aria-checked={override === p.slug || (override === null && personagem === p.slug)}
              className={`avst5-p3d-chip${personagem === p.slug ? ' avst5-p3d-chip-on' : ''}`}
              onClick={() => trocarPersonagem(p.slug)}>
              {p.nome}
            </button>
          ))}
        </div>
        {animacoesDoAtual.length > 0 && (
          <div className="avst5-p3d-animacoes" role="radiogroup" aria-label="Animação"
            data-teste="p3d-animacoes">
            <Sparkles size={11} aria-hidden />
            {animacoesDoAtual.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={animacao === a}
                className={`avst5-p3d-chip${animacao === a ? ' avst5-p3d-chip-on' : ''}`}
                onClick={() => setAnimacao(a)}>
                {a}
              </button>
            ))}
          </div>
        )}
        <div className="avst5-p3d-cameras" role="radiogroup" aria-label="Câmera (§453.1)">
          <button type="button" role="radio" aria-checked={cameraModo === 'corpo'} title="Corpo inteiro"
            onClick={() => trocarCamera('corpo')}><PersonStanding size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'retrato'} title="Retrato"
            onClick={() => trocarCamera('retrato')}><UserRound size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'cinematica'} title="Cinemática (órbita)"
            onClick={() => trocarCamera('cinematica')}><Clapperboard size={13} aria-hidden /></button>
        </div>
        <div className="avst5-p3d-nota" role="note" data-teste="p3d-pendencias">
          {override === null ? 'Auto pela espécie 2D' : 'Personagem fixado'}
          {pendencias > 0 ? ` · ${pendencias} item(ns) equipados seguem no 2D` : ''}
        </div>
      </>)}
      {fase === 'carregando' && (
        <div className="avst5-p3d-carregando" role="status">
          <span className="avst-esqueleto" style={{ width: 180, height: 180, borderRadius: '50%' }} />
        </div>
      )}
    </div>
  );
}
