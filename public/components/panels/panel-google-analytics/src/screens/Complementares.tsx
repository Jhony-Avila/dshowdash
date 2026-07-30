// screens/Complementares.tsx — telas do §10 que faltavam e que DERIVAM de endpoints existentes.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ NENHUMA destas telas tem endpoint próprio, e isso é deliberado. Todas recortam ou agrupam
// dados que `/acquisition`, `/pages`, `/conversions` e `/properties` já devolvem. A §74 do
// briefing proíbe uma chamada por card; criar seis rotas novas para seis recortes do mesmo dado
// multiplicaria o consumo de quota da Data API por nada — e quota é o recurso mais escasso da
// integração real (§57).
//
// Regra que fica: **tela nova só ganha endpoint novo quando precisa de dado que ainda não vem.**
import { useMemo } from 'react';
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, KpiCard, Badge, Vazio, BarraProp, Icone } from '../components/UI';
import type { Coluna } from '../components/UI';
import { SerieTemporal } from '../components/Serie';
import { fmtInt, fmtPct, fmtSegundos } from '../lib/fmt';

// ════════════════════════════════════════════════════════════════════════
// §10.2 #7 — Origem e Mídia
// ════════════════════════════════════════════════════════════════════════
interface LinhaOm {
  chave: string; origem: string; midia: string;
  sessoes: number; usuarios: number; conversoes: number; taxa: number;
  campanhas: number; utm_ok: boolean;
}

