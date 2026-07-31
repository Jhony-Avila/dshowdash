// panel-bling/src/app/selecao.tsx — cross-filter global (§54) e drill-down (§55)
// @version 1.0.0  @created 2026-07-30
//
// O PROBLEMA QUE ISTO RESOLVE
// Na Fase 2 o cross-filter existia DENTRO da tela: clicar num canal recortava a
// tabela logo abaixo e acabava ali. O §54 pede outra coisa — "selecionar um
// canal filtra pedidos", com a seleção atravessando telas. Sem isso, quem
// encontra um problema na Visão Geral tem que refazer o filtro à mão em cada
// tela seguinte, e no meio do caminho erra o recorte.
//
// COMO FUNCIONA
// A seleção vive aqui, acima das telas, e vira parâmetro nas requisições. Quem
// seleciona não precisa saber quem vai consumir; quem consome não precisa saber
// de onde veio. Uma barra fixa mostra o recorte ativo e o botão de limpar —
// exigência explícita do §54.
//
// POR QUE NÃO NO HASH DA URL
// A tela já mora no hash. Empilhar a seleção ali obrigaria a serializar/parsear
// a cada clique de gráfico e encheria o histórico do navegador de entradas que
// ninguém quer revisitar com o botão voltar. A seleção é estado de sessão de
// análise, não de endereço.

import React from 'react';

/** Campos que podem ser selecionados. São os mesmos que a API aceita como filtro. */
export type CampoSelecao =
  | 'canal' | 'categoria' | 'fornecedor' | 'vendedor' | 'deposito'
  | 'situacao' | 'cliente' | 'produto' | 'transportadora' | 'uf'
  | 'status' | 'classe' | 'quadrante' | 'severidade' | 'modulo';

export interface Selecao {
  campo: CampoSelecao;
  /** Valor que vai para a API — normalmente o id. */
  valor: string;
  /** O que o usuário vê na barra. */
  rotulo: string;
  /** Tela que originou, para a barra dizer de onde veio. */
  origem: string;
}

interface Contexto {
  selecoes: Selecao[];
  alternar: (s: Selecao) => void;
  limpar: () => void;
  limparCampo: (campo: CampoSelecao) => void;
  /** Filtros prontos para virar query string. */
  comoParametros: () => Record<string, string>;
  ativa: (campo: CampoSelecao, valor: string) => boolean;
}

const Ctx = React.createContext<Contexto | null>(null);

export const CHAVE_SELECAO = 'dshow.bling.selecao';

/**
 * ⚠️ A seleção também precisa sobreviver à REMONTAGEM do painel.
 *
 * O app-shell recria o React a cada mudança de hash (medido em 2026-07-30:
 * 1 → 2 → 3 montagens ao navegar). Sem persistir, o §54 — "a seleção atravessa
 * telas" — seria exatamente o que NÃO acontece: o recorte morreria na primeira
 * navegação, que é justamente quando ele deveria valer.
 *
 * sessionStorage: recorte de análise morre com a aba.
 */
function lerSalvas(): Selecao[] {
  try {
    const cru = sessionStorage.getItem(CHAVE_SELECAO);
    if (!cru) return [];
    const p = JSON.parse(cru);
    if (!Array.isArray(p)) return [];
    // Valida a forma: um valor salvo por versão anterior não pode derrubar a tela.
    return p.filter(x => x && typeof x.campo === 'string' && typeof x.valor === 'string'
                      && typeof x.rotulo === 'string');
  } catch {
    return [];
  }
}

function salvar(s: Selecao[]): void {
  try { sessionStorage.setItem(CHAVE_SELECAO, JSON.stringify(s)); } catch { /* não é fatal */ }
}

/**
 * Campos que a API aceita diretamente como filtro de recurso. Os demais são
 * seleção de leitura (recortam no cliente) — declarados aqui para não passarem
 * silenciosamente como parâmetro que o servidor ignora.
 */
const ACEITOS_PELA_API: CampoSelecao[] = [
  'canal', 'categoria', 'fornecedor', 'vendedor', 'deposito', 'situacao',
];

