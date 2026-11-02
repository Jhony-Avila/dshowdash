<?php
// Bling / lib/BlingProviderBase.php - calculo UNICO, herdado por mock e real
// @module  bling.provider.base
// @version 1.0.0
// @created 2026-07-30
//
// POR QUE ESTA CLASSE EXISTE
// No modulo Google Calendar, mock e banco calculavam os mesmos indicadores por
// caminhos diferentes. A divergencia so apareceu na homologacao, quando ja havia
// tela construida em cima dos dois. A correcao foi centralizar o calculo numa
// base herdada pelos dois provedores.
//
// O Bling nasce assim, e a regra e simples:
//   - a SUBCLASSE devolve LINHAS  (colecoes brutas: pedidos, produtos, titulos...)
//   - a BASE agrega, deriva KPI, classifica e ordena
//
// Trocar BLING_PROVIDER=mock por =bling NAO PODE mudar um numero. Se mudar, o
// calculo vazou para a subclasse - e isso e um bug, nao uma diferenca de fonte.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

abstract class BlingProviderBase
{
    // ─────────────────────────────────────────────────────────────
    // Contrato que cada provedor implementa (so devolve linhas)
    // ─────────────────────────────────────────────────────────────

    abstract public function nome(): string;
    abstract public function ehSimulado(): bool;
    abstract public function ultimaSync(): ?string;

    /** @return array<int,array> */
    abstract public function colecao(string $nome): array;

    // ─────────────────────────────────────────────────────────────
    // Utilitarios de filtro (aplicados igual para todo mundo)
    // ─────────────────────────────────────────────────────────────

    /** Filtra por janela de datas sobre um campo. */
    protected function noPeriodo(array $linhas, string $campo, array $f): array
    {
        return array_values(array_filter($linhas, static fn($l) =>
            isset($l[$campo]) && $l[$campo] !== null
            && substr((string) $l[$campo], 0, 10) >= $f['de']
            && substr((string) $l[$campo], 0, 10) <= $f['ate']
        ));
    }

    /** Janela imediatamente anterior, do mesmo tamanho — base de toda comparacao. */
    protected function periodoAnterior(array $f): array
    {
        $dias = max(1, (int) ((strtotime($f['ate']) - strtotime($f['de'])) / 86400) + 1);
        return [
            'de'  => date('Y-m-d', strtotime($f['de'] . " -$dias days")),
            'ate' => date('Y-m-d', strtotime($f['de'] . ' -1 day')),
        ];
    }

    /** Variacao percentual segura. null quando a base e zero — nunca "infinito". */
    protected function variacao(float $atual, float $anterior): ?float
    {
        if ($anterior == 0.0) {
            return null;
        }
        return round((($atual - $anterior) / abs($anterior)) * 100, 1);
    }

    /** Pedidos que contam como venda: exclui rascunho e cancelado. */
    protected function pedidosValidos(array $pedidos): array
    {
        return array_values(array_filter($pedidos, static fn($p) =>
            !in_array($p['situacao'], ['rascunho', 'cancelado'], true)));
    }

    // ─────────────────────────────────────────────────────────────
    // KPIs (§14.1)
    // ─────────────────────────────────────────────────────────────

    public function kpis(array $f): array
    {
        $pedidos   = $this->colecao('pedidos');
        $notas     = $this->colecao('notas');
        $receber   = $this->colecao('receber');
        $pagar     = $this->colecao('pagar');
        $estoque   = $this->colecao('estoque');
        $compras   = $this->colecao('compras');
        $envios    = $this->colecao('envios');
        $sync      = $this->colecao('sync');

        $ant = $this->periodoAnterior($f);

        $noPer  = $this->pedidosValidos($this->noPeriodo($pedidos, 'data', $f));
        $noAnt  = $this->pedidosValidos($this->noPeriodo($pedidos, 'data', $ant));

        $fatBruto  = array_sum(array_column($noPer, 'total'));
        $fatAnt    = array_sum(array_column($noAnt, 'total'));
        $custo     = array_sum(array_column($noPer, 'custo'));
        $desconto  = array_sum(array_column($noPer, 'desconto'));
        $frete     = array_sum(array_column($noPer, 'frete'));
        $fatLiquido= $fatBruto - $frete;

        $faturados = array_values(array_filter($noPer, static fn($p) =>
            in_array($p['situacao'], ['faturado', 'nota_emitida', 'separacao', 'enviado', 'entregue'], true)));

        $unidades = 0;
        foreach ($noPer as $p) {
            foreach ($p['itens'] as $it) {
                $unidades += $it['quantidade'];
            }
        }

        $notasPer   = $this->noPeriodo($notas, 'emissao', $f);
        $notasErro  = array_values(array_filter($notasPer, static fn($n) => $n['situacao'] === 'rejeitada'));

        $recAberto  = array_values(array_filter($receber, static fn($r) => in_array($r['situacao'], ['aberto', 'parcial'], true)));
        $recVencido = array_values(array_filter($receber, static fn($r) => $r['situacao'] === 'vencido'));
        $pagAberto  = array_values(array_filter($pagar, static fn($p) => in_array($p['situacao'], ['aberto', 'parcial'], true)));
        $pagVencido = array_values(array_filter($pagar, static fn($p) => $p['situacao'] === 'vencido'));

        $valorEstoque = 0.0;
        $produtosPorId = [];
        foreach ($this->colecao('produtos') as $p) {
            $produtosPorId[$p['id']] = $p;
        }
        foreach ($estoque as $e) {
            $custoUnit = $produtosPorId[$e['produto']]['custo'] ?? 0;
            $valorEstoque += max(0, $e['fisico']) * $custoUnit;
        }

        $zerados  = count(array_filter($estoque, static fn($e) => $e['status'] === 'zerado'));
        $criticos = count(array_filter($estoque, static fn($e) => in_array($e['status'], ['critico', 'negativo'], true)));

        $comprasPer = $this->noPeriodo($compras, 'emissao', $f);
        $aguardandoExpedicao = count(array_filter($envios, static fn($e) =>
            in_array($e['situacao'], ['aguardando_separacao', 'separado'], true)));

        $integracoesFalha = count(array_filter($sync, static fn($s) => $s['situacao'] === 'erro'));

        $clientesDistintos = count(array_unique(array_column($noPer, 'cliente')));
        $ticket = count($noPer) > 0 ? $fatBruto / count($noPer) : 0.0;
        $ticketAnt = count($noAnt) > 0 ? $fatAnt / count($noAnt) : 0.0;
        $margem = $fatLiquido > 0 ? (($fatLiquido - $custo) / $fatLiquido) * 100 : 0.0;

        return [
            $this->kpi('faturamento_bruto', 'Faturamento bruto', $fatBruto, 'moeda',
                $this->variacao($fatBruto, $fatAnt), $this->serieDiaria($noPer, 'data', 'total', $f), 'pedidos-venda'),
            $this->kpi('faturamento_liquido', 'Faturamento líquido', $fatLiquido, 'moeda',
                $this->variacao($fatLiquido, $fatAnt - array_sum(array_column($noAnt, 'frete'))), null, 'vendas'),
            $this->kpi('pedidos', 'Pedidos de venda', count($noPer), 'inteiro',
                $this->variacao(count($noPer), count($noAnt)), $this->serieDiaria($noPer, 'data', null, $f), 'pedidos-venda'),
            $this->kpi('pedidos_faturados', 'Pedidos faturados', count($faturados), 'inteiro', null, null, 'pedidos-venda'),
            $this->kpi('ticket_medio', 'Ticket médio', $ticket, 'moeda',
                $this->variacao($ticket, $ticketAnt), null, 'vendas'),
            $this->kpi('produtos_vendidos', 'Produtos vendidos', $unidades, 'inteiro', null, null, 'produtos'),
            $this->kpi('clientes', 'Clientes', $clientesDistintos, 'inteiro', null, null, 'clientes'),
            $this->kpi('contas_receber', 'Contas a receber', array_sum(array_column($recAberto, 'saldo')), 'moeda', null, null, 'contas-receber'),
            $this->kpi('contas_vencidas', 'Contas vencidas', array_sum(array_column($recVencido, 'saldo')), 'moeda',
                null, null, 'contas-receber', count($recVencido) > 0 ? 'atencao' : 'ok'),
            $this->kpi('contas_pagar', 'Contas a pagar', array_sum(array_column($pagAberto, 'saldo')), 'moeda', null, null, 'contas-pagar'),
            $this->kpi('saldo_projetado', 'Saldo projetado',
                array_sum(array_column($recAberto, 'saldo')) - array_sum(array_column($pagAberto, 'saldo')), 'moeda', null, null, 'fluxo-caixa'),
            $this->kpi('notas_emitidas', 'Notas emitidas', count($notasPer), 'inteiro', null, null, 'notas-fiscais'),
            $this->kpi('notas_erro', 'Notas com erro', count($notasErro), 'inteiro', null, null, 'notas-fiscais',
                count($notasErro) > 0 ? 'critico' : 'ok'),
            $this->kpi('estoque_total', 'Valor em estoque', $valorEstoque, 'moeda', null, null, 'estoque'),
            $this->kpi('produtos_sem_estoque', 'Produtos sem estoque', $zerados, 'inteiro', null, null, 'estoque',
                $zerados > 0 ? 'atencao' : 'ok'),
            $this->kpi('produtos_criticos', 'Estoque crítico', $criticos, 'inteiro', null, null, 'estoque',
                $criticos > 0 ? 'critico' : 'ok'),
            $this->kpi('pedidos_compra', 'Pedidos de compra', count($comprasPer), 'inteiro', null, null, 'pedidos-compra'),
            $this->kpi('aguardando_expedicao', 'Aguardando expedição', $aguardandoExpedicao, 'inteiro', null, null, 'expedicao',
                $aguardandoExpedicao > 30 ? 'atencao' : 'ok'),
            $this->kpi('margem_estimada', 'Margem estimada', $margem, 'percentual', null, null, 'rentabilidade',
                'ok', 'Estimativa: receita menos custo de produto. Não inclui composição contábil completa.'),
            $this->kpi('integracoes_falha', 'Integrações com falha', $integracoesFalha, 'inteiro', null, null, 'sincronizacao',
                $integracoesFalha > 0 ? 'critico' : 'ok'),
        ];
    }

