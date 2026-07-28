// services/mock/MockMetaAdsService.ts — dados simulados (briefing §40).
// @version 1.0.0  @created 2026-07-28
//
// Gerador determinístico com hierarquia coerente: campanha → conjunto →
// anúncio → criativo; leads e eventos de pixel derivados das campanhas.
// Cenários mudam volume, custos, fadiga, pixel e reprovações.

import type {
  Alerta, Anuncio, AtencaoItem, Campanha, CenarioId, Conjunto, Conta,
  Criativo, EventoPixel, FiltrosGlobais, Kpi, Lead, Metricas, Objetivo,
  Overview, PeriodoId, PixelInfo, Posicionamento, Publico,
  ResumoOrcamento, StatusEntrega, SyncJob,
} from '../../domain/types';
import type { MetaAdsService } from '../MetaAdsService';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const dia = (d: Date) => d.toISOString().slice(0, 10);
const DIAS = 120;
const LAT = 220;

interface CfgCenario {
  volume: number;          // multiplicador de investimento/resultados
  custoFator: number;      // >1 = CPL/CPA piores
  fadiga: number;          // 0..1 proporção de criativos fatigados
  pixelOk: boolean;
  reprovadas: number;      // nº de campanhas com anúncio reprovado
  tendencia: number;       // -1..1 nos últimos 30 dias
  vazio?: boolean;
}

const CENARIOS: Record<CenarioId, CfgCenario> = {
  saudavel:           { volume: 1, custoFator: 1, fadiga: 0.12, pixelOk: true, reprovadas: 0, tendencia: 0.25 },
  queda_performance:  { volume: 0.85, custoFator: 1.6, fadiga: 0.4, pixelOk: true, reprovadas: 1, tendencia: -0.55 },
  falha_pixel:        { volume: 1, custoFator: 1.15, fadiga: 0.15, pixelOk: false, reprovadas: 0, tendencia: 0 },
  orcamento_critico:  { volume: 1.4, custoFator: 1.1, fadiga: 0.2, pixelOk: true, reprovadas: 0, tendencia: 0.5 },
  fadiga_criativo:    { volume: 0.95, custoFator: 1.3, fadiga: 0.7, pixelOk: true, reprovadas: 0, tendencia: -0.3 },
  campanha_reprovada: { volume: 0.9, custoFator: 1.05, fadiga: 0.15, pixelOk: true, reprovadas: 2, tendencia: 0.1 },
  sem_dados:          { volume: 0, custoFator: 1, fadiga: 0, pixelOk: true, reprovadas: 0, tendencia: 0, vazio: true },
};

const CAMPANHAS_BASE: { nome: string; objetivo: Objetivo; orcamento: number }[] = [
  { nome: '[Leads] Painel LED Igrejas — BR', objetivo: 'leads', orcamento: 180 },
  { nome: '[Leads] Painel LED Varejo — Sudeste', objetivo: 'leads', orcamento: 150 },
  { nome: '[Conv] Letreiro Digital — Site', objetivo: 'conversao', orcamento: 120 },
  { nome: '[Leads] Telão para Eventos', objetivo: 'leads', orcamento: 90 },
  { nome: '[Tráfego] Blog Guia do LED', objetivo: 'trafego', orcamento: 40 },
  { nome: '[Rmkt] Visitantes 30d — Catálogo', objetivo: 'conversao', orcamento: 70 },
  { nome: '[Engaj] Reels Institucional', objetivo: 'engajamento', orcamento: 35 },
  { nome: '[Leads] Fachadas e Outdoor — Capitais', objetivo: 'leads', orcamento: 110 },
];

const PUBLICOS_NOMES = [
  ['Interesse: igrejas e ministérios', 'salvo'],
  ['Lookalike 1% — Leads 180d', 'semelhante'],
  ['Visitantes do site 30d', 'remarketing'],
  ['Engajou Instagram 90d', 'personalizado'],
  ['Interesse: sinalização e varejo', 'salvo'],
  ['Lookalike 3% — Compradores', 'semelhante'],
] as const;

const POSICIONAMENTOS: { nome: string; plataforma: Posicionamento['plataforma']; peso: number }[] = [
  { nome: 'Feed do Instagram', plataforma: 'instagram', peso: 30 },
  { nome: 'Reels', plataforma: 'instagram', peso: 24 },
  { nome: 'Stories', plataforma: 'instagram', peso: 16 },
  { nome: 'Feed do Facebook', plataforma: 'facebook', peso: 18 },
  { nome: 'Messenger', plataforma: 'messenger', peso: 4 },
  { nome: 'Audience Network', plataforma: 'audience_network', peso: 8 },
];

const NOMES_LEAD = [
  'Pr. Marcos Oliveira', 'Juliana Ramos', 'Carlos Eduardo', 'Igreja Vida Plena',
  'Fernanda Costa', 'Roberto Almeida', 'Loja Estilo Casa', 'Ana Beatriz',
  'Sup. Bom Preço', 'Diego Martins', 'Colégio Saber', 'Patrícia Lima',
];

