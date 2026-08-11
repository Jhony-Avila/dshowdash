// workspace/TrilhoCategorias.tsx — SIDEBAR de categorias do workspace
// (AS6 L2 §39, lote 771–780 — decisão #79, fase 1 da componentização).
// @version 2.0.0  @created 2026-08-08  @updated 2026-08-11
//
// Extração VERBATIM do <nav> do ShellStudio: DOM byte a byte o mesmo.
// (lote 931–940: categoriasAtivas esconde 'roupa_sobre' sem a flag —
// com a flag off a lista é idêntica à CATEGORIAS de sempre)
//
// Mega onda 1301+ (lote 1331–1340, decisão #143, flag as6.nav_grupos):
// navegação em MACROGRUPOS — as categorias deixam de ser uma lista
// plana e ganham cabeçalhos colapsáveis (Personagem / Vestuário /
// Ambiente / Identidade visual). Regras:
// - flag OFF ⇒ DOM byte a byte igual ao anterior (§651);
// - grupos mapeiam SÓ conteúdo existente — "Expressão e movimento"
//   (emotes/personalidades/posturas) vive no palco/paleta e ainda não
//   tem destino de navegação próprio, então NÃO publica grupo vazio
//   (briefing §32); entra quando houver destino real;
// - o grupo da categoria ATIVA nunca esconde a categoria: colapsar o
//   grupo onde você está reabre sozinho (nunca "sumir consigo mesmo");
// - colapso persistido por grupo em localStorage (não-essencial e
//   reversível — limpar a chave volta ao padrão tudo aberto).
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { categoriasAtivas } from '../services/AvatarCatalog';
import type { CategoriaId } from '../domain/types';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';

export interface PropsTrilhoCategorias {
  categoria: CategoriaId;
  /** ≤84px: só a inicial (o pai calcula a partir da largura arrastável) */
  compacta: boolean;
  aoEscolher: (id: CategoriaId) => void;
}

/** Macrogrupos (briefing de navegação 2026-08-11, §2): taxonomia por
 *  INTENÇÃO do usuário, mapeando apenas categorias que existem hoje. */
const MACROGRUPOS: Array<{ id: string; nome: string; categorias: CategoriaId[] }> = [
  { id: 'personagem', nome: 'Personagem', categorias: ['base', 'cabelo', 'olhos', 'boca'] },
  { id: 'vestuario', nome: 'Vestuário', categorias: ['roupa', 'roupa_sobre', 'acessorio'] },
  { id: 'ambiente', nome: 'Ambiente e cenário', categorias: ['fundo'] },
  { id: 'identidade', nome: 'Identidade visual', categorias: ['moldura', 'efeito', 'aura', 'banner', 'emblema'] },
];

const CHAVE_NAVG = 'dshow.avst6.navgrupos.v1';

function lerColapsados(): Set<string> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_NAVG) ?? '[]');
    return new Set(Array.isArray(bruto) ? bruto.filter((x) => typeof x === 'string') : []);
  } catch { return new Set(); }
}

export function TrilhoCategorias({ categoria, compacta, aoEscolher }: PropsTrilhoCategorias) {
  const grupos = flag('as6.nav_grupos');
  const [colapsados, setColapsados] = useState<Set<string>>(lerColapsados);
  const ativas = categoriasAtivas();

  const botao = (c: (typeof ativas)[number]) => (
    <button key={c.id} type="button"
      className={`avst5-cat${categoria === c.id ? ' avst5-cat-on' : ''}`}
      title={c.nome} /* nav estreita: o tooltip já devolve o nome (#127 confirmou) */ onClick={() => aoEscolher(c.id)}>
      <span className="avst5-cat-inicial" aria-hidden>{c.nome.slice(0, 1)}</span>
      {!compacta && <span>{c.nome}</span>}
    </button>
  );

  if (!grupos) {
    return (
      <nav className={`avst5-sidebar${compacta ? ' avst5-sidebar-compacta' : ''}`} aria-label="Categorias">
        {ativas.map(botao)}
      </nav>
    );
  }

  const alternar = (id: string) => {
    setColapsados((atual) => {
      const prox = new Set(atual);
      if (prox.has(id)) prox.delete(id); else prox.add(id);
      try { localStorage.setItem(CHAVE_NAVG, JSON.stringify([...prox])); } catch { /* sem storage */ }
      return prox;
    });
  };

  return (
    <nav className={`avst5-sidebar avst6-navg${compacta ? ' avst5-sidebar-compacta' : ''}`}
      aria-label="Categorias" data-teste="nav-grupos">
      {MACROGRUPOS.map((g) => {
        const cats = g.categorias
          .map((id) => ativas.find((c) => c.id === id))
          .filter((c): c is (typeof ativas)[number] => !!c);
        if (!cats.length) return null; // §32: nada vazio publicado
        // colapsar o grupo da categoria ativa não esconde onde você está
        const aberto = !colapsados.has(g.id) || cats.some((c) => c.id === categoria);
        return (
          <section key={g.id} className="avst6-navg-grupo" data-teste={`navg-${g.id}`}>
            {compacta
              ? <hr className="avst6-navg-sep" aria-hidden />
              : (
                <button type="button" className="avst6-navg-cab" aria-expanded={aberto}
                  data-teste={`navg-cab-${g.id}`} onClick={() => alternar(g.id)}>
                  <ChevronDown size={12} aria-hidden data-aberto={aberto ? '' : undefined} />
                  {t(g.nome)}
                </button>
              )}
            {(aberto || compacta) && cats.map(botao)}
          </section>
        );
      })}
      {/* rede de segurança: categoria futura fora do mapa NUNCA some da
          navegação — aparece solta no fim até ganhar grupo */}
      {ativas.filter((c) => !MACROGRUPOS.some((g) => g.categorias.includes(c.id))).map(botao)}
    </nav>
  );
}