    /** Monta um card de KPI no formato que o front-end espera (§14.1). */
    protected function kpi(
        string $id, string $rotulo, float $valor, string $formato,
        ?float $variacao = null, ?array $sparkline = null, ?string $drilldown = null,
        string $semantica = 'ok', ?string $tooltip = null
    ): array {
        return [
            'id'        => $id,
            'rotulo'    => $rotulo,
            'valor'     => round($valor, 2),
            'formato'   => $formato,
            'variacao'  => $variacao,
            'tendencia' => $variacao === null ? 'estavel' : ($variacao > 1 ? 'alta' : ($variacao < -1 ? 'baixa' : 'estavel')),
            'sparkline' => $sparkline,
            'drilldown' => $drilldown,
            'semantica' => $semantica,
            'tooltip'   => $tooltip,
        ];
    }

    /**
     * Serie diaria para sparkline e graficos.
     * $campo null = contagem; senao, soma do campo.
     */
    protected function serieDiaria(array $linhas, string $campoData, ?string $campo, array $f): array
    {
        $mapa = [];
        $cursor = strtotime($f['de']);
        $fim = strtotime($f['ate']);
        while ($cursor <= $fim) {
            $mapa[date('Y-m-d', $cursor)] = 0.0;
            $cursor = strtotime('+1 day', $cursor);
        }
        foreach ($linhas as $l) {
            $d = substr((string) ($l[$campoData] ?? ''), 0, 10);
            if (!isset($mapa[$d])) {
                continue;
            }
            $mapa[$d] += $campo === null ? 1 : (float) ($l[$campo] ?? 0);
        }
        $saida = [];
        foreach ($mapa as $data => $v) {
            $saida[] = ['data' => $data, 'valor' => round($v, 2)];
        }
        return $saida;
    }

    /** Agrega serie por granularidade (dia|semana|mes). */
    protected function agregarSerie(array $serie, string $granularidade): array
    {
        if ($granularidade === 'dia') {
            return $serie;
        }
        $mapa = [];
        foreach ($serie as $ponto) {
            $chave = $granularidade === 'mes'
                ? substr($ponto['data'], 0, 7)
                : date('o-\WW', strtotime($ponto['data']));
            $mapa[$chave] = ($mapa[$chave] ?? 0) + $ponto['valor'];
        }
        $saida = [];
        foreach ($mapa as $data => $v) {
            $saida[] = ['data' => $data, 'valor' => round($v, 2)];
        }
        return $saida;
    }

    /** Media movel — usada nos graficos do §17 e na deteccao de anomalia (§42). */
    protected function mediaMovel(array $serie, int $janela = 7): array
    {
        $saida = [];
        $n = count($serie);
        for ($i = 0; $i < $n; $i++) {
            $ini = max(0, $i - $janela + 1);
            $fatia = array_slice($serie, $ini, $i - $ini + 1);
            $saida[] = [
                'data'  => $serie[$i]['data'],
                'valor' => round(array_sum(array_column($fatia, 'valor')) / max(1, count($fatia)), 2),
            ];
        }
        return $saida;
    }

    // ─────────────────────────────────────────────────────────────
    // Evolucao consolidada (§17)
    // ─────────────────────────────────────────────────────────────