const PRODUTOS = ['Painel LED Indoor', 'Painel LED Outdoor', 'Telão para Igreja', 'Letreiro Digital', 'Painel para Eventos'];
const REGIOES: [string, number][] = [['SP', 30], ['MG', 14], ['RJ', 12], ['PR', 8], ['RS', 7], ['BA', 6], ['SC', 6], ['GO', 5], ['PE', 4], ['CE', 4], ['DF', 4]];

function mZero(): Metricas {
  return { investimento: 0, alcance: 0, impressoes: 0, frequencia: 0, cliques: 0, ctr: 0, cpc: 0, cpm: 0, leads: 0, cpl: 0, conversoes: 0, cpa: 0, receita: 0, roas: 0 };
}

/** Deriva métricas coerentes a partir de investimento + perfil do objetivo. */
function derivar(inv: number, objetivo: Objetivo, custoFator: number, rnd: () => number): Metricas {
  const cpm = (12 + rnd() * 14) * custoFator;
  const impressoes = Math.round((inv / cpm) * 1000);
  const alcance = Math.round(impressoes / (1.6 + rnd() * 1.4));
  const ctr = (objetivo === 'trafego' ? 1.6 : objetivo === 'engajamento' ? 2.2 : 1.1) + rnd() * 0.9;
  const cliques = Math.round(impressoes * (ctr / 100));
  const txLead = objetivo === 'leads' ? 0.09 + rnd() * 0.05 : objetivo === 'conversao' ? 0.03 : 0.008;
  const leads = Math.round(cliques * txLead / custoFator);
  const txConv = objetivo === 'conversao' ? 0.5 : 0.22;
  const conversoes = Math.max(0, Math.round(leads * txConv * (0.8 + rnd() * 0.4)));
  const receita = conversoes * (900 + rnd() * 2600);
  return {
    investimento: inv,
    alcance, impressoes,
    frequencia: alcance > 0 ? impressoes / alcance : 0,
    cliques, ctr,
    cpc: cliques > 0 ? inv / cliques : 0,
    cpm,
    leads,
    cpl: leads > 0 ? inv / leads : 0,
    conversoes,
    cpa: conversoes > 0 ? inv / conversoes : 0,
    receita,
    roas: inv > 0 ? receita / inv : 0,
  };
}

function somar(a: Metricas, b: Metricas): Metricas {
  const s: Metricas = { ...mZero() };
  s.investimento = a.investimento + b.investimento;
  s.alcance = a.alcance + b.alcance;
  s.impressoes = a.impressoes + b.impressoes;
  s.cliques = a.cliques + b.cliques;
  s.leads = a.leads + b.leads;
  s.conversoes = a.conversoes + b.conversoes;
  s.receita = a.receita + b.receita;
  s.frequencia = s.alcance > 0 ? s.impressoes / s.alcance : 0;
  s.ctr = s.impressoes > 0 ? (s.cliques / s.impressoes) * 100 : 0;
  s.cpc = s.cliques > 0 ? s.investimento / s.cliques : 0;
  s.cpm = s.impressoes > 0 ? (s.investimento / s.impressoes) * 1000 : 0;
  s.cpl = s.leads > 0 ? s.investimento / s.leads : 0;
  s.cpa = s.conversoes > 0 ? s.investimento / s.conversoes : 0;
  s.roas = s.investimento > 0 ? s.receita / s.investimento : 0;
  return s;
}

interface DiaCampanha { dia: string; m: Metricas; }

export class MockMetaAdsService implements MetaAdsService {
  readonly origem = 'mock' as const;

  private cfg: CfgCenario;
  private hoje = new Date();
  private contas: Conta[];
  private campanhas: Campanha[] = [];
  private conjuntos: Conjunto[] = [];
  private anuncios: Anuncio[] = [];
  private criativos: Criativo[] = [];
  private publicos: Publico[] = [];
  private leads: Lead[] = [];
  private diario = new Map<string, DiaCampanha[]>(); // campanhaId -> série

  constructor(cenario: CenarioId) {
    this.cfg = CENARIOS[cenario];
    const rnd = mulberry32(20260728 + cenario.length * 104729);
    this.contas = [
      { id: 'c1', nome: 'Dshow — Principal', idExterno: 'act_1029384756', moeda: 'BRL', fuso: 'America/Sao_Paulo', status: 'ativa', pagina: 'Dshow Painéis de LED', instagram: '@dshow.led', ultimaSincronizacao: iso(new Date(this.hoje.getTime() - 9 * 60000)) },
      { id: 'c2', nome: 'Dshow — Performance', idExterno: 'act_5647382910', moeda: 'BRL', fuso: 'America/Sao_Paulo', status: 'ativa', pagina: 'Painel de LED Brasil', instagram: '@paineldeledbr', ultimaSincronizacao: iso(new Date(this.hoje.getTime() - 14 * 60000)) },
    ];
    if (this.cfg.vazio) return;
    this.gerar(rnd);
  }

