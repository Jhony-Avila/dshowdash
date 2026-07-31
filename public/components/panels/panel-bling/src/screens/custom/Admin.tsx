// panel-bling/src/screens/custom/Admin.tsx — Integrações, Sincronização, Configurações
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import {
  GradeKpis, Kpi, Secao, EstadoErro, BlocoCarregando, Badge, EstadoVazio,
  inteiro, percentual, haQuantoTempo, dataHora,
} from '@shared';
import { api } from '../../services/api';
import { useCarga } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
import { Icone } from '../../shell/Icone';

function kpi(id: string, rotulo: string, valor: number, formato: string,
  semantica: 'ok' | 'atencao' | 'critico' = 'ok'): Kpi {
  return {
    id, rotulo, valor, formato: formato as any, variacao: null, tendencia: 'estavel',
    sparkline: null, drilldown: null, semantica, tooltip: null,
  };
}

/* ═══════════════════════ Integrações (§10 item 47) ═══════════════════════ */

export function Integracoes({ aoNavegar }: PropsTela) {
  const carga = useCarga<any>(s => api.integracoes(s), []);
  const status = useCarga<any>(s => api.status(s), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Carregando integrações" />;

  const b = carga.dados.bling ?? {};
  const canais: any[] = carga.dados.canais ?? [];
  const checklist: any[] = status.dados?.checklist ?? [];
  const pendentes = checklist.filter(c => !c.ok);

  return (
    <div style={{ minWidth: 0 }}>
      <Secao titulo="Conexão com o Bling">
        <div className="bl-cartao" style={{ padding: '14px 16px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--bl-verde-suave)', border: '1px solid var(--bl-verde-borda)',
              color: 'var(--bl-verde)',
            }}>
              <Icone nome="Plug" tamanho={17} />
            </span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Bling ERP</div>
              <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>
                provedor: <strong>{b.provider}</strong>
                {b.ultima_sync && ` · sincronizado ${haQuantoTempo(b.ultima_sync)}`}
              </div>
            </div>
            <Badge info={b.estado} />
          </div>

          <div className="bl-titulo-secao">Checklist de ativação</div>
          {status.dados ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {checklist.map(c => (
                <li key={c.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 10px', borderRadius: 'var(--bl-raio-sm)',
                  background: c.ok ? 'var(--bl-sucesso-bg)' : 'var(--bl-superficie-2)',
                  border: `1px solid ${c.ok ? 'var(--bl-sucesso)' : 'var(--bl-borda)'}`,
                }}>
                  <span aria-hidden style={{
                    marginTop: 2, width: 14, height: 14, borderRadius: 999, flex: '0 0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    background: c.ok ? 'var(--bl-sucesso)' : 'transparent',
                    border: `1.5px solid ${c.ok ? 'var(--bl-sucesso)' : 'var(--bl-texto-3)'}`,
                    color: '#fff',
                  }}>{c.ok ? '✓' : ''}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: c.ok ? 500 : 600 }}>{c.rotulo}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>{c.detalhe}</div>
                    {c.acao && (
                      <div style={{ fontSize: 11.5, color: 'var(--bl-aviso)', marginTop: 3 }}>
                        <strong>Falta:</strong> {c.acao}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : <BlocoCarregando linhas={4} />}

          {pendentes.length > 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--bl-texto-2)', margin: '12px 0 0' }}>
              {pendentes.length} item(ns) pendente(s) para a integração real. Enquanto isso, o módulo
              opera com dados simulados e nenhuma escrita é enviada ao Bling.
            </p>
          )}
        </div>
      </Secao>

      <Secao titulo="Canais de venda conectados"
        descricao="Canais que o Bling consolida. O vínculo com módulos do Dshow Dash é indicado quando existe.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {canais.map(c => (
            <div key={c.id} className="bl-cartao" style={{ padding: '11px 13px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icone nome="Store" tamanho={15} />
                <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0 }}>{c.nome}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge info={c.estado_info} />
                <span style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>{c.tipo}</span>
              </div>
              {c.modulo_dshow && (
                <div style={{ fontSize: 11, color: 'var(--bl-texto-2)', marginTop: 6 }}>
                  Também disponível no módulo <strong>{c.modulo_dshow}</strong>.
                </div>
              )}
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}

/* ═══════════════════════ Sincronização (§47) ═══════════════════════ */

export function Sincronizacao({ larguraPainel }: PropsTela) {
  const carga = useCarga<any>(s => api.sincronizacao(s), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Carregando estado da sincronização" />;

  const r = carga.dados.resumo ?? {};
  const recursos: any[] = carga.dados.recursos ?? [];
  const estrategia: Record<string, string> = carga.dados.estrategia ?? {};

  return (
    <div style={{ minWidth: 0 }}>
      {carga.dados.nota && (
        <div style={{
          margin: '4px 0 14px', padding: '10px 13px', fontSize: 12.5,
          borderRadius: 'var(--bl-raio-sm)', background: 'var(--bl-aviso-bg)',
          color: 'var(--bl-aviso)', border: '1px solid var(--bl-aviso)',
        }}>
          {carga.dados.nota}
        </div>
      )}

      <GradeKpis kpis={[
        kpi('recursos', 'Recursos', r.recursos ?? 0, 'inteiro'),
        kpi('ok', 'Em dia', r.ok ?? 0, 'inteiro'),
        kpi('atencao', 'Em atenção', (r.atencao ?? 0) + (r.parcial ?? 0), 'inteiro',
          ((r.atencao ?? 0) + (r.parcial ?? 0)) > 0 ? 'atencao' : 'ok'),
        kpi('erro', 'Com erro', r.erro ?? 0, 'inteiro', (r.erro ?? 0) > 0 ? 'critico' : 'ok'),
        kpi('consultados', 'Registros consultados', r.consultados ?? 0, 'inteiro'),
        kpi('criados', 'Criados', r.criados ?? 0, 'inteiro'),
        kpi('atualizados', 'Atualizados', r.atualizados ?? 0, 'inteiro'),
        kpi('limite', 'Pico de limite consumido', r.limite_consumido_max ?? 0, 'percentual',
          (r.limite_consumido_max ?? 0) > 80 ? 'critico'
          : (r.limite_consumido_max ?? 0) > 60 ? 'atencao' : 'ok'),
      ]} />

      <Secao titulo="Por recurso"
        descricao="Cursor, watermark e retry são o que permite retomar a sincronização exatamente de onde parou.">
        <div className="bl-cartao bl-rola-x">
          <table style={{ width: '100%', minWidth: 940, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Recurso', 'Situação', 'Última execução', 'Próxima', 'Duração',
                  'Consultados', 'Criados', 'Atualizados', 'Erros', 'Limite', 'Retry', 'Estratégia'].map((h, i) => (
                  <th key={h} style={{
                    padding: '9px 10px', fontSize: 10.5, fontWeight: 600,
                    textAlign: i >= 4 && i <= 10 ? 'right' : 'left',
                    color: 'var(--bl-texto-2)', background: 'var(--bl-bg-elevado)',
                    borderBottom: '1px solid var(--bl-borda)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recursos.map((s, i) => (
                <tr key={s.recurso} style={{ background: i % 2 ? 'var(--bl-superficie-2)' : undefined }}>
                  <td style={td()}>
                    <div style={{ fontSize: 12.5 }}>{s.rotulo}</div>
                    <div style={{ fontSize: 10, color: 'var(--bl-texto-3)', fontFamily: 'var(--bl-fonte-mono)' }}>
                      {s.cursor}
                    </div>
                  </td>
                  <td style={td()}><Badge info={s.situacao_info} /></td>
                  <td style={td()}>
                    <div style={{ fontSize: 11.5 }}>{haQuantoTempo(s.ultima_execucao)}</div>
                    <div style={{ fontSize: 10, color: 'var(--bl-texto-3)' }}>
                      watermark {haQuantoTempo(s.watermark)}
                    </div>
                  </td>
                  <td style={td()}>
                    <span style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>
                      {dataHora(s.proxima_execucao)}
                    </span>
                  </td>
                  <td style={td('direita')}>{s.duracao_s.toFixed(1).replace('.', ',')}s</td>
                  <td style={td('direita')}>{inteiro(s.consultados)}</td>
                  <td style={td('direita')}>{inteiro(s.criados)}</td>
                  <td style={td('direita')}>{inteiro(s.atualizados)}</td>
                  <td style={{ ...td('direita'), color: s.erros > 0 ? 'var(--bl-erro)' : undefined }}>
                    {inteiro(s.erros)}
                  </td>
                  <td style={td('direita')}>
                    <span style={{
                      color: s.limite_consumido_pct > 80 ? 'var(--bl-erro)'
                        : s.limite_consumido_pct > 60 ? 'var(--bl-aviso)' : undefined,
                    }}>
                      {percentual(s.limite_consumido_pct, 0)}
                    </span>
                  </td>
                  <td style={td('direita')}>{s.retry > 0 ? inteiro(s.retry) : '—'}</td>
                  <td style={td()}>
                    <span style={{ fontSize: 11, color: 'var(--bl-texto-2)' }}>{s.estrategia}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao titulo="Estratégia de sincronização"
        descricao="Como o módulo carrega, reconcilia e se recupera de falha.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
          {Object.entries(estrategia).map(([k, v]) => (
            <div key={k} className="bl-cartao" style={{ padding: '10px 12px', minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                color: 'var(--bl-verde)', marginBottom: 3,
              }}>
                {k.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>{v}</div>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}

function td(alinhamento: 'esquerda' | 'direita' = 'esquerda'): React.CSSProperties {
  return {
    padding: '7px 10px', fontSize: 12, textAlign: alinhamento === 'direita' ? 'right' : 'left',
    borderBottom: '1px solid var(--bl-borda)', fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };
}

/* ═══════════════════════ Configurações (§10 item 52) ═══════════════════════ */

export function Configuracoes() {
  const carga = useCarga<any>(s => api.configuracoes(s), []);
  const contas = useCarga<any>(s => api.contas(s), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Carregando configurações" />;

  const c = carga.dados;

  return (
    <div style={{ minWidth: 0, maxWidth: 820 }}>
      <Secao titulo="Provedor de dados">
        <Bloco>
          <Linha rotulo="Provedor ativo" valor={<code style={codigo}>{c.provedor.atual}</code>} />
          <Linha rotulo="Opções" valor={c.provedor.opcoes.join(' · ')} />
          <Linha rotulo="Variável de ambiente" valor={<code style={codigo}>{c.provedor.variavel}</code>} />
          <Linha rotulo="Editável pela interface"
            valor={<Badge info={{ chave: 'nao', rotulo: 'Não', cor: 'neutro' }} />} />
          <p style={{ fontSize: 11.5, color: 'var(--bl-texto-2)', margin: '8px 0 0' }}>
            {c.provedor.nota}
          </p>
        </Bloco>
      </Secao>

      <Secao titulo="Contas e unidades">
        <Bloco>
          {contas.dados ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {(contas.dados.contas ?? []).map((a: any) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  padding: '9px 11px', borderRadius: 'var(--bl-raio-sm)',
                  background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
                }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--bl-texto-2)' }}>
                      {a.cnpj_mascarado} · {a.unidade} · {a.ambiente}
                    </div>
                  </div>
                  <Badge info={a.estado} />
                  {a.pendencias > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--bl-aviso)' }}>
                      {a.pendencias} pendência(s)
                    </span>
                  )}
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--bl-texto-3)', margin: 0 }}>
                Documentos exibidos mascarados por padrão (LGPD, §62).
              </p>
            </div>
          ) : <BlocoCarregando linhas={3} />}
        </Bloco>
      </Secao>

      <Secao titulo="Acesso">
        <Bloco>
          <Linha rotulo="Nível mínimo exigido" valor={String(c.acesso.nivel_minimo)} />
          <Linha rotulo="Modelo" valor={c.acesso.modelo} />
        </Bloco>
      </Secao>

      <Secao titulo="Privacidade e proteção de dados">
        <Bloco>
          <Linha rotulo="Mascaramento de documentos" valor={<Sim v={c.privacidade.mascaramento_documentos} />} />
          <Linha rotulo="Mascaramento de contatos" valor={<Sim v={c.privacidade.mascaramento_contatos} />} />
          <Linha rotulo="Exportação auditada" valor={<Sim v={c.privacidade.exportacao_auditada} />} />
          <Linha rotulo="Base" valor={c.privacidade.base} />
        </Bloco>
      </Secao>

      <Secao titulo="Operações de escrita">
        <Bloco>
          <Linha rotulo="Habilitadas"
            valor={<Badge info={{
              chave: c.escrita.habilitada ? 'sim' : 'nao',
              rotulo: c.escrita.habilitada ? 'Sim' : 'Não',
              cor: c.escrita.habilitada ? 'sucesso' : 'neutro',
            }} />} />
          <p style={{ fontSize: 11.5, color: 'var(--bl-texto-2)', margin: '8px 0 0' }}>
            {c.escrita.nota}
          </p>
        </Bloco>
      </Secao>
    </div>
  );
}

const codigo: React.CSSProperties = {
  fontFamily: 'var(--bl-fonte-mono)', fontSize: 11.5, padding: '1px 6px',
  background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)', borderRadius: 4,
};

function Bloco({ children }: { children: React.ReactNode }) {
  return <div className="bl-cartao" style={{ padding: '13px 15px', minWidth: 0 }}>{children}</div>;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '5px 0', fontSize: 12.5,
    }}>
      <span style={{ color: 'var(--bl-texto-2)', minWidth: 190 }}>{rotulo}</span>
      <span style={{ flex: 1 }}>{valor}</span>
    </div>
  );
}

function Sim({ v }: { v: boolean }) {
  return <Badge info={{ chave: v ? 'sim' : 'nao', rotulo: v ? 'Ativo' : 'Inativo', cor: v ? 'sucesso' : 'neutro' }} />;
}