    /**
     * Series temporais da tela de evolucao.
     * Mora AQUI, e nao no controller, porque compartilha a mesma origem dos KPIs:
     * o grafico nao pode contar diferente do numero exibido logo acima dele.
     */
    public function evolucao(array $f): array
    {
        $pedidosPeriodo = $this->pedidosValidos($this->noPeriodo($this->colecao('pedidos'), 'data', $f));
        $notasPeriodo   = $this->noPeriodo($this->colecao('notas'), 'emissao', $f);
        $comprasPeriodo = $this->noPeriodo($this->colecao('compras'), 'emissao', $f);
        $recPeriodo     = $this->noPeriodo($this->colecao('receber'), 'vencimento', $f);
        $pagPeriodo     = $this->noPeriodo($this->colecao('pagar'), 'vencimento', $f);

        $g = in_array($f['granularidade'], ['dia', 'semana', 'mes'], true) ? $f['granularidade'] : 'dia';

        $faturamento = $this->agregarSerie($this->serieDiaria($pedidosPeriodo, 'data', 'total', $f), $g);
        $pedidos     = $this->agregarSerie($this->serieDiaria($pedidosPeriodo, 'data', null, $f), $g);
        $custo       = $this->agregarSerie($this->serieDiaria($pedidosPeriodo, 'data', 'custo', $f), $g);

        // Ticket medio e margem sao DERIVADOS das series acima, ponto a ponto —
        // recalcular por outro caminho abriria espaco para divergencia.
        $ticket = [];
        $margem = [];
        foreach ($faturamento as $i => $ponto) {
            $qtd = $pedidos[$i]['valor'] ?? 0;
            $ticket[] = ['data' => $ponto['data'], 'valor' => $qtd > 0 ? round($ponto['valor'] / $qtd, 2) : 0.0];
            $c = $custo[$i]['valor'] ?? 0;
            $margem[] = ['data' => $ponto['data'],
                'valor' => $ponto['valor'] > 0 ? round((($ponto['valor'] - $c) / $ponto['valor']) * 100, 1) : 0.0];
        }

        return [
            'granularidade' => $g,
            'series' => [
                ['id' => 'faturamento', 'rotulo' => 'Faturamento',  'formato' => 'moeda',      'eixo' => 'esquerda', 'pontos' => $faturamento],
                ['id' => 'pedidos',     'rotulo' => 'Pedidos',      'formato' => 'inteiro',    'eixo' => 'direita',  'pontos' => $pedidos],
                ['id' => 'ticket_medio','rotulo' => 'Ticket médio', 'formato' => 'moeda',      'eixo' => 'esquerda', 'pontos' => $ticket],
                ['id' => 'margem',      'rotulo' => 'Margem',       'formato' => 'percentual', 'eixo' => 'direita',  'pontos' => $margem],
                ['id' => 'recebimentos','rotulo' => 'Recebimentos', 'formato' => 'moeda',      'eixo' => 'esquerda',
                 'pontos' => $this->agregarSerie($this->serieDiaria($recPeriodo, 'vencimento', 'valor', $f), $g)],
                ['id' => 'pagamentos',  'rotulo' => 'Pagamentos',   'formato' => 'moeda',      'eixo' => 'esquerda',
                 'pontos' => $this->agregarSerie($this->serieDiaria($pagPeriodo, 'vencimento', 'valor', $f), $g)],
                ['id' => 'compras',     'rotulo' => 'Compras',      'formato' => 'moeda',      'eixo' => 'esquerda',
                 'pontos' => $this->agregarSerie($this->serieDiaria($comprasPeriodo, 'emissao', 'valor', $f), $g)],
                ['id' => 'notas',       'rotulo' => 'Notas emitidas','formato' => 'inteiro',   'eixo' => 'direita',
                 'pontos' => $this->agregarSerie($this->serieDiaria($notasPeriodo, 'emissao', null, $f), $g)],
            ],
            'media_movel' => [
                'faturamento' => $this->mediaMovel($faturamento, 7),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Saude operacional (§15)
    // ─────────────────────────────────────────────────────────────

    public function saude(): array
    {
        $sync   = $this->colecao('sync');
        $webhooks = $this->colecao('webhooks');
        $notas  = $this->colecao('notas');
        $estoque= $this->colecao('estoque');
        $receber= $this->colecao('receber');
        $canais = $this->colecao('canais');

        $syncErro    = count(array_filter($sync, static fn($s) => $s['situacao'] === 'erro'));
        $syncAtencao = count(array_filter($sync, static fn($s) => in_array($s['situacao'], ['atencao', 'parcial'], true)));
        $whFalha     = count(array_filter($webhooks, static fn($w) => in_array($w['situacao'], ['falhou', 'dlq'], true)));
        $nfRejeitada = count(array_filter($notas, static fn($n) => $n['situacao'] === 'rejeitada'));
        $estNegativo = count(array_filter($estoque, static fn($e) => $e['status'] === 'negativo'));
        $recVencido  = count(array_filter($receber, static fn($r) => $r['situacao'] === 'vencido'));
        $canalQuebrado = count(array_filter($canais, static fn($c) => $c['integrado'] === false));

        $simulado = $this->ehSimulado();

        return [
            $this->indicadorSaude('api', 'API Bling', $simulado ? 'desatualizado' : 'saudavel',
                $simulado ? 'Provedor simulado ativo' : 'Respondendo normalmente'),
            $this->indicadorSaude('oauth', 'OAuth', $simulado ? 'indisponivel' : 'saudavel',
                $simulado ? 'Credencial não configurada' : 'Token válido'),
            $this->indicadorSaude('webhooks', 'Webhooks', $whFalha > 8 ? 'degradado' : ($whFalha > 0 ? 'atencao' : 'saudavel'),
                "$whFalha evento(s) com falha"),
            $this->indicadorSaude('sincronizacao', 'Sincronização',
                $syncErro > 0 ? 'degradado' : ($syncAtencao > 0 ? 'atencao' : 'saudavel'),
                "$syncErro com erro, $syncAtencao em atenção"),
            $this->indicadorSaude('banco', 'Banco local', $simulado ? 'indisponivel' : 'saudavel',
                $simulado ? 'Banco BLING ainda não provisionado' : 'Operacional'),
            $this->indicadorSaude('filas', 'Filas', $whFalha > 12 ? 'atencao' : 'saudavel',
                'Processamento em dia'),
            $this->indicadorSaude('fiscal', 'Notas fiscais', $nfRejeitada > 0 ? 'atencao' : 'saudavel',
                "$nfRejeitada nota(s) rejeitada(s)"),
            $this->indicadorSaude('estoque', 'Estoque', $estNegativo > 0 ? 'degradado' : 'saudavel',
                "$estNegativo item(ns) com saldo negativo"),
            $this->indicadorSaude('financeiro', 'Financeiro', $recVencido > 20 ? 'atencao' : 'saudavel',
                "$recVencido título(s) vencido(s)"),
            $this->indicadorSaude('canais', 'Canais de venda', $canalQuebrado > 0 ? 'atencao' : 'saudavel',
                "$canalQuebrado canal(is) sem integração"),
        ];
    }

    protected function indicadorSaude(string $id, string $rotulo, string $estado, string $detalhe): array
    {
        return array_merge(
            ['id' => $id, 'rotulo' => $rotulo, 'detalhe' => $detalhe],
            BlingSituacoes::descrever('saude', $estado)
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Painel "Exige atencao" (§16)
    // ─────────────────────────────────────────────────────────────

    public function atencao(): array
    {
        $pedidos = $this->colecao('pedidos');
        $notas   = $this->colecao('notas');
        $estoque = $this->colecao('estoque');
        $receber = $this->colecao('receber');
        $compras = $this->colecao('compras');
        $webhooks= $this->colecao('webhooks');
        $sync    = $this->colecao('sync');
        $envios  = $this->colecao('envios');
        $produtos= $this->colecao('produtos');
        $fornec  = $this->colecao('fornecedores');
        $clientes= $this->colecao('clientes');

        $hoje = date('Y-m-d');
        $itens = [];

        $nfRejeitadas = array_values(array_filter($notas, static fn($n) => $n['situacao'] === 'rejeitada'));
        $itens[] = $this->ocorrencia('notas_rejeitadas', 'critica', 'Fiscal', 'Notas fiscais rejeitadas',
            count($nfRejeitadas), array_sum(array_column($nfRejeitadas, 'valor')),
            'Corrigir o cadastro apontado no erro e reenviar', 'notas-fiscais');

        // Pedido parado: aprovado ha mais de 3 dias e ainda sem faturamento.
        $parados = array_values(array_filter($pedidos, static fn($p) =>
            $p['situacao'] === 'aprovado' && $p['data'] < date('Y-m-d', strtotime('-3 days'))));
        $itens[] = $this->ocorrencia('pedidos_parados', 'alta', 'Vendas', 'Pedidos aprovados parados há mais de 3 dias',
            count($parados), array_sum(array_column($parados, 'total')),
            'Faturar ou revisar o motivo da retenção', 'pedidos-venda');

        $semNota = array_values(array_filter($pedidos, static fn($p) => $p['situacao'] === 'faturado'));
        $itens[] = $this->ocorrencia('pedidos_sem_nota', 'alta', 'Fiscal', 'Pedidos faturados sem nota emitida',
            count($semNota), array_sum(array_column($semNota, 'total')),
            'Emitir a nota fiscal', 'notas-fiscais');

        $negativos = array_values(array_filter($estoque, static fn($e) => $e['status'] === 'negativo'));
        $itens[] = $this->ocorrencia('estoque_negativo', 'critica', 'Estoque', 'Itens com saldo negativo',
            count($negativos), null, 'Inventariar e ajustar o saldo', 'estoque');

        $divergentes = array_values(array_filter($estoque, static fn($e) => $e['divergencia'] !== 0));
        $itens[] = $this->ocorrencia('estoque_divergente', 'media', 'Estoque', 'Divergência entre saldo físico e sistema',
            count($divergentes), null, 'Conferir contagem no depósito', 'estoque');

        $semVinculo = array_values(array_filter($produtos, static fn($p) => count($p['canais']) === 0));
        $itens[] = $this->ocorrencia('produtos_sem_vinculo', 'media', 'Produtos', 'Produtos sem vínculo com canal de venda',
            count($semVinculo), null, 'Vincular ao canal correspondente', 'canais-venda');

        $vencidas = array_values(array_filter($receber, static fn($r) => $r['situacao'] === 'vencido'));
        $itens[] = $this->ocorrencia('contas_vencidas', 'critica', 'Financeiro', 'Contas a receber vencidas',
            count($vencidas), array_sum(array_column($vencidas, 'saldo')),
            'Acionar cobrança', 'contas-receber');

        $comprasAtrasadas = array_values(array_filter($compras, static fn($c) =>
            in_array($c['situacao'], ['enviado_fornecedor', 'recebido_parcial'], true) && $c['previsao'] < $hoje));
        $itens[] = $this->ocorrencia('compras_atrasadas', 'alta', 'Compras', 'Pedidos de compra atrasados',
            count($comprasAtrasadas), array_sum(array_column($comprasAtrasadas, 'valor')),
            'Cobrar prazo do fornecedor', 'pedidos-compra');

        $whFalha = array_values(array_filter($webhooks, static fn($w) => in_array($w['situacao'], ['falhou', 'dlq'], true)));
        $itens[] = $this->ocorrencia('webhooks_falha', 'alta', 'Integração', 'Webhooks com falha de processamento',
            count($whFalha), null, 'Reprocessar a partir da fila', 'webhooks');

        $itens[] = $this->ocorrencia('token_expirando', $this->ehSimulado() ? 'critica' : 'media', 'Integração',
            $this->ehSimulado() ? 'Credencial do Bling não configurada' : 'Token próximo do vencimento',
            1, null, $this->ehSimulado() ? 'Cadastrar client_id e client_secret' : 'Renovar autorização', 'integracoes');

        $syncErro = array_values(array_filter($sync, static fn($s) => $s['situacao'] === 'erro'));
        $itens[] = $this->ocorrencia('sync_interrompida', 'alta', 'Integração', 'Sincronizações interrompidas',
            count($syncErro), null, 'Ver o erro e reprocessar o recurso', 'sincronizacao');

        // Cliente duplicado: mesmo nome normalizado aparecendo mais de uma vez.
        $porNome = [];
        foreach ($clientes as $c) {
            $chave = mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $c['nome']));
            $porNome[$chave] = ($porNome[$chave] ?? 0) + 1;
        }
        $dups = count(array_filter($porNome, static fn($n) => $n > 1));
        $itens[] = $this->ocorrencia('clientes_duplicados', 'baixa', 'Relacionamento', 'Possíveis clientes duplicados',
            $dups, null, 'Revisar e unificar cadastros', 'clientes');

        $fornIncompletos = array_values(array_filter($fornec, static fn($f) => !$f['cadastro_completo']));
        $itens[] = $this->ocorrencia('fornecedores_incompletos', 'baixa', 'Compras', 'Fornecedores com cadastro incompleto',
            count($fornIncompletos), null, 'Completar dados fiscais e bancários', 'fornecedores');

        $atrasados = array_values(array_filter($envios, static fn($e) => $e['situacao'] === 'atrasado'));
        $itens[] = $this->ocorrencia('remessas_atraso', 'alta', 'Logística', 'Remessas com atraso na entrega',
            count($atrasados), null, 'Acionar a transportadora', 'rastreamento');

        // Valor divergente: titulo cujo total nao bate com o pedido de origem.
        $porPedido = [];
        foreach ($receber as $r) {
            if ($r['pedido'] !== null) {
                $porPedido[$r['pedido']] = ($porPedido[$r['pedido']] ?? 0) + $r['valor'];
            }
        }
        $divergencias = 0;
        $valorDiv = 0.0;
        foreach ($this->pedidosValidos($pedidos) as $p) {
            if (!isset($porPedido[$p['id']])) {
                continue;
            }
            $delta = abs($porPedido[$p['id']] - $p['total']);
            if ($delta > 0.05) {
                $divergencias++;
                $valorDiv += $delta;
            }
        }
        $itens[] = $this->ocorrencia('valores_divergentes', 'media', 'Conciliação', 'Títulos com valor divergente do pedido',
            $divergencias, $valorDiv, 'Conciliar manualmente', 'conciliacao');

        // Só volta o que realmente tem ocorrencia, ordenado por severidade.
        $itens = array_values(array_filter($itens, static fn($i) => $i['quantidade'] > 0));
        $peso = array_flip(BlingSituacoes::SEVERIDADE);
        usort($itens, static fn($a, $b) =>
            [$peso[$a['severidade']] ?? 9, -$a['quantidade']] <=> [$peso[$b['severidade']] ?? 9, -$b['quantidade']]);

        return $itens;
    }

    protected function ocorrencia(
        string $id, string $severidade, string $modulo, string $descricao,
        int $quantidade, ?float $valor, string $acao, string $tela
    ): array {
        return [
            'id' => $id, 'severidade' => $severidade, 'modulo' => $modulo,
            'descricao' => $descricao, 'quantidade' => $quantidade,
            'valor_impactado' => $valor === null ? null : round($valor, 2),
            'acao_recomendada' => $acao, 'tela' => $tela,
            'responsavel' => $modulo,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Sankey empresarial (§18) — canal -> pedido -> ... -> recebimento
    // ─────────────────────────────────────────────────────────────

    public function fluxoEmpresarial(array $f): array
    {
        $pedidos = $this->pedidosValidos($this->noPeriodo($this->colecao('pedidos'), 'data', $f));
        $canais  = [];
        foreach ($this->colecao('canais') as $c) {
            $canais[$c['id']] = $c['nome'];
        }

        $notasPorPedido = [];
        foreach ($this->colecao('notas') as $n) {
            $notasPorPedido[$n['pedido']] = $n;
        }
        $enviosPorPedido = [];
        foreach ($this->colecao('envios') as $e) {
            $enviosPorPedido[$e['pedido']] = $e;
        }
        $recPorPedido = [];
        foreach ($this->colecao('receber') as $r) {
            if ($r['pedido'] !== null) {
                $recPorPedido[$r['pedido']][] = $r;
            }
        }

        $nos = [];
        $links = [];
        $addLink = static function (string $de, string $para, float $valor, int $qtd) use (&$links): void {
            $chave = "$de\x00$para";
            if (!isset($links[$chave])) {
                $links[$chave] = ['origem' => $de, 'destino' => $para, 'valor' => 0.0, 'quantidade' => 0];
            }
            $links[$chave]['valor'] += $valor;
            $links[$chave]['quantidade'] += $qtd;
        };

        $faturaveis = ['faturado', 'nota_emitida', 'separacao', 'enviado', 'entregue'];

        foreach ($pedidos as $p) {
            $canal = $canais[$p['canal']] ?? $p['canal'];
            $nos[$canal] = 'canal';
            $nos['Pedidos'] = 'etapa';
            $addLink($canal, 'Pedidos', $p['total'], 1);

            if (!in_array($p['situacao'], $faturaveis, true)) {
                continue;
            }
            $nos['Faturamento'] = 'etapa';
            $addLink('Pedidos', 'Faturamento', $p['total'], 1);

            $nf = $notasPorPedido[$p['id']] ?? null;
            if ($nf === null || $nf['situacao'] !== 'autorizada') {
                continue;
            }
            $nos['Nota fiscal'] = 'etapa';
            $addLink('Faturamento', 'Nota fiscal', $nf['valor'], 1);

            $env = $enviosPorPedido[$p['id']] ?? null;
            if ($env !== null) {
                $nos['Expedição'] = 'etapa';
                $addLink('Nota fiscal', 'Expedição', $nf['valor'], 1);
                if ($env['situacao'] === 'entregue') {
                    $nos['Entrega'] = 'etapa';
                    $addLink('Expedição', 'Entrega', $nf['valor'], 1);
                }
            }

            $liquidado = 0.0;
            foreach ($recPorPedido[$p['id']] ?? [] as $r) {
                $liquidado += $r['recebido'];
            }
            if ($liquidado > 0) {
                $nos['Recebimento'] = 'etapa';
                $origem = isset($enviosPorPedido[$p['id']]) && $enviosPorPedido[$p['id']]['situacao'] === 'entregue'
                    ? 'Entrega' : 'Nota fiscal';
                $addLink($origem, 'Recebimento', $liquidado, 1);
            }
        }

        $nosSaida = [];
        foreach ($nos as $nome => $tipo) {
            $nosSaida[] = ['id' => $nome, 'nome' => $nome, 'tipo' => $tipo];
        }
        $linksSaida = array_values(array_map(static function ($l) {
            $l['valor'] = round($l['valor'], 2);
            return $l;
        }, $links));

        return ['nos' => $nosSaida, 'links' => $linksSaida];
    }

    // ─────────────────────────────────────────────────────────────
    // Funil fiscal (§31)
    // ─────────────────────────────────────────────────────────────

    public function funilFiscal(array $f): array
    {
        $pedidos = $this->pedidosValidos($this->noPeriodo($this->colecao('pedidos'), 'data', $f));
        $notas   = [];
        foreach ($this->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }
        $envios = [];
        foreach ($this->colecao('envios') as $e) {
            $envios[$e['pedido']] = $e;
        }

        $aprovados  = array_values(array_filter($pedidos, static fn($p) => BlingSituacoes::PEDIDO[$p['situacao']]['ordem'] >= 2
            && BlingSituacoes::PEDIDO[$p['situacao']]['ordem'] < 90));
        $faturaveis = array_values(array_filter($aprovados, static fn($p) => BlingSituacoes::PEDIDO[$p['situacao']]['ordem'] >= 3));
        $geradas    = array_values(array_filter($faturaveis, static fn($p) => isset($notas[$p['id']])));
        $autorizadas= array_values(array_filter($geradas, static fn($p) => $notas[$p['id']]['situacao'] === 'autorizada'));
        $enviadas   = array_values(array_filter($autorizadas, static fn($p) => isset($envios[$p['id']])));

        $etapas = [
            ['id' => 'aprovados',   'rotulo' => 'Pedidos aprovados',  'quantidade' => count($aprovados),   'valor' => array_sum(array_column($aprovados, 'total'))],
            ['id' => 'faturaveis',  'rotulo' => 'Pedidos faturáveis', 'quantidade' => count($faturaveis),  'valor' => array_sum(array_column($faturaveis, 'total'))],
            ['id' => 'geradas',     'rotulo' => 'Notas geradas',      'quantidade' => count($geradas),     'valor' => array_sum(array_column($geradas, 'total'))],
            ['id' => 'autorizadas', 'rotulo' => 'Notas autorizadas',  'quantidade' => count($autorizadas), 'valor' => array_sum(array_column($autorizadas, 'total'))],
            ['id' => 'enviadas',    'rotulo' => 'Notas enviadas',     'quantidade' => count($enviadas),    'valor' => array_sum(array_column($enviadas, 'total'))],
        ];

        // Perda entre etapas: e o que a tela precisa destacar, nao o total.
        foreach ($etapas as $i => &$e) {
            $e['valor'] = round($e['valor'], 2);
            if ($i === 0) {
                $e['perda'] = 0;
                $e['conversao'] = 100.0;
                continue;
            }
            $ant = $etapas[$i - 1]['quantidade'];
            $e['perda'] = $ant - $e['quantidade'];
            $e['conversao'] = $ant > 0 ? round(($e['quantidade'] / $ant) * 100, 1) : 0.0;
        }
        unset($e);

        return $etapas;
    }

    // ─────────────────────────────────────────────────────────────
    // Curva ABC (§41)
    // ─────────────────────────────────────────────────────────────

    public function curvaAbc(string $dimensao, string $metrica, array $f): array
    {
        $pedidos = $this->pedidosValidos($this->noPeriodo($this->colecao('pedidos'), 'data', $f));

        $produtos = [];
        foreach ($this->colecao('produtos') as $p) {
            $produtos[$p['id']] = $p;
        }
        $clientes = [];
        foreach ($this->colecao('clientes') as $c) {
            $clientes[$c['id']] = $c;
        }
        $canais = [];
        foreach ($this->colecao('canais') as $c) {
            $canais[$c['id']] = $c;
        }
        $categorias = [];
        foreach ($this->colecao('categorias') as $c) {
            $categorias[$c['id']] = $c;
        }
        $fornecedores = [];
        foreach ($this->colecao('fornecedores') as $fo) {
            $fornecedores[$fo['id']] = $fo;
        }

        // Dimensoes de nivel PEDIDO agregam o total do pedido; as de nivel ITEM
        // agregam o item com desconto e frete RATEADOS na proporcao do subtotal.
        //
        // Sem esse rateio a curva soma o subtotal e o KPI soma o total — e a
        // mesma tela mostra dois faturamentos diferentes. O smoke test pegou
        // exatamente isso (diferenca = desconto − frete do periodo).
        $nivelPedido = in_array($dimensao, ['clientes', 'canais'], true);

        $acum = [];
        $registrar = static function (string $chave, string $rotulo, float $valor) use (&$acum): void {
            if (!isset($acum[$chave])) {
                $acum[$chave] = ['id' => $chave, 'rotulo' => $rotulo, 'valor' => 0.0];
            }
            $acum[$chave]['valor'] += $valor;
        };

        foreach ($pedidos as $p) {
            if ($nivelPedido) {
                [$chave, $rotulo] = $dimensao === 'clientes'
                    ? [$p['cliente'], $clientes[$p['cliente']]['nome'] ?? $p['cliente']]
                    : [$p['canal'], $canais[$p['canal']]['nome'] ?? $p['canal']];

                $unidades = 0;
                foreach ($p['itens'] as $it) {
                    $unidades += $it['quantidade'];
                }

                $registrar($chave, $rotulo, match ($metrica) {
                    'unidades'   => $unidades,
                    'margem'     => $p['total'] - $p['frete'] - $p['custo'],
                    'frequencia' => 1,
                    default      => $p['total'],
                });
                continue;
            }

            // Nivel item: rateia desconto e frete pela participacao no subtotal.
            $ajuste = $p['subtotal'] > 0 ? ($p['total'] / $p['subtotal']) : 1.0;

            foreach ($p['itens'] as $it) {
                $prod = $produtos[$it['produto']] ?? null;
                [$chave, $rotulo] = match ($dimensao) {
                    'categorias'   => [$prod['categoria'] ?? '?', $categorias[$prod['categoria'] ?? '']['nome'] ?? '—'],
                    'fornecedores' => [$prod['fornecedor'] ?? '?', $fornecedores[$prod['fornecedor'] ?? '']['nome'] ?? '—'],
                    default        => [$it['produto'], $it['nome']],
                };

                $liquido = $it['total'] * $ajuste;

                $registrar($chave, $rotulo, match ($metrica) {
                    'unidades'   => $it['quantidade'],
                    'margem'     => $liquido - ($it['custo_unitario'] * $it['quantidade']),
                    'frequencia' => 1,
                    default      => $liquido,
                });
            }
        }

        $lista = array_values($acum);
        usort($lista, static fn($a, $b) => $b['valor'] <=> $a['valor']);

        $total = array_sum(array_column($lista, 'valor'));
        $acumulado = 0.0;
        foreach ($lista as &$l) {
            $acumulado += $l['valor'];
            $l['valor'] = round($l['valor'], 2);
            $l['participacao'] = $total > 0 ? round(($l['valor'] / $total) * 100, 2) : 0.0;
            $l['acumulado_pct'] = $total > 0 ? round(($acumulado / $total) * 100, 2) : 0.0;
            $l['classe'] = $l['acumulado_pct'] <= 80 ? 'A' : ($l['acumulado_pct'] <= 95 ? 'B' : 'C');
        }
        unset($l);

        return ['itens' => $lista, 'total' => round($total, 2)];
    }

    // ─────────────────────────────────────────────────────────────
    // Rentabilidade (§40)
    // ─────────────────────────────────────────────────────────────

    public function rentabilidade(string $dimensao, array $f): array
    {
        $pedidos = $this->pedidosValidos($this->noPeriodo($this->colecao('pedidos'), 'data', $f));

        $formas = [];
        foreach ($this->colecao('formas_pagamento') as $fp) {
            $formas[$fp['id']] = $fp;
        }
        $vendedores = [];
        foreach ($this->colecao('vendedores') as $v) {
            $vendedores[$v['id']] = $v;
        }
        $canais = [];
        foreach ($this->colecao('canais') as $c) {
            $canais[$c['id']] = $c;
        }
        $clientes = [];
        foreach ($this->colecao('clientes') as $c) {
            $clientes[$c['id']] = $c;
        }
        $produtos = [];
        foreach ($this->colecao('produtos') as $p) {
            $produtos[$p['id']] = $p;
        }
        $categorias = [];
        foreach ($this->colecao('categorias') as $c) {
            $categorias[$c['id']] = $c;
        }

        $acum = [];
        foreach ($pedidos as $p) {
            $taxa = ($formas[$p['forma_pagamento']]['taxa_pct'] ?? 0) / 100;
            $comissaoPct = ($vendedores[$p['vendedor']]['comissao_pct'] ?? 0) / 100;

            // Rateio por item quando a dimensao e de produto; senao, pedido inteiro.
            $porProduto = in_array($dimensao, ['produto', 'sku', 'categoria'], true);
            $linhas = $porProduto
                ? array_map(static fn($it) => [$it, $it['total']], $p['itens'])
                : [[null, $p['total']]];

            foreach ($linhas as [$it, $receitaBruta]) {
                $prod = $it !== null ? ($produtos[$it['produto']] ?? null) : null;
                [$chave, $rotulo] = match ($dimensao) {
                    'produto'   => [$it['produto'], $it['nome']],
                    'sku'       => [$it['sku'], $it['sku']],
                    'categoria' => [$prod['categoria'] ?? '?', $categorias[$prod['categoria'] ?? '']['nome'] ?? '—'],
                    'cliente'   => [$p['cliente'], $clientes[$p['cliente']]['nome'] ?? $p['cliente']],
                    'canal'     => [$p['canal'], $canais[$p['canal']]['nome'] ?? $p['canal']],
                    'vendedor'  => [$p['vendedor'], $vendedores[$p['vendedor']]['nome'] ?? $p['vendedor']],
                    'periodo'   => [substr($p['data'], 0, 7), substr($p['data'], 0, 7)],
                    default     => [$p['id'], $p['numero']],
                };

                $proporcao = $p['subtotal'] > 0 ? $receitaBruta / $p['subtotal'] : 1.0;
                $desconto  = $p['desconto'] * $proporcao;
                $frete     = $p['frete'] * $proporcao;
                $custo     = $it !== null ? $it['custo_unitario'] * $it['quantidade'] : $p['custo'];
                $receita   = $receitaBruta - $desconto;
                $comissao  = $receita * $comissaoPct;
                $taxaValor = $receita * $taxa;
                // Estimativa de imposto — declarada como estimativa em toda a UI (§26.2).
                $imposto   = $receita * 0.115;
                $lucro     = $receita - $custo - $comissao - $taxaValor - $imposto - $frete;

                if (!isset($acum[$chave])) {
                    $acum[$chave] = [
                        'id' => $chave, 'rotulo' => $rotulo, 'receita' => 0.0, 'desconto' => 0.0,
                        'frete' => 0.0, 'comissao' => 0.0, 'impostos' => 0.0, 'taxas' => 0.0,
                        'custo' => 0.0, 'lucro' => 0.0, 'pedidos' => 0, 'unidades' => 0,
                    ];
                }
                $a = &$acum[$chave];
                $a['receita']  += $receita;
                $a['desconto'] += $desconto;
                $a['frete']    += $frete;
                $a['comissao'] += $comissao;
                $a['impostos'] += $imposto;
                $a['taxas']    += $taxaValor;
                $a['custo']    += $custo;
                $a['lucro']    += $lucro;
                $a['pedidos']  += $it === null ? 1 : 0;
                $a['unidades'] += $it !== null ? $it['quantidade'] : 0;
                unset($a);
            }
        }

        $lista = array_values($acum);
        foreach ($lista as &$l) {
            foreach (['receita', 'desconto', 'frete', 'comissao', 'impostos', 'taxas', 'custo', 'lucro'] as $c) {
                $l[$c] = round($l[$c], 2);
            }
            $l['margem_pct'] = $l['receita'] > 0 ? round(($l['lucro'] / $l['receita']) * 100, 1) : 0.0;
            $l['prejuizo'] = $l['lucro'] < 0;
        }
        unset($l);
        usort($lista, static fn($a, $b) => $b['receita'] <=> $a['receita']);

        return $lista;
    }

    // ─────────────────────────────────────────────────────────────
    // Insights por regra (§42)
    // ─────────────────────────────────────────────────────────────

    public function insights(array $f): array
    {
        $saida = [];
        $pedidos = $this->pedidosValidos($this->colecao('pedidos'));

        // 1. Queda de vendas: ultimos 7 dias vs 7 anteriores.
        $ult7 = $this->noPeriodo($pedidos, 'data', ['de' => date('Y-m-d', strtotime('-6 days')), 'ate' => date('Y-m-d')]);
        $ant7 = $this->noPeriodo($pedidos, 'data', ['de' => date('Y-m-d', strtotime('-13 days')), 'ate' => date('Y-m-d', strtotime('-7 days'))]);
        $fatU = array_sum(array_column($ult7, 'total'));
        $fatA = array_sum(array_column($ant7, 'total'));
        $var  = $this->variacao($fatU, $fatA);
        if ($var !== null && $var <= -12) {
            $saida[] = $this->insight('queda_vendas', 'critica', 'Queda de faturamento nos últimos 7 dias',
                sprintf('Faturamento de %s contra %s no período anterior (%.1f%%).',
                    $this->moeda($fatU), $this->moeda($fatA), $var),
                abs($var) >= 25 ? 'alta' : 'media', $fatA - $fatU,
                'Verificar canais com maior perda e pedidos parados.', 'vendas',
                ['atual' => $fatU, 'anterior' => $fatA, 'variacao_pct' => $var]);
        }

        // 2. Aumento de cancelamentos.
        $todos30 = $this->noPeriodo($this->colecao('pedidos'), 'data', ['de' => date('Y-m-d', strtotime('-29 days')), 'ate' => date('Y-m-d')]);
        $canc = count(array_filter($todos30, static fn($p) => $p['situacao'] === 'cancelado'));
        $taxaCanc = count($todos30) > 0 ? ($canc / count($todos30)) * 100 : 0;
        if ($taxaCanc > 5) {
            $saida[] = $this->insight('cancelamentos', 'alta', 'Taxa de cancelamento acima do esperado',
                sprintf('%d de %d pedidos cancelados nos últimos 30 dias (%.1f%%).', $canc, count($todos30), $taxaCanc),
                'media', null, 'Revisar motivos de cancelamento por canal.', 'pedidos-venda',
                ['cancelados' => $canc, 'total' => count($todos30), 'taxa_pct' => round($taxaCanc, 1)]);
        }

        // 3. Estoque divergente.
        $div = array_values(array_filter($this->colecao('estoque'), static fn($e) => $e['divergencia'] !== 0));
        if (count($div) > 0) {
            $saida[] = $this->insight('estoque_divergente', 'media', 'Divergências de estoque detectadas',
                sprintf('%d combinação(ões) produto/depósito com saldo divergente.', count($div)),
                'alta', null, 'Programar contagem cíclica nos itens afetados.', 'estoque',
                ['ocorrencias' => count($div)]);
        }

        // 4. Erro fiscal recorrente: mesmo codigo aparecendo 3+ vezes.
        $porCodigo = [];
        foreach ($this->colecao('notas') as $n) {
            if ($n['situacao'] === 'rejeitada' && $n['erro'] !== null) {
                $porCodigo[$n['erro']['codigo']] = ($porCodigo[$n['erro']['codigo']] ?? 0) + 1;
            }
        }
        arsort($porCodigo);
        foreach (array_slice($porCodigo, 0, 3, true) as $codigo => $qtd) {
            if ($qtd < 3) {
                continue;
            }
            $saida[] = $this->insight("erro_fiscal_$codigo", 'alta', "Rejeição fiscal recorrente — código $codigo",
                sprintf('%d notas rejeitadas com o mesmo código.', $qtd),
                'alta', null, 'Corrigir a causa no cadastro em vez de reenviar caso a caso.', 'notas-fiscais',
                ['codigo' => $codigo, 'ocorrencias' => $qtd]);
        }

        // 5. Produtos parados com estoque.
        $parados = array_values(array_filter($this->colecao('estoque'), static fn($e) => $e['status'] === 'parado'));
        if (count($parados) > 0) {
            $saida[] = $this->insight('produtos_parados', 'media', 'Produtos com estoque e sem venda em 90 dias',
                sprintf('%d item(ns) sem saída no período.', count($parados)),
                'media', null, 'Avaliar promoção ou desmobilização.', 'estoque',
                ['ocorrencias' => count($parados)]);
        }

        // 6. Fornecedor com atraso sistematico.
        $compras = $this->colecao('compras');
        $atrasoPorForn = [];
        foreach ($compras as $c) {
            if ($c['recebimento'] === null) {
                continue;
            }
            $atraso = (int) ((strtotime($c['recebimento']) - strtotime($c['previsao'])) / 86400);
            $atrasoPorForn[$c['fornecedor']][] = $atraso;
        }
        $fornecedores = [];
        foreach ($this->colecao('fornecedores') as $fo) {
            $fornecedores[$fo['id']] = $fo;
        }
        foreach ($atrasoPorForn as $fid => $atrasos) {
            if (count($atrasos) < 4) {
                continue;
            }
            $media = array_sum($atrasos) / count($atrasos);
            if ($media >= 6) {
                $saida[] = $this->insight("atraso_forn_$fid", 'media',
                    'Atraso sistemático de fornecedor: ' . ($fornecedores[$fid]['nome'] ?? $fid),
                    sprintf('Média de %.1f dias de atraso em %d entregas.', $media, count($atrasos)),
                    'media', null, 'Renegociar prazo ou buscar fornecedor alternativo.', 'fornecedores',
                    ['fornecedor' => $fid, 'atraso_medio_dias' => round($media, 1), 'entregas' => count($atrasos)]);
            }
        }

        // 7. Inadimplencia concentrada.
        $vencidos = array_values(array_filter($this->colecao('receber'), static fn($r) => $r['situacao'] === 'vencido'));
        if (count($vencidos) > 0) {
            $porCliente = [];
            foreach ($vencidos as $v) {
                $porCliente[$v['cliente']] = ($porCliente[$v['cliente']] ?? 0) + $v['saldo'];
            }
            arsort($porCliente);
            $topCliente = array_key_first($porCliente);
            $totalVenc = array_sum($porCliente);
            $conc = $totalVenc > 0 ? ($porCliente[$topCliente] / $totalVenc) * 100 : 0;
            if ($conc > 18) {
                $clientes = [];
                foreach ($this->colecao('clientes') as $c) {
                    $clientes[$c['id']] = $c;
                }
                $saida[] = $this->insight('inadimplencia_concentrada', 'alta', 'Inadimplência concentrada em um cliente',
                    sprintf('%s responde por %.1f%% do total vencido (%s).',
                        $clientes[$topCliente]['nome'] ?? $topCliente, $conc, $this->moeda($porCliente[$topCliente])),
                    'alta', $porCliente[$topCliente], 'Priorizar cobrança e revisar limite de crédito.', 'contas-receber',
                    ['cliente' => $topCliente, 'concentracao_pct' => round($conc, 1)]);
            }
        }

        // 8. Sincronizacao incompleta.
        $syncRuim = array_values(array_filter($this->colecao('sync'), static fn($s) => in_array($s['situacao'], ['erro', 'parcial'], true)));
        if (count($syncRuim) > 0) {
            $saida[] = $this->insight('sync_incompleta', 'alta', 'Sincronização incompleta em recursos ativos',
                sprintf('%d recurso(s) com erro ou carga parcial.', count($syncRuim)),
                'alta', null, 'Reprocessar a partir do cursor registrado.', 'sincronizacao',
                ['recursos' => array_column($syncRuim, 'recurso')]);
        }

        return $saida;
    }

    protected function insight(
        string $id, string $severidade, string $titulo, string $evidencia,
        string $confianca, ?float $impacto, string $recomendacao, string $tela, array $dados
    ): array {
        return [
            'id' => $id, 'severidade' => $severidade, 'titulo' => $titulo,
            'evidencia' => $evidencia, 'periodo' => ['de' => null, 'ate' => null],
            'impacto' => $impacto === null ? null : round($impacto, 2),
            'recomendacao' => $recomendacao, 'confianca' => $confianca,
            'origem' => $this->ehSimulado() ? 'dados simulados' : 'banco local BLING',
            'tela' => $tela, 'dados' => $dados,
        ];
    }

    protected function moeda(float $v): string
    {
        return 'R$ ' . number_format($v, 2, ',', '.');
    }

    // ─────────────────────────────────────────────────────────────
    // Paginacao e ordenacao (usadas por todo grid server-side, §51)
    // ─────────────────────────────────────────────────────────────

    protected function ordenar(array $linhas, string $campo, string $direcao): array
    {
        if ($campo === '') {
            return $linhas;
        }
        usort($linhas, static function ($a, $b) use ($campo, $direcao) {
            $va = $a[$campo] ?? null;
            $vb = $b[$campo] ?? null;
            $cmp = is_numeric($va) && is_numeric($vb) ? ($va <=> $vb) : strcmp((string) $va, (string) $vb);
            return $direcao === 'asc' ? $cmp : -$cmp;
        });
        return $linhas;
    }

    protected function paginar(array $linhas, array $f): array
    {
        $total = count($linhas);
        $offset = ($f['pagina'] - 1) * $f['limite'];
        return [
            'itens'   => array_slice($linhas, $offset, $f['limite']),
            'total'   => $total,
            'pagina'  => $f['pagina'],
            'limite'  => $f['limite'],
            'paginas' => (int) ceil($total / max(1, $f['limite'])),
        ];
    }

    /** Busca textual simples sobre um conjunto de campos. */
    protected function buscar(array $linhas, string $termo, array $campos): array
    {
        if ($termo === '') {
            return $linhas;
        }
        $t = mb_strtolower($termo);
        return array_values(array_filter($linhas, static function ($l) use ($t, $campos) {
            foreach ($campos as $c) {
                if (isset($l[$c]) && str_contains(mb_strtolower((string) $l[$c]), $t)) {
                    return true;
                }
            }
            return false;
        }));
    }
}