  private gerar(rnd: () => number): void {
    let cid = 100; let sid = 300; let aid = 700; let crid = 900;
    CAMPANHAS_BASE.forEach((base, idx) => {
      const contaId = idx % 3 === 2 ? 'c2' : 'c1';
      const reprovada = idx < this.cfg.reprovadas;
      const status: StatusEntrega = reprovada ? 'reprovada'
        : idx === 6 ? 'pausada'
        : idx === 3 && this.cfg.custoFator > 1.4 ? 'aprendizado_limitado'
        : 'ativa';
      const campanhaId = `CMP-${cid++}`;

      // Série diária da campanha (com fim de semana mais fraco + tendência).
      const serie: DiaCampanha[] = [];
      const total = mZero();
      for (let d = DIAS - 1; d >= 0; d--) {
        const dt = new Date(this.hoje); dt.setDate(dt.getDate() - d);
        if (status === 'pausada' && d < 20) { serie.push({ dia: dia(dt), m: mZero() }); continue; }
        if (reprovada && d < 10) { serie.push({ dia: dia(dt), m: mZero() }); continue; }
        const fds = dt.getDay() === 0 ? 0.7 : dt.getDay() === 6 ? 0.85 : 1;
        const recencia = d < 30 ? 1 + this.cfg.tendencia * ((30 - d) / 30) : 1;
        const inv = Math.max(0, base.orcamento * this.cfg.volume * fds * recencia * (0.85 + rnd() * 0.3));
        const m = derivar(inv, base.objetivo, this.cfg.custoFator * (d < 30 ? 1 + (this.cfg.custoFator - 1) * 0.4 : 1), rnd);
        serie.push({ dia: dia(dt), m });
        Object.assign(total, somar(total, m));
      }
      this.diario.set(campanhaId, serie);

      const inicio = new Date(this.hoje); inicio.setDate(inicio.getDate() - DIAS);
      this.campanhas.push({
        ...total,
        id: campanhaId,
        nome: base.nome,
        objetivo: base.objetivo,
        status,
        orcamentoDiario: base.orcamento,
        orcamentoUtilizadoPct: this.cfg.volume > 1.2 ? 92 + rnd() * 8 : 55 + rnd() * 35,
        inicio: iso(inicio),
        fim: null,
        contaId,
        diagnostico: reprovada ? 'Anúncio reprovado: política de publicidade — revisar texto/imagem.'
          : status === 'aprendizado_limitado' ? 'Aprendizado limitado: poucas conversões por semana no conjunto.'
          : null,
      });

      // Conjuntos (2-3) repartem a campanha.
      const nConj = 2 + (idx % 2);
      for (let c = 0; c < nConj; c++) {
        const conjId = `SET-${sid++}`;
        const fatia = 1 / nConj;
        const pub = PUBLICOS_NOMES[(idx + c) % PUBLICOS_NOMES.length];
        const mConj = this.escala(total, fatia * (0.8 + rnd() * 0.4));
        this.conjuntos.push({
          ...mConj,
          id: conjId,
          nome: `${pub[0]}`,
          campanhaId, campanha: base.nome,
          status: status === 'ativa' && c === nConj - 1 && this.cfg.custoFator > 1.4 ? 'aprendizado_limitado' : status,
          publico: pub[0],
          posicionamento: c === 0 ? 'automatico' : 'manual',
          estrategiaLance: base.objetivo === 'leads' ? 'Menor custo' : 'Maior valor',
          contaId,
        });

        // Anúncios (2) por conjunto, cada um com criativo.
        for (let a = 0; a < 2; a++) {
          const anId = `AD-${aid++}`;
          const crId = `CR-${crid++}`;
          const formato: Criativo['formato'] = (idx + c + a) % 3 === 0 ? 'video' : (idx + a) % 3 === 1 ? 'imagem' : 'carrossel';
          const mAd = this.escala(mConj, 0.5 * (0.7 + rnd() * 0.6));
          const fadigado = rnd() < this.cfg.fadiga;
          const diasAtivo = 12 + Math.floor(rnd() * 80);
          this.anuncios.push({
            ...mAd,
            id: anId,
            nome: `${formato === 'video' ? '🎬' : formato === 'imagem' ? '🖼' : '🧩'} ${base.nome.split('—')[0].trim()} · v${a + 1}`,
            conjuntoId: conjId, conjunto: pub[0],
            campanhaId, campanha: base.nome,
            criativoId: crId,
            formato,
            status: reprovada && a === 0 ? 'reprovada' : status === 'reprovada' ? 'pausada' : status,
            qualidade: mAd.ctr > 1.6 ? 'acima_media' : mAd.ctr > 1 ? 'media' : 'abaixo_media',
            contaId,
          });

          const fatores = [
            { fator: `CTR ${mAd.ctr.toFixed(1)}% vs média da conta`, impacto: mAd.ctr > 1.4 ? 12 : -8 },
            { fator: `Frequência ${mAd.frequencia.toFixed(1)}`, impacto: mAd.frequencia > 2.6 ? -12 : 6 },
            { fator: `${diasAtivo} dias ativo`, impacto: diasAtivo > 60 ? -10 : 4 },
            { fator: 'Custo por resultado vs meta', impacto: this.cfg.custoFator > 1.3 ? -9 : 8 },
            { fator: fadigado ? 'Tendência de queda nos últimos 7 dias' : 'Resultados estáveis', impacto: fadigado ? -14 : 7 },
          ];
          this.criativos.push({
            ...mAd,
            id: crId,
            nome: `${base.nome.split('—')[0].trim()} — criativo v${a + 1}`,
            formato,
            campanha: base.nome,
            diasAtivo,
            fadiga: fadigado ? 'alta' : mAd.frequencia > 2.4 ? 'media' : 'baixa',
            score: Math.max(22, Math.min(95, Math.round(60 + fatores.reduce((s, f) => s + f.impacto, 0) / 2))),
            fatoresScore: fatores,
            retencao: formato === 'video' ? {
              p3s: Math.round(45 + rnd() * 25), p25: Math.round(30 + rnd() * 18),
              p50: Math.round(16 + rnd() * 12), p75: Math.round(9 + rnd() * 7),
              p95: Math.round(4 + rnd() * 4), p100: Math.round(2 + rnd() * 3),
              tempoMedio: 6 + rnd() * 9,
            } : null,
            contaId,
          });
        }
      }
    });

    // Públicos agregados.
    PUBLICOS_NOMES.forEach(([nome, tipo], i) => {
      const rel = this.conjuntos.filter((c) => c.publico === nome);
      const m = rel.reduce((acc, c) => somar(acc, c), mZero());
      const sobre = PUBLICOS_NOMES.filter((_, j) => j !== i).slice(0, 2)
        .map(([outro]) => ({ com: outro, pct: Math.round(8 + rnd() * (tipo === 'semelhante' ? 34 : 20)) }));
      this.publicos.push({
        ...m,
        id: `PUB-${i}`,
        nome,
        tipo: tipo as Publico['tipo'],
        tamanho: Math.round(180000 + rnd() * 2400000),
        saturacaoPct: Math.round(m.frequencia * 18 + rnd() * 15),
        sobreposicao: sobre,
        contaId: 'c1',
      });
    });

    // Leads individuais (derivados das campanhas de leads).
    let lid = 5000;
    for (const cmp of this.campanhas.filter((c) => c.leads > 0)) {
      const quantos = Math.min(cmp.leads, 60);
      const conjs = this.conjuntos.filter((c) => c.campanhaId === cmp.id);
      for (let i = 0; i < quantos; i++) {
        const horas = Math.floor(rnd() * 24 * 30);
        const dt = new Date(this.hoje.getTime() - horas * 3600000);
        const conj = conjs[Math.floor(rnd() * conjs.length)];
        const anuncio = this.anuncios.find((a) => a.conjuntoId === conj?.id);
        const convertido = rnd() < 0.16;
        const status: Lead['status'] = convertido ? 'convertido'
          : rnd() < 0.2 ? 'qualificado' : rnd() < 0.25 ? 'em_contato'
          : rnd() < 0.15 ? 'desqualificado' : 'novo';
        const nome = NOMES_LEAD[Math.floor(rnd() * NOMES_LEAD.length)];
        this.leads.push({
          id: `LD-${lid++}`,
          data: iso(dt),
          nome,
          telefone: `(1${Math.floor(rnd() * 9)}) 9****-${String(1000 + Math.floor(rnd() * 8999))}`,
          email: `${nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}***@gmail.com`,
          formulario: cmp.objetivo === 'leads' ? 'Formulário — Orçamento rápido' : 'Site — Página de contato',
          campanha: cmp.nome,
          conjunto: conj?.nome ?? '—',
          anuncio: anuncio?.nome ?? '—',
          produtoInteresse: PRODUTOS[Math.floor(rnd() * PRODUTOS.length)],
          status,
          crmVinculado: rnd() < 0.72,
          receita: convertido ? 1800 + rnd() * 24000 : null,
          contaId: cmp.contaId,
        });
      }
    }
    this.leads.sort((a, b) => b.data.localeCompare(a.data));
  }

