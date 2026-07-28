// services/mock/MockMercadoLivreService.ts — dados simulados (briefing §35).
// @version 1.0.0  @created 2026-07-28
//
// Gerador DETERMINÍSTICO (RNG com seed): mesma sessão/cenário → mesmos dados.
// Relacionamentos consistentes: produto → anúncio → pedido → envio/financeiro/
// ocorrência. Cenários alteram volume, atrasos, reclamações e sincronização.

import type {
  Alerta, Anuncio, AtencaoItem, CenarioId, Conta, Envio, FiltrosGlobais,
  LancamentoFinanceiro, Ocorrencia, Overview, Pedido, PedidoDetalhe,
  PeriodoId, Pergunta, Produto, RentabilidadeItem, ReputacaoSnapshot,
  ResumoFinanceiro, SecaoId, SyncJob,
} from '../../domain/types';
import type { MercadoLivreService } from '../MercadoLivreService';

// ── RNG determinístico ──────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIAS_HISTORICO = 120;
const LATENCIA_MS = 220;

// ── Catálogo (universo Dshow) ───────────────────────────────────────
const CATALOGO = [
  { sku: 'LED-P25-IN', nome: 'Painel de LED P2.5 Indoor (m²)', cat: 'Painéis Indoor', custo: 4200, preco: 6890 },
  { sku: 'LED-P3-IN', nome: 'Painel de LED P3 Indoor (m²)', cat: 'Painéis Indoor', custo: 3400, preco: 5590 },
  { sku: 'LED-P4-OUT', nome: 'Painel de LED P4 Outdoor (m²)', cat: 'Painéis Outdoor', custo: 3900, preco: 6390 },
  { sku: 'LED-P5-OUT', nome: 'Painel de LED P5 Outdoor (m²)', cat: 'Painéis Outdoor', custo: 3100, preco: 5190 },
  { sku: 'TELAO-IGR-3X2', nome: 'Telão de LED para Igreja 3x2m', cat: 'Kits Igreja', custo: 21500, preco: 32900 },
  { sku: 'TELAO-IGR-4X3', nome: 'Telão de LED para Igreja 4x3m', cat: 'Kits Igreja', custo: 39800, preco: 58900 },
  { sku: 'LETR-DG-1M', nome: 'Letreiro Digital 100x20cm', cat: 'Letreiros', custo: 780, preco: 1490 },
  { sku: 'LETR-DG-2M', nome: 'Letreiro Digital 200x40cm', cat: 'Letreiros', custo: 1650, preco: 2890 },
  { sku: 'MOD-P25', nome: 'Módulo LED P2.5 (reposição)', cat: 'Peças e Módulos', custo: 95, preco: 189 },
  { sku: 'MOD-P5', nome: 'Módulo LED P5 (reposição)', cat: 'Peças e Módulos', custo: 62, preco: 129 },
  { sku: 'CTRL-NOVA', nome: 'Controladora NovaStar VX400', cat: 'Controladoras', custo: 2900, preco: 4590 },
  { sku: 'CTRL-TB2', nome: 'Controladora TB2 Wi-Fi', cat: 'Controladoras', custo: 640, preco: 1190 },
  { sku: 'FONTE-5V60A', nome: 'Fonte Chaveada 5V 60A', cat: 'Peças e Módulos', custo: 88, preco: 179 },
  { sku: 'CABO-LAN-10', nome: 'Kit Cabos e Conexões 10m', cat: 'Peças e Módulos', custo: 45, preco: 99 },
];

const COMPRADORES = [
  'Igreja Batista Renovo', 'Marcos Vinícius', 'Loja Center Modas', 'Ana Paula Eventos',
  'Supermercado Bom Preço', 'Carlos Eduardo', 'Paróquia N. Sra. das Graças', 'TecSom Locações',
  'Academia Corpo em Forma', 'Juliana Ramos', 'Auto Peças Silva', 'Comunidade Vida Nova',
  'Restaurante Sabor Real', 'Pedro Henrique', 'Colégio Novo Saber', 'Ótica Visão Clara',
];

const UFS: [string, number][] = [
  ['SP', 32], ['MG', 14], ['RJ', 11], ['PR', 8], ['RS', 7], ['SC', 6], ['BA', 6],
  ['GO', 4], ['PE', 4], ['CE', 3], ['DF', 3], ['ES', 2],
];

const CIDADES: Record<string, string[]> = {
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'Ribeirão Preto'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  PR: ['Curitiba', 'Londrina'], RS: ['Porto Alegre', 'Caxias do Sul'],
  SC: ['Florianópolis', 'Joinville'], BA: ['Salvador', 'Feira de Santana'],
  GO: ['Goiânia'], PE: ['Recife'], CE: ['Fortaleza'], DF: ['Brasília'], ES: ['Vitória'],
};

const ASSUNTOS_PERGUNTA = [
  ['Vocês emitem nota fiscal?', 'fiscal'],
  ['Qual o prazo de entrega para meu CEP?', 'prazo'],
  ['Esse painel serve para ambiente externo?', 'especificação'],
  ['Acompanha a controladora?', 'especificação'],
  ['Tem garantia de quanto tempo?', 'garantia'],
  ['Fazem instalação?', 'instalação'],
  ['O frete está incluso?', 'frete'],
  ['Aceitam parcelamento em 12x?', 'pagamento'],
  ['Qual o consumo de energia?', 'especificação'],
  ['Tem pronta entrega?', 'estoque'],
] as const;

