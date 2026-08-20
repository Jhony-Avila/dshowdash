// shell/QaStudio.tsx — onda 1410 (MEGA_BRIEFING_01 §2707–§2742; VISUAL-QA.md
// §7): ROTA DE QA VISUAL (dev) — chunk lazy atrás de `as6.qa_route` (OFF).
// @version 1.0.0  @created 2026-08-20
//
// Painel de homologação sobre o Palco 3D ABERTO: controla o renderizador
// pelo handle dev (window.__avst3d — exposto com as5.hud3d OU as6.qa_route),
// SEM tocar o estado persistido do avatar: LOD forçado, look, overlays de
// QA, cena de calibração e screenshot 1-click (download local). Inspector
// técnico: snapshotMetricas (renderer.info, luzes, câmera) + manifest do
// personagem (hash, licença, qaVisual, health do index §2735) + bones/
// clipes/morphs. Debug de materiais (lista mapas/fatores) atrás de
// `as6.material_debug` (OFF). Nada persiste; fechar restaura overlay/lab.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, FlaskConical, X } from 'lucide-react';
import { flag } from '../nucleo/flags';
import { MOVIMENTOS, animar } from './movimento';

interface Renderizador3dDev {
  definirQualidade?: (p: 'economico' | 'medio' | 'alto' | 'auto') => void;
  aplicarLook?: (id: string) => void;
  lookAtivo?: () => string;
  definirOverlay?: (m: string) => void;
  overlayAtivo?: () => string;
  definirLaboratorio?: (v: boolean) => void;
  laboratorioAtivo?: () => boolean;
  snapshotMetricas?: () => Record<string, unknown> & { luzes?: unknown[]; drawCalls?: number; triangulos?: number };
  capturar?: (o: { largura: number; altura: number; formato?: string }) => Promise<{ dataUri: string }>;
  manifest?: { id?: string; versao?: number; rig?: string; qualidadeVisual?: string; qaVisual?: { status?: string }; licenca?: { tipo?: string; comprovante?: string }; hashes?: Record<string, string>; animacoes?: string[] } | null;
  personagem?: { traverse: (fn: (o: unknown) => void) => void } | null;
  bones?: Map<string, unknown>;
  clipes?: Map<string, unknown>;
}

interface JanelaDev extends Window { __avst3d?: Renderizador3dDev }

const LODS = ['auto', 'alto', 'medio', 'economico'] as const;
const LOOKS = ['estudio', 'soft', 'cool', 'neon', 'portrait', 'dramatic'];
const OVERLAYS = ['nenhum', 'clay', 'normals', 'wireframe', 'silhueta', 'grayscale'];

interface InfoMaterial { nome: string; tipo: string; mapas: string[]; roughness: number | null; metalness: number | null }

