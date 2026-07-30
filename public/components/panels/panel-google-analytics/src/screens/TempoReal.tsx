// screens/TempoReal.tsx — §18
// @version 1.0.0  @created 2026-07-30
import { useEffect, useState } from 'react';
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Badge, Icone, Grid, BarraProp, Vazio } from '../components/UI';
import type { Coluna } from '../components/UI';
import { SerieTemporal } from '../components/Serie';
import { fmtInt } from '../lib/fmt';

/**
 * ⚠️ O refresh é PAUSÁVEL e configurável de propósito (§18.3). Esta é a tela mais caríssima do
 * módulo: a Data API cobra tempo real numa categoria de quota separada, e um intervalo curto
 * deixado ligado numa aba esquecida consome quota sozinho a noite toda. Por isso: intervalo
 * explícito, botão de pausa, e pausa automática quando a aba sai de foco.
 */
const INTERVALOS = [
  { id: 0, rotulo: 'Manual' },
  { id: 30, rotulo: '30 s' },
  { id: 60, rotulo: '1 min' },
  { id: 300, rotulo: '5 min' },
];

export default function TempoReal({ filtros, svc, recarga, onMeta }: PropsTela) {
  const [intervalo, setIntervalo] = useState(60);
  const [pausado, setPausado] = useState(false);
  const [tique, setTique] = useState(0);

  // ⚠️ `document.hidden`: sem esta guarda a aba em segundo plano segue consumindo quota.
  // É regra do projeto para qualquer polling (aparece no strict-mode como violação).
  useEffect(() => {
    if (intervalo === 0 || pausado) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTique((n) => n + 1);
    }, intervalo * 1000);
    return () => window.clearInterval(id);
  }, [intervalo, pausado]);

  const { dados, meta, carregando, erro } = usarDados(
    (s) => svc.getRealtime(filtros, s),
    [filtros.cenario, recarga, tique],
    onMeta,
  );

  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando linhas={4} />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const maxPag = Math.max(1, ...dados.por_pagina.map((p) => p.usuarios));
  const colPag: Coluna<typeof dados.por_pagina[number]>[] = [
    { chave: 'path', rotulo: 'Página', render: (l) => <span className="ga-trunc ga-mono" title={l.titulo}>{l.path}</span> },
    { chave: 'u', rotulo: 'Usuários', num: true, larg: 90, render: (l) => fmtInt(l.usuarios) },
    { chave: 'b', rotulo: '', larg: 110, render: (l) => <BarraProp valor={l.usuarios} max={maxPag} /> },
  ];

  return (
    <>
      <Card
        titulo="Agora"
        nota="tempo real não reconcilia com os relatórios principais"
        acao={
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <div className="ga-sel-campo">
              <label htmlFor="ga-rt-int">Atualizar</label>
              <select id="ga-rt-int" className="ga-sel" value={intervalo} onChange={(e) => setIntervalo(Number(e.target.value))}>
                {INTERVALOS.map((i) => <option key={i.id} value={i.id}>{i.rotulo}</option>)}
              </select>
            </div>
            <button className="ga-btn" onClick={() => setPausado((v) => !v)} aria-pressed={pausado}>
              {pausado ? 'Retomar' : 'Pausar'}
            </button>
            <button className="ga-btn" onClick={() => setTique((n) => n + 1)}>
              <Icone nome="RefreshCw" tam={13} /> Agora
            </button>
          </span>
        }
      >
        <div className="ga-colunas">
          <div className="ga-card">
            <div className="ga-card__corpo">
              <div style={{ fontSize: 11, color: 'var(--ga-txt-2)' }}>Usuários ativos agora</div>
              <div className="ga-rt-num">{fmtInt(dados.ativos_agora)}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--ga-txt-2)' }}>
                <span>5 min: <b style={{ color: 'var(--ga-txt)' }}>{fmtInt(dados.ativos_5min)}</b></span>
                <span>30 min: <b style={{ color: 'var(--ga-txt)' }}>{fmtInt(dados.ativos_30min)}</b></span>
              </div>
              <div style={{ marginTop: 10 }}>
                <Badge tipo={pausado ? 'neutro' : 'ok'}>
                  {pausado ? 'atualização pausada' : intervalo === 0 ? 'atualização manual' : `atualizando a cada ${intervalo}s`}
                </Badge>
              </div>
            </div>
          </div>

          <div className="ga-card" style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <div className="ga-card__corpo">
              <div style={{ fontSize: 11, color: 'var(--ga-txt-2)', marginBottom: 4 }}>Últimos 30 minutos</div>
              <SerieTemporal
                datas={dados.por_minuto.map((p) => `2026-01-${String((Number(p.minuto.split(':')[1]) % 28) + 1).padStart(2, '0')}`)}
                series={[{ nome: 'Usuários por minuto', dados: dados.por_minuto.map((p) => p.usuarios), cor: '#E8710A', tipo: 'bar' }]}
                altura={140}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="ga-colunas--2">
        <Card titulo="Páginas ativas">
          <Grid colunas={colPag} linhas={dados.por_pagina} chave={(l) => l.path} />
        </Card>

        <Card titulo="Origem do tráfego agora">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {dados.por_canal.filter((c) => c.usuarios > 0).map((c) => (
                <div key={c.canal} className="ga-rt-lin">
                  <span>{c.canal}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtInt(c.usuarios)}</span>
                </div>
              ))}
              {dados.por_canal.every((c) => c.usuarios === 0) && <Vazio titulo="Ninguém no site agora" />}
            </div>
          </div>
        </Card>
      </div>

      <div className="ga-colunas--2">
        <Card titulo="Eventos recentes">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {dados.eventos_recentes.map((e, i) => (
                <div key={i} className="ga-rt-lin">
                  <span className="ga-mono">{e.evento} {e.importante && <Badge tipo="marca">importante</Badge>}</span>
                  <span style={{ color: 'var(--ga-txt-3)' }}>{e.quando}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card titulo="Dispositivos e regiões agora">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {dados.por_dispositivo.map((d) => (
                <div key={d.dispositivo} className="ga-rt-lin">
                  <span>{d.dispositivo}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtInt(d.usuarios)}</span>
                </div>
              ))}
              <div style={{ height: 8 }} />
              {dados.por_regiao.slice(0, 5).map((r) => (
                <div key={r.uf} className="ga-rt-lin">
                  <span>{r.regiao}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtInt(r.usuarios)}</span>
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
