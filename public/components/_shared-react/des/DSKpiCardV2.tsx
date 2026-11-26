// _shared-react/des/DSKpiCardV2.tsx — DES · DSKpiCard v2, VARIAÇÃO A (sóbria), escolhida pelo Jhony no Chromatic (26/11). Fonte: o Lab.
// ROXO (CIMA). Mesma API da v1 (os mesmos dados), só props OPCIONAIS a mais: dominio (cor do ícone), serie (micrográfico), anterior (tooltip da
// variação), variante 'A' (sóbria) | 'B' (mais rica). Opção A: CSS de tokens (ds-kpi-card-v2.css), sem Tailwind.
// Inspiração portada: "metrics" do Untitled UI PRO (ícone em caixa, número + indicador de variação), Aceternity "stats-with-number-ticker" e
// "bento" (fundo com tom, profundidade no hover). Regras R2: "—" nunca animado nem 0; variação só se o dado existir; micrográfico só com
// série real (sem série, nada); cor da variação pela POLARIDADE; NumberFlow e entrada respeitam "reduzir movimento".
import { useId, type ReactNode } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { fmtKpi, intlDe, type EstadoKpi, type FormatoKpi, type TomSelo, type VariacaoKpi } from './DSKpiCard';
import './ds-kpi-card.css';
import './ds-kpi-card-v2.css';

export type DominioKpi = 'comercial' | 'operacao' | 'financeiro' | 'marketing';
export interface DSKpiCardV2Props {
  rotulo: string; marcador?: string; icone?: ReactNode; dominio?: DominioKpi;
  valor: number | null; formato: FormatoKpi; estado: EstadoKpi;
  motivo?: ReactNode; sub?: ReactNode; selo?: { texto: string; tom: TomSelo } | null; quando?: string | null;
  /** variação vs. o período anterior (% já calculado pelo serviço; null = desconhecida → não aparece) */
  variacao?: VariacaoKpi | null;
  /** valor do período anterior (vai no tooltip e no texto para leitor de tela) */
  anterior?: number | null;
  /** série do micrográfico (7–30 pontos, do serviço). Sem série: nada. null no meio = ponto desconhecido (a linha quebra). */
  serie?: (number | null)[] | null;
  fonte: string; acao?: { rotulo: string; onClick: () => void } | null; onTentar?: () => void; tentando?: boolean; dica?: string;
  animar?: boolean; /** só a A vai para o Dash (a B ficou no Lab) */ variante?: 'A'; dados?: Record<`data-${string}`, string | undefined>;
}

const SELO_PADRAO: Partial<Record<EstadoKpi, [string, TomSelo]>> = {
  desatualizado: ['Desatualizado', 'aviso'], parcial: ['Dados parciais', 'aviso'], erro: ['Com problema', 'erro'], vazio: ['Sem dado', 'neutro'], carregando: ['Carregando…', 'neutro'],
};
const base = (v: number, f: FormatoKpi) => (f === 'percentual' ? v / 100 : v);

function Numero({ v, f, animar }: { v: number; f: FormatoKpi; animar?: boolean }) {
  if (!animar) return <>{fmtKpi(v, f)}</>;
  return <><span aria-hidden><NumberFlow value={base(v, f)} locales="pt-BR" format={intlDe(f)} respectMotionPreference /></span><span className="des-sr">{fmtKpi(v, f)}</span></>;
}

function Variacao({ v, anterior, formato }: { v: VariacaoKpi; anterior?: number | null; formato: FormatoKpi }) {
  if (v.valor === null) return null;   // desconhecida: não aparece (nunca inventar)
  const sobe = v.valor > 0, zero = v.valor === 0;
  const bom = zero ? null : sobe === (v.polaridade === 'maior-melhor');
  const txt = `${zero ? '' : sobe ? '▲ +' : '▼ '}${zero ? '0' : v.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`.replace('▼ -', '▼ −');
  const ant = anterior === undefined || anterior === null ? null : fmtKpi(anterior, formato);
  return (
    <span className={`des2-var des2-var--${bom === null ? 'neutro' : bom ? 'bom' : 'ruim'}`} title={ant ? `${v.base}: ${ant}` : v.base} data-des-variacao>
      <span aria-hidden>{txt}</span>
      <span className="des-sr">{`variação ${v.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%, ${bom === null ? 'estável' : bom ? 'favorável' : 'desfavorável'}`}{ant ? `; ${v.base}: ${ant}` : ''}</span>
      <span className="des2-var__base" aria-hidden>{v.base}</span>
    </span>
  );
}

