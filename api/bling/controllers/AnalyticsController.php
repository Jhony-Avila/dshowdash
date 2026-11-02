<?php
// Bling / controllers/AnalyticsController.php - telas analiticas
// @module  bling.controller.analytics
// @version 1.0.0
// @created 2026-07-30
//
// Serve §24 (matriz de estoque), §26 (precos/simulador), §31 (funil fiscal),
// §34 (fluxo de caixa), §35 (Sankey financeiro), §40 (rentabilidade),
// §41 (curva ABC), §42 (insights), §43 (relatorios).
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class AnalyticsController
{
    /** GET /abc?dimensao=produtos|clientes|canais|categorias&metrica=... */
    public static function abc(): void
    {
        $f = bling_filtros();
        $dim = bling_str('dimensao', 'produtos', 20);
        $met = bling_str('metrica', 'faturamento', 20);

        $dimsOk = ['produtos', 'clientes', 'canais', 'categorias', 'fornecedores'];
        $metsOk = ['faturamento', 'margem', 'unidades', 'frequencia'];
        if (!in_array($dim, $dimsOk, true)) {
            $dim = 'produtos';
        }
        if (!in_array($met, $metsOk, true)) {
            $met = 'faturamento';
        }

        $r = BlingProvider::atual()->curvaAbc($dim, $met, $f);

        // Resumo por classe: e o que o grafico de Pareto precisa destacar.
        $classes = ['A' => ['itens' => 0, 'valor' => 0.0], 'B' => ['itens' => 0, 'valor' => 0.0], 'C' => ['itens' => 0, 'valor' => 0.0]];
        foreach ($r['itens'] as $i) {
            $classes[$i['classe']]['itens']++;
            $classes[$i['classe']]['valor'] += $i['valor'];
        }
        foreach ($classes as $k => &$c) {
            $c['classe'] = $k;
            $c['valor'] = round($c['valor'], 2);
            $c['participacao'] = $r['total'] > 0 ? round(($c['valor'] / $r['total']) * 100, 1) : 0.0;
        }
        unset($c);

        ApiResponse::success([
            'dimensao' => $dim, 'metrica' => $met,
            'itens'    => $r['itens'], 'total' => $r['total'],
            'classes'  => array_values($classes),
            'dimensoes_disponiveis' => $dimsOk,
            'metricas_disponiveis'  => $metsOk,
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /profitability?dimensao=pedido|produto|sku|cliente|canal|vendedor|categoria|periodo */
    public static function rentabilidade(): void
    {
        $f = bling_filtros();
        $dim = bling_str('dimensao', 'canal', 20);
        $dimsOk = ['pedido', 'produto', 'sku', 'cliente', 'canal', 'vendedor', 'categoria', 'periodo'];
        if (!in_array($dim, $dimsOk, true)) {
            $dim = 'canal';
        }

        $linhas = BlingProvider::atual()->rentabilidade($dim, $f);

        // Waterfall consolidado: receita -> deducoes -> lucro.
        $soma = static fn(string $c) => round(array_sum(array_column($linhas, $c)), 2);
        $waterfall = [
            ['id' => 'receita',  'rotulo' => 'Receita bruta', 'valor' => $soma('receita') + $soma('desconto'), 'tipo' => 'inicial'],
            ['id' => 'desconto', 'rotulo' => 'Descontos',     'valor' => -$soma('desconto'), 'tipo' => 'reducao'],
            ['id' => 'custo',    'rotulo' => 'Custo',         'valor' => -$soma('custo'),    'tipo' => 'reducao'],
            ['id' => 'comissao', 'rotulo' => 'Comissões',     'valor' => -$soma('comissao'), 'tipo' => 'reducao'],
            ['id' => 'taxas',    'rotulo' => 'Taxas',         'valor' => -$soma('taxas'),    'tipo' => 'reducao'],
            ['id' => 'impostos', 'rotulo' => 'Impostos (est.)','valor' => -$soma('impostos'),'tipo' => 'reducao'],
            ['id' => 'frete',    'rotulo' => 'Frete',         'valor' => -$soma('frete'),    'tipo' => 'reducao'],
            ['id' => 'lucro',    'rotulo' => 'Lucro',         'valor' => $soma('lucro'),     'tipo' => 'final'],
        ];

        ApiResponse::success([
            'dimensao'  => $dim,
            'itens'     => $linhas,
            'waterfall' => $waterfall,
            'prejuizo'  => array_values(array_filter($linhas, static fn($l) => $l['prejuizo'])),
            'dimensoes_disponiveis' => $dimsOk,
            'nota' => 'Impostos e taxas são estimativas. Não substituem apuração contábil.',
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /fiscal-funnel — §31. */
    public static function funilFiscal(): void
    {
        $f = bling_filtros();
        ApiResponse::success(['etapas' => BlingProvider::atual()->funilFiscal($f)], bling_meta(['filtros' => $f]));
    }

    /** GET /insights — §42. */
    public static function insights(): void
    {
        $f = bling_filtros();
        $ins = BlingProvider::atual()->insights($f);
        foreach ($ins as &$i) {
            $i['periodo'] = ['de' => $f['de'], 'ate' => $f['ate']];
        }
        unset($i);
        ApiResponse::success(['insights' => $ins], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /cashflow — §34. Entradas, saidas, saldo diario e acumulado.
     * Separa REALIZADO de PREVISTO: misturar os dois numa serie so e como
     * um relatorio financeiro vira ficcao.
     */
    public static function fluxoCaixa(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $hoje = date('Y-m-d');

        $entradas = [];
        $saidas = [];
        foreach ($p->colecao('receber') as $r) {
            if ($r['vencimento'] < $f['de'] || $r['vencimento'] > $f['ate']) {
                continue;
            }
            $d = $r['vencimento'];
            $entradas[$d]['previsto'] = ($entradas[$d]['previsto'] ?? 0) + $r['valor'];
            $entradas[$d]['realizado'] = ($entradas[$d]['realizado'] ?? 0) + $r['recebido'];
            if ($r['situacao'] === 'vencido') {
                $entradas[$d]['vencido'] = ($entradas[$d]['vencido'] ?? 0) + $r['saldo'];
            }
        }
        foreach ($p->colecao('pagar') as $t) {
            if ($t['vencimento'] < $f['de'] || $t['vencimento'] > $f['ate']) {
                continue;
            }
            $d = $t['vencimento'];
            $saidas[$d]['previsto'] = ($saidas[$d]['previsto'] ?? 0) + $t['valor'];
            $saidas[$d]['realizado'] = ($saidas[$d]['realizado'] ?? 0) + $t['pago'];
            if ($t['situacao'] === 'vencido') {
                $saidas[$d]['vencido'] = ($saidas[$d]['vencido'] ?? 0) + $t['saldo'];
            }
        }

        $pontos = [];
        $acumulado = 0.0;
        $cursor = strtotime($f['de']);
        $fim = strtotime($f['ate']);
        while ($cursor <= $fim) {
            $d = date('Y-m-d', $cursor);
            $ePrev = round($entradas[$d]['previsto'] ?? 0, 2);
            $eReal = round($entradas[$d]['realizado'] ?? 0, 2);
            $sPrev = round($saidas[$d]['previsto'] ?? 0, 2);
            $sReal = round($saidas[$d]['realizado'] ?? 0, 2);

            // Antes de hoje o saldo acumula pelo REALIZADO; a partir de hoje, pelo PREVISTO.
            $saldoDia = $d <= $hoje ? ($eReal - $sReal) : ($ePrev - $sPrev);
            $acumulado += $saldoDia;

            $pontos[] = [
                'data' => $d,
                'entradas_previsto'  => $ePrev,
                'entradas_realizado' => $eReal,
                'saidas_previsto'    => $sPrev,
                'saidas_realizado'   => $sReal,
                'entradas_vencido'   => round($entradas[$d]['vencido'] ?? 0, 2),
                'saidas_vencido'     => round($saidas[$d]['vencido'] ?? 0, 2),
                'saldo_dia'          => round($saldoDia, 2),
                'saldo_acumulado'    => round($acumulado, 2),
                'projetado'          => $d > $hoje,
            ];
            $cursor = strtotime('+1 day', $cursor);
        }

        // Agregacao opcional (§34: diario, semanal, mensal).
        $g = $f['granularidade'];
        if ($g !== 'dia') {
            $mapa = [];
            foreach ($pontos as $pt) {
                $k = $g === 'mes' ? substr($pt['data'], 0, 7) : date('o-\WW', strtotime($pt['data']));
                if (!isset($mapa[$k])) {
                    $mapa[$k] = $pt;
                    $mapa[$k]['data'] = $k;
                    continue;
                }
                foreach (['entradas_previsto', 'entradas_realizado', 'saidas_previsto', 'saidas_realizado',
                          'entradas_vencido', 'saidas_vencido', 'saldo_dia'] as $c) {
                    $mapa[$k][$c] = round($mapa[$k][$c] + $pt[$c], 2);
                }
                $mapa[$k]['saldo_acumulado'] = $pt['saldo_acumulado'];
                $mapa[$k]['projetado'] = $mapa[$k]['projetado'] && $pt['projetado'];
            }
            $pontos = array_values($mapa);
        }

        ApiResponse::success([
            'granularidade' => $g,
            'pontos' => $pontos,
            'resumo' => [
                'entradas_previsto'  => round(array_sum(array_column($pontos, 'entradas_previsto')), 2),
                'entradas_realizado' => round(array_sum(array_column($pontos, 'entradas_realizado')), 2),
                'saidas_previsto'    => round(array_sum(array_column($pontos, 'saidas_previsto')), 2),
                'saidas_realizado'   => round(array_sum(array_column($pontos, 'saidas_realizado')), 2),
                'saldo_final'        => $pontos === [] ? 0.0 : end($pontos)['saldo_acumulado'],
            ],
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /financial-flow — §35. Sankey do valor: canal -> receita -> deducoes -> margem.
     * O objetivo e mostrar ONDE o dinheiro encolhe, nao quanto entrou.
     */
    public static function fluxoFinanceiro(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $linhas = $p->rentabilidade('canal', $f);

        $nos = [];
        $links = [];
        $add = static function (string $de, string $para, float $valor) use (&$links, &$nos): void {
            if ($valor <= 0) {
                return;
            }
            $nos[$de] = true;
            $nos[$para] = true;
            $k = "$de\x00$para";
            $links[$k] = ['origem' => $de, 'destino' => $para, 'valor' => round(($links[$k]['valor'] ?? 0) + $valor, 2)];
        };

        foreach ($linhas as $l) {
            $add($l['rotulo'], 'Receita', $l['receita']);
        }

        $soma = static fn(string $c) => round(array_sum(array_column($linhas, $c)), 2);
        $add('Receita', 'Custo do produto', $soma('custo'));
        $add('Receita', 'Impostos (est.)',  $soma('impostos'));
        $add('Receita', 'Taxas',            $soma('taxas'));
        $add('Receita', 'Comissões',        $soma('comissao'));
        $add('Receita', 'Frete',            $soma('frete'));
        $add('Receita', 'Margem',           max(0, $soma('lucro')));

        ApiResponse::success([
            'nos' => array_values(array_map(static fn($n) => ['id' => $n, 'nome' => $n], array_keys($nos))),
            'links' => array_values($links),
            'prejuizo_total' => $soma('lucro') < 0 ? abs($soma('lucro')) : 0.0,
            'nota' => 'Impostos e taxas são estimativas.',
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /inventory-matrix — §24.3, matriz giro x margem com quadrantes.
     * O corte usa a MEDIANA, nao a media: com poucos itens de giro altissimo,
     * a media joga quase tudo para o quadrante de baixo giro e a matriz mente.
     */
    public static function matrizEstoque(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $produtos = [];
        foreach ($p->colecao('produtos') as $prod) {
            $produtos[$prod['id']] = $prod;
        }

        $porProduto = [];
        foreach ($p->colecao('estoque') as $e) {
            if (!isset($porProduto[$e['produto']])) {
                $porProduto[$e['produto']] = ['giro' => 0.0, 'disponivel' => 0, 'valor' => 0.0];
            }
            $porProduto[$e['produto']]['giro'] = max($porProduto[$e['produto']]['giro'], $e['giro_anual']);
            $porProduto[$e['produto']]['disponivel'] += $e['disponivel'];
            $porProduto[$e['produto']]['valor'] += max(0, $e['fisico']) * ($produtos[$e['produto']]['custo'] ?? 0);
        }

        $itens = [];
        foreach ($porProduto as $pid => $d) {
            $prod = $produtos[$pid] ?? null;
            if ($prod === null) {
                continue;
            }
            $itens[] = [
                'id' => $pid, 'sku' => $prod['sku'], 'produto' => $prod['nome'],
                'giro' => round($d['giro'], 2), 'margem_pct' => $prod['margem_pct'],
                'disponivel' => $d['disponivel'], 'valor' => round($d['valor'], 2),
                'receita' => $prod['receita'],
            ];
        }

        $mediana = static function (array $v): float {
            if ($v === []) {
                return 0.0;
            }
            sort($v);
            $n = count($v);
            return $n % 2 === 1 ? (float) $v[intdiv($n, 2)] : (($v[$n / 2 - 1] + $v[$n / 2]) / 2);
        };
        $corteGiro = $mediana(array_column($itens, 'giro'));
        $corteMargem = $mediana(array_column($itens, 'margem_pct'));

        foreach ($itens as &$i) {
            $altoGiro = $i['giro'] >= $corteGiro;
            $altaMargem = $i['margem_pct'] >= $corteMargem;
            $i['quadrante'] = match (true) {
                $altoGiro && $altaMargem   => 'estrela',
                $altoGiro && !$altaMargem  => 'volume',
                !$altoGiro && $altaMargem  => 'nicho',
                default                    => 'revisar',
            };
        }
        unset($i);

        $quadrantes = [
            ['id' => 'estrela', 'rotulo' => 'Alto giro e alta margem', 'cor' => 'sucesso',
             'acao' => 'Proteger disponibilidade — é o que sustenta o resultado.'],
            ['id' => 'volume',  'rotulo' => 'Alto giro e baixa margem', 'cor' => 'info',
             'acao' => 'Revisar preço ou custo de compra.'],
            ['id' => 'nicho',   'rotulo' => 'Baixo giro e alta margem', 'cor' => 'aviso',
             'acao' => 'Avaliar esforço comercial dirigido.'],
            ['id' => 'revisar', 'rotulo' => 'Baixo giro e baixa margem', 'cor' => 'erro',
             'acao' => 'Candidato a descontinuar ou liquidar.'],
        ];
        foreach ($quadrantes as &$q) {
            $doQuadrante = array_values(array_filter($itens, static fn($i) => $i['quadrante'] === $q['id']));
            $q['itens'] = count($doQuadrante);
            $q['valor_estoque'] = round(array_sum(array_column($doQuadrante, 'valor')), 2);
            $q['receita'] = round(array_sum(array_column($doQuadrante, 'receita')), 2);
        }
        unset($q);

        ApiResponse::success([
            'itens' => $itens,
            'cortes' => ['giro' => round($corteGiro, 2), 'margem_pct' => round($corteMargem, 1),
                         'metodo' => 'mediana'],
            'quadrantes' => $quadrantes,
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /price-simulator — §26.2.
     * Nao persiste nada: e uma calculadora. Toda saida vem rotulada como estimativa.
     */
    public static function simuladorPreco(): void
    {
        $num = static function (string $chave, float $padrao): float {
            $v = $_GET[$chave] ?? null;
            return is_numeric($v) ? (float) $v : $padrao;
        };

        $custo     = max(0.0, $num('custo', 0));
        $preco     = max(0.0, $num('preco', 0));
        $descontoP = max(0.0, min(100.0, $num('desconto_pct', 0)));
        $impostoP  = max(0.0, min(100.0, $num('imposto_pct', 11.5)));
        $comissaoP = max(0.0, min(100.0, $num('comissao_pct', 3)));
        $taxaP     = max(0.0, min(100.0, $num('taxa_pct', 0)));
        $frete     = max(0.0, $num('frete', 0));

        $precoLiquido = $preco * (1 - $descontoP / 100);
        $imposto  = $precoLiquido * $impostoP / 100;
        $comissao = $precoLiquido * $comissaoP / 100;
        $taxa     = $precoLiquido * $taxaP / 100;
        $lucro    = $precoLiquido - $custo - $imposto - $comissao - $taxa - $frete;

        // Preco de equilibrio: onde o lucro zera, dadas as aliquotas informadas.
        $fator = 1 - ($impostoP + $comissaoP + $taxaP) / 100;
        $equilibrio = $fator > 0 ? ($custo + $frete) / $fator : null;

        ApiResponse::success([
            'entrada' => [
                'custo' => $custo, 'preco' => $preco, 'desconto_pct' => $descontoP,
                'imposto_pct' => $impostoP, 'comissao_pct' => $comissaoP,
                'taxa_pct' => $taxaP, 'frete' => $frete,
            ],
            'resultado' => [
                'preco_liquido' => round($precoLiquido, 2),
                'imposto'   => round($imposto, 2),
                'comissao'  => round($comissao, 2),
                'taxa'      => round($taxa, 2),
                'frete'     => round($frete, 2),
                'custo'     => round($custo, 2),
                'lucro'     => round($lucro, 2),
                'margem_pct'=> $precoLiquido > 0 ? round(($lucro / $precoLiquido) * 100, 2) : 0.0,
                'markup'    => $custo > 0 ? round($precoLiquido / $custo, 3) : null,
                'preco_equilibrio' => $equilibrio === null ? null : round($equilibrio, 2),
                'abaixo_do_equilibrio' => $equilibrio !== null && $precoLiquido < $equilibrio,
            ],
            'nota' => 'Cálculo estimado. Impostos e taxas informados pelo usuário; não substitui apuração contábil.',
        ], bling_meta());
    }

    /** GET /reports — catalogo dos relatorios disponiveis (§43). */
    public static function relatorios(): void
    {
        $catalogo = [
            ['id' => 'pedidos',       'nome' => 'Pedidos de venda',   'recurso' => 'sales-orders',    'grupo' => 'Vendas'],
            ['id' => 'vendas',        'nome' => 'Vendas consolidadas','recurso' => 'sales',           'grupo' => 'Vendas'],
            ['id' => 'canais',        'nome' => 'Canais de venda',    'recurso' => 'channels',        'grupo' => 'Vendas'],
            ['id' => 'produtos',      'nome' => 'Produtos',           'recurso' => 'products',        'grupo' => 'Produtos'],
            ['id' => 'estoque',       'nome' => 'Estoque',            'recurso' => 'inventory',       'grupo' => 'Produtos'],
            ['id' => 'precos',        'nome' => 'Preços e custos',    'recurso' => 'prices',          'grupo' => 'Produtos'],
            ['id' => 'compras',       'nome' => 'Pedidos de compra',  'recurso' => 'purchase-orders', 'grupo' => 'Compras'],
            ['id' => 'fornecedores',  'nome' => 'Fornecedores',       'recurso' => 'suppliers',       'grupo' => 'Compras'],
            ['id' => 'clientes',      'nome' => 'Clientes',           'recurso' => 'customers',       'grupo' => 'Relacionamento'],
            ['id' => 'notas',         'nome' => 'Notas fiscais',      'recurso' => 'invoices',        'grupo' => 'Fiscal'],
            ['id' => 'receber',       'nome' => 'Contas a receber',   'recurso' => 'receivables',     'grupo' => 'Financeiro'],
            ['id' => 'pagar',         'nome' => 'Contas a pagar',     'recurso' => 'payables',        'grupo' => 'Financeiro'],
            ['id' => 'fluxo-caixa',   'nome' => 'Fluxo de caixa',     'recurso' => null,              'grupo' => 'Financeiro'],
            ['id' => 'logistica',     'nome' => 'Logística',          'recurso' => 'shipments',       'grupo' => 'Logística'],
            ['id' => 'rentabilidade', 'nome' => 'Rentabilidade',      'recurso' => null,              'grupo' => 'Inteligência'],
            ['id' => 'sincronizacao', 'nome' => 'Sincronização',      'recurso' => null,              'grupo' => 'Administração'],
            ['id' => 'auditoria',     'nome' => 'Auditoria',          'recurso' => 'audit',           'grupo' => 'Administração'],
        ];

        foreach ($catalogo as &$c) {
            $c['formatos'] = ['csv', 'xlsx', 'pdf'];
            $c['agendavel'] = false;   // §43: agendamento e fase futura, declarado como tal
        }
        unset($c);

        ApiResponse::success(['relatorios' => $catalogo], bling_meta());
    }

    /**
     * GET /forecast — §43 "Previsões".
     * Projecao por regressao linear simples sobre a serie diaria, com o R² exposto.
     * Sem o R² o usuario nao tem como saber se a projecao vale alguma coisa.
     */
    public static function previsoes(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $ev = $p->evolucao(array_merge($f, ['granularidade' => 'dia']));

        $serie = [];
        foreach ($ev['series'] as $s) {
            if ($s['id'] === 'faturamento') {
                $serie = $s['pontos'];
                break;
            }
        }

        $n = count($serie);
        if ($n < 7) {
            ApiResponse::success([
                'disponivel' => false,
                'motivo' => 'Período curto demais para projetar (mínimo de 7 dias).',
            ], bling_meta(['filtros' => $f]));
        }

        $somaX = $somaY = $somaXY = $somaXX = 0.0;
        foreach ($serie as $i => $pt) {
            $somaX += $i;
            $somaY += $pt['valor'];
            $somaXY += $i * $pt['valor'];
            $somaXX += $i * $i;
        }
        $den = ($n * $somaXX - $somaX * $somaX);
        $a = $den != 0 ? ($n * $somaXY - $somaX * $somaY) / $den : 0.0;
        $b = ($somaY - $a * $somaX) / $n;

        $media = $somaY / $n;
        $ssTot = $ssRes = 0.0;
        foreach ($serie as $i => $pt) {
            $prev = $a * $i + $b;
            $ssTot += ($pt['valor'] - $media) ** 2;
            $ssRes += ($pt['valor'] - $prev) ** 2;
        }
        $r2 = $ssTot > 0 ? max(0.0, 1 - $ssRes / $ssTot) : 0.0;

        $horizonte = bling_int('horizonte', 30, 7, 90);
        $projecao = [];
        for ($i = 0; $i < $horizonte; $i++) {
            $x = $n + $i;
            $projecao[] = [
                'data'  => date('Y-m-d', strtotime($f['ate'] . ' +' . ($i + 1) . ' days')),
                'valor' => round(max(0.0, $a * $x + $b), 2),
            ];
        }

        ApiResponse::success([
            'disponivel' => true,
            'historico'  => $serie,
            'projecao'   => $projecao,
            'modelo' => [
                'tipo' => 'regressao_linear',
                'inclinacao_dia' => round($a, 2),
                'intercepto' => round($b, 2),
                'r2' => round($r2, 3),
                'confianca' => $r2 >= 0.6 ? 'alta' : ($r2 >= 0.3 ? 'media' : 'baixa'),
                'aviso' => $r2 < 0.3
                    ? 'Ajuste fraco: a série não tem tendência linear clara. Trate a projeção como referência, não como previsão.'
                    : null,
            ],
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /warehouse-flow — §25, transferencias entre depositos. */
    public static function fluxoDepositos(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $depositos = [];
        foreach ($p->colecao('depositos') as $d) {
            $depositos[$d['id']] = $d;
        }
        $produtos = [];
        foreach ($p->colecao('produtos') as $x) {
            $produtos[$x['id']] = $x;
        }

        // Transferencia derivada: item com saldo em deposito nao-padrao veio do padrao.
        $links = [];
        foreach ($p->colecao('estoque') as $e) {
            $dep = $depositos[$e['deposito']] ?? null;
            if ($dep === null || $dep['padrao'] || $e['fisico'] <= 0) {
                continue;
            }
            $valor = $e['fisico'] * ($produtos[$e['produto']]['custo'] ?? 0);
            $k = 'Depósito Geral' . "\x00" . $dep['nome'];
            $links[$k] = [
                'origem' => 'Depósito Geral', 'destino' => $dep['nome'],
                'valor' => round(($links[$k]['valor'] ?? 0) + $valor, 2),
                'quantidade' => ($links[$k]['quantidade'] ?? 0) + $e['fisico'],
            ];
        }

        $nos = [];
        foreach ($p->colecao('depositos') as $d) {
            $nos[] = ['id' => $d['nome'], 'nome' => $d['nome'], 'padrao' => $d['padrao']];
        }

        ApiResponse::success([
            'nos' => $nos,
            'links' => array_values($links),
            'nota' => 'Fluxo inferido da distribuição atual de saldo entre depósitos. '
                    . 'O histórico real de transferências entra na integração (Fase 5).',
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /quality — §23, qualidade cadastral consolidada. */
    public static function qualidade(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $produtos = $p->colecao('produtos');

        $porCriterio = [];
        foreach ($produtos as $prod) {
            foreach ($prod['qualidade_pendencias'] as $c) {
                $porCriterio[$c] = ($porCriterio[$c] ?? 0) + 1;
            }
        }
        arsort($porCriterio);

        $rotulos = [
            'sku' => 'SKU', 'gtin' => 'GTIN/EAN', 'descricao' => 'Descrição', 'imagens' => 'Imagens',
            'categoria' => 'Categoria', 'marca' => 'Marca', 'unidade' => 'Unidade', 'peso' => 'Peso',
            'dimensoes' => 'Dimensões', 'origem' => 'Origem', 'tributacao' => 'Tributação (NCM)',
            'custo' => 'Custo', 'preco' => 'Preço', 'estoque' => 'Estoque',
            'fornecedor' => 'Fornecedor', 'canal' => 'Vínculo com canal',
        ];

        $pendencias = [];
        $total = count($produtos);
        foreach ($porCriterio as $criterio => $qtd) {
            // Impacto: receita dos produtos afetados por essa pendencia especifica.
            $receitaAfetada = 0.0;
            foreach ($produtos as $prod) {
                if (in_array($criterio, $prod['qualidade_pendencias'], true)) {
                    $receitaAfetada += $prod['receita'];
                }
            }
            $pendencias[] = [
                'criterio' => $criterio,
                'rotulo' => $rotulos[$criterio] ?? $criterio,
                'produtos' => $qtd,
                'participacao' => $total > 0 ? round(($qtd / $total) * 100, 1) : 0.0,
                'receita_afetada' => round($receitaAfetada, 2),
                'prioridade' => $receitaAfetada > 0 ? 'alta' : ($qtd > $total * 0.2 ? 'media' : 'baixa'),
                'acao' => 'Completar o campo no cadastro do produto.',
            ];
        }

        $scores = array_column($produtos, 'qualidade_score');
        sort($scores);
        $mediana = count($scores) > 0
            ? (count($scores) % 2 === 1
                ? $scores[intdiv(count($scores), 2)]
                : ($scores[count($scores) / 2 - 1] + $scores[count($scores) / 2]) / 2)
            : 0;

        ApiResponse::success([
            'resumo' => [
                'produtos' => $total,
                'score_medio' => $total > 0 ? (int) round(array_sum($scores) / $total) : 0,
                'score_mediana' => (int) round($mediana),
                'completos' => count(array_filter($produtos, static fn($x) => $x['qualidade_score'] === 100)),
                'criticos' => count(array_filter($produtos, static fn($x) => $x['qualidade_score'] < 60)),
            ],
            'pendencias' => $pendencias,
            'distribuicao' => self::histograma($scores, 10),
        ], bling_meta(['filtros' => $f]));
    }

    /** Histograma simples para a distribuicao de scores. */
    private static function histograma(array $valores, int $faixas): array
    {
        $saida = [];
        for ($i = 0; $i < $faixas; $i++) {
            $min = (int) (100 / $faixas * $i);
            $max = (int) (100 / $faixas * ($i + 1));
            $saida[] = [
                'faixa' => "$min–$max",
                'min' => $min, 'max' => $max,
                'quantidade' => count(array_filter($valores, static fn($v) => $v >= $min && ($v < $max || ($max === 100 && $v === 100)))),
            ];
        }
        return $saida;
    }
}
