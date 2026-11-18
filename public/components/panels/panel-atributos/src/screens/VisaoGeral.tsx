// panel-atributos/src/screens/VisaoGeral.tsx — visão geral (§11.1): cartões que levam à lista filtrada, cobertura por subcategoria e os
// atributos obrigatórios mais vazios.
import React from 'react';
import type { VisaoGeral as TVisao } from '../lib/tipos';
import { obter } from '../lib/api';
import { decimal } from '../lib/formatar';
import { rotuloCategoria, rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Carregando, Erro } from '../ui/Comuns';

export function VisaoGeral() {
  const m = useModulo();
  const [d, setD] = React.useState<TVisao | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const carregar = React.useCallback(() => { setErro(null); obter<TVisao>('visao_geral').then(setD).catch((e) => setErro(e.message)); }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!d) return <Carregando rotulo="Calculando a visão geral" />;
  const c = d.cartoes;
  const cartoes: { n: string; rot: string; det: string; tom?: string; ir: () => void }[] = [
    { n: String(c.ativos), rot: 'produtos ativos', det: 'no catálogo do Precifica', ir: () => m.ir('produtos', { filtro: {} }) },
    // UX-1: o número do cartão = o total da lista que o clique abre (antes: mostrava com_kit e abria "sem kit")
    { n: String(c.sem_kit), rot: 'sem kit específico', det: `${c.com_kit} com kit específico`, tom: c.sem_kit ? 'aviso' : undefined, ir: () => m.ir('produtos', { filtro: { semKit: true } }) },
    { n: c.essencial_medio === null ? '—' : `${decimal(String(c.essencial_medio))}%`, rot: 'preenchimento essencial médio', det: 'obrigatórios + importantes', tom: (c.essencial_medio ?? 0) < 35 ? 'aviso' : undefined, ir: () => m.ir('produtos', { filtro: { obrigatoriosVazios: true } }) },
    { n: String(c.sem_foto), rot: 'produtos sem foto', det: 'fotos são cuidadas no app', tom: c.sem_foto ? 'aviso' : undefined, ir: () => m.ir('produtos', { filtro: { semFoto: true } }) },
    { n: String(c.pendencias), rot: 'pendências de conferência', det: `${c.sugestoes} sugestões · ${c.fora_da_ficha} fora da ficha`, tom: c.pendencias ? 'info' : undefined, ir: () => m.ir('conferencia') },
  ];
  return (
    <div className="at-visao">
      <div className="at-titulo-tela"><div><h2>Visão geral</h2><p>Como está a especificação técnica dos produtos ativos. Cada número leva à lista correspondente.</p></div></div>
      <div className="at-resumo at-resumo--grande">
        {cartoes.map((k) => (
          <button key={k.rot} type="button" className={`at-resumo__item at-resumo__item--botao ${k.tom ? `at-resumo__item--${k.tom}` : ''}`} onClick={k.ir}>
            <strong>{k.n}</strong><span>{k.rot}</span><small>{k.det}</small>
          </button>))}
      </div>
      <div className="at-visao__colunas">
        <section className="at-painel">
          <div className="at-painel__cabeca"><h3>Cobertura por subcategoria</h3><span className="at-fraco">produtos ativos · com kit específico · essencial médio</span></div>
          <div className="at-painel__corpo at-cobertura">
            {d.cobertura.map((s) => {
              const pk = s.ativos ? Math.round((100 * s.com_kit) / s.ativos) : 0; const pe = s.essencial_medio ?? 0;
              return (
                <button key={`${s.categoria}|${s.subcategoria}`} type="button" className="at-cobertura__linha" onClick={() => m.ir('produtos', { filtro: { subcategoria: s.subcategoria ?? '' } })}
                  title={`${rotuloCategoria(s.categoria)} · ${rotuloSubcategoria(s.subcategoria)}: ${s.com_kit} de ${s.ativos} com kit; essencial médio ${s.essencial_medio ?? '—'}%`}>
                  <span className="at-cobertura__nome">{rotuloSubcategoria(s.subcategoria)}</span>
                  <span className="at-cobertura__n">{s.ativos}</span>
                  <span className="at-cobertura__barras">
                    <span className="at-cobertura__trilho"><span style={{ width: `${pk}%`, background: 'var(--bl-info)' }} /></span>
                    <span className="at-cobertura__trilho"><span style={{ width: `${pe}%`, background: pe >= 80 ? 'var(--bl-sucesso)' : pe >= 35 ? 'var(--bl-aviso)' : 'var(--bl-erro)' }} /></span>
                  </span>
                  <span className="at-cobertura__pct">{pk}% · {s.essencial_medio === null ? '—' : `${decimal(String(pe))}%`}</span>
                </button>);
            })}
            <div className="at-legenda-linha"><span><i style={{ background: 'var(--bl-info)' }} />com kit específico</span><span><i style={{ background: 'var(--bl-sucesso)' }} />preenchimento essencial</span></div>
          </div>
        </section>
        <section className="at-painel">
          <div className="at-painel__cabeca"><h3>Obrigatórios mais vazios</h3><span className="at-fraco">produtos ativos sem valor</span></div>
          <div className="at-painel__corpo">
            {d.obrigatorios_mais_vazios.length === 0 ? <p className="at-fraco">Nenhum obrigatório vazio.</p> : (
              <ol className="at-ranking">{d.obrigatorios_mais_vazios.map((o) => (
                <li key={o.atributo_id}><button type="button" className="at-link" onClick={() => m.ir('conferencia')}>{o.rotulo}</button><span>{o.produtos} produto{o.produtos === 1 ? '' : 's'}</span></li>))}</ol>)}
            <p className="at-fraco" style={{ marginTop: 12 }}>Obrigatório vem da importância "Campos Obrigatórios" do legado (A3) e pode ser ajustado por kit.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