const MOTIVOS_OCORRENCIA = [
  'Produto chegou com avaria', 'Atraso na entrega', 'Produto diferente do anúncio',
  'Arrependimento da compra', 'Defeito após instalação', 'Faltou item no pacote',
];

// ── Configuração por cenário (briefing §35.3) ───────────────────────
interface CfgCenario {
  volume: number;         // multiplicador de pedidos/dia
  tendencia: number;      // inclinação recente (-1..1)
  taxaAtraso: number;
  taxaReclamacao: number;
  taxaCancelamento: number;
  estoqueFator: number;   // 1 normal; <0.3 crítico
  reputacao: 'verde_escuro' | 'verde' | 'amarelo' | 'laranja';
  syncOk: boolean;
  vazio?: boolean;
}

const CENARIOS: Record<CenarioId, CfgCenario> = {
  saudavel:        { volume: 1.0, tendencia: 0.25, taxaAtraso: 0.05, taxaReclamacao: 0.025, taxaCancelamento: 0.03, estoqueFator: 1, reputacao: 'verde_escuro', syncOk: true },
  pico_vendas:     { volume: 2.1, tendencia: 0.8, taxaAtraso: 0.09, taxaReclamacao: 0.03, taxaCancelamento: 0.035, estoqueFator: 0.6, reputacao: 'verde', syncOk: true },
  crise_logistica: { volume: 0.9, tendencia: -0.2, taxaAtraso: 0.28, taxaReclamacao: 0.09, taxaCancelamento: 0.07, estoqueFator: 1, reputacao: 'amarelo', syncOk: true },
  queda_reputacao: { volume: 0.8, tendencia: -0.5, taxaAtraso: 0.18, taxaReclamacao: 0.12, taxaCancelamento: 0.09, estoqueFator: 1, reputacao: 'laranja', syncOk: true },
  estoque_critico: { volume: 1.1, tendencia: 0.3, taxaAtraso: 0.06, taxaReclamacao: 0.03, taxaCancelamento: 0.04, estoqueFator: 0.15, reputacao: 'verde', syncOk: true },
  falha_sync:      { volume: 1.0, tendencia: 0.1, taxaAtraso: 0.06, taxaReclamacao: 0.03, taxaCancelamento: 0.03, estoqueFator: 1, reputacao: 'verde', syncOk: false },
  sem_dados:       { volume: 0, tendencia: 0, taxaAtraso: 0, taxaReclamacao: 0, taxaCancelamento: 0, estoqueFator: 1, reputacao: 'verde', syncOk: true, vazio: true },
};

// ── Utilidades ──────────────────────────────────────────────────────
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const dia = (d: Date) => d.toISOString().slice(0, 10);

function escolherUf(rnd: () => number): string {
  const total = UFS.reduce((s, [, p]) => s + p, 0);
  let alvo = rnd() * total;
  for (const [uf, p] of UFS) { alvo -= p; if (alvo <= 0) return uf; }
  return 'SP';
}

export class MockMercadoLivreService implements MercadoLivreService {
  readonly origem = 'mock' as const;

  private cfg: CfgCenario;
  private contas: Conta[];
  private pedidos: Pedido[] = [];
  private anuncios: Anuncio[] = [];
  private perguntas: Pergunta[] = [];
  private ocorrencias: Ocorrencia[] = [];
  private hoje: Date;

  constructor(cenario: CenarioId) {
    this.cfg = CENARIOS[cenario];
    this.hoje = new Date();
    const rnd = mulberry32(20260728 + cenario.length * 7919);

    this.contas = [
      { id: 'c1', nome: 'Dshow Oficial', nickname: 'DSHOW_OFICIAL', site: 'MLB', status: this.cfg.reputacao === 'laranja' ? 'atencao' : 'ativa', reputacao: this.cfg.reputacao, ultimaSincronizacao: iso(new Date(this.hoje.getTime() - (this.cfg.syncOk ? 8 : 260) * 60000)) },
      { id: 'c2', nome: 'Dshow Store', nickname: 'DSHOWSTORE', site: 'MLB', status: 'ativa', reputacao: this.cfg.reputacao === 'verde_escuro' ? 'verde' : this.cfg.reputacao, ultimaSincronizacao: iso(new Date(this.hoje.getTime() - (this.cfg.syncOk ? 12 : 300) * 60000)) },
    ];
    if (this.cfg.vazio) return;

    this.gerarPedidos(rnd);
    this.gerarAnuncios(rnd);
    this.gerarPerguntas(rnd);
    this.gerarOcorrencias(rnd);
  }

  // ── Geração base ──────────────────────────────────────────────────