/** Micrográfico: só com série real (≥ 2 pontos conhecidos). A linha quebra onde o ponto é desconhecido (null). */
function Sparkline({ serie, area }: { serie: (number | null)[]; area: boolean }) {
  const id = useId().replace(/:/g, '');
  const conhecidos = serie.filter((x): x is number => x !== null && Number.isFinite(x));
  if (conhecidos.length < 2) return null;
  const mn = Math.min(...conhecidos), mx = Math.max(...conhecidos), W = 100, H = 28, pad = 2;
  const pt = (v: number, i: number) => `${(i / (serie.length - 1)) * W},${H - pad - ((v - mn) / (mx - mn || 1)) * (H - pad * 2)}`;
  const trechos: string[][] = []; let cur: string[] = [];
  serie.forEach((v, i) => { if (v === null || !Number.isFinite(v)) { if (cur.length) trechos.push(cur); cur = []; } else cur.push(pt(v, i)); });
  if (cur.length) trechos.push(cur);
  return (
    <svg className="des2-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden data-des-spark={serie.length}>
      {area && <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>}
      {area && trechos.map((t, k) => t.length > 1 && <polygon key={`a${k}`} points={`${t[0].split(',')[0]},${H} ${t.join(' ')} ${t[t.length - 1].split(',')[0]},${H}`} fill={`url(#g${id})`} />)}
      {trechos.map((t, k) => <polyline key={k} points={t.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />)}
    </svg>
  );
}

export function DSKpiCardV2(p: DSKpiCardV2Props) {
  const v = p.variante ?? 'A';
  const padrao = SELO_PADRAO[p.estado];
  const selo = p.selo === null ? null : p.selo ?? (padrao ? { texto: padrao[0], tom: padrao[1] } : null);
  const carregando = p.estado === 'carregando';
  const semNumero = p.estado === 'vazio' || p.estado === 'erro' || p.valor === null;
  const temSerie = !semNumero && !!p.serie && p.serie.filter((x) => x !== null).length >= 2;
  return (
    <article className={`des2-kpi des2-kpi--${v}`} data-des-kpi data-des-estado={p.estado} data-des-dominio={p.dominio ?? 'neutro'} aria-busy={carregando || undefined} title={p.dica} {...p.dados}>
      <header className="des2-kpi__cab">
        {p.icone && <span className="des2-kpi__ic" aria-hidden>{p.icone}</span>}
        <div className="des2-kpi__tit">
          <h3 className="des2-kpi__rotulo" data-des-rotulo>{p.rotulo}</h3>
          {p.marcador && <span className="des2-kpi__marcador" data-des-marcador>{p.marcador}</span>}
        </div>
      </header>
      {carregando ? (
        <div className="des2-kpi__corpo"><span className="des-osso" style={{ width: '56%', height: 30 }} /><span className="des-osso" style={{ width: '36%', height: 12 }} /></div>
      ) : p.estado === 'erro' ? (
        <div className="des2-kpi__corpo des-kpi__problema" role="status">
          {selo && <span className={`des-selo des-selo--${selo.tom} des2-kpi__selo`} data-des-selo>{selo.texto}</span>}
          <span>{p.motivo || 'A leitura desta fonte falhou.'}{p.quando !== undefined && <span className="des-kpi__quando"> · {p.quando ?? 'sem leitura válida recente'}</span>}</span>
          {p.onTentar && <button type="button" className="des-btn" onClick={p.onTentar} disabled={p.tentando}><RefreshCw size={13} aria-hidden /> {p.tentando ? 'Tentando…' : 'Tentar de novo'}</button>}
        </div>
      ) : (
        <div className="des2-kpi__corpo">
          <div className="des2-kpi__linha">
            <div className={`des2-kpi__valor${semNumero ? ' des2-kpi__valor--vazio' : p.estado === 'desatualizado' ? ' des2-kpi__valor--velho' : ''}`} data-des-valor>
              {semNumero || p.valor === null ? '—' : <Numero v={p.valor} f={p.formato} animar={p.animar} />}
            </div>
          </div>
          {/* linha própria, sempre: a variação (em destaque) ou, fora de 'ok', o selo do estado — nunca espreme o número nem o rótulo */}
          {p.variacao && !semNumero && p.variacao.valor !== null ? <Variacao v={p.variacao} anterior={p.anterior} formato={p.formato} />
            : selo && <span className={`des-selo des-selo--${selo.tom} des2-kpi__selo`} data-des-selo>{selo.texto}</span>}
          {(p.estado !== 'ok' && (p.motivo || p.estado === 'vazio')) ? <span className="des2-kpi__sub">{p.motivo || 'Sem valor informado · nenhum número assumido'}</span>
            : p.sub ? <span className="des2-kpi__sub">{p.sub}</span> : null}
        </div>
      )}
      {/* rodapé só com o que acrescenta: micrográfico e/ou ação. A fonte já está no marcador ("Financeiro · Precifica"); repeti-la sozinha
          esticava os cartões de estado acima de 160 px (a linha inteira da Geral cresce junto). Sem marcador, a fonte volta para o rodapé. */}
      {(temSerie || (p.acao && !carregando) || !p.marcador) && (
        <footer className="des2-kpi__rodape" data-des-rodape>
          {temSerie ? <Sparkline serie={p.serie!} area={v === 'B'} /> : <span className="des2-kpi__fonte">{p.marcador ? '' : p.fonte}</span>}
          {p.acao && !carregando && <button type="button" className="des-link des2-kpi__acao" onClick={p.acao.onClick}>{p.acao.rotulo} <ArrowRight size={13} aria-hidden /></button>}
        </footer>)}
    </article>
  );
}