  private escala(m: Metricas, fator: number): Metricas {
    const r = { ...m };
    r.investimento *= fator; r.alcance = Math.round(r.alcance * fator);
    r.impressoes = Math.round(r.impressoes * fator); r.cliques = Math.round(r.cliques * fator);
    r.leads = Math.round(r.leads * fator); r.conversoes = Math.round(r.conversoes * fator);
    r.receita *= fator;
    r.cpl = r.leads > 0 ? r.investimento / r.leads : 0;
    r.cpa = r.conversoes > 0 ? r.investimento / r.conversoes : 0;
    r.cpc = r.cliques > 0 ? r.investimento / r.cliques : 0;
    r.roas = r.investimento > 0 ? r.receita / r.investimento : 0;
    return r;
  }

  // ── Períodos ──────────────────────────────────────────────────────

  private intervalo(p: PeriodoId): [Date, Date] {
    const fim = new Date(this.hoje); fim.setHours(23, 59, 59, 999);
    const ini = new Date(this.hoje); ini.setHours(0, 0, 0, 0);
    switch (p) {
      case 'hoje': break;
      case 'ontem': ini.setDate(ini.getDate() - 1); fim.setDate(fim.getDate() - 1); break;
      case '7d': ini.setDate(ini.getDate() - 6); break;
      case '14d': ini.setDate(ini.getDate() - 13); break;
      case '30d': ini.setDate(ini.getDate() - 29); break;
      case 'mes_atual': ini.setDate(1); break;
      case 'mes_anterior': ini.setMonth(ini.getMonth() - 1, 1); fim.setDate(0); break;
      case 'trimestre': ini.setMonth(Math.floor(ini.getMonth() / 3) * 3, 1); break;
      case 'ano': ini.setMonth(0, 1); break;
      case '12m': ini.setFullYear(ini.getFullYear() - 1); break;
    }
    return [ini, fim];
  }

