// screens/Usuarios.tsx — §36 (Usuários), §39 (Dispositivos), §40 (Localizações), §37 (Retenção)
// @version 1.1.0  @created 2026-07-30  @updated 2026-07-30 (Fase 2: mapa em D3)
import { useState } from 'react';
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, KpiCard, Vazio, BarraProp } from '../components/UI';
import type { Coluna } from '../components/UI';
import { MapaBrasil } from '../components/viz/MapaBrasil';
import { fmtInt, fmtPct } from '../lib/fmt';

function usarUsuarios(p: PropsTela) {
  return usarDados(
    (s) => p.svc.getUsers(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
}

/** Aviso de privacidade (§36.2, §72) — sai na tela, não no código. */
function AvisoPrivacidade({ texto }: { texto: string }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--ga-borda)' }}>
      {texto}
    </div>
  );
}

export function Usuarios(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarUsuarios(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  return (
    <>
      <Card titulo="Usuários no período">
        <div className="ga-kpis">{dados.kpis.map((k) => <KpiCard key={k.chave} kpi={k} />)}</div>
      </Card>
      <Card titulo="Novos × recorrentes">
        <div className="ga-card">
          <div className="ga-card__corpo">
            {(() => {
              const novos = dados.kpis.find((k) => k.chave === 'novos')?.valor ?? 0;
              const rec = dados.kpis.find((k) => k.chave === 'recorrentes')?.valor ?? 0;
              const tot = novos + rec || 1;
              return (
                <>
                  <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ga-borda)' }}>
                    <div style={{ width: `${(novos / tot) * 100}%`, background: 'var(--ga-laranja)' }} title={`Novos: ${fmtInt(novos)}`} />
                    <div style={{ width: `${(rec / tot) * 100}%`, background: 'var(--ga-roxo)' }} title={`Recorrentes: ${fmtInt(rec)}`} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
                    <span><b style={{ color: 'var(--ga-laranja)' }}>■</b> Novos: {fmtInt(novos)} ({fmtPct((novos / tot) * 100, 1)})</span>
                    <span><b style={{ color: 'var(--ga-roxo)' }}>■</b> Recorrentes: {fmtInt(rec)} ({fmtPct((rec / tot) * 100, 1)})</span>
                  </div>
                </>
              );
            })()}
            <AvisoPrivacidade texto={dados.aviso_privacidade} />
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

export function Dispositivos(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarUsuarios(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  type L = typeof dados.por_dispositivo[number];
  const max = Math.max(1, ...dados.por_dispositivo.map((d) => d.usuarios));
  const melhorTx = Math.max(...dados.por_dispositivo.map((d) => d.taxa_conversao));

  const cols: Coluna<L>[] = [
    { chave: 'd', rotulo: 'Dispositivo', render: (l) => <b>{l.dispositivo}</b> },
    { chave: 'bar', rotulo: '', larg: 120, render: (l) => <BarraProp valor={l.usuarios} max={max} /> },
    { chave: 'u', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.usuarios, 0)) },
    { chave: 'c', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
    {
      chave: 'tx', rotulo: 'Taxa de conversão', num: true,
      // Destaca o dispositivo que converte MUITO abaixo do melhor: é a leitura que a §39.2 quer
      // (matriz volume × conversão) sem precisar de gráfico.
      render: (l) => (
        <span style={{ color: l.taxa_conversao < melhorTx * 0.5 ? 'var(--ga-ruim)' : undefined, fontWeight: l.taxa_conversao < melhorTx * 0.5 ? 650 : undefined }}>
          {fmtPct(l.taxa_conversao)}
        </span>
      ),
    },
    { chave: 'e', rotulo: 'Engajamento', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1) },
  ];

  const pior = [...dados.por_dispositivo].sort((a, b) => a.taxa_conversao - b.taxa_conversao)[0];

  return (
    <>
      <Card titulo="Dispositivos" nota="volume × qualidade na mesma tabela">
        <Grid
          colunas={cols}
          linhas={dados.por_dispositivo}
          chave={(l) => l.dispositivo}
          onLinha={(l) => p.onCorte({ dispositivo: p.corte.dispositivo === l.dispositivo ? null : l.dispositivo })}
          selecionada={(l) => p.corte.dispositivo === l.dispositivo}
        />
      </Card>
      {pior && pior.taxa_conversao < melhorTx * 0.5 && (
        <Card titulo="Leitura">
          <div className="ga-card">
            <div className="ga-card__corpo" style={{ fontSize: 12, color: 'var(--ga-txt-2)', lineHeight: 1.6 }}>
              <b style={{ color: 'var(--ga-txt)' }}>{pior.dispositivo}</b> converte a {fmtPct(pior.taxa_conversao)},
              menos da metade do melhor dispositivo ({fmtPct(melhorTx)}), com {fmtInt(pior.usuarios)} usuários.
              Volume alto com conversão baixa costuma ser problema de experiência, não de tráfego:
              vale conferir formulário, peso da página e área de toque nesse dispositivo.
            </div>
          </div>
        </Card>
      )}
      <Procedencia meta={meta} />
    </>
  );
}

export function Localizacoes(p: PropsTela) {
  const [ufSel, setUfSel] = useState<string | null>(null);
  const { dados, meta, carregando, erro } = usarUsuarios(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  type L = typeof dados.por_regiao[number];
  const max = Math.max(1, ...dados.por_regiao.map((r) => r.usuarios));
  const cols: Coluna<L>[] = [
    { chave: 'uf', rotulo: 'UF', larg: 60, render: (l) => <span className="ga-mono">{l.uf}</span> },
    { chave: 'r', rotulo: 'Região', render: (l) => l.regiao },
    { chave: 'bar', rotulo: '', larg: 130, render: (l) => <BarraProp valor={l.usuarios} max={max} /> },
    { chave: 'u', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.usuarios, 0)) },
    { chave: 'c', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
    { chave: 'tx', rotulo: 'Taxa', num: true, render: (l) => fmtPct(l.taxa_conversao) },
  ];

  return (
    <>
      <Card titulo="Distribuição por estado" nota="clique num estado para destacá-lo na tabela abaixo">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <MapaBrasil
              dados={dados.por_regiao}
              metrica="usuarios"
              altura={430}
              selecionada={ufSel}
              onClicarUf={(u) => {
                setUfSel(u.uf === ufSel ? null : u.uf);
                // ⚠️ O filtro global do módulo não tem dimensão de UF; o corte por região
                // entra junto com a Fase 3 (drill-down completo). Aqui a seleção é local e
                // serve para ligar mapa e tabela — dizer que filtra tudo seria mentira.
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 6 }}>
          Intensidade = usuários. A precisão geográfica é a que a fonte fornece — o módulo não
          infere localização mais fina que isso.
        </div>
      </Card>

      <Card titulo="Estados" nota={ufSel ? `destacando ${ufSel}` : undefined}>
        <Grid
          colunas={cols}
          linhas={dados.por_regiao}
          chave={(l) => l.uf + l.regiao}
          onLinha={(l) => setUfSel(l.uf === ufSel ? null : l.uf)}
          selecionada={(l) => l.uf === ufSel}
        />
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

// ── Retenção / coortes (§37) ─────────────────────────────────────────────
export function Retencao(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarUsuarios(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  /** Escala de cor da coorte. Laranja da marca, opacidade pela retenção. */
  const cor = (v: number) => {
    const t = Math.max(0, Math.min(1, v / 100));
    return `rgba(232, 113, 10, ${(0.12 + t * 0.88).toFixed(3)})`;
  };
  const maxSemanas = Math.max(...dados.coortes.map((c) => c.semanas.length));

  return (
    <>
      <Card titulo="Retenção por coorte semanal" nota="% dos usuários da coorte que voltaram">
        <div className="ga-grid-wrap">
          <table className="ga-grid ga-coorte">
            <thead>
              <tr>
                <th>Coorte</th>
                <th className="ga-num">Usuários</th>
                {Array.from({ length: maxSemanas }).map((_, i) => <th key={i} className="ga-num">S{i}</th>)}
              </tr>
            </thead>
            <tbody>
              {dados.coortes.map((c) => (
                <tr key={c.coorte}>
                  <td className="ga-mono">{c.coorte}</td>
                  <td className="ga-num">{fmtInt(c.tamanho)}</td>
                  {Array.from({ length: maxSemanas }).map((_, i) => {
                    const v = c.semanas[i];
                    if (v === undefined) return <td key={i} className="ga-cel" data-v="vazia" />;
                    return (
                      <td key={i} className="ga-cel" style={{ background: cor(v) }} title={`Semana ${i}: ${fmtPct(v, 1)}`}>
                        {v.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
