// shell/Equipados.tsx — painel "Equipados" (AS5 F3 C1, P2 §70).
// @version 0.1.0  @created 2026-07-31
// Visão de TODOS os slots ativos com ações por item: remover, trocar
// (abre a categoria), favoritar e BLOQUEAR (§70.1 — presets/aleatório/IA
// respeitam o cadeado; a escolha manual pede confirmação no modal §69.1).
import { Lock, LockOpen, Pencil, Star, Trash2 } from 'lucide-react';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { itemPorId } from '../services/AvatarCatalog';
import { alternarFavorito, favoritos } from '../services/Progresso';

const CHAVE_BLOQUEIOS = 'dshow.avst5.bloqueios.v1';

export function lerBloqueios(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CHAVE_BLOQUEIOS) ?? '[]') as string[]); }
  catch { return new Set(); }
}

export function alternarBloqueio(slot: string): Set<string> {
  const s = lerBloqueios();
  if (s.has(slot)) s.delete(slot); else s.add(slot);
  try { localStorage.setItem(CHAVE_BLOQUEIOS, JSON.stringify([...s])); } catch { /* sem storage */ }
  return s;
}

export const ROTULOS: Record<string, string> = {
  base: 'Base', cabelo: 'Cabelo', olhos: 'Olhos', boca: 'Boca', roupa: 'Roupa',
  acessorio_cabeca: 'Acessório · cabeça', acessorio_rosto: 'Acessório · rosto',
  acessorio_pescoco: 'Acessório · pescoço',
  // mega onda 1301+ (#140, as6.acess_v2): slots finos aditivos
  acessorio_olhos: 'Acessório · olhos', acessorio_orelha: 'Acessório · orelha',
  acessorio_costas: 'Acessório · costas', acessorio_flutuante: 'Acessório · flutuante',
  acessorio_companheiro: 'Acessório · companheiro', fundo: 'Fundo', moldura: 'Moldura',
  efeito: 'Efeito', aura: 'Aura', banner: 'Banner', emblema: 'Emblema',
};

export function Equipados({ config, bloqueios, aoRemover, aoTrocar, aoBloquear, aoMudarFavs }: {
  config: AvatarConfig;
  bloqueios: Set<string>;
  aoRemover: (slot: string) => void;
  aoTrocar: (categoria: CategoriaId) => void;
  aoBloquear: (slot: string) => void;
  aoMudarFavs: () => void;
}) {
  const linhas: Array<{ slot: string; id: string }> = [
    { slot: 'base', id: config.base },
    ...Object.entries(config.camadas).filter(([, id]) => !!id).map(([slot, id]) => ({ slot, id: id as string })),
  ];
  const favs = favoritos();

  return (
    <div className="avst5-equipados" aria-label="Itens equipados">
      {linhas.map(({ slot, id }) => {
        const item = itemPorId(id);
        const bloqueado = bloqueios.has(slot);
        const categoria = (slot.startsWith('acessorio') ? 'acessorio' : slot) as CategoriaId;
        return (
          <div key={slot} className="avst5-eq-linha" data-slot={slot}>
            <span className="avst5-eq-slot">{ROTULOS[slot] ?? slot}</span>
            <span className="avst5-eq-nome">{item?.nome ?? id}</span>
            <span className="avst5-eq-acoes">
              <button type="button" title={bloqueado ? 'Desbloquear slot' : 'Bloquear slot (presets/aleatório não mexem)'}
                aria-pressed={bloqueado} className={bloqueado ? 'avst5-eq-on' : ''}
                onClick={() => aoBloquear(slot)}>
                {bloqueado ? <Lock size={12} aria-hidden /> : <LockOpen size={12} aria-hidden />}
              </button>
              <button type="button" title="Favoritar item"
                className={favs.has(id) ? 'avst5-eq-on' : ''}
                onClick={() => { alternarFavorito(id); aoMudarFavs(); }}>
                <Star size={12} aria-hidden />
              </button>
              <button type="button" title="Trocar (abrir categoria)" onClick={() => aoTrocar(categoria)}>
                <Pencil size={12} aria-hidden />
              </button>
              {slot !== 'base' && (
                <button type="button" title="Remover" onClick={() => aoRemover(slot)}>
                  <Trash2 size={12} aria-hidden />
                </button>
              )}
            </span>
          </div>
        );
      })}
      {linhas.length === 1 && <p className="avst-grade-vazia">Só a base equipada — explore o catálogo.</p>}
    </div>
  );
}