  /** Métricas de uma campanha dentro do período dos filtros. */
  private noPeriodo(campanhaId: string, f: FiltrosGlobais): Metricas {
    const serie = this.diario.get(campanhaId) ?? [];
    const [ini, fim] = this.intervalo(f.periodo);
    const i0 = dia(ini); const i1 = dia(fim);
    return serie.filter((s) => s.dia >= i0 && s.dia <= i1)
      .reduce((acc, s) => somar(acc, s.m), mZero());
  }

  private campanhasFiltradas(f: FiltrosGlobais): Campanha[] {
    return this.campanhas
      .filter((c) => (f.contaId === 'todas' || c.contaId === f.contaId)
        && (f.objetivo === 'todos' || c.objetivo === f.objetivo))
      .map((c) => ({ ...c, ...this.noPeriodo(c.id, f), id: c.id } as Campanha));
  }

  // ── Contrato ──────────────────────────────────────────────────────

  async getContas(): Promise<Conta[]> { await dormir(80); return this.contas; }

  async getOverview(f: FiltrosGlobais): Promise<Overview> {
    await dormir(LAT);
    const cmps = this.campanhasFiltradas(f);
    const total = cmps.reduce((acc, c) => somar(acc, c), mZero());

    // Comparação (período equivalente anterior).
    let anterior: Metricas | null = null;
    if (f.comparacao !== 'nenhuma') {
      const [ini, fim] = this.intervalo(f.periodo);
      const dur = fim.getTime() - ini.getTime();
      const ini2 = new Date(ini.getTime() - dur - 1); const fim2 = new Date(ini.getTime() - 1);
      if (f.comparacao === 'mes_anterior') { ini2.setTime(ini.getTime()); ini2.setMonth(ini2.getMonth() - 1); fim2.setTime(fim.getTime()); fim2.setMonth(fim2.getMonth() - 1); }
      if (f.comparacao === 'ano_anterior') { ini2.setTime(ini.getTime()); ini2.setFullYear(ini2.getFullYear() - 1); fim2.setTime(fim.getTime()); fim2.setFullYear(fim2.getFullYear() - 1); }
      const i0 = dia(ini2); const i1 = dia(fim2);
      anterior = mZero();
      for (const c of this.campanhas) {
        if (f.contaId !== 'todas' && c.contaId !== f.contaId) continue;
        if (f.objetivo !== 'todos' && c.objetivo !== f.objetivo) continue;
        const serie = this.diario.get(c.id) ?? [];
        anterior = somar(anterior, serie.filter((s) => s.dia >= i0 && s.dia <= i1)
          .reduce((acc, s) => somar(acc, s.m), mZero()));
      }
    }

    const varPct = (atual: number, ant: number | undefined): number | null =>
      anterior && ant && ant > 0 ? ((atual - ant) / ant) * 100 : null;

    // Sparkline (investimento 14d).
    const spark: number[] = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(this.hoje); dt.setDate(dt.getDate() - d);
      const chave = dia(dt);
      let v = 0;
      for (const c of cmps) {
        const s = this.diario.get(c.id)?.find((x) => x.dia === chave);
        v += s?.m.investimento ?? 0;
      }
      spark.push(Math.round(v));
    }

    const t = (v: number | null, invertido = false): Kpi['tendencia'] =>
      v === null || Math.abs(v) < 1 ? 'neutra' : (v > 0) !== invertido ? 'positiva' : 'negativa';