  private gerarPedidos(rnd: () => number): void {
    let seq = 41200;
    for (let d = DIAS_HISTORICO - 1; d >= 0; d--) {
      const data = new Date(this.hoje);
      data.setDate(data.getDate() - d);
      const diaSemana = data.getDay();
      const fatorSemana = diaSemana === 0 ? 0.45 : diaSemana === 6 ? 0.7 : 1;
      // Tendência: multiplica os últimos 30 dias progressivamente.
      const recencia = d < 30 ? 1 + this.cfg.tendencia * ((30 - d) / 30) : 1;
      const base = 7 * this.cfg.volume * fatorSemana * recencia;
      const quantos = Math.max(0, Math.round(base + (rnd() - 0.5) * 4));

      for (let i = 0; i < quantos; i++) {
        const p = CATALOGO[Math.floor(rnd() * rnd() * CATALOGO.length)]; // vieza p/ itens baratos
        const qtd = p.preco < 500 ? 1 + Math.floor(rnd() * 3) : 1;
        const bruto = p.preco * qtd;
        const tarifa = bruto * (0.11 + rnd() * 0.06);
        const frete = p.preco < 300 ? 0 : 40 + rnd() * 180;
        const uf = escolherUf(rnd);
        const cancelado = rnd() < this.cfg.taxaCancelamento;
        const devolvido = !cancelado && rnd() < 0.015;
        const atrasado = !cancelado && rnd() < this.cfg.taxaAtraso;
        const idade = d;
        let status: Pedido['status'];
        if (cancelado) status = 'cancelado';
        else if (devolvido) status = 'devolvido';
        else if (idade > 12) status = 'entregue';
        else if (idade > 6) status = rnd() < 0.85 ? 'entregue' : 'enviado';
        else if (idade > 3) status = rnd() < 0.6 ? 'enviado' : 'separacao';
        else if (idade > 1) status = rnd() < 0.5 ? 'separacao' : 'faturado';
        else status = rnd() < 0.5 ? 'pago' : 'novo';

        const hora = 8 + Math.floor(rnd() * 13);
        data.setHours(hora, Math.floor(rnd() * 60), 0, 0);
        const prazo = new Date(data); prazo.setDate(prazo.getDate() + 2);

        this.pedidos.push({
          id: `MLB-${seq++}`,
          data: iso(new Date(data)),
          comprador: COMPRADORES[Math.floor(rnd() * COMPRADORES.length)],
          uf,
          cidade: CIDADES[uf][Math.floor(rnd() * CIDADES[uf].length)],
          produto: p.nome,
          sku: p.sku,
          anuncioId: `AN-${p.sku}`,
          quantidade: qtd,
          valorBruto: bruto,
          tarifa,
          frete,
          valorLiquido: bruto - tarifa - (rnd() < 0.5 ? frete * 0.5 : 0),
          status,
          envio: p.preco < 300 ? (rnd() < 0.6 ? 'full' : 'correios') : (rnd() < 0.4 ? 'flex' : 'coleta'),
          prazoEnvio: ['novo', 'pago', 'faturado', 'separacao'].includes(status) ? iso(prazo) : null,
          atrasado: atrasado && ['separacao', 'enviado', 'novo', 'pago', 'faturado'].includes(status),
          notaFiscal: ['novo', 'pago'].includes(status) ? null : `NF-${seq * 3}`,
          temReclamacao: rnd() < this.cfg.taxaReclamacao,
          contaId: rnd() < 0.7 ? 'c1' : 'c2',
        });
      }
    }
  }

  private gerarAnuncios(rnd: () => number): void {
    for (const p of CATALOGO) {
      const doProduto = this.pedidos.filter((x) => x.sku === p.sku && x.status !== 'cancelado');
      const vendas = doProduto.reduce((s, x) => s + x.quantidade, 0);
      const visitas = Math.round(vendas * (18 + rnd() * 30)) + Math.round(rnd() * 400);
      const semEstoque = rnd() > this.cfg.estoqueFator;
      const pausado = !semEstoque && rnd() < 0.08;
      const margem = ((p.preco - p.custo) / p.preco) * 100 - 14;
      const fatores: Anuncio['fatoresQualidade'] = [
        { fator: 'Título com termo principal', impacto: 12 },
        { fator: `${3 + Math.floor(rnd() * 6)} imagens`, impacto: rnd() < 0.5 ? 8 : -6 },
        { fator: 'Atributos preenchidos', impacto: rnd() < 0.7 ? 10 : -8 },
        { fator: 'Tempo de resposta a perguntas', impacto: rnd() < 0.6 ? 6 : -10 },
        { fator: 'Preço vs concorrência', impacto: rnd() < 0.5 ? 7 : -5 },
      ];
      const qualidade = Math.max(28, Math.min(96, 62 + fatores.reduce((s, f) => s + f.impacto, 0) / 2));
      this.anuncios.push({
        id: `AN-${p.sku}`,
        titulo: p.nome,
        sku: p.sku,
        categoria: p.cat,
        tipo: p.preco > 2000 ? 'premium' : 'classico',
        preco: p.preco,
        precoPromocional: rnd() < 0.25 ? Math.round(p.preco * 0.92) : null,
        estoque: semEstoque ? 0 : Math.round((4 + rnd() * 40) * this.cfg.estoqueFator),
        visitas,
        vendas,
        conversaoPct: visitas > 0 ? (vendas / visitas) * 100 : 0,
        faturamento: doProduto.reduce((s, x) => s + x.valorBruto, 0),
        tarifaPct: 11 + rnd() * 6,
        margemPct: margem,
        status: semEstoque ? 'pausado' : pausado ? 'em_revisao' : 'ativo',
        qualidade: Math.round(qualidade),
        fatoresQualidade: fatores,
        contaId: rnd() < 0.7 ? 'c1' : 'c2',
      });
    }
  }

