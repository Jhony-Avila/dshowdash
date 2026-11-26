// _shared-react/des/DSKpiCard.tsx — DES · cartão de KPI único (CIMA, 26/11). FONTE ÚNICA: o Lab (/srv/dshow-lab/des) usa uma cópia deste arquivo.
// Desenho = "metrics" do Untitled UI PRO (MetricsSimple + MetricChangeIndicator "modern") PORTADO para CSS de tokens (opção A do Jhony; sem Tailwind).
// Contrato R2 (FASE0-DES-PLANO §3): valor null → "—" (nunca 0); estados com motivo escrito; variação com POLARIDADE (a cor diz bom/ruim, não o
// sinal); número pt-BR; ação "Ver …". Big Number animado pelo NumberFlow (decisão do Jhony, 26/11), nunca o "—".
// Acessibilidade: o nome do cartão é o texto visível (sem aria-label que o esconda — lição da P32); o NumberFlow é aria-hidden e o valor formatado
// inteiro vai num texto só para leitor de tela (o NumberFlow sozinho é lido dígito a dígito).
// Estados: ok · carregando · vazio · erro · desatualizado · parcial (+ variação + / − / menor-é-melhor = os 8 do piloto).
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, RefreshCw } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import './ds-kpi-card.css';

export type EstadoKpi = 'ok' | 'carregando' | 'vazio' | 'erro' | 'desatualizado' | 'parcial';
export type FormatoKpi = 'moeda' | 'moeda-inteira' | 'inteiro' | 'percentual';
export type TomSelo = 'ok' | 'aviso' | 'erro' | 'neutro';
export interface VariacaoKpi { valor: number | null; polaridade: 'maior-melhor' | 'menor-melhor'; base: string }
export interface DSKpiCardProps {
  marcador?: string; rotulo: string; icone?: ReactNode;
  valor: number | null; formato: FormatoKpi; estado: EstadoKpi;
  /** texto do estado (fora de 'ok'); em 'erro' é a frase do problema */
  motivo?: ReactNode;
  /** linha sob o número (contexto: "Fechados no período" etc.); aparece em qualquer estado com número */
  sub?: ReactNode;
  variacao?: VariacaoKpi | null;
  /** selo explícito (ex.: "Zero real", "Aguardando conexão", "Sem acesso"); sem ele vale o selo padrão do estado */
  selo?: { texto: string; tom: TomSelo } | null;
  /** erro: horário do último sucesso, já em texto ("Último sucesso às 10:42") */
  quando?: string | null;
  fonte: string; acao?: { rotulo: string; onClick: () => void } | null;
  onTentar?: () => void; tentando?: boolean;
  /** dica do cartão (title) */
  dica?: string;
  /** anima a troca do número (NumberFlow). Sem a prop = texto puro. */
  animar?: boolean;
  /** atributos data-* extras na raiz (compatibilidade com testes e medidores existentes) */
  dados?: Record<`data-${string}`, string | undefined>;
}

type FormatoIntl = { style?: 'currency' | 'percent' | 'decimal'; currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number };
export const intlDe = (f: FormatoKpi): FormatoIntl => (f === 'moeda' ? { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }
  : f === 'moeda-inteira' ? { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 } : f === 'percentual' ? { style: 'percent', maximumFractionDigits: 1 } : {});
const base = (v: number, f: FormatoKpi) => (f === 'percentual' ? v / 100 : v);
export const fmtKpi = (v: number | null, f: FormatoKpi): string => (v === null || !Number.isFinite(v) ? '—' : base(v, f).toLocaleString('pt-BR', intlDe(f)));
const SELO_PADRAO: Partial<Record<EstadoKpi, [string, TomSelo]>> = {
  desatualizado: ['Desatualizado', 'aviso'], parcial: ['Dados parciais', 'aviso'], erro: ['Com problema', 'erro'], vazio: ['Sem dado', 'neutro'], carregando: ['Carregando…', 'neutro'],
};