    const kpis: Kpi[] = [
      { id: 'inv', rotulo: 'Investimento', valor: total.investimento, formato: 'moeda', variacaoPct: varPct(total.investimento, anterior?.investimento), tendencia: 'neutra', sparkline: spark, drill: 'orcamentos' },
      { id: 'alcance', rotulo: 'Alcance', valor: total.alcance, formato: 'numero', variacaoPct: varPct(total.alcance, anterior?.alcance), tendencia: t(varPct(total.alcance, anterior?.alcance)), sparkline: [], drill: 'performance' },
      { id: 'imp', rotulo: 'Impressões', valor: total.impressoes, formato: 'numero', variacaoPct: null, tendencia: 'neutra', sparkline: [] },
      { id: 'freq', rotulo: 'Frequência', valor: total.frequencia, formato: 'decimal', variacaoPct: null, tendencia: total.frequencia > 2.6 ? 'negativa' : 'neutra', sparkline: [], dica: 'Frequência alta acelera a fadiga dos criativos.', drill: 'criativos' },
      { id: 'cliques', rotulo: 'Cliques', valor: total.cliques, formato: 'numero', variacaoPct: varPct(total.cliques, anterior?.cliques), tendencia: t(varPct(total.cliques, anterior?.cliques)), sparkline: [] },
      { id: 'ctr', rotulo: 'CTR', valor: total.ctr, formato: 'percentual', variacaoPct: varPct(total.ctr, anterior?.ctr), tendencia: t(varPct(total.ctr, anterior?.ctr)), sparkline: [] },
      { id: 'cpc', rotulo: 'CPC', valor: total.cpc, formato: 'moeda', variacaoPct: varPct(total.cpc, anterior?.cpc), tendencia: t(varPct(total.cpc, anterior?.cpc), true), sparkline: [] },
      { id: 'cpm', rotulo: 'CPM', valor: total.cpm, formato: 'moeda', variacaoPct: null, tendencia: 'neutra', sparkline: [] },
      { id: 'leads', rotulo: 'Leads', valor: total.leads, formato: 'numero', variacaoPct: varPct(total.leads, anterior?.leads), tendencia: t(varPct(total.leads, anterior?.leads)), sparkline: [], drill: 'leads' },
      { id: 'cpl', rotulo: 'CPL', valor: total.cpl, formato: 'moeda', variacaoPct: varPct(total.cpl, anterior?.cpl), tendencia: t(varPct(total.cpl, anterior?.cpl), true), sparkline: [], drill: 'leads' },
      { id: 'conv', rotulo: 'Conversões', valor: total.conversoes, formato: 'numero', variacaoPct: varPct(total.conversoes, anterior?.conversoes), tendencia: t(varPct(total.conversoes, anterior?.conversoes)), sparkline: [], drill: 'funil' },
      { id: 'cpa', rotulo: 'CPA', valor: total.cpa, formato: 'moeda', variacaoPct: varPct(total.cpa, anterior?.cpa), tendencia: t(varPct(total.cpa, anterior?.cpa), true), sparkline: [] },
      { id: 'receita', rotulo: 'Receita atribuída', valor: total.receita, formato: 'moeda', variacaoPct: varPct(total.receita, anterior?.receita), tendencia: t(varPct(total.receita, anterior?.receita)), sparkline: [], dica: 'Atribuição da plataforma — ver avisos na seção Atribuição.', drill: 'atribuicao' },
      { id: 'roas', rotulo: 'ROAS', valor: total.roas, formato: 'decimal', variacaoPct: varPct(total.roas, anterior?.roas), tendencia: t(varPct(total.roas, anterior?.roas)), sparkline: [], drill: 'performance' },
    ];

    // Série do período.
    const [ini, fim] = this.intervalo(f.periodo);
    const serie: Overview['serie'] = [];
    for (let dt = new Date(ini); dt <= fim; dt.setDate(dt.getDate() + 1)) {
      const chave = dia(dt);
      let m = mZero();
      for (const c of cmps) {
        const s = this.diario.get(c.id)?.find((x) => x.dia === chave);
        if (s) m = somar(m, s.m);
      }
      serie.push({
        dia: chave,
        investimento: Math.round(m.investimento),
        leads: m.leads,
        cpl: Math.round(m.cpl * 100) / 100,
        conversoes: m.conversoes,
        roas: Math.round(m.roas * 100) / 100,
        ctr: Math.round(m.ctr * 100) / 100,
      });
    }

    const funil: Overview['funil'] = [
      { rotulo: 'Impressões', valor: total.impressoes },
      { rotulo: 'Cliques', valor: total.cliques },
      { rotulo: 'Leads', valor: total.leads, custo: total.cpl },
      { rotulo: 'Oportunidades', valor: Math.round(total.leads * 0.38) },
      { rotulo: 'Vendas', valor: total.conversoes, custo: total.cpa },
    ];