  private gerarPerguntas(rnd: () => number): void {
    const quantas = Math.round(46 * Math.max(0.3, this.cfg.volume));
    for (let i = 0; i < quantas; i++) {
      const p = CATALOGO[Math.floor(rnd() * CATALOGO.length)];
      const horas = Math.floor(rnd() * 96);
      const dataP = new Date(this.hoje.getTime() - horas * 3600000);
      const [texto, assunto] = ASSUNTOS_PERGUNTA[Math.floor(rnd() * ASSUNTOS_PERGUNTA.length)];
      const pendente = horas < 30 && rnd() < 0.45;
      this.perguntas.push({
        id: `Q-${9000 + i}`,
        data: iso(dataP),
        anuncioId: `AN-${p.sku}`,
        produto: p.nome,
        comprador: COMPRADORES[Math.floor(rnd() * COMPRADORES.length)],
        texto,
        status: pendente ? 'pendente' : 'respondida',
        resposta: pendente ? null : 'Olá! Sim, atendemos — qualquer dúvida estamos à disposição.',
        horasAguardando: pendente ? horas : 0,
        assunto,
        contaId: rnd() < 0.7 ? 'c1' : 'c2',
      });
    }
  }

  private gerarOcorrencias(rnd: () => number): void {
    const alvo = this.pedidos.filter((p) => p.temReclamacao || p.status === 'cancelado' || p.status === 'devolvido');
    let i = 0;
    for (const p of alvo) {
      const tipo = p.status === 'cancelado' ? 'cancelamento'
        : p.status === 'devolvido' ? 'devolucao'
        : rnd() < 0.2 ? 'mediacao' : 'reclamacao';
      const diasAbertos = Math.floor(rnd() * 12);
      const abertura = new Date(p.data); abertura.setDate(abertura.getDate() + 1);
      const prazo = new Date(abertura); prazo.setDate(prazo.getDate() + 5);
      this.ocorrencias.push({
        id: `OC-${3000 + i++}`,
        tipo,
        pedidoId: p.id,
        cliente: p.comprador,
        produto: p.produto,
        motivo: MOTIVOS_OCORRENCIA[Math.floor(rnd() * MOTIVOS_OCORRENCIA.length)],
        status: diasAbertos > 7 ? 'resolvida' : diasAbertos > 3 ? 'em_andamento' : 'aberta',
        abertura: iso(abertura),
        prazo: diasAbertos <= 7 ? iso(prazo) : null,
        valor: p.valorBruto,
        contaId: p.contaId,
      });
    }
  }

  // ── Períodos ──────────────────────────────────────────────────────

  private intervalo(periodo: PeriodoId): [Date, Date] {
    const fim = new Date(this.hoje); fim.setHours(23, 59, 59, 999);
    const ini = new Date(this.hoje); ini.setHours(0, 0, 0, 0);
    switch (periodo) {
      case 'hoje': break;
      case 'ontem': ini.setDate(ini.getDate() - 1); fim.setDate(fim.getDate() - 1); break;
      case '7d': ini.setDate(ini.getDate() - 6); break;
      case '15d': ini.setDate(ini.getDate() - 14); break;
      case '30d': ini.setDate(ini.getDate() - 29); break;
      case 'mes_atual': ini.setDate(1); break;
      case 'mes_anterior': ini.setMonth(ini.getMonth() - 1, 1); fim.setDate(0); break;
      case 'trimestre': ini.setMonth(Math.floor(ini.getMonth() / 3) * 3, 1); break;
      case 'ano': ini.setMonth(0, 1); break;
      case '12m': ini.setFullYear(ini.getFullYear() - 1); break;
    }
    return [ini, fim];
  }

  private filtrar(f: FiltrosGlobais): Pedido[] {
    const [ini, fim] = this.intervalo(f.periodo);
    return this.pedidos.filter((p) => {
      const d = new Date(p.data);
      return d >= ini && d <= fim && (f.contaId === 'todas' || p.contaId === f.contaId);
    });
  }

  private filtrarComparacao(f: FiltrosGlobais): Pedido[] | null {
    if (f.comparacao === 'nenhuma') return null;
    const [ini, fim] = this.intervalo(f.periodo);
    const dur = fim.getTime() - ini.getTime();
    const ini2 = new Date(ini); const fim2 = new Date(fim);
    if (f.comparacao === 'anterior') { ini2.setTime(ini.getTime() - dur - 1); fim2.setTime(ini.getTime() - 1); }
    if (f.comparacao === 'mes_anterior') { ini2.setMonth(ini2.getMonth() - 1); fim2.setMonth(fim2.getMonth() - 1); }
    if (f.comparacao === 'ano_anterior') { ini2.setFullYear(ini2.getFullYear() - 1); fim2.setFullYear(fim2.getFullYear() - 1); }
    return this.pedidos.filter((p) => {
      const d = new Date(p.data);
      return d >= ini2 && d <= fim2 && (f.contaId === 'todas' || p.contaId === f.contaId);
    });
  }

  // ── API do contrato ───────────────────────────────────────────────

  async getContas(): Promise<Conta[]> {
    await dormir(80);
    return this.contas;
  }

  async getOverview(f: FiltrosGlobais): Promise<Overview> {
    await dormir(LATENCIA_MS);
    const atual = this.filtrar(f);
    const antes = this.filtrarComparacao(f);
    const validos = atual.filter((p) => p.status !== 'cancelado');
    const soma = (lista: Pedido[], fn: (p: Pedido) => number) => lista.reduce((s, p) => s + fn(p), 0);

    const brutas = soma(validos, (p) => p.valorBruto);
    const liquidas = soma(validos, (p) => p.valorLiquido);
    const itens = soma(validos, (p) => p.quantidade);
    const perguntasPend = this.perguntas.filter((q) => q.status === 'pendente' && (f.contaId === 'todas' || q.contaId === f.contaId)).length;
    const reclAbertas = this.ocorrencias.filter((o) => o.status !== 'resolvida' && (o.tipo === 'reclamacao' || o.tipo === 'mediacao')).length;
    const cancel = atual.filter((p) => p.status === 'cancelado').length;
    const devol = atual.filter((p) => p.status === 'devolvido').length;
    const estoqueCritico = this.anuncios.filter((a) => a.estoque === 0 || a.estoque < 3).length;

    const variacao = (agora: number, fn: (p: Pedido) => number): [number | null, number | null] => {
      if (!antes) return [null, null];
      const antesValidos = antes.filter((p) => p.status !== 'cancelado');
      const anterior = soma(antesValidos, fn);
      if (anterior === 0) return [null, agora];
      return [((agora - anterior) / anterior) * 100, agora - anterior];
    };

    // Sparkline: últimos 14 dias de faturamento.
    const spark: number[] = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(this.hoje); dt.setDate(dt.getDate() - d);
      const chave = dia(dt);
      spark.push(soma(this.pedidos.filter((p) => dia(new Date(p.data)) === chave && p.status !== 'cancelado'), (p) => p.valorBruto));
    }

