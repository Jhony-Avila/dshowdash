// screens/Qualidade.tsx — §42 (Qualidade da coleta) e §44 (Tagging / GTM)
// @version 1.0.0  @created 2026-07-30
//
// Esta é a tela mais valiosa do módulo hoje, e por um motivo específico: os achados que ela
// mostra são REAIS, vindos da auditoria da Fase 0 sobre o container de produção. Ela responde
// "o sistema de mensuração está saudável?" (§84) com evidência, não com opinião.
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, KpiCard, Badge, Vazio, Icone } from '../components/UI';

function usarQualidade(p: PropsTela) {
  return usarDados(
    (s) => p.svc.getQuality(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
}

const SEV_BADGE: Record<string, 'erro' | 'alerta' | 'info'> = { alta: 'erro', media: 'alerta', baixa: 'info' };

/** Classificação da §6 do briefing — o mesmo vocabulário do relatório da Fase 0. */
const CLASS_BADGE: Record<string, 'ok' | 'alerta' | 'erro' | 'info' | 'neutro'> = {
  funcionando: 'ok',
  'funcionando parcialmente': 'alerta',
  incorreto: 'erro',
  duplicado: 'alerta',
  ausente: 'erro',
  'não validado': 'neutro',
  obsoleto: 'alerta',
  inseguro: 'erro',
};

export function Qualidade(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarQualidade(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const r = dados.resumo;
  const altas = dados.achados.filter((a) => a.severidade === 'alta').length;

  return (
    <>
      <Card titulo="Saúde da coleta">
        <div className="ga-kpis">
          <KpiCard kpi={{ chave: 's', rotulo: 'Streams ativos', valor: r.streams_ativos, unidade: 'int' }} />
          <KpiCard kpi={{ chave: 'e', rotulo: 'Eventos recebidos', valor: r.eventos_recebidos, unidade: 'int' }} />
          <KpiCard kpi={{ chave: 'a', rotulo: 'Eventos ausentes', valor: r.eventos_ausentes, unidade: 'int', maior_melhor: false }} />
          <KpiCard kpi={{ chave: 'w', rotulo: 'Eventos com apontamento', valor: r.eventos_com_aviso, unidade: 'int', maior_melhor: false }} />
          <KpiCard kpi={{ chave: 'o', rotulo: 'Achados abertos', valor: r.achados_abertos, unidade: 'int', maior_melhor: false }} />
        </div>
      </Card>

      <Card titulo="Achados" nota={`${altas} de severidade alta · classificação conforme a auditoria da Fase 0`}>
        <div className="ga-atencao">
          {dados.achados.map((a, i) => (
            <div key={i} className="ga-alerta-item" data-sev={a.severidade}>
              <div className="ga-alerta-item__faixa" />
              <div className="ga-alerta-item__corpo">
                <div className="ga-alerta-item__tit" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {a.item}
                  <Badge tipo={SEV_BADGE[a.severidade] ?? 'info'}>{a.severidade}</Badge>
                  <Badge tipo={CLASS_BADGE[a.classificacao] ?? 'neutro'}>{a.classificacao}</Badge>
                </div>
                <div className="ga-alerta-item__lin">{a.detalhe}</div>
              </div>
              <div className="ga-alerta-item__acao" />
            </div>
          ))}
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

export function Tagging(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarQualidade(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const t = dados.tagging;

  return (
    <>
      <Card titulo="Instalação" nota="identificadores reais, auditados na Fase 0">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ga-txt-2)' }}>Container GTM</div>
                <div className="ga-mono" style={{ fontSize: 14, fontWeight: 600 }}>{t.container}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ga-txt-2)' }}>Measurement ID (GA4)</div>
                <div className="ga-mono" style={{ fontSize: 14, fontWeight: 600 }}>{t.measurement_id}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ga-txt-2)' }}>Universal Analytics (legado)</div>
                <div className="ga-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ga-erro)' }}>{t.ua_legado}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ga-txt-2)' }}>Onde a tag vive</div>
                <div className="ga-mono" style={{ fontSize: 12.5 }}>{t.onde_esta_a_tag}</div>
              </div>
            </div>

            {/* ⚠️ Este aviso é o achado mais fácil de perder de vista, e o de maior risco
                operacional: a tag não está no HTML. Fica na tela, não só no relatório. */}
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#F59E0B14', border: '1px solid #F59E0B44', fontSize: 12, lineHeight: 1.55 }}>
              <b>Atenção:</b> a tag do GA4 é injetada por <span className="ga-mono">{t.onde_esta_a_tag}</span>, não pelo HTML da
              página. Qualquer deploy do site que regenere esse arquivo pode derrubar a coleta inteira
              sem aviso — e quem auditar apenas o HTML não vai encontrar a tag.
            </div>
          </div>
        </div>
      </Card>

      <div className="ga-colunas--2">
        <Card titulo="Tags no container" nota="por tipo">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {Object.entries(t.tipos_de_tag).map(([tipo, n]) => (
                <div key={tipo} className="ga-rt-lin">
                  <span>{tipo}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card titulo="Checklist de instalação" nota="§44.1">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {t.checklist.map((c) => (
                <div key={c.item} className="ga-rt-lin">
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <Icone nome={c.ok === true ? 'BadgeCheck' : c.ok === false ? 'CircleAlert' : 'Info'} tam={14} />
                    {c.item}
                  </span>
                  <Badge tipo={c.ok === true ? 'ok' : c.ok === false ? 'erro' : 'neutro'}>
                    {c.ok === true ? 'ok' : c.ok === false ? 'pendente' : 'não validado'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Procedencia meta={meta} />
    </>
  );
}