    const rnd = mulberry32(42);
    const porRegiao = REGIOES.map(([uf, peso]) => ({
      rotulo: uf, valor: Math.round(total.investimento * (peso / 100) * (0.85 + rnd() * 0.3)),
    })).sort((a, b) => b.valor - a.valor);

    const porObjetivo = (['leads', 'conversao', 'trafego', 'engajamento'] as Objetivo[])
      .map((o) => ({ rotulo: o === 'conversao' ? 'Conversão' : o === 'trafego' ? 'Tráfego' : o === 'engajamento' ? 'Engajamento' : 'Leads', valor: Math.round(cmps.filter((c) => c.objetivo === o).reduce((s, c) => s + c.investimento, 0)) }))
      .filter((d) => d.valor > 0);

    const porPosicionamento = POSICIONAMENTOS.map((p) => ({
      rotulo: p.nome, valor: Math.round(total.investimento * (p.peso / 100)),
    }));

    // Exige atenção.
    const atencao: AtencaoItem[] = [];
    const reprov = this.anuncios.filter((a) => a.status === 'reprovada').length;
    if (reprov > 0) atencao.push({ id: 'a1', titulo: `${reprov} anúncio(s) reprovado(s)`, detalhe: 'Sem entrega até revisão — corrigir e reenviar.', prioridade: 1, secao: 'qualidade', acao: 'Ver diagnóstico' });
    const fatigados = this.criativos.filter((c) => c.fadiga === 'alta').length;
    if (fatigados > 0) atencao.push({ id: 'a2', titulo: `${fatigados} criativo(s) com fadiga alta`, detalhe: 'CTR em queda e frequência alta — trocar criativo.', prioridade: this.cfg.fadiga > 0.5 ? 1 : 2, secao: 'criativos', acao: 'Abrir criativos' });
    if (!this.cfg.pixelOk) atencao.push({ id: 'a3', titulo: 'Pixel sem eventos de Purchase há 48h', detalhe: 'Otimização e atribuição comprometidas.', prioridade: 1, secao: 'pixel', acao: 'Diagnosticar pixel' });
    const limitado = this.conjuntos.filter((c) => c.status === 'aprendizado_limitado').length;
    if (limitado > 0) atencao.push({ id: 'a4', titulo: `${limitado} conjunto(s) em aprendizado limitado`, detalhe: 'Poucas conversões/semana — consolidar conjuntos ou ampliar público.', prioridade: 2, secao: 'conjuntos', acao: 'Revisar conjuntos' });
    if (this.cfg.volume > 1.2) atencao.push({ id: 'a5', titulo: 'Orçamento no limite em 3 campanhas', detalhe: 'Ritmo de gasto >90% — avaliar aumento ou realocação.', prioridade: 2, secao: 'orcamentos', acao: 'Ver orçamentos' });
    if (this.cfg.custoFator > 1.3) atencao.push({ id: 'a6', titulo: 'CPL acima da meta no período', detalhe: `CPL atual ${total.cpl > 0 ? 'R$ ' + total.cpl.toFixed(2) : '—'} — meta R$ 18,00.`, prioridade: 2, secao: 'performance', acao: 'Analisar performance' });