    const [vPctB, vAbsB] = variacao(brutas, (p) => p.valorBruto);
    const [vPctP, vAbsP] = variacao(validos.length, () => 1);

    const kpi = (id: string, rotulo: string, valor: number, formato: Kpi_['formato'], vPct: number | null, vAbs: number | null, tendencia: Kpi_['tendencia'], drill?: SecaoId, dica?: string): Kpi_ => ({
      id, rotulo, valor, formato, variacaoPct: vPct, variacaoAbs: vAbs, tendencia, sparkline: id === 'brutas' ? spark : [], drill, dica,
    });
    type Kpi_ = Overview['kpis'][number];

    const tendenciaDe = (v: number | null, invertido = false): Kpi_['tendencia'] =>
      v === null || Math.abs(v) < 1 ? 'neutra' : (v > 0) !== invertido ? 'positiva' : 'negativa';

    const kpis: Kpi_[] = [
      kpi('brutas', 'Vendas brutas', brutas, 'moeda', vPctB, vAbsB, tendenciaDe(vPctB), 'vendas'),
      kpi('liquidas', 'Vendas líquidas', liquidas, 'moeda', vPctB, null, tendenciaDe(vPctB), 'financeiro'),
      kpi('pedidos', 'Pedidos', validos.length, 'numero', vPctP, vAbsP, tendenciaDe(vPctP), 'pedidos'),
      kpi('itens', 'Itens vendidos', itens, 'numero', null, null, 'neutra', 'produtos'),
      kpi('ticket', 'Ticket médio', validos.length ? brutas / validos.length : 0, 'moeda', null, null, 'neutra', 'vendas'),
      kpi('perguntas', 'Perguntas pendentes', perguntasPend, 'numero', null, null, perguntasPend > 4 ? 'negativa' : 'neutra', 'perguntas', 'Perguntas sem resposta reduzem conversão e reputação.'),
      kpi('reclamacoes', 'Reclamações abertas', reclAbertas, 'numero', null, null, reclAbertas > 2 ? 'negativa' : 'neutra', 'reclamacoes'),
      kpi('cancel', 'Cancelamentos', cancel, 'numero', null, null, cancel > 3 ? 'negativa' : 'neutra', 'devolucoes'),
      kpi('devol', 'Devoluções', devol, 'numero', null, null, devol > 2 ? 'negativa' : 'neutra', 'devolucoes'),
      kpi('estoque', 'Estoque crítico', estoqueCritico, 'numero', null, null, estoqueCritico > 2 ? 'negativa' : 'neutra', 'estoque'),
      kpi('tarifas', 'Custo de tarifas', soma(validos, (p) => p.tarifa), 'moeda', null, null, 'neutra', 'financeiro'),
      kpi('margem', 'Margem estimada', brutas > 0 ? ((liquidas - soma(validos, (p) => this.custoDe(p))) / brutas) * 100 : 0, 'percentual', null, null, 'neutra', 'rentabilidade'),
    ];

    // Série temporal do período.
    const [ini, fim] = this.intervalo(f.periodo);
    const serie: Overview['serie'] = [];
    for (let dt = new Date(ini); dt <= fim; dt.setDate(dt.getDate() + 1)) {
      const chave = dia(dt);
      const doDia = validos.filter((p) => dia(new Date(p.data)) === chave);
      serie.push({
        dia: chave,
        faturamento: Math.round(soma(doDia, (p) => p.valorBruto)),
        liquido: Math.round(soma(doDia, (p) => p.valorLiquido)),
        pedidos: doDia.length,
        ticket: doDia.length ? Math.round(soma(doDia, (p) => p.valorBruto) / doDia.length) : 0,
      });
    }

    const visitas = this.anuncios.reduce((s, a) => s + a.visitas, 0);
    const funil: Overview['funil'] = [
      { rotulo: 'Visitas', valor: Math.round(visitas * (atual.length / Math.max(1, this.pedidos.length))) },
      { rotulo: 'Perguntas', valor: Math.round(this.perguntas.length * (atual.length / Math.max(1, this.pedidos.length))) + atual.length },
      { rotulo: 'Pedidos', valor: atual.length },
      { rotulo: 'Vendas confirmadas', valor: validos.length },
      { rotulo: 'Entregues', valor: atual.filter((p) => p.status === 'entregue').length },
    ];

    const porGrupo = (chave: (p: Pedido) => string): Overview['porCategoria'] => {
      const mapa = new Map<string, number>();
      for (const p of validos) mapa.set(chave(p), (mapa.get(chave(p)) ?? 0) + p.valorBruto);
      return [...mapa.entries()].map(([rotulo, valor]) => ({ rotulo, valor: Math.round(valor) }))
        .sort((a, b) => b.valor - a.valor);
    };

