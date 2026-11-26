// panel-atributos/src/screens/VincularMatriz.tsx — VINCULAR · MATRIZ V2 (ESQUERDA, 19/11; BRIEFING-MATRIZ-V2 + COMPARATIVO aprovado do Jhony).
// 26/11 (decisão do Jhony, 2º degrau da tabela padrão): a grade passa a ser o AG Grid Community (MatrizGrade.tsx, carregado sob demanda) no lugar
// das duas <table> sincronizadas. A faixa travada (título, subcategoria, legenda) continua igual; dados e regras de origem não mudam (lib/matriz.ts).
// O clique no produto abre a ficha (como no ar).
import React from 'react';
import type { KitResumo, Vitrine } from '../lib/tipos';
import { rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { CabecalhoTravado, Etiqueta } from '../ui/Comuns';
import { MARCADOR, ORDEM_ORIGENS, produtosDaMatriz, type Origem } from '../lib/matriz';
import './vincular-matriz.css';

const MatrizGrade = React.lazy(() => import('./MatrizGrade').then((x) => ({ default: x.MatrizGrade })));

function Marcador({ o }: { o: Origem }) {
  const m = MARCADOR[o];
  return <abbr className={`at-mx__m at-mx__m--${m.classe}`} title={m.titulo} aria-label={m.titulo} data-origem={o}>{m.texto}</abbr>;
}

export function VincularMatriz({ vit, kits, sel }: { vit: Vitrine; kits: KitResumo[]; sel: ReadonlySet<number> }) {
  const m = useModulo();
  const [sub, setSub] = React.useState('');
  const prods = React.useMemo(() => produtosDaMatriz(vit.produtos, sel, sub), [vit.produtos, sel, sub]);
  const subcats = React.useMemo(() => [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort(), [vit.produtos]);
  // larguras pelo conjunto ATIVO inteiro (não mudam ao filtrar/ordenar: a coluna não "pula")
  const ativos = React.useMemo(() => vit.produtos.filter((p) => p.ativo), [vit.produtos]);

  return (
    <section className="at-painel at-mx at-matriz" data-matriz>{/* .at-matriz: o seletor que a trava da CIMA espera ("vincular-matriz") */}
      <CabecalhoTravado>
        <div className="at-mx__faixa">
          <h3>Matriz produtos × kits {sel.size ? <Etiqueta tom="verde">{sel.size} selecionado(s)</Etiqueta> : null}</h3>
          <span className="at-mx__espaco" />
          <select className="at-campo" aria-label="Subcategoria" value={sub} onChange={(e) => setSub(e.target.value)}>
            <option value="">Todas as subcategorias</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}
          </select>
          <ul className="at-mx__legenda" aria-label="Legenda das origens">
            {ORDEM_ORIGENS.map((o) => <li key={o}><Marcador o={o} /><span>{o === 'escopo' ? 'Pela subcategoria' : o === 'direto' ? 'Vínculo direto' : 'Todos os produtos'}</span></li>)}
          </ul>
        </div>
      </CabecalhoTravado>
      <React.Suspense fallback={<div className="at-mx__grade-carregando" role="status" aria-label="Carregando a matriz" />}>
        <MatrizGrade prods={prods} kits={kits} ativos={ativos} aoAbrir={(id) => m.abrirProduto(id)} />
      </React.Suspense>
    </section>);
}