    return { kpis, serie, funil, porObjetivo, porPosicionamento, porRegiao, atencao: atencao.sort((a, b) => a.prioridade - b.prioridade) };
  }

  async getCampanhas(f: FiltrosGlobais): Promise<Campanha[]> {
    await dormir(LAT);
    return this.campanhasFiltradas(f).sort((a, b) => b.investimento - a.investimento);
  }

  async getConjuntos(f: FiltrosGlobais, campanhaId?: string): Promise<Conjunto[]> {
    await dormir(LAT);
    return this.conjuntos.filter((c) =>
      (f.contaId === 'todas' || c.contaId === f.contaId)
      && (!campanhaId || c.campanhaId === campanhaId));
  }

  async getAnuncios(f: FiltrosGlobais, conjuntoId?: string): Promise<Anuncio[]> {
    await dormir(LAT);
    return this.anuncios.filter((a) =>
      (f.contaId === 'todas' || a.contaId === f.contaId)
      && (!conjuntoId || a.conjuntoId === conjuntoId));
  }

  async getCriativos(f: FiltrosGlobais): Promise<Criativo[]> {
    await dormir(LAT);
    return this.criativos
      .filter((c) => f.contaId === 'todas' || c.contaId === f.contaId)
      .sort((a, b) => b.investimento - a.investimento);
  }

  async getPublicos(f: FiltrosGlobais): Promise<Publico[]> {
    await dormir(LAT);
    void f;
    return this.publicos;
  }

  async getPosicionamentos(f: FiltrosGlobais): Promise<Posicionamento[]> {
    await dormir(LAT);
    const cmps = this.campanhasFiltradas(f);
    const total = cmps.reduce((acc, c) => somar(acc, c), mZero());
    const rnd = mulberry32(7);
    return POSICIONAMENTOS.map((p, i) => {
      const m = this.escala(total, (p.peso / 100) * (0.85 + rnd() * 0.3));
      return { ...m, id: `POS-${i}`, nome: p.nome, plataforma: p.plataforma };
    });
  }

  async getLeads(f: FiltrosGlobais): Promise<Lead[]> {
    await dormir(LAT);
    const [ini, fim] = this.intervalo(f.periodo);
    return this.leads.filter((l) => {
      const d = new Date(l.data);
      return d >= ini && d <= fim && (f.contaId === 'todas' || l.contaId === f.contaId);
    });
  }

  async getPixel(f: FiltrosGlobais): Promise<PixelInfo> {
    await dormir(LAT);
    void f;
    const rnd = mulberry32(99);
    const evento = (nome: string, base: number, saude: EventoPixel['saude'] = 'ok', diag: string | null = null): EventoPixel => {
      const serie: EventoPixel['serie'] = [];
      for (let d = 13; d >= 0; d--) {
        const dt = new Date(this.hoje); dt.setDate(dt.getDate() - d);
        const morto = saude !== 'ok' && d < 2;
        serie.push({ dia: dia(dt), n: morto ? 0 : Math.round(base * (0.75 + rnd() * 0.5)) });
      }
      return {
        nome, recebidos: serie.reduce((s, x) => s + x.n, 0), serie,
        ultimaAtividade: iso(new Date(this.hoje.getTime() - (saude === 'ok' ? 8 : 2900) * 60000)),
        saude, diagnostico: diag,
      };
    };
    const purchaseSaude: EventoPixel['saude'] = this.cfg.pixelOk ? 'ok' : 'sem_atividade';
    return {
      id: 'PX-274900112',
      nome: 'Pixel Dshow — site principal',
      status: 'ativo',
      correspondenciaPct: this.cfg.pixelOk ? 71 : 44,
      dedupPct: 96,
      eventos: [
        evento('PageView', 1450),
        evento('ViewContent', 610),
        evento('Lead', 38),
        evento('Contact', 22),
        evento('AddToCart', 12),
        evento('InitiateCheckout', 8),
        evento('Purchase', this.cfg.pixelOk ? 5 : 0, purchaseSaude,
          this.cfg.pixelOk ? null : 'Sem eventos há 48h — verificar disparo no checkout e a API de conversões.'),
      ],
    };
  }

  async getResumoOrcamento(f: FiltrosGlobais): Promise<ResumoOrcamento> {
    await dormir(LAT);
    const cmps = this.campanhasFiltradas(f);
    const diario = cmps.filter((c) => c.status === 'ativa').reduce((s, c) => s + c.orcamentoDiario, 0);
    const investido = cmps.reduce((s, c) => s + c.investimento, 0);
    const [ini, fim] = this.intervalo(f.periodo);
    const dias = Math.max(1, Math.round((fim.getTime() - ini.getTime()) / 86400000) + 1);
    const ritmo = investido / dias;
    return {
      orcamentoDiarioTotal: diario,
      investidoPeriodo: investido,
      ritmoDiario: ritmo,
      projecaoMes: ritmo * 30,
      campanhasAcimaRitmo: cmps.filter((c) => c.orcamentoUtilizadoPct > 90).length,
      campanhasAbaixoRitmo: cmps.filter((c) => c.orcamentoUtilizadoPct < 60).length,
    };
  }

  async getAlertas(f: FiltrosGlobais): Promise<Alerta[]> {
    await dormir(140);
    const ov = await this.getOverview(f);
    return ov.atencao.map((a, i) => ({
      id: `AL-${i}`, tipo: a.secao, mensagem: a.titulo, prioridade: a.prioridade,
      data: iso(this.hoje), secao: a.secao, recomendacao: a.detalhe,
    }));
  }

  async getSyncJobs(): Promise<SyncJob[]> {
    await dormir(100);
    const min = (m: number) => iso(new Date(this.hoje.getTime() - m * 60000));
    const em = (m: number) => iso(new Date(this.hoje.getTime() + m * 60000));
    const job = (recurso: string, minutos: number, proc: number, novos: number, erro = false): SyncJob => ({
      recurso, status: erro ? 'erro' : 'ok', ultima: min(erro ? 300 : minutos), proxima: em(30 - minutos),
      processados: proc, novos, erros: erro ? 7 : 0,
    });
    return [
      job('Campanhas', 9, this.campanhas.length, 0),
      job('Conjuntos', 9, this.conjuntos.length, 0),
      job('Anúncios', 11, this.anuncios.length, 1),
      job('Insights (métricas)', 12, DIAS * this.campanhas.length, 96),
      job('Leads', 6, this.leads.length, 4),
      job('Pixel/Eventos', 8, 2100, 240, !this.cfg.pixelOk),
    ];
  }
}