    const atencao: AtencaoItem[] = [];
    const pendEnvio = atual.filter((p) => ['novo', 'pago', 'faturado', 'separacao'].includes(p.status)).length;
    const atrasados = this.pedidos.filter((p) => p.atrasado).length;
    if (atrasados > 0) atencao.push({ id: 'a1', titulo: `${atrasados} envio${atrasados > 1 ? 's' : ''} atrasado${atrasados > 1 ? 's' : ''}`, detalhe: 'Risco direto de reclamação e reputação.', prioridade: 1, secao: 'envios', acao: 'Priorizar expedição' });
    if (reclAbertas > 0) atencao.push({ id: 'a2', titulo: `${reclAbertas} reclamação(ões) aberta(s)`, detalhe: 'Responder antes do prazo de mediação.', prioridade: 1, secao: 'reclamacoes', acao: 'Tratar ocorrências' });
    if (perguntasPend > 0) atencao.push({ id: 'a3', titulo: `${perguntasPend} pergunta(s) sem resposta`, detalhe: 'Tempo de resposta afeta conversão.', prioridade: 2, secao: 'perguntas', acao: 'Responder agora' });
    if (pendEnvio > 0) atencao.push({ id: 'a4', titulo: `${pendEnvio} pedido(s) aguardando ação`, detalhe: 'Faturar, separar ou despachar.', prioridade: 2, secao: 'pedidos', acao: 'Abrir fila' });
    const pausados = this.anuncios.filter((a) => a.status !== 'ativo').length;
    if (pausados > 0) atencao.push({ id: 'a5', titulo: `${pausados} anúncio(s) pausado(s)/em revisão`, detalhe: 'Perda de exposição e vendas.', prioridade: 3, secao: 'anuncios', acao: 'Revisar anúncios' });
    if (estoqueCritico > 0) atencao.push({ id: 'a6', titulo: `${estoqueCritico} produto(s) com estoque crítico`, detalhe: 'Risco de ruptura e pausa automática.', prioridade: this.cfg.estoqueFator < 0.3 ? 1 : 3, secao: 'estoque', acao: 'Repor estoque' });
    if (!this.cfg.syncOk) atencao.push({ id: 'a0', titulo: 'Falha de sincronização', detalhe: 'Dados podem estar desatualizados há mais de 4 horas.', prioridade: 1, secao: 'sincronizacao', acao: 'Ver diagnóstico' });