export function QaStudio({ aoFechar }: { aoFechar: () => void }) {
  const refCaixa = useRef<HTMLDivElement>(null);
  const [tic, setTic] = useState(0);
  const [lod, setLod] = useState<(typeof LODS)[number]>('auto');
  const r = (window as JanelaDev).__avst3d ?? null;
  useEffect(() => {
    void animar(refCaixa.current, MOVIMENTOS.aparecer, { duracao: 160, easing: 'ease-out' });
    refCaixa.current?.setAttribute('tabindex', '-1');
    refCaixa.current?.focus();
    const aoEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoEsc);
    return () => {
      window.removeEventListener('keydown', aoEsc);
      // fechar RESTAURA o render (QA nunca vaza pro estúdio)
      const h = (window as JanelaDev).__avst3d;
      h?.definirOverlay?.('nenhum');
      h?.definirLaboratorio?.(false);
    };
  }, [aoFechar]);

  const snap = r?.snapshotMetricas?.() ?? null;
  const manifest = r?.manifest ?? null;
  const [health, setHealth] = useState<number | null>(null);
  useEffect(() => {
    if (!manifest?.id) return;
    // health do index (§2735) — derivado no tooling; ausência = ok silencioso
    void fetch('/assets/avatars/3d/personagens/index.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((idx: { personagens?: { slug: string; health?: number }[] } | null) => {
        const p = idx?.personagens?.find((x) => x.slug === manifest.id);
        setHealth(typeof p?.health === 'number' ? p.health : null);
      })
      .catch(() => setHealth(null));
  }, [manifest?.id]);

  const materiais = useMemo<InfoMaterial[]>(() => {
    if (!flag('as6.material_debug') || !r?.personagem) return [];
    const lista: InfoMaterial[] = [];
    const MAPAS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'] as const;
    r.personagem.traverse((o) => {
      const mesh = o as { isMesh?: boolean; material?: Record<string, unknown> | Record<string, unknown>[] };
      if (!mesh.isMesh || !mesh.material) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const nome = String(m.name ?? '?');
        if (lista.some((x) => x.nome === nome)) continue;
        lista.push({
          nome,
          tipo: String(m.type ?? '?'),
          mapas: MAPAS.filter((k) => Boolean(m[k])),
          roughness: typeof m.roughness === 'number' ? +m.roughness.toFixed(2) : null,
          metalness: typeof m.metalness === 'number' ? +m.metalness.toFixed(2) : null,
        });
      }
    });
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, tic]);

  const screenshot = async () => {
    if (!r?.capturar) return;
    const { dataUri } = await r.capturar({ largura: 1024, altura: 1024, formato: 'png' });
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = `qa-${manifest?.id ?? 'palco3d'}-${r.lookAtivo?.() ?? 'estudio'}-${r.overlayAtivo?.() ?? 'nenhum'}.png`;
    a.click();
  };

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="QA Studio (dev)">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <div ref={refCaixa} className="avst5-tlm" data-teste="qa-studio">
        <h3><FlaskConical size={15} aria-hidden /> QA Studio · homologação visual (dev)</h3>
        {!r ? (
          <p className="avst5-tlm-vazio" data-teste="qa-sem-palco">Abra o <strong>Palco 3D</strong> primeiro — o QA Studio inspeciona o renderizador ativo.</p>
        ) : (
          <>
            <div className="avst5-tlm-acoes" data-teste="qa-controles">
              {LODS.map((l) => (
                <button key={l} type="button" className="avst-botao" data-teste={`qa-lod-${l}`} aria-pressed={lod === l}
                  onClick={() => { r.definirQualidade?.(l); setLod(l); setTic((t) => t + 1); }}>LOD {l}</button>
              ))}
            </div>
            <div className="avst5-tlm-acoes">
              {LOOKS.map((l) => (
                <button key={l} type="button" className="avst-botao" data-teste={`qa-look-${l}`} aria-pressed={r.lookAtivo?.() === l}
                  onClick={() => { r.aplicarLook?.(l); setTic((t) => t + 1); }}>{l}</button>
              ))}
            </div>
            <div className="avst5-tlm-acoes">
              {OVERLAYS.map((o) => (
                <button key={o} type="button" className="avst-botao" data-teste={`qa-overlay-${o}`} aria-pressed={r.overlayAtivo?.() === o}
                  onClick={() => { r.definirOverlay?.(o); setTic((t) => t + 1); }}>{o}</button>
              ))}
              <button type="button" className="avst-botao" data-teste="qa-lab" aria-pressed={r.laboratorioAtivo?.() === true}
                onClick={() => { r.definirLaboratorio?.(!(r.laboratorioAtivo?.() === true)); setTic((t) => t + 1); }}>Calibração</button>
              <button type="button" className="avst-botao" data-teste="qa-screenshot" onClick={() => { void screenshot(); }}>
                <Camera size={12} aria-hidden /> Screenshot</button>
            </div>
            {/* inspector técnico (§2707): manifest + renderer.info + rig */}
            <div className="avst5-tlm-storage" data-teste="qa-inspector">
              <h4>Inspector · {manifest?.id ?? 'manequim'} v{manifest?.versao ?? '—'}{health !== null ? ` · health ${health}/100` : ''}</h4>
              <ul>
                <li><code>qualidade/QA</code><em data-teste="qa-insp-qv">{manifest?.qualidadeVisual ?? '—'} · {manifest?.qaVisual?.status ?? 'sem ficha'}</em></li>
                <li><code>rig/bones/clipes</code><em data-teste="qa-insp-rig">{manifest?.rig ?? '—'} · {r.bones?.size ?? 0} bones · {r.clipes?.size ?? 0} clipes</em></li>
                <li><code>hash lod0</code><em>{manifest?.hashes?.lod0?.slice(7, 23) ?? '—'}</em></li>
                <li><code>licença</code><em>{manifest?.licenca?.tipo ?? '—'}</em></li>
                {snap && <li><code>render</code><em data-teste="qa-insp-render">{String(snap.drawCalls ?? '—')} draw calls · {String(snap.triangulos ?? '—')} tri · look {String((snap as { look?: string }).look ?? '—')}</em></li>}
              </ul>
            </div>
            {flag('as6.material_debug') && materiais.length > 0 && (
              <div className="avst5-tlm-storage" data-teste="qa-materiais">
                <h4>Materiais · {materiais.length} (as6.material_debug)</h4>
                <ul>
                  {materiais.map((m) => (
                    <li key={m.nome}><code>{m.nome}</code><em>{m.tipo} · r {m.roughness ?? '—'} · m {m.metalness ?? '—'} · {m.mapas.length ? m.mapas.join(',') : 'sem mapas'}</em></li>
                  ))}
                </ul>
              </div>
            )}
            <p className="avst5-tlm-nota">Nada aqui persiste — fechar restaura overlay e calibração. Ficha/gates: <code>scripts/avatar/assets3d/cli.mjs</code>.</p>
          </>
        )}
        <div className="avst5-tlm-acoes">
          <button type="button" className="avst-botao" data-teste="qa-fechar" onClick={aoFechar}><X size={12} aria-hidden /> Fechar</button>
        </div>
      </div>
    </div>
  );
}