export function ProvedorSelecao({ children }: { children: React.ReactNode }) {
  const [selecoes, setSelecoes] = React.useState<Selecao[]>(lerSalvas);

  const alternar = React.useCallback((s: Selecao) => {
    setSelecoes(atual => {
      const igual = atual.find(x => x.campo === s.campo && x.valor === s.valor);
      // Um valor por campo: selecionar outro canal TROCA o canal, não soma.
      // Somar produziria "canal = ml E canal = amazon", que não devolve nada.
      const novo = igual
        ? atual.filter(x => x !== igual)
        : [...atual.filter(x => x.campo !== s.campo), s];
      salvar(novo);
      return novo;
    });
  }, []);

  const limpar = React.useCallback(() => { setSelecoes([]); salvar([]); }, []);
  const limparCampo = React.useCallback((campo: CampoSelecao) => {
    setSelecoes(a => { const novo = a.filter(x => x.campo !== campo); salvar(novo); return novo; });
  }, []);

  const comoParametros = React.useCallback(() => {
    const p: Record<string, string> = {};
    for (const s of selecoes) {
      if (ACEITOS_PELA_API.includes(s.campo)) p[s.campo] = s.valor;
    }
    return p;
  }, [selecoes]);

  const ativa = React.useCallback(
    (campo: CampoSelecao, valor: string) =>
      selecoes.some(s => s.campo === campo && s.valor === valor),
    [selecoes]);

  const valor = React.useMemo(
    () => ({ selecoes, alternar, limpar, limparCampo, comoParametros, ativa }),
    [selecoes, alternar, limpar, limparCampo, comoParametros, ativa]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSelecao(): Contexto {
  const c = React.useContext(Ctx);
  if (!c) {
    throw new Error('useSelecao precisa estar dentro de <ProvedorSelecao>');
  }
  return c;
}

/** Barra do recorte ativo. Fica fixa abaixo do header enquanto houver seleção. */
export function BarraSelecao({ aoNavegar }: { aoNavegar?: (tela: string) => void }) {
  const { selecoes, limparCampo, limpar } = useSelecao();
  if (selecoes.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '7px 14px', fontSize: 12,
        background: 'var(--bl-verde-suave)',
        borderBottom: '1px solid var(--bl-verde-borda)',
        flex: '0 0 auto', minWidth: 0,
      }}
    >
      <span style={{ color: 'var(--bl-texto-2)', flex: '0 0 auto' }}>
        Recorte ativo em todas as telas:
      </span>

      {selecoes.map(s => (
        <span
          key={`${s.campo}:${s.valor}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '2px 4px 2px 9px', borderRadius: 999,
            background: 'var(--bl-superficie)', border: '1px solid var(--bl-verde-borda)',
            maxWidth: 300,
          }}
        >
          <span style={{ color: 'var(--bl-texto-3)', fontSize: 11 }}>{rotuloCampo(s.campo)}</span>
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.rotulo}
          </strong>
          <button
            type="button"
            onClick={() => limparCampo(s.campo)}
            aria-label={`Remover recorte de ${rotuloCampo(s.campo)}: ${s.rotulo}`}
            title="Remover este recorte"
            style={{
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: 'inherit', fontSize: 11, lineHeight: 1,
              color: 'var(--bl-texto-2)', background: 'transparent',
              border: 'none', borderRadius: 999, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </span>
      ))}

      <div style={{ flex: 1, minWidth: 4 }} />

      {selecoes[0]?.origem && (
        <span style={{ color: 'var(--bl-texto-3)', fontSize: 11 }}>
          de {selecoes[0].origem}
        </span>
      )}

      <button type="button" className="bl-botao" onClick={limpar} style={{ height: 24, fontSize: 11 }}>
        Limpar seleção
      </button>
    </div>
  );
}

function rotuloCampo(c: CampoSelecao): string {
  const m: Record<CampoSelecao, string> = {
    canal: 'Canal', categoria: 'Categoria', fornecedor: 'Fornecedor',
    vendedor: 'Vendedor', deposito: 'Depósito', situacao: 'Situação',
    cliente: 'Cliente', produto: 'Produto', transportadora: 'Transportadora',
    uf: 'UF', status: 'Status', classe: 'Classe', quadrante: 'Quadrante',
    severidade: 'Severidade', modulo: 'Módulo',
  };
  return m[c] ?? c;
}

/* ─────────────────────────── Drill-down (§55) ─────────────────────────── */

/**
 * Destino de drill-down: a tela E o recorte que a explica.
 *
 * Levar só a tela é meia entrega — o usuário clica em "notas com erro: 5",
 * chega na tela de Notas Fiscais com 85 notas e tem que descobrir sozinho quais
 * são as 5. O recorte viaja junto.
 */
export interface Destino {
  tela: string;
  selecao?: Selecao;
  /** Filtros de tela que não são seleção global (ex.: situação específica). */
  filtros?: Record<string, string>;
}

/** KPI da Visão Geral → tela + recorte. */
export const DESTINO_KPI: Record<string, Destino> = {
  faturamento_bruto:   { tela: 'pedidos-venda' },
  faturamento_liquido: { tela: 'vendas' },
  pedidos:             { tela: 'pedidos-venda' },
  pedidos_faturados:   { tela: 'pedidos-venda', filtros: { situacao: 'faturado' } },
  ticket_medio:        { tela: 'vendas' },
  produtos_vendidos:   { tela: 'produtos' },
  clientes:            { tela: 'clientes' },
  contas_receber:      { tela: 'contas-receber', filtros: { situacao: 'aberto' } },
  contas_vencidas:     { tela: 'contas-receber', filtros: { situacao: 'vencido' } },
  contas_pagar:        { tela: 'contas-pagar', filtros: { situacao: 'aberto' } },
  saldo_projetado:     { tela: 'fluxo-caixa' },
  notas_emitidas:      { tela: 'notas-fiscais' },
  notas_erro:          { tela: 'notas-fiscais', filtros: { situacao: 'rejeitada' } },
  estoque_total:       { tela: 'estoque' },
  produtos_sem_estoque:{ tela: 'estoque', filtros: { status: 'zerado' } },
  produtos_criticos:   { tela: 'estoque', filtros: { status: 'critico' } },
  pedidos_compra:      { tela: 'pedidos-compra' },
  aguardando_expedicao:{ tela: 'expedicao' },
  margem_estimada:     { tela: 'rentabilidade' },
  integracoes_falha:   { tela: 'sincronizacao' },
};

/** Ocorrência do painel "Exige atenção" → tela + recorte. */
export const DESTINO_ATENCAO: Record<string, Destino> = {
  notas_rejeitadas:       { tela: 'notas-fiscais', filtros: { situacao: 'rejeitada' } },
  pedidos_parados:        { tela: 'pedidos-venda', filtros: { situacao: 'aprovado' } },
  pedidos_sem_nota:       { tela: 'pedidos-venda', filtros: { situacao: 'faturado' } },
  estoque_negativo:       { tela: 'estoque', filtros: { status: 'negativo' } },
  estoque_divergente:     { tela: 'estoque' },
  produtos_sem_vinculo:   { tela: 'produtos' },
  contas_vencidas:        { tela: 'contas-receber', filtros: { situacao: 'vencido' } },
  compras_atrasadas:      { tela: 'pedidos-compra', filtros: { situacao: 'enviado_fornecedor' } },
  webhooks_falha:         { tela: 'webhooks', filtros: { situacao: 'falhou' } },
  token_expirando:        { tela: 'integracoes' },
  sync_interrompida:      { tela: 'sincronizacao' },
  clientes_duplicados:    { tela: 'clientes' },
  fornecedores_incompletos:{ tela: 'fornecedores' },
  remessas_atraso:        { tela: 'envios', filtros: { situacao: 'atrasado' } },
  valores_divergentes:    { tela: 'conciliacao', filtros: { status: 'divergente' } },
};
