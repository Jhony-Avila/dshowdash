// shell/Palco3d.tsx — PRÉVIA 3D no viewport do shell (AS5 · mega 7).
// @version 1.0.0  @created 2026-08-03
//
// Wrapper React fino do Renderizador3d (§401) via fábrica: o three só
// atravessa a rede quando o usuário LIGA o 3D (import dinâmico → chunk
// motor3d). Mostra os personagens CURADOS publicados pelo pipeline
// (public/assets/avatars/3d/personagens); pendências §481 viram um chip
// honesto — itens equipados seguem representados no 2D até o catálogo 3D
// ganhar as peças. Flag as5.palco3d (fail-safe OFF) decide se o botão
// sequer aparece; erro aqui NUNCA derruba o shell (estado indisponível).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Clapperboard, PersonStanding, UserRound } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import type { EstadoCamera, RenderizadorAvatar } from '../nucleo/renderizador';
import { criarRenderizador } from '../services/FabricaRenderizador';

/** Personagens curados publicados (AS4 → pipeline mega 5, versionados). */
export const PERSONAGENS_CURADOS = [
  { slug: 'humano_casual', nome: 'Casual' },
  { slug: 'humano_aventureiro', nome: 'Aventureiro' },
  { slug: 'humano_terno', nome: 'Executivo' },
  { slug: 'humano_punk', nome: 'Punk' },
  { slug: 'androide', nome: 'Androide' },
  { slug: 'animal_pug', nome: 'Pug' },
] as const;

const CHAVE_PERSONAGEM = 'dshow.avst5.p3d.personagem.v1';

function personagemGuardado(): string {
  try {
    const s = localStorage.getItem(CHAVE_PERSONAGEM);
    return PERSONAGENS_CURADOS.some((p) => p.slug === s) ? (s as string) : 'humano_casual';
  } catch { return 'humano_casual'; }
}

export function Palco3d({ estado, movReduzido }: {
  estado: EstadoAvatar;
  movReduzido: boolean;
}) {
  const refAlvo = useRef<HTMLDivElement>(null);
  const refR = useRef<RenderizadorAvatar | null>(null);
  const refPersonagem = useRef(personagemGuardado());
  const [personagem, setPersonagem] = useState(refPersonagem.current);
  const [fase, setFase] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [pendencias, setPendencias] = useState(0);
  const [cameraModo, setCameraModo] = useState<EstadoCamera['modo']>('corpo');

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

  // estado do DRAFT + personagem escolhido → renderer (pendências honestas)
  useEffect(() => {
    refPersonagem.current = personagem;
    const r = refR.current;
    if (!r || fase !== 'pronto') return;
    void r.aplicarEstado(estado).then((res) => {
      if (!res.ok) { setFase('indisponivel'); return; }
      setPendencias(res.pendencias.length);
      // enquadramento com folga (o default do renderer corta o topo em
      // viewports largos) — respeita o modo de câmera escolhido
      r.definirCamera({ modo: cameraModo, distancia: 2.15 });
    });
  }, [estado, personagem, fase, cameraModo]);

  // §297: movimento reduzido = sem idle
  useEffect(() => {
    if (fase === 'pronto') void refR.current?.tocarAnimacao({ id: movReduzido ? 'nenhum' : 'idle' });
  }, [movReduzido, fase]);

  const trocarPersonagem = useCallback((slug: string) => {
    setPersonagem(slug);
    try { localStorage.setItem(CHAVE_PERSONAGEM, slug); } catch { /* sem storage */ }
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
          {PERSONAGENS_CURADOS.map((p) => (
            <button key={p.slug} type="button" role="radio" aria-checked={personagem === p.slug}
              className={`avst5-p3d-chip${personagem === p.slug ? ' avst5-p3d-chip-on' : ''}`}
              onClick={() => trocarPersonagem(p.slug)}>
              {p.nome}
            </button>
          ))}
        </div>
        <div className="avst5-p3d-cameras" role="radiogroup" aria-label="Câmera (§453.1)">
          <button type="button" role="radio" aria-checked={cameraModo === 'corpo'} title="Corpo inteiro"
            onClick={() => trocarCamera('corpo')}><PersonStanding size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'retrato'} title="Retrato"
            onClick={() => trocarCamera('retrato')}><UserRound size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'cinematica'} title="Cinemática (órbita)"
            onClick={() => trocarCamera('cinematica')}><Clapperboard size={13} aria-hidden /></button>
        </div>
        <div className="avst5-p3d-nota" role="note" data-teste="p3d-pendencias">
          Prévia 3D (curados)
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