    return {
      kpis, serie, funil,
      porCategoria: porGrupo((p) => CATALOGO.find((c) => c.sku === p.sku)?.cat ?? 'Outros'),
      porEstado: porGrupo((p) => p.uf),
      atencao: atencao.sort((a, b) => a.prioridade - b.prioridade),
    };
  }

  private custoDe(p: Pedido): number {
    return (CATALOGO.find((c) => c.sku === p.sku)?.custo ?? 0) * p.quantidade;
  }

  async getPedidos(f: FiltrosGlobais): Promise<Pedido[]> {
    await dormir(LATENCIA_MS);
    return this.filtrar(f).sort((a, b) => b.data.localeCompare(a.data));
  }

  async getPedido(id: string): Promise<PedidoDetalhe | null> {
    await dormir(120);
    const p = this.pedidos.find((x) => x.id === id);
    if (!p) return null;
    const compra = new Date(p.data);
    const passo = (dias: number) => { const d = new Date(compra); d.setDate(d.getDate() + dias); return iso(d); };
    const timeline = [
      { data: p.data, titulo: 'Pedido realizado' },
      { data: passo(0), titulo: 'Pagamento aprovado', detalhe: 'Cartão de crédito' },
    ];
    if (!['novo', 'pago'].includes(p.status)) timeline.push({ data: passo(1), titulo: 'Nota fiscal emitida', detalhe: p.notaFiscal ?? '' });
    if (['enviado', 'entregue', 'devolvido'].includes(p.status)) timeline.push({ data: passo(2), titulo: 'Pedido despachado', detalhe: `Modalidade ${p.envio}` });
    if (['entregue', 'devolvido'].includes(p.status)) timeline.push({ data: passo(5), titulo: 'Entregue ao comprador' });
    if (p.status === 'devolvido') timeline.push({ data: passo(9), titulo: 'Devolução concluída' });
    if (p.status === 'cancelado') timeline.push({ data: passo(1), titulo: 'Pedido cancelado' });
    return {
      ...p,
      timeline,
      pagamento: { metodo: 'Cartão de crédito', parcelas: p.valorBruto > 2000 ? 10 : 3, status: p.status === 'cancelado' ? 'estornado' : 'aprovado' },
      endereco: `${p.cidade} — ${p.uf}`,
      mensagens: p.temReclamacao ? 3 : 1,
      observacoes: p.atrasado ? ['⚠ Prazo de envio estourado — priorizar expedição.'] : [],
    };
  }

  async getAnuncios(f: FiltrosGlobais): Promise<Anuncio[]> {
    await dormir(LATENCIA_MS);
    return this.anuncios.filter((a) => f.contaId === 'todas' || a.contaId === f.contaId);
  }

  async getProdutos(f: FiltrosGlobais): Promise<Produto[]> {
    await dormir(LATENCIA_MS);
    void f;
    const mediaMargem = 30;
    return CATALOGO.map((c) => {
      const anuncio = this.anuncios.find((a) => a.sku === c.sku);
      const vendidos = this.pedidos.filter((p) => p.sku === c.sku && p.status !== 'cancelado');
      const unidades = vendidos.reduce((s, p) => s + p.quantidade, 0);
      const estoque = anuncio?.estoque ?? 0;
      const vendaDiaria = unidades / DIAS_HISTORICO;
      const cobertura = vendaDiaria > 0 ? estoque / vendaDiaria : 999;
      const margemPct = ((c.preco - c.custo) / c.preco) * 100 - 14;
      return {
        sku: c.sku,
        nome: c.nome,
        categoria: c.cat,
        anunciosVinculados: 1,
        estoqueTotal: estoque + Math.round(estoque * 0.1),
        estoqueDisponivel: estoque,
        estoqueReservado: Math.round(estoque * 0.1),
        custo: c.custo,
        precoMedio: c.preco,
        faturamento: vendidos.reduce((s, p) => s + p.valorBruto, 0),
        unidadesVendidas: unidades,
        margemPct,
        coberturaDias: Math.round(cobertura),
        giro: vendaDiaria > 0.15 ? 'alto' : 'baixo',
        margem: margemPct >= mediaMargem ? 'alta' : 'baixa',
        status: estoque === 0 ? 'zerado' : cobertura < 7 ? 'critico' : cobertura > 180 ? (unidades < 3 ? 'parado' : 'excesso') : 'ok',
      };
    });
  }

  async getPerguntas(f: FiltrosGlobais): Promise<Pergunta[]> {
    await dormir(LATENCIA_MS);
    return this.perguntas
      .filter((q) => f.contaId === 'todas' || q.contaId === f.contaId)
      .sort((a, b) => (a.status === b.status ? b.data.localeCompare(a.data) : a.status === 'pendente' ? -1 : 1));
  }

  async getOcorrencias(f: FiltrosGlobais): Promise<Ocorrencia[]> {
    await dormir(LATENCIA_MS);
    return this.ocorrencias
      .filter((o) => f.contaId === 'todas' || o.contaId === f.contaId)
      .sort((a, b) => (a.status === 'resolvida' ? 1 : 0) - (b.status === 'resolvida' ? 1 : 0) || b.abertura.localeCompare(a.abertura));
  }

  async getEnvios(f: FiltrosGlobais): Promise<Envio[]> {
    await dormir(LATENCIA_MS);
    return this.filtrar(f)
      .filter((p) => p.status !== 'cancelado' && p.status !== 'novo' && p.status !== 'pago')
      .map((p, i) => {
        const compra = new Date(p.data);
        const postado = new Date(compra); postado.setDate(postado.getDate() + 2);
        const previsao = new Date(compra); previsao.setDate(previsao.getDate() + 7);
        const entregue = p.status === 'entregue' ? new Date(compra.getTime() + (p.atrasado ? 10 : 5) * 86400000) : null;
        return {
          id: `SHP-${7000 + i}`,
          pedidoId: p.id,
          modalidade: p.envio,
          status: p.status === 'entregue' ? 'entregue' : p.status === 'devolvido' ? 'devolvido' : p.atrasado ? 'atrasado' : p.status === 'enviado' ? 'em_transito' : 'preparando',
          uf: p.uf,
          cidade: p.cidade,
          postado: ['enviado', 'entregue', 'devolvido'].includes(p.status) ? iso(postado) : null,
          previsao: iso(previsao),
          entregue: entregue ? iso(entregue) : null,
          diasTransito: entregue ? Math.round((entregue.getTime() - postado.getTime()) / 86400000) : null,
          rastreio: `BR${String(731200 + i)}ML`,
          contaId: p.contaId,
        };
      });
  }

  async getResumoFinanceiro(f: FiltrosGlobais): Promise<ResumoFinanceiro> {
    await dormir(LATENCIA_MS);
    const atual = this.filtrar(f);
    const validos = atual.filter((p) => p.status !== 'cancelado');
    const soma = (lista: Pedido[], fn: (p: Pedido) => number) => lista.reduce((s, p) => s + fn(p), 0);
    const brutas = soma(validos, (p) => p.valorBruto);
    const tarifas = soma(validos, (p) => p.tarifa);
    const fretes = soma(validos, (p) => p.frete * 0.5);
    const impostos = brutas * 0.08;
    const cancelamentos = soma(atual.filter((p) => p.status === 'cancelado'), (p) => p.valorBruto);
    const devolucoes = soma(atual.filter((p) => p.status === 'devolvido'), (p) => p.valorBruto);
    const custo = soma(validos, (p) => this.custoDe(p));
    const liquido = brutas - tarifas - fretes - impostos - devolucoes;
    const recebiveis = validos.filter((p) => ['novo', 'pago', 'faturado', 'separacao', 'enviado'].includes(p.status));
    return {
      vendasBrutas: brutas,
      descontos: brutas * 0.015,
      tarifas, fretes,
      impostosEstimados: impostos,
      cancelamentos, devolucoes,
      custoProdutos: custo,
      valorLiquido: liquido,
      lucroBruto: liquido - custo,
      margemPct: brutas > 0 ? ((liquido - custo) / brutas) * 100 : 0,
      aReceber: soma(recebiveis, (p) => p.valorLiquido),
      recebido: liquido - soma(recebiveis, (p) => p.valorLiquido),
    };
  }

  async getLancamentos(f: FiltrosGlobais): Promise<LancamentoFinanceiro[]> {
    await dormir(LATENCIA_MS);
    return this.filtrar(f)
      .filter((p) => p.status !== 'cancelado')
      .map((p) => {
        const venda = new Date(p.data);
        const prevista = new Date(venda); prevista.setDate(prevista.getDate() + 14);
        const recebido = prevista < this.hoje;
        const status: LancamentoFinanceiro['status'] = recebido
          ? (p.temReclamacao ? 'divergente' : 'recebido') : 'pendente';
        return {
          pedidoId: p.id,
          dataVenda: p.data,
          dataPrevista: iso(prevista),
          dataRecebimento: recebido ? iso(prevista) : null,
          valorBruto: p.valorBruto,
          tarifa: p.tarifa,
          frete: p.frete * 0.5,
          valorLiquido: p.valorLiquido,
          status,
          contaId: p.contaId,
        };
      })
      .sort((a, b) => b.dataVenda.localeCompare(a.dataVenda));
  }

  async getRentabilidade(f: FiltrosGlobais): Promise<RentabilidadeItem[]> {
    await dormir(LATENCIA_MS);
    const validos = this.filtrar(f).filter((p) => p.status !== 'cancelado');
    return CATALOGO.map((c) => {
      const doProduto = validos.filter((p) => p.sku === c.sku);
      const receita = doProduto.reduce((s, p) => s + p.valorBruto, 0);
      const tarifa = doProduto.reduce((s, p) => s + p.tarifa, 0);
      const frete = doProduto.reduce((s, p) => s + p.frete * 0.5, 0);
      const unidades = doProduto.reduce((s, p) => s + p.quantidade, 0);
      const custo = c.custo * unidades;
      const lucro = receita - tarifa - frete - custo - receita * 0.08;
      return {
        sku: c.sku, nome: c.nome, categoria: c.cat,
        receita, custo, tarifa, frete, lucro,
        margemPct: receita > 0 ? (lucro / receita) * 100 : 0,
        unidades,
      };
    }).filter((r) => r.unidades > 0).sort((a, b) => b.lucro - a.lucro);
  }

  async getReputacao(f: FiltrosGlobais): Promise<ReputacaoSnapshot> {
    await dormir(LATENCIA_MS);
    void f;
    const serie: ReputacaoSnapshot['serie'] = [];
    const scoreBase = { verde_escuro: 92, verde: 84, amarelo: 68, laranja: 52, vermelho: 35 }[this.cfg.reputacao];
    const rnd = mulberry32(777);
    for (let d = 59; d >= 0; d--) {
      const dt = new Date(this.hoje); dt.setDate(dt.getDate() - d);
      const progresso = (59 - d) / 59;
      const drift = this.cfg.tendencia < 0 ? -14 * progresso : 4 * progresso;
      serie.push({
        dia: dia(dt),
        score: Math.round(Math.max(20, Math.min(98, scoreBase - drift + (rnd() - 0.5) * 4))),
        reclamacoes: Math.round(this.cfg.taxaReclamacao * 100 + (rnd() - 0.5) * 2),
        atrasos: Math.round(this.cfg.taxaAtraso * 100 + (rnd() - 0.5) * 3),
      });
    }
    const fatores: string[] = [];
    if (this.cfg.taxaReclamacao > 0.05) fatores.push('Taxa de reclamações acima do limite da faixa verde');
    if (this.cfg.taxaAtraso > 0.1) fatores.push('Atrasos de envio recorrentes na última quinzena');
    if (this.cfg.estoqueFator < 0.3) fatores.push('Rupturas de estoque geram cancelamentos');
    if (fatores.length === 0) fatores.push('Nenhum fator de risco relevante no período');
    return {
      nivel: this.cfg.reputacao,
      vendasConcluidas: this.pedidos.filter((p) => p.status === 'entregue').length,
      reclamacoesPct: this.cfg.taxaReclamacao * 100,
      cancelamentosPct: this.cfg.taxaCancelamento * 100,
      atrasosPct: this.cfg.taxaAtraso * 100,
      serie,
      fatoresRisco: fatores,
    };
  }

  async getAlertas(f: FiltrosGlobais): Promise<Alerta[]> {
    await dormir(150);
    const overview = await this.getOverview(f);
    return overview.atencao.map((a, i) => ({
      id: `AL-${i}`,
      tipo: a.secao,
      mensagem: `${a.titulo} — ${a.detalhe}`,
      prioridade: a.prioridade,
      data: iso(this.hoje),
      secao: a.secao,
      tratado: false,
    }));
  }

  async getSyncJobs(): Promise<SyncJob[]> {
    await dormir(100);
    const ok = this.cfg.syncOk;
    const min = (m: number) => iso(new Date(this.hoje.getTime() - m * 60000));
    const em = (m: number) => iso(new Date(this.hoje.getTime() + m * 60000));
    const job = (recurso: string, minutos: number, processados: number, novos: number, erro = false): SyncJob => ({
      recurso,
      status: erro ? 'erro' : 'ok',
      ultima: min(erro ? 260 : minutos),
      proxima: em(erro ? 5 : 30 - minutos),
      processados, novos,
      erros: erro ? 12 : 0,
    });
    return [
      job('Pedidos', 8, 412, 9, !ok),
      job('Anúncios', 12, CATALOGO.length, 0, !ok),
      job('Perguntas', 6, this.perguntas.length, 3, false),
      job('Reclamações', 15, this.ocorrencias.length, 1, false),
      job('Envios', 9, 380, 7, !ok),
      job('Financeiro', 22, 395, 12, false),
    ];
  }
}
