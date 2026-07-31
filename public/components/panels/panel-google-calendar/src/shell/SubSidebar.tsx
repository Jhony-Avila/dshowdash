// shell/SubSidebar.tsx — navegação interna do módulo (§10, §11).
// @version 1.0.0  @created 2026-07-29
//
// Expandida 240 px / colapsada 72 px, conforme §11.1 e §11.2.
// Persistência por usuário em dshow.google-calendar.sidebar.collapsed (§11.3).
import { GRUPOS, TELAS, type TelaId } from './types';
import { Icone } from './Icone';

interface Props {
  ativa: TelaId;
  colapsada: boolean;
  badges: Record<string, number>;
  onNavegar: (id: TelaId) => void;
  onToggle: () => void;
}

export function SubSidebar({ ativa, colapsada, badges, onNavegar, onToggle }: Props) {
  return (
    <nav className={`gc-subsidebar${colapsada ? ' is-colapsada' : ''}`}
         aria-label="Navegação do módulo Google Calendar">
      <button type="button" className="gc-subsidebar-toggle" onClick={onToggle}
              aria-expanded={!colapsada}
              title={colapsada ? 'Expandir menu' : 'Recolher menu'}>
        <Icone nome={colapsada ? 'chevron-right' : 'chevron-left'} />
        {!colapsada && <span>Recolher</span>}
      </button>

      <div className="gc-subsidebar-scroll">
        {GRUPOS.map((g) => {
          const itens = TELAS.filter((t) => t.grupo === g.id);
          if (!itens.length) return null;
          return (
            <div className="gc-grupo" key={g.id}>
              {!colapsada && <div className="gc-grupo-label">{g.label}</div>}
              {colapsada && <div className="gc-grupo-sep" aria-hidden="true" />}
              <ul className="gc-grupo-itens">
                {itens.map((t) => {
                  const n = t.badge ? (badges[t.badge] ?? 0) : 0;
                  const selecionada = ativa === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`gc-item${selecionada ? ' is-ativo' : ''}`}
                        aria-current={selecionada ? 'page' : undefined}
                        onClick={() => onNavegar(t.id)}
                        title={colapsada ? `${t.label}${n > 0 ? ` (${n})` : ''}` : t.descricao}
                      >
                        <span className="gc-item-icone"><Icone nome={t.icone} /></span>
                        {!colapsada && <span className="gc-item-label">{t.label}</span>}
                        {n > 0 && (
                          <span className={`gc-badge${colapsada ? ' is-compacto' : ''}`}>
                            {colapsada ? '' : n}
                            <span className="gc-sr">{n} pendente(s)</span>
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
