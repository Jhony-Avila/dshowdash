// Página de DEMONSTRAÇÃO só de teste (não é tela do produto): TabelaDados com 2 grupos e uma célula editável.
// Usada por teste-tabela-dados-demo.cjs (Playwright, file://). Build: bash scripts/atributos/testes/tabela-dados-demo/montar.sh <saída>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TabelaDados, type ColunaTabela } from '../../../../public/components/panels/panel-atributos/src/ui/TabelaDados';
import type { Ordenacao } from '../../../../public/components/panels/panel-atributos/src/lib/ordenar';
import '../../../../public/components/_shared-react/styles/tokens.css';

interface Linha { id: number; grupo: string; rotulo: string; valor: string; qtd: number | null }
const INICIAIS: Linha[] = [
  { id: 1, grupo: 'base', rotulo: 'Peso', valor: '12', qtd: 4 },
  { id: 2, grupo: 'base', rotulo: 'Altura', valor: '3', qtd: 10 },
  { id: 3, grupo: 'base', rotulo: 'Cor', valor: '', qtd: null },
  { id: 4, grupo: 'kit', rotulo: 'Bitola', valor: '7', qtd: 2 },
  { id: 5, grupo: 'kit', rotulo: 'Comprimento', valor: '40', qtd: 1 },
  { id: 6, grupo: 'kit', rotulo: 'Ângulo', valor: '1', qtd: 30 },
];
const GRUPOS = [{ chave: 'kit', titulo: 'Kit Cabos' }, { chave: 'base', titulo: 'Base (todos os produtos)' }];

function Demo() {
  const [linhas, setLinhas] = React.useState(INICIAIS);
  const [ordem, setOrdem] = React.useState<Ordenacao>({ chave: 'rotulo', direcao: 'asc' });
  const colunas = React.useMemo<ColunaTabela<Linha>[]>(() => [
    { chave: 'rotulo', titulo: 'Rótulo', tipo: 'texto' },
    { chave: 'valor', titulo: 'Valor', tipo: 'numero', alinhamento: 'esquerda',
      render: (l) => <input aria-label={`Valor de ${l.rotulo}`} data-id={l.id} value={l.valor} onChange={(e) => { const v = e.target.value; setLinhas((ls) => ls.map((x) => (x.id === l.id ? { ...x, valor: v } : x))); }} /> },
    { chave: 'qtd', titulo: 'Quantidade', tipo: 'numero' },
  ], []);
  return (
    <div data-bl-root style={{ padding: 16, background: 'var(--bl-bg)', color: 'var(--bl-texto)', fontFamily: 'var(--bl-fonte)' }}>
      <p>
        <button type="button" id="ordenar-fora" onMouseDown={(e) => e.preventDefault()} onClick={() => setOrdem({ chave: 'valor', direcao: 'desc' })}>Ordenar por Valor ▼ (sem tirar o foco)</button>
        <output id="ordem">{ordem.chave}:{ordem.direcao}</output>
      </p>
      <TabelaDados colunas={colunas} linhas={linhas} chaveLinha={(l) => l.id} grupos={GRUPOS} grupoDaLinha={(l) => l.grupo}
        ordenacao={ordem} aoOrdenar={setOrdem} legenda="Demonstração" aoClicarLinha={(l) => { (window as any).__clicada = l.id; }} rotuloLinha={(l) => `Abrir ${l.rotulo}`} />
    </div>
  );
}
createRoot(document.getElementById('raiz')!).render(<Demo />);