function Numero({ v, f, animar }: { v: number; f: FormatoKpi; animar?: boolean }) {
  if (!animar) return <>{fmtKpi(v, f)}</>;
  return <><span aria-hidden><NumberFlow value={base(v, f)} locales="pt-BR" format={intlDe(f)} respectMotionPreference /></span><span className="des-sr">{fmtKpi(v, f)}</span></>;
}

function Variacao({ v }: { v: VariacaoKpi }) {
  if (v.valor === null) return <span className="des-var des-var--neutro"><Minus size={12} aria-hidden />— <span className="des-var__base">{v.base}</span></span>;
  const sobe = v.valor > 0, zero = v.valor === 0;
  const bom = zero ? null : (sobe === (v.polaridade === 'maior-melhor'));
  const Ic = zero ? Minus : sobe ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`des-var des-var--${bom === null ? 'neutro' : bom ? 'bom' : 'ruim'}`} data-des-variacao>
      <Ic size={12} strokeWidth={3} aria-hidden />{`${sobe ? '+' : ''}${v.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
      <span className="des-sr">{bom === null ? ', sem variação' : bom ? ', favorável' : ', desfavorável'}</span>
      <span className="des-var__base">{v.base}</span>
    </span>
  );
}

export function DSKpiCard(p: DSKpiCardProps) {
  const padrao = SELO_PADRAO[p.estado];
  const selo = p.selo === null ? null : p.selo ?? (padrao ? { texto: padrao[0], tom: padrao[1] } : null);
  const carregando = p.estado === 'carregando';
  const semNumero = p.estado === 'vazio' || p.estado === 'erro' || p.valor === null;
  return (
    <article className="des-kpi" data-des-kpi data-des-estado={p.estado} aria-busy={carregando || undefined} title={p.dica} {...p.dados}>
      {p.marcador && <span className="des-kpi__marcador" data-des-marcador>{p.marcador}</span>}
      <header className="des-kpi__cab">
        <h3 className="des-kpi__rotulo" data-des-rotulo>{p.rotulo}</h3>
        {selo && <span className={`des-selo des-selo--${selo.tom}`} data-des-selo>{selo.texto}</span>}
        {p.icone && <span className="des-kpi__ic" aria-hidden>{p.icone}</span>}
      </header>
      {carregando ? (
        <><span className="des-osso" style={{ width: '58%', height: 34 }} /><span className="des-osso" style={{ width: '40%', height: 14 }} /></>
      ) : p.estado === 'erro' ? (
        <div className="des-kpi__problema" role="status">
          <span>{p.motivo || 'A leitura desta fonte falhou.'}</span>
          {p.quando !== undefined && <span className="des-kpi__quando">{p.quando ?? 'Sem leitura válida recente'}</span>}
          {p.onTentar && (
            <button type="button" className="des-btn" onClick={p.onTentar} disabled={p.tentando} aria-busy={p.tentando || undefined}>
              <RefreshCw size={13} aria-hidden /> {p.tentando ? 'Tentando…' : 'Tentar de novo'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="des-kpi__linha">
            <div className={`des-kpi__valor${semNumero ? ' des-kpi__valor--vazio' : p.estado === 'desatualizado' ? ' des-kpi__valor--velho' : ''}`} data-des-valor>
              {semNumero || p.valor === null ? '—' : <Numero v={p.valor} f={p.formato} animar={p.animar} />}
            </div>
            {p.variacao && !semNumero && <Variacao v={p.variacao} />}
          </div>
          {p.sub && <span className="des-kpi__sub">{p.sub}</span>}
          {p.estado !== 'ok' && (p.motivo || (p.estado === 'vazio' && !p.sub)) && (
            <span className="des-kpi__motivo">{p.motivo || 'Sem valor informado · nenhum número assumido'}</span>
          )}
        </>
      )}
      <footer className="des-kpi__rodape" data-des-rodape>
        <span className="des-kpi__fonte">{p.fonte}</span>
        {p.acao && !carregando && <button type="button" className="des-link" onClick={p.acao.onClick}>{p.acao.rotulo} <ArrowRight size={13} aria-hidden /></button>}
      </footer>
    </article>
  );
}