export function OrigemMidia(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getAcquisition(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.filtros.canal, p.recarga],
    p.onMeta,
  );

  // Agrupa as campanhas por par origem/mídia — a dimensão que o GA4 chama de "source/medium".
  const linhas = useMemo<LinhaOm[]>(() => {
    if (!dados) return [];
    const mapa = new Map<string, LinhaOm>();
    for (const c of dados.campanhas) {
      const midia = c.midia !== '' ? c.midia : '(none)';
      const chave = `${c.origem} / ${midia}`;
      const atual = mapa.get(chave) ?? {
        chave, origem: c.origem, midia,
        sessoes: 0, usuarios: 0, conversoes: 0, taxa: 0, campanhas: 0, utm_ok: true,
      };
      atual.sessoes += c.sessoes;
      atual.usuarios += c.usuarios;
      atual.conversoes += c.conversoes;
      atual.campanhas += 1;
      // Um par é problemático se QUALQUER campanha dentro dele tem UTM inconsistente.
      if (!c.utm_ok) atual.utm_ok = false;
      mapa.set(chave, atual);
    }
    const arr = [...mapa.values()];
    for (const l of arr) { l.taxa = l.sessoes > 0 ? (l.conversoes / l.sessoes) * 100 : 0; }
    return arr.sort((a, b) => b.sessoes - a.sessoes);
  }, [dados]);

  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const max = Math.max(1, ...linhas.map((l) => l.sessoes));
  const cols: Coluna<LinhaOm>[] = [
    {
      chave: 'om', rotulo: 'Origem / mídia', csv: (l) => l.chave,
      render: (l) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span className="ga-mono ga-trunc">{l.chave}</span>
          {!l.utm_ok && <Badge tipo="alerta">UTM</Badge>}
        </span>
      ),
    },
    { chave: 'camp', rotulo: 'Campanhas', num: true, larg: 100, render: (l) => fmtInt(l.campanhas), csv: (l) => l.campanhas },
    { chave: 'bar', rotulo: '', larg: 110, render: (l) => <BarraProp valor={l.sessoes} max={max} /> },
    { chave: 'ses', rotulo: 'Sessões', num: true, render: (l) => fmtInt(l.sessoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.sessoes, 0)), csv: (l) => l.sessoes },
    { chave: 'usr', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios), csv: (l) => l.usuarios },
    { chave: 'cv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)), csv: (l) => l.conversoes },
    { chave: 'tx', rotulo: 'Taxa', num: true, render: (l) => fmtPct(l.taxa), csv: (l) => l.taxa },
  ];

  const semUtm = linhas.filter((l) => l.midia === '(none)' || !l.utm_ok);

  return (
    <>
      <Card titulo="Origem e mídia" nota={`${linhas.length} pares no período`}>
        <Grid colunas={cols} linhas={linhas} chave={(l) => l.chave} exportarComo="ga-origem-midia" />
      </Card>
      {semUtm.length > 0 && (
        <Card titulo="Pares com problema de marcação" nota={`${semUtm.length} de ${linhas.length}`}>
          <div className="ga-card">
            <div className="ga-card__corpo">
              {semUtm.map((l) => (
                <div key={l.chave} className="ga-rt-lin">
                  <span className="ga-mono">{l.chave}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ga-alerta)' }}>
                    {l.midia === '(none)' ? 'sem utm_medium' : 'divergência de capitalização'}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', marginTop: 8, lineHeight: 1.55 }}>
                Par sem <span className="ga-mono">utm_medium</span> cai em <span className="ga-mono">(none)</span> e
                fica fora de qualquer análise por mídia. Divergência de capitalização faz o GA4
                tratar a mesma origem como duas.
              </div>
            </div>
          </div>
        </Card>
      )}
      <Procedencia meta={meta} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// §10.2 #12 — Referências (canal Referral, em detalhe)
// ════════════════════════════════════════════════════════════════════════
export function Referencias(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getAcquisition(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const refs = dados.campanhas.filter((c) => c.canal === 'Referral' || c.midia === 'referral');
  const total = dados.por_canal.find((c) => c.canal === 'Referral');

  const cols: Coluna<typeof refs[number]>[] = [
    { chave: 'org', rotulo: 'Site de origem', csv: (l) => l.origem, render: (l) => <span className="ga-mono">{l.origem}</span> },
    { chave: 'camp', rotulo: 'Campanha', csv: (l) => l.campanha, render: (l) => <span className="ga-trunc">{l.campanha}</span> },
    { chave: 'ses', rotulo: 'Sessões', num: true, render: (l) => fmtInt(l.sessoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.sessoes, 0)), csv: (l) => l.sessoes },
    { chave: 'eng', rotulo: 'Engajamento', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1), csv: (l) => l.taxa_engajamento },
    { chave: 'cv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), csv: (l) => l.conversoes },
    { chave: 'tx', rotulo: 'Taxa', num: true, render: (l) => fmtPct(l.taxa_conversao), csv: (l) => l.taxa_conversao },
  ];

  return (
    <>
      {total && (
        <Card titulo="Tráfego de referência no total">
          <div className="ga-kpis">
            <KpiCard kpi={{ chave: 's', rotulo: 'Sessões', valor: total.sessoes, unidade: 'int' }} />
            <KpiCard kpi={{ chave: 'c', rotulo: 'Conversões', valor: total.conversoes, unidade: 'int' }} />
            <KpiCard kpi={{ chave: 't', rotulo: 'Taxa de conversão', valor: total.taxa_conversao, unidade: 'pct' }} />
          </div>
        </Card>
      )}
      <Card titulo="Sites que enviam tráfego" nota={`${refs.length} origens`}>
        <Grid
          colunas={cols} linhas={refs} chave={(l) => l.origem + l.campanha}
          exportarComo="ga-referencias"
          vazio={<Vazio titulo="Nenhuma referência no período" detalhe="Nenhuma sessão veio de outro site com marcação de referral." />}
        />
      </Card>
      {/* ⚠️ A §5.1 da investigação apontou que o cross-domain NÃO está configurado. Sem isso,
          navegação entre domínios próprios aparece aqui como referência de terceiro. */}
      <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', lineHeight: 1.55 }}>
        A auditoria da Fase 0 não encontrou cross-domain configurado no container. Enquanto isso,
        navegação entre domínios da própria empresa pode aparecer nesta lista como referência
        externa — e inflar o canal Referral com tráfego que na verdade já era seu.
      </div>
      <Procedencia meta={meta} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// §27 / §10.3 #19 — Engajamento
// ════════════════════════════════════════════════════════════════════════
export function Engajamento(p: PropsTela) {
  const ov = usarDados(
    (s) => p.svc.getOverview(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  const pg = usarDados(
    (s) => p.svc.getPages(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    undefined,
  );
  const ev = usarDados(
    (s) => p.svc.getEvents(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    undefined,
  );

  if (ov.erro) return <Erro erro={ov.erro} />;
  if (ov.carregando && !ov.dados) return <Carregando />;
  if (!ov.dados) return <Vazio titulo="Sem dados" />;

  const serie = ov.dados.serie;
  const taxa = serie.map((s) => (s.sessoes > 0 ? (s.sessoes_engajadas / s.sessoes) * 100 : 0));
  const kpis = ov.dados.kpis.filter((k) => ['sessoes_engajadas', 'taxa_engajamento', 'visualizacoes', 'eventos'].includes(k.chave));

  // Eventos de interação: scroll e tempo. ⚠️ Os nomes vêm do container REAL, com o typo
  // `scrool_*` — trocar por "scroll" aqui esconderia o defeito que a §42 quer expor.
  const interacao = (ev.dados?.eventos ?? []).filter((e) => /^scrool_|^time_/.test(e.evento));

  const colsPg: Coluna<NonNullable<typeof pg.dados>['paginas'][number]>[] = [
    { chave: 'p', rotulo: 'Página', csv: (l) => l.path, render: (l) => <span className="ga-trunc ga-mono" title={l.titulo}>{l.path}</span> },
    { chave: 'eng', rotulo: 'Engajamento', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1), csv: (l) => l.taxa_engajamento },
    { chave: 't', rotulo: 'Tempo médio', num: true, render: (l) => fmtSegundos(l.tempo_medio_seg), csv: (l) => l.tempo_medio_seg },
    { chave: 'v', rotulo: 'Visualizações', num: true, render: (l) => fmtInt(l.visualizacoes), csv: (l) => l.visualizacoes },
  ];

  return (
    <>
      <Card titulo="Engajamento no período">
        <div className="ga-kpis">{kpis.map((k) => <KpiCard key={k.chave} kpi={k} />)}</div>
      </Card>

      <Card titulo="Taxa de engajamento por dia" nota="sessões engajadas ÷ sessões">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <SerieTemporal
              datas={serie.map((s) => s.data)}
              series={[
                { nome: 'Taxa de engajamento (%)', dados: taxa.map((t) => Number(t.toFixed(2))), cor: '#17A673' },
                { nome: 'Sessões', dados: serie.map((s) => s.sessoes), cor: '#E8710A', eixo: 1 },
              ]}
              altura={250}
            />
          </div>
        </div>
        {/* §27: não chamar de "rejeição" o que é engajamento. */}
        <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 6, lineHeight: 1.55 }}>
          Esta é a taxa de <b>engajamento</b>, não o inverso da antiga taxa de rejeição. O GA4 conta
          como engajada a sessão com mais de 10 segundos, evento importante ou 2+ visualizações —
          tratar "100% − engajamento" como rejeição é leitura errada.
        </div>
      </Card>

      <div className="ga-colunas--2">
        <Card titulo="Engajamento por página">
          {pg.dados ? (
            <Grid
              colunas={colsPg}
              linhas={[...pg.dados.paginas].sort((a, b) => b.taxa_engajamento - a.taxa_engajamento)}
              chave={(l) => l.path}
              exportarComo="ga-engajamento-paginas"
            />
          ) : <Carregando linhas={3} />}
        </Card>

        <Card titulo="Eventos de interação" nota="rolagem e tempo de permanência">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {interacao.length === 0 ? (
                <Vazio titulo="Nenhum evento de interação no período" />
              ) : interacao.map((e) => (
                <div key={e.evento} className="ga-rt-lin">
                  <span className="ga-mono">
                    {e.evento}
                    {e.evento.startsWith('scrool_') && <Badge tipo="alerta">grafia</Badge>}
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtInt(e.contagem)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 8, lineHeight: 1.5 }}>
                Os nomes aparecem como estão no container. <span className="ga-mono">scrool_*</span> está
                grafado errado na origem — corrigir aqui esconderia o defeito.
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Procedencia meta={ov.meta} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// §10.3 #20 — Saídas
// ════════════════════════════════════════════════════════════════════════
export function Saidas(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getPages(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  type L = typeof dados.paginas[number] & { pctSaida: number };
  const linhas: L[] = dados.paginas
    .map((l) => ({ ...l, pctSaida: l.visualizacoes > 0 ? (l.saidas / l.visualizacoes) * 100 : 0 }))
    .sort((a, b) => b.saidas - a.saidas);

  const max = Math.max(1, ...linhas.map((l) => l.saidas));
  const cols: Coluna<L>[] = [
    { chave: 'p', rotulo: 'Página', csv: (l) => `${l.titulo} (${l.path})`, render: (l) => (
      <span style={{ display: 'grid', minWidth: 0 }}>
        <span className="ga-trunc" title={l.titulo}>{l.titulo}</span>
        <span className="ga-trunc ga-mono" style={{ color: 'var(--ga-txt-3)' }}>{l.path}</span>
      </span>
    ) },
    { chave: 'bar', rotulo: '', larg: 110, render: (l) => <BarraProp valor={l.saidas} max={max} /> },
    { chave: 's', rotulo: 'Saídas', num: true, render: (l) => fmtInt(l.saidas), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.saidas, 0)), csv: (l) => l.saidas },
    { chave: 'v', rotulo: 'Visualizações', num: true, render: (l) => fmtInt(l.visualizacoes), csv: (l) => l.visualizacoes },
    {
      chave: 'pct', rotulo: '% de saída', num: true,
      // ⚠️ Saída alta em página de OBRIGADO é o resultado desejado, não problema — o fluxo
      // terminou ali. Pintar de vermelho seria alarme falso.
      render: (l) => (
        <span style={{ color: l.pctSaida > 55 && l.tipo !== 'obrigado' ? 'var(--ga-ruim)' : undefined }}>
          {fmtPct(l.pctSaida, 1)}
        </span>
      ),
      csv: (l) => l.pctSaida,
    },
    { chave: 't', rotulo: 'Tipo', larg: 100, render: (l) => <Badge tipo={l.tipo === 'obrigado' ? 'ok' : l.tipo === 'erro' ? 'erro' : 'neutro'}>{l.tipo}</Badge>, csv: (l) => l.tipo },
  ];

  const problematicas = linhas.filter((l) => l.pctSaida > 55 && l.tipo !== 'obrigado' && l.visualizacoes > 100);

  return (
    <>
      <Card titulo="Saídas por página" nota="onde as pessoas deixam o site">
        <Grid colunas={cols} linhas={linhas} chave={(l) => l.path} exportarComo="ga-saidas" />
      </Card>
      <Card titulo="Leitura" nota={`${problematicas.length} páginas com saída alta fora do fluxo esperado`}>
        <div className="ga-card">
          <div className="ga-card__corpo" style={{ fontSize: 12, color: 'var(--ga-txt-2)', lineHeight: 1.6 }}>
            Saída alta em página de <b>obrigado</b> é o resultado esperado — o fluxo terminou ali, e
            por isso essas páginas não aparecem destacadas.
            {problematicas.length > 0 && (
              <> Já estas merecem olhar: {problematicas.slice(0, 4).map((l) => (
                <span key={l.path} className="ga-mono" style={{ color: 'var(--ga-txt)' }}> {l.path} ({fmtPct(l.pctSaida, 0)})</span>
              ))}.</>
            )}
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// §10.4 #25 — Leads (tela própria, com a ponta REAL do CRM)
// ════════════════════════════════════════════════════════════════════════
export function Leads(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getConversions(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const c = dados.conciliacao_crm;
  const crm = c.crm;

  return (
    <>
      <Card titulo="Leads" nota="o lado do CRM é dado real do Pipedrive">
        <div className="ga-kpis">
          <KpiCard kpi={{ chave: 'ga', rotulo: `generate_lead (GA4 · ${c.ga4_fonte})`, valor: c.ga4_generate_lead, unidade: 'int' }} />
          {crm.disponivel && <KpiCard kpi={{ chave: 'crm', rotulo: 'Leads no CRM (real)', valor: crm.total ?? 0, unidade: 'int' }} />}
          {crm.disponivel && <KpiCard kpi={{ chave: 'cv', rotulo: 'Viraram negócio', valor: crm.convertidos_em_negocio ?? 0, unidade: 'int' }} />}
          {crm.disponivel && crm.valor_total !== undefined && (
            <KpiCard kpi={{ chave: 'v', rotulo: 'Valor declarado nos leads', valor: crm.valor_total, unidade: 'currency' }} />
          )}
        </div>
      </Card>

      {crm.disponivel && crm.por_dia.length > 0 && (
        <Card titulo="Leads por dia no CRM" nota="série real do Pipedrive">
          <div className="ga-card">
            <div className="ga-card__corpo">
              <SerieTemporal
                datas={crm.por_dia.map((d) => d.data)}
                series={[{ nome: 'Leads no CRM', dados: crm.por_dia.map((d) => d.leads), cor: '#17A673', tipo: 'bar' }]}
                altura={220}
              />
              {/* ⚠️ Só os dias COM lead vêm do backend. A série é esparsa de verdade — preencher
                  os dias vazios com zero daria a impressão de queda onde não houve medição. */}
              <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 6 }}>
                {crm.por_dia.length} dias com pelo menos um lead. Dias sem lead não aparecem no eixo:
                a série mostra o que houve, não zeros preenchidos.
              </div>
            </div>
          </div>
        </Card>
      )}

      {crm.disponivel && (
        <Card titulo="De onde vêm os leads" nota="origem registrada no Pipedrive">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {(crm.por_origem ?? []).map((o) => (
                <div key={o.origem} className="ga-rt-lin">
                  <span>{o.rotulo} <span className="ga-mono" style={{ color: 'var(--ga-txt-3)' }}>{o.origem}</span></span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtInt(o.total)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', marginTop: 8, lineHeight: 1.55 }}>
                {crm.aviso_origem}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!c.comparavel && (
        <div className="ga-erro" style={{ borderColor: '#F59E0B55', background: '#F59E0B14' }}>
          <div className="ga-erro__t" style={{ color: 'var(--ga-alerta)' }}>
            <Icone nome="TriangleAlert" tam={14} /> Comparação com o GA4 suspensa
          </div>
          <div className="ga-erro__d">{c.motivo_nao_comparavel}</div>
        </div>
      )}
      <Procedencia meta={meta} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// §10.6 #39 — Streams
// ════════════════════════════════════════════════════════════════════════
export function Streams(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getProperties(s),
    [p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const streams = dados.contas.flatMap((c) =>
    c.propriedades.flatMap((pr) =>
      pr.streams.map((s) => ({ ...s, propriedade: pr.nome, property_id: pr.property_id, timezone: pr.timezone, moeda: pr.moeda })),
    ),
  );

  const cols: Coluna<typeof streams[number]>[] = [
    { chave: 'n', rotulo: 'Stream', csv: (l) => l.nome, render: (l) => <b>{l.nome}</b> },
    { chave: 't', rotulo: 'Tipo', larg: 90, render: (l) => <Badge tipo="marca">{l.tipo}</Badge>, csv: (l) => l.tipo },
    { chave: 'd', rotulo: 'Domínio', csv: (l) => l.dominio, render: (l) => <span className="ga-mono">{l.dominio}</span> },
    { chave: 'mid', rotulo: 'Measurement ID', csv: (l) => l.measurement_id, render: (l) => <span className="ga-mono">{l.measurement_id}</span> },
    { chave: 'prop', rotulo: 'Propriedade', csv: (l) => `${l.propriedade} (${l.property_id})`, render: (l) => <span className="ga-trunc">{l.propriedade}</span> },
    { chave: 'tz', rotulo: 'Fuso', csv: (l) => l.timezone, render: (l) => <span className="ga-mono" style={{ fontSize: 11 }}>{l.timezone}</span> },
    { chave: 'a', rotulo: 'Estado', larg: 90, render: (l) => <Badge tipo={l.ativo ? 'ok' : 'erro'}>{l.ativo ? 'ativo' : 'inativo'}</Badge>, csv: (l) => (l.ativo ? 'ativo' : 'inativo') },
  ];

  return (
    <>
      <Card titulo="Streams de dados" nota={`${streams.length} stream(s)`}>
        <Grid colunas={cols} linhas={streams} chave={(l) => l.id} exportarComo="ga-streams" />
      </Card>
      {/* ⚠️ O mesmo aviso da tela de Propriedades: este inventário é FORMA, não confirmação. */}
      <div className="ga-erro" style={{ borderColor: '#F59E0B55', background: '#F59E0B14' }}>
        <div className="ga-erro__t" style={{ color: 'var(--ga-alerta)' }}>Inventário não confirmado</div>
        <div className="ga-erro__d">{dados.aviso_inventario}</div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 8, lineHeight: 1.55 }}>
        ⚠️ O fuso mostrado é o da propriedade. GA4 tem timezone <b>por propriedade</b>, e este
        servidor não tem as tabelas de fuso do MySQL carregadas — por isso todo relatório do módulo
        é resolvido em America/Sao_Paulo na borda da API, nunca no banco.
      </div>
      <Procedencia meta={meta} />
    </>
  );
}
