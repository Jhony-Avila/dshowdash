// components/Contextos.tsx — drawer "Visualizar em contextos" (4.6, decisão #42).
// @version 1.0.0  @created 2026-07-30
//
// Mostra o avatar ATUAL onde ele realmente vive: Header, Menu, Perfil,
// Card de ranking e Mobile — nos temas escuro E claro. Tudo mock visual
// determinístico (mesmo motor SVG do palco); nada é salvo por aqui.
import { useEffect } from 'react';
import { Crown, Moon, Sun, X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { RARIDADES, tituloPorId } from '../services/AvatarCatalog';
import { AvatarSvg } from './AvatarSvg';

function Mocks({ config, tema }: { config: AvatarConfig; tema: 'escuro' | 'claro' }) {
  const titulo = tituloPorId(config.titulo);
  const sufixo = tema === 'escuro' ? 'd' : 'c';
  return (
    <div className={`avst-ctx-grade avst-ctx-${tema}`}>
      {/* Header do dash */}
      <figure className="avst-ctx-item">
        <div className="avst-ctx-header">
          <span className="avst-ctx-logo" aria-hidden />
          <span className="avst-ctx-linhas" aria-hidden><i /><i /><i /></span>
          <span className="avst-ctx-av avst-ctx-av-36">
            <AvatarSvg config={config} forma="circulo" estatico uid={`cx-h${sufixo}`} />
          </span>
        </div>
        <figcaption>Header</figcaption>
      </figure>

      {/* Menu do usuário */}
      <figure className="avst-ctx-item">
        <div className="avst-ctx-menu">
          <span className="avst-ctx-av avst-ctx-av-44">
            <AvatarSvg config={config} forma="circulo" estatico uid={`cx-m${sufixo}`} />
          </span>
          <span className="avst-ctx-menu-info">
            <strong>Você</strong>
            <em>Meu perfil · Sair</em>
          </span>
        </div>
        <figcaption>Menu</figcaption>
      </figure>

      {/* Perfil */}
      <figure className="avst-ctx-item">
        <div className="avst-ctx-perfil">
          <span className="avst-ctx-av avst-ctx-av-84">
            <AvatarSvg config={config} forma="circulo" estatico uid={`cx-p${sufixo}`} />
          </span>
          <strong>Você</strong>
          {titulo && (
            <em className="avst-ctx-titulo" style={{ color: RARIDADES[titulo.raridade].cor }}>
              <Crown size={10} aria-hidden /> {titulo.nome}
            </em>
          )}
        </div>
        <figcaption>Perfil</figcaption>
      </figure>

      {/* Card de ranking */}
      <figure className="avst-ctx-item">
        <div className="avst-ctx-ranking">
          <span className="avst-ctx-pos">2º</span>
          <span className="avst-ctx-av avst-ctx-av-40">
            <AvatarSvg config={config} forma="circulo" estatico uid={`cx-r${sufixo}`} />
          </span>
          <span className="avst-ctx-menu-info">
            <strong>Você</strong>
            <em>1.240 pts</em>
          </span>
        </div>
        <figcaption>Card de ranking</figcaption>
      </figure>

      {/* Mobile */}
      <figure className="avst-ctx-item">
        <div className="avst-ctx-mobile">
          <span className="avst-ctx-linhas" aria-hidden><i /><i /></span>
          <span className="avst-ctx-av avst-ctx-av-30">
            <AvatarSvg config={config} forma="circulo" estatico uid={`cx-b${sufixo}`} />
          </span>
        </div>
        <figcaption>Mobile</figcaption>
      </figure>
    </div>
  );
}

export function Contextos({ config, aoFechar }: {
  config: AvatarConfig;
  aoFechar: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  return (
    <div className="avst-ctx-fundo" onClick={aoFechar}>
      <aside className="avst-ctx-drawer" role="dialog" aria-label="Visualizar em contextos"
        onClick={(e) => e.stopPropagation()}>
        <header className="avst-ctx-cab">
          <h3>Visualizar em contextos</h3>
          <button type="button" className="avst-hist-mini" title="Fechar (Esc)" onClick={aoFechar}>
            <X size={14} aria-hidden />
          </button>
        </header>
        <p className="avst-ctx-nota">
          Como o seu avatar aparece em cada canto do dash — antes de salvar.
        </p>
        <h4 className="avst-ctx-secao"><Moon size={12} aria-hidden /> Tema escuro</h4>
        <Mocks config={config} tema="escuro" />
        <h4 className="avst-ctx-secao"><Sun size={12} aria-hidden /> Tema claro</h4>
        <Mocks config={config} tema="claro" />
      </aside>
    </div>
  );
}
