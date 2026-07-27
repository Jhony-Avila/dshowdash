// screens/Configuracoes.tsx — preferências do módulo (assinatura, exibição).
// @version 1.0.0  @created 2026-07-21
//
// Preferências em localStorage (store real = outlook_user_preferences §28.7, Fase 2).
import { useEffect, useRef, useState } from 'react';
import {
  getSignature, setSignature, getSignAuto, setSignAuto,
  getLayout, setLayout, getDensity, setDensity,
  type PrefLayout, type PrefDensity,
} from '../lib/prefs';

const LAYOUTS: { id: PrefLayout; label: string; hint: string }[] = [
  { id: 'right', label: 'À direita', hint: 'Lista e leitura lado a lado' },
  { id: 'bottom', label: 'Abaixo', hint: 'Leitura embaixo da lista' },
  { id: 'off', label: 'Oculto', hint: 'Leitura abre em tela cheia' },
];

export function Configuracoes() {
  const sigRef = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(getSignAuto());
  const [layout, setLayoutState] = useState<PrefLayout>(getLayout());
  const [density, setDensityState] = useState<PrefDensity>(getDensity());
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { if (sigRef.current) sigRef.current.innerHTML = getSignature(); }, []);

  function salvarAssinatura() {
    setSignature(sigRef.current?.innerHTML ?? '');
    setSignAuto(auto);
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2200);
  }
  function escolherLayout(l: PrefLayout) { setLayoutState(l); setLayout(l); }
  function escolherDensity(d: PrefDensity) { setDensityState(d); setDensity(d); }

  return (
    <div className="ol-page ol-config">
      <header className="ol-page-head">
        <div>
          <h1 className="ol-h1">Configurações</h1>
          <p className="ol-sub">Preferências do módulo de e-mails.</p>
        </div>
      </header>

      <section className="ol-cfg-card">
        <h3 className="ol-cfg-tit">Assinatura</h3>
        <p className="ol-cfg-desc">Texto adicionado ao final das mensagens novas.</p>
        <div ref={sigRef} className="ol-cfg-sig" contentEditable suppressContentEditableWarning
          data-placeholder="Sua assinatura (nome, cargo, contato…)" />
        <label className="ol-cfg-check">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          Inserir automaticamente em novas mensagens
        </label>
        <div className="ol-cfg-acts">
          <button className="ol-btn ol-btn-primary" onClick={salvarAssinatura}>Salvar assinatura</button>
          {salvo && <span className="ol-cfg-salvo">✓ Salvo</span>}
        </div>
      </section>

      <section className="ol-cfg-card">
        <h3 className="ol-cfg-tit">Exibição</h3>
        <p className="ol-cfg-desc">Também disponível pelo botão “Exibição” na Central.</p>
        <div className="ol-cfg-grp-lbl">Painel de leitura</div>
        <div className="ol-cfg-opts">
          {LAYOUTS.map((l) => (
            <button key={l.id} className={`ol-cfg-opt${layout === l.id ? ' is-on' : ''}`} onClick={() => escolherLayout(l.id)}>
              <span className="ol-cfg-opt-lbl">{l.label}</span>
              <span className="ol-cfg-opt-hint">{l.hint}</span>
            </button>
          ))}
        </div>
        <div className="ol-cfg-grp-lbl">Densidade</div>
        <div className="ol-cfg-opts">
          <button className={`ol-cfg-opt${density === 'comfortable' ? ' is-on' : ''}`} onClick={() => escolherDensity('comfortable')}>
            <span className="ol-cfg-opt-lbl">Confortável</span>
            <span className="ol-cfg-opt-hint">Mais espaço, com prévia</span>
          </button>
          <button className={`ol-cfg-opt${density === 'compact' ? ' is-on' : ''}`} onClick={() => escolherDensity('compact')}>
            <span className="ol-cfg-opt-lbl">Compacto</span>
            <span className="ol-cfg-opt-hint">Mais mensagens, sem prévia</span>
          </button>
        </div>
      </section>

      <p className="ol-cfg-nota">
        As preferências ficam salvas neste navegador. Notificações, período do dashboard e sincronização
        entre dispositivos chegam com a integração real (Fase 2).
      </p>
    </div>
  );
}
