// screens/Jornada.tsx — §21 (Sankey de aquisição) + §25/§26 (jornada e árvore de navegação)
// @version 1.0.0  @created 2026-07-30
//
// Duas perguntas diferentes na mesma tela, e por isso dois gráficos:
//   · o Sankey responde "de onde vem quem chega e onde essa gente aterrissa";
//   · a árvore responde "o que a pessoa faz depois de entrar, e onde ela desiste".
// Juntá-las num gráfico só produziria um diagrama que não responde nenhuma das duas.
import { useState } from 'react';
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Vazio, Badge, Icone } from '../components/UI';
import { Sankey } from '../components/viz/Sankey';
import { ArvoreJornada } from '../components/viz/ArvoreJornada';
import { corDaCamada, usarPaleta } from '../lib/paleta';
import { fmtInt, fmtPct } from '../lib/fmt';

export default function Jornada(p: PropsTela) {
  const pal = usarPaleta();
  const [inicio, setInicio] = useState<string | null>(null);
  const [noSel, setNoSel] = useState<string | null>(null);

  const fluxo = usarDados(
    (s) => p.svc.getFlow(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.filtros.canal, p.filtros.campanha, p.recarga],
    p.onMeta,
  );

  const jornada = usarDados(
    (s) => p.svc.getJourney({ ...p.filtros, pagina: inicio ?? p.filtros.pagina }, s),
    [p.filtros.periodo, p.filtros.cenario, inicio, p.filtros.pagina, p.recarga],
    undefined,   // ⚠️ só o primeiro bloco publica procedência: dois blocos brigando pelo rodapé faria o valor piscar
  );

  if (fluxo.erro) return <Erro erro={fluxo.erro} />;
  if (fluxo.carregando && !fluxo.dados) return <Carregando linhas={6} />;
  if (!fluxo.dados) return <Vazio titulo="Sem dados" />;

  const f = fluxo.dados;
  const vazio = f.nos.length === 0;

  return (
    <>
      <Card
        titulo="Fluxo de aquisição"
        nota="clique num nó para filtrar as outras telas · passe o mouse para isolar o caminho"
        acao={
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {f.camadas.map((c) => (
              <span key={c.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, color: 'var(--ga-txt-2)' }}>
                <i style={{ width: 9, height: 9, borderRadius: 2, background: corDaCamada(pal, c.id), display: 'inline-block' }} />
                {c.rotulo}
              </span>
            ))}
          </span>
        }
      >
        <div className="ga-card">
          <div className="ga-card__corpo">
            {vazio ? (
              <Vazio titulo="Sem fluxo no período" detalhe="Nenhuma sessão com origem identificada. Troque o cenário ou o período." />
            ) : (
              <Sankey
                nos={f.nos}
                links={f.links}
                altura={440}
                selecionado={noSel}
                onClicarNo={(n) => {
                  setNoSel(n.id === noSel ? null : n.id);
                  // O id carrega a camada no prefixo — é o que permite transformar um clique
                  // no diagrama em filtro tipado, sem tabela de tradução no front.
                  if (n.camada === 'canal') p.onCorte({ canal: n.id === noSel ? null : n.nome });
                  if (n.camada === 'campanha') p.onCorte({ campanha: n.id === noSel ? null : n.nome });
                  if (n.camada === 'landing') p.onCorte({ pagina: n.id === noSel ? null : n.nome });
                }}
              />
            )}
          </div>
        </div>
        {!vazio && (
          <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 6 }}>
            {f.nos.length} nós · {f.links.length} ligações · a espessura é proporcional ao número de sessões
          </div>
        )}
      </Card>

      <Card
        titulo="Jornada e abandono"
        nota="a partir de uma página de entrada"
        acao={
          <span className="ga-sel-campo">
            <label htmlFor="ga-jornada-inicio">Começar em</label>
            <select
              id="ga-jornada-inicio"
              className="ga-sel"
              value={inicio ?? jornada.dados?.inicio ?? '/'}
              onChange={(e) => setInicio(e.target.value)}
            >
              {(jornada.dados?.inicios_disponiveis ?? []).map((i) => (
                <option key={i.path} value={i.path}>{i.path}</option>
              ))}
            </select>
          </span>
        }
      >
        {jornada.erro ? (
          <Erro erro={jornada.erro} />
        ) : jornada.carregando && !jornada.dados ? (
          <Carregando linhas={3} />
        ) : jornada.dados ? (
          <>
            <div className="ga-card">
              <div className="ga-card__corpo">
                <ArvoreJornada
                  raiz={jornada.dados.arvore}
                  altura={470}
                  onClicarNo={(n) => { if (n.tipo !== 'saida') p.onCorte({ pagina: n.nome }); }}
                />
              </div>
            </div>
            {(() => {
              const a = jornada.dados.arvore;
              const saida = a.filhos.find((x) => x.tipo === 'saida');
              const seguiu = a.filhos.filter((x) => x.tipo !== 'saida').reduce((s, x) => s + x.usuarios, 0);
              return (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: 12 }}>
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <Icone nome="Users" tam={13} /> {fmtInt(a.usuarios)} entraram em <b className="ga-mono">{a.nome}</b>
                  </span>
                  <span><Badge tipo="ok">{fmtInt(seguiu)} seguiram</Badge></span>
                  {saida && (
                    <span>
                      <Badge tipo="erro">
                        {fmtInt(saida.usuarios)} saíram ({fmtPct((saida.usuarios / Math.max(1, a.usuarios)) * 100, 1)})
                      </Badge>
                    </span>
                  )}
                </div>
              );
            })()}
            <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 8, lineHeight: 1.55 }}>
              O nó vermelho <b>(saiu do site)</b> é abandono, não erro de dado — uma árvore que só
              desenha quem seguiu adiante esconde exatamente o que interessa descobrir.
            </div>
          </>
        ) : null}
      </Card>

      <Procedencia meta={fluxo.meta} />
    </>
  );
}
