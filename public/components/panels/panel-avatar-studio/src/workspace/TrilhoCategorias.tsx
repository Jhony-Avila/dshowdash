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
import { ChevronDown, Wrench } from 'lucide-react';
import { categoriasAtivas, itensDe } from '../services/AvatarCatalog';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';
import { ArvoreAcessorios } from './HubAcessorios';
import { FERRAMENTAS_NAV, TAXONOMIA } from './taxonomia';
import type { CategoriaMae } from './taxonomia';
import { subcategoriaDoAsset } from './acessorios';

export interface PropsTrilhoCategorias {
  categoria: CategoriaId;
  /** ≤84px: só a inicial (o pai calcula a partir da largura arrastável) */
  compacta: boolean;
  aoEscolher: (id: CategoriaId) => void;
  /** #144 (as6.acess_hub): árvore de subcategorias sob a categoria-mãe
   *  Acessório — hierarquia convencional na própria sidebar */
  config?: AvatarConfig;
  subAcess?: string | null;
  aoEscolherSub?: (id: string | null) => void;
  /** #145/#146 (as6.tax_v2): taxonomia v2 — principal ativa + handlers */
  principalAtiva?: string | null;
  aoEscolherPrincipal?: (id: string) => void;
  aoAbrirFerramenta?: (id: string) => void;
  /** #148 (as6.tax_cms): taxonomia hidratada do CMS; ausente = estática */
  taxonomia?: CategoriaMae[] | null;
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

const CHAVE_TAXV2 = 'dshow.avst6.taxv2.aberta.v1';

/** nº de assets alcançáveis por uma principal (contador do briefing §4) */
function contarAssets(categoria: CategoriaId, subcats?: string[]): number {
  const itens = itensDe(categoria);
  if (!subcats) return itens.length;
  const alvo = new Set(subcats);
  return itens.filter((i) => { const s = subcategoriaDoAsset(i.id); return s && alvo.has(s.id); }).length;
}

export function TrilhoCategorias({ categoria, compacta, aoEscolher, config, subAcess, aoEscolherSub, principalAtiva, aoEscolherPrincipal, aoAbrirFerramenta, taxonomia }: PropsTrilhoCategorias) {
  const grupos = flag('as6.nav_grupos');
  const taxV2 = flag('as6.tax_v2') && !!aoEscolherPrincipal;
  const [colapsados, setColapsados] = useState<Set<string>>(lerColapsados);
  // taxonomia v2: ACORDEÃO — uma mãe aberta por vez (briefing §6/§7);
  // a seleção sobrevive ao recolhimento (o estado ativo mora no shell)
  const [maeAberta, setMaeAberta] = useState<string>(() => {
    try { return localStorage.getItem(CHAVE_TAXV2) ?? 'personagem'; } catch { return 'personagem'; }
  });
  const ativas = categoriasAtivas();

  if (taxV2) {
    const abrirMae = (id: string) => {
      setMaeAberta((atual) => {
        const prox = atual === id ? '' : id;
        try { localStorage.setItem(CHAVE_TAXV2, prox); } catch { /* sem storage */ }
        return prox;
      });
    };
    return (
      <nav className={`avst5-sidebar avst6-tax${compacta ? ' avst5-sidebar-compacta' : ''}`}
        aria-label="Categorias" data-teste="tax-v2">
        {(taxonomia ?? TAXONOMIA).filter((m) => m.estado !== 'oculta').map((mae) => {
          const emBreve = mae.estado === 'em_breve';
          // respeita gates de categoria técnica (ex.: Sobrepeça só com
          // as6.creator_v6 — mesma regra da lista clássica §3393)
          const visiveis = mae.principais.filter((p) => p.estado !== 'oculta'
            && ativas.some((c) => c.id === p.categoria));
          // colapsar a mãe da principal ativa não esconde onde você está
          const aberto = !emBreve && (maeAberta === mae.id || visiveis.some((p) => p.id === principalAtiva));
          return (
            <section key={mae.id} className="avst6-navg-grupo" data-teste={`tax-${mae.id}`}>
              {compacta
                ? <hr className="avst6-navg-sep" aria-hidden />
                : (
                  <button type="button" className="avst6-navg-cab" aria-expanded={aberto}
                    disabled={emBreve} data-teste={`tax-cab-${mae.id}`}
                    title={emBreve ? t('Em breve — novas categorias em preparação') : mae.nome}
                    onClick={() => abrirMae(mae.id)}>
                    <ChevronDown size={12} aria-hidden data-aberto={aberto ? '' : undefined} />
                    {t(mae.nome)}
                    {emBreve && <small className="avst6-tax-breve">{t('Em breve')}</small>}
                  </button>
                )}
              {/* principais de mãe FECHADA ficam no DOM com hidden:
                  visual idêntico ao acordeão e a paleta/atalhos/testes
                  seguem alcançando os botões por texto */}
              {visiveis.map((p) => {
                const pBreve = p.estado === 'em_breve';
                const n = pBreve ? 0 : contarAssets(p.categoria, p.subcats);
                return (
                  <button key={p.id} type="button" hidden={!aberto && !compacta}
                    className={`avst5-cat${principalAtiva === p.id ? ' avst5-cat-on' : ''}`}
                    disabled={pBreve}
                    title={pBreve ? t('Em breve — novos assets em preparação') : p.nome}
                    data-teste={`tax-p-${p.id}`}
                    onClick={() => aoEscolherPrincipal?.(p.id)}>
                    <span className="avst5-cat-inicial" aria-hidden>{p.nome.slice(0, 1)}</span>
                    {!compacta && <span className="avst6-tax-nome">{t(p.nome)}</span>}
                    {!compacta && (pBreve
                      ? <small className="avst6-tax-breve">{t('Em breve')}</small>
                      : n > 0 && <small className="avst6-tax-n">{n}</small>)}
                  </button>
                );
              })}
            </section>
          );
        })}
        {/* ─ §5.11: ferramentas e gestão — NUNCA viram assets ─ */}
        <section className="avst6-navg-grupo avst6-tax-ferr" data-teste="tax-ferramentas">
          {compacta
            ? <hr className="avst6-navg-sep" aria-hidden />
            : <span className="avst6-navg-cab" role="presentation"><Wrench size={11} aria-hidden /> {t('Ferramentas e gestão')}</span>}
          {FERRAMENTAS_NAV.map((f) => (
            <button key={f.id} type="button" className="avst5-cat"
              title={f.nome} data-teste={`tax-f-${f.id}`}
              onClick={() => aoAbrirFerramenta?.(f.id)}>
              <span className="avst5-cat-inicial" aria-hidden>{f.nome.slice(0, 1)}</span>
              {!compacta && <span className="avst6-tax-nome">{t(f.nome)}</span>}
            </button>
          ))}
        </section>
      </nav>
    );
  }

  // #144: a árvore de subcategorias aparece ABAIXO do botão Acessório
  // quando a categoria-mãe está ativa (accordion convencional). Na
  // sidebar compacta não cabe — a grade mostra tudo ("Todos") e o
  // usuário alarga a nav para navegar por subcategoria.
  const arvoreAcess = (c: (typeof ativas)[number]) => (
    flag('as6.acess_hub') && !compacta && c.id === 'acessorio' && categoria === 'acessorio'
      && config && aoEscolherSub
      ? <ArvoreAcessorios key="arv-acess" config={config} subAtiva={subAcess ?? null} aoEscolherSub={aoEscolherSub} />
      : null
  );

  const botao = (c: (typeof ativas)[number]) => (
    <button key={c.id} type="button"
      className={`avst5-cat${categoria === c.id ? ' avst5-cat-on' : ''}`}
      title={c.nome} /* nav estreita: o tooltip já devolve o nome (#127 confirmou) */ onClick={() => aoEscolher(c.id)}>
      <span className="avst5-cat-inicial" aria-hidden>{c.nome.slice(0, 1)}</span>
      {!compacta && <span>{c.nome}</span>}
    </button>
  );
  const botaoComFilhos = (c: (typeof ativas)[number]) => [botao(c), arvoreAcess(c)];

  if (!grupos) {
    return (
      <nav className={`avst5-sidebar${compacta ? ' avst5-sidebar-compacta' : ''}`} aria-label="Categorias">
        {ativas.map(botaoComFilhos)}
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
            {(aberto || compacta) && cats.map(botaoComFilhos)}
          </section>
        );
      })}
      {/* rede de segurança: categoria futura fora do mapa NUNCA some da
          navegação — aparece solta no fim até ganhar grupo */}
      {ativas.filter((c) => !MACROGRUPOS.some((g) => g.categorias.includes(c.id))).map(botaoComFilhos)}
    </nav>
  );
}
