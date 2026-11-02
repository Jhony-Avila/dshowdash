<?php
// Bling / controllers/HistoryController.php - séries históricas e análises profundas
// @module  bling.controller.history
// @version 1.0.0
// @created 2026-07-30
//
// Fase 3. Serve o que as telas pediam e ainda não existia:
//   §26.1  histórico de preço, custo, margem, volume e estoque
//   §24.2  cobertura, projeção de ruptura, aging, estoque × venda
//   §39    prazo prometido × realizado, custo por região, distribuição de prazo
//   §40    matriz margem × volume
//
// Tudo deriva do MESMO grafo das outras telas — nenhuma série é inventada aqui.
// Quando um dado não existe na Fase 2 (histórico real de preço, por exemplo), a
// resposta diz isso em `origem`, em vez de fabricar uma curva bonita.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class HistoryController
{
    /**
     * GET /price-history?produto=<id> — §26.1
     *
     * O grafo não guarda histórico de alteração de preço (isso vem da API na
     * Fase 5, via `bling_price_history`). O que existe de real é o preço/custo
     * ATUAL e as VENDAS por dia. A série mostra o que é real — volume e receita
     * por dia — e marca preço e custo como linhas constantes, declarando em
     * `origem` que são o valor vigente, não uma reconstrução histórica.
     *
     * Desenhar uma curva de preço variando seria a mentira mais fácil desta tela.
     */
    public static function historicoPreco(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $produtoId = bling_str('produto', '', 40);

        $produtos = [];
        foreach ($p->colecao('produtos') as $x) {
            $produtos[$x['id']] = $x;
        }

        if ($produtoId === '' || !isset($produtos[$produtoId])) {
            // Sem produto escolhido: devolve os candidatos mais relevantes.
            $lista = array_values($p->colecao('produtos'));
            usort($lista, static fn($a, $b) => $b['receita'] <=> $a['receita']);
            ApiResponse::success([
                'selecionado' => null,
                'sugestoes' => array_map(static fn($x) => [
                    'id' => $x['id'], 'sku' => $x['sku'], 'nome' => $x['nome'],
                    'receita' => $x['receita'], 'margem_pct' => $x['margem_pct'],
                ], array_slice($lista, 0, 30)),
            ], bling_meta(['filtros' => $f]));
        }

        $prod = $produtos[$produtoId];

        // Unidades e receita por dia, a partir dos pedidos reais.
        $porDia = [];
        $cursor = strtotime($f['de']);
        $fim = strtotime($f['ate']);
        while ($cursor <= $fim) {
            $porDia[date('Y-m-d', $cursor)] = ['unidades' => 0, 'receita' => 0.0];
            $cursor = strtotime('+1 day', $cursor);
        }
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            foreach ($ped['itens'] as $it) {
                if ($it['produto'] !== $produtoId || !isset($porDia[$ped['data']])) {
                    continue;
                }
                $porDia[$ped['data']]['unidades'] += $it['quantidade'];
                $porDia[$ped['data']]['receita']  += $it['total'];
            }
        }

        $precoVigente = $prod['preco_promocional'] ?? $prod['preco'];
        $margemVigente = $precoVigente > 0
            ? round((($precoVigente - $prod['custo']) / $precoVigente) * 100, 1) : 0.0;

        $pontos = [];
        foreach ($porDia as $data => $d) {
            $pontos[] = [
                'data'      => $data,
                'unidades'  => $d['unidades'],
                'receita'   => round($d['receita'], 2),
                // Preço e custo vigentes, repetidos — declarados como tal.
                'preco'     => $precoVigente,
                'custo'     => $prod['custo'],
                'margem_pct'=> $margemVigente,
            ];
        }

        $estoquePorDeposito = [];
        foreach ($p->colecao('estoque') as $e) {
            if ($e['produto'] === $produtoId) {
                $estoquePorDeposito[] = $e;
            }
        }

        ApiResponse::success([
            'selecionado' => [
                'id' => $prod['id'], 'sku' => $prod['sku'], 'nome' => $prod['nome'],
                'preco' => $prod['preco'], 'preco_promocional' => $prod['preco_promocional'],
                'custo' => $prod['custo'], 'margem_pct' => $prod['margem_pct'],
                'markup' => $prod['custo'] > 0 ? round($precoVigente / $prod['custo'], 2) : null,
                'estoque_total' => $prod['estoque_total'],
                'unidades_vendidas' => $prod['unidades_vendidas'],
                'receita' => $prod['receita'],
                'ultima_venda' => $prod['ultima_venda'],
            ],
            'pontos' => $pontos,
            'estoque_por_deposito' => $estoquePorDeposito,
            'origem' => [
                'unidades' => 'real — pedidos do período',
                'receita'  => 'real — itens dos pedidos',
                'preco'    => 'VALOR VIGENTE repetido, não histórico',
                'custo'    => 'VALOR VIGENTE repetido, não histórico',
            ],
            'nota' => 'O histórico de alteração de preço e custo só existe a partir da '
                    . 'integração real (tabela bling_price_history, Fase 4). As linhas de '
                    . 'preço e custo mostram o valor vigente hoje — não uma reconstrução.',
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /inventory-analytics — §24.2
     * Cobertura, projeção de ruptura, aging, estoque × venda.
     */
    public static function analiseEstoque(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $hoje = date('Y-m-d');

        $produtos = [];
        foreach ($p->colecao('produtos') as $x) {
            $produtos[$x['id']] = $x;
        }
        $depositos = [];
        foreach ($p->colecao('depositos') as $d) {
            $depositos[$d['id']] = $d;
        }

        $estoque = $p->colecao('estoque');
        if ($f['deposito'] !== '') {
            $estoque = array_values(array_filter($estoque,
                static fn($e) => $e['deposito'] === $f['deposito']));
        }

        // ── Cobertura: distribuição em faixas ────────────────────
        $faixas = [
            ['id' => 'ruptura',  'rotulo' => 'Sem cobertura',  'min' => null, 'max' => 0,   'cor' => 'erro'],
            ['id' => 'critica',  'rotulo' => 'Até 7 dias',     'min' => 0,    'max' => 7,   'cor' => 'erro'],
            ['id' => 'baixa',    'rotulo' => '8 a 15 dias',    'min' => 7,    'max' => 15,  'cor' => 'aviso'],
            ['id' => 'adequada', 'rotulo' => '16 a 45 dias',   'min' => 15,   'max' => 45,  'cor' => 'sucesso'],
            ['id' => 'alta',     'rotulo' => '46 a 90 dias',   'min' => 45,   'max' => 90,  'cor' => 'info'],
            ['id' => 'excesso',  'rotulo' => 'Acima de 90',    'min' => 90,   'max' => null,'cor' => 'neutro'],
            ['id' => 'parado',   'rotulo' => 'Sem consumo',    'min' => null, 'max' => null,'cor' => 'neutro'],
        ];
        $contagem = array_fill_keys(array_column($faixas, 'id'), ['itens' => 0, 'valor' => 0.0]);

        // ── Projeção de ruptura: quando cada item zera ───────────
        $rupturas = [];
        // ── Aging: há quanto tempo o saldo não se move ───────────
        $aging = [
            ['id' => '0-30',    'rotulo' => 'Até 30 dias',   'itens' => 0, 'valor' => 0.0],
            ['id' => '31-60',   'rotulo' => '31 a 60 dias',  'itens' => 0, 'valor' => 0.0],
            ['id' => '61-90',   'rotulo' => '61 a 90 dias',  'itens' => 0, 'valor' => 0.0],
            ['id' => '91-180',  'rotulo' => '91 a 180 dias', 'itens' => 0, 'valor' => 0.0],
            ['id' => '180+',    'rotulo' => 'Mais de 180',   'itens' => 0, 'valor' => 0.0],
        ];
        // ── Estoque × venda: dispersão ───────────────────────────
        $dispersao = [];

        foreach ($estoque as $e) {
            $prod = $produtos[$e['produto']] ?? null;
            if ($prod === null) {
                continue;
            }
            $valor = max(0, $e['fisico']) * $prod['custo'];
            $cob = $e['cobertura_dias'];

            // cobertura
            $chave = match (true) {
                $e['consumo_90d'] === 0 => 'parado',
                $e['disponivel'] <= 0   => 'ruptura',
                $cob === null           => 'parado',
                $cob <= 7               => 'critica',
                $cob <= 15              => 'baixa',
                $cob <= 45              => 'adequada',
                $cob <= 90              => 'alta',
                default                 => 'excesso',
            };
            $contagem[$chave]['itens']++;
            $contagem[$chave]['valor'] += $valor;

            // ruptura projetada
            if ($cob !== null && $cob > 0 && $cob <= 60 && $e['disponivel'] > 0) {
                $rupturas[] = [
                    'produto'    => $prod['nome'],
                    'sku'        => $prod['sku'],
                    'deposito'   => $depositos[$e['deposito']]['nome'] ?? $e['deposito'],
                    'disponivel' => $e['disponivel'],
                    'consumo_dia'=> $e['consumo_dia'],
                    'cobertura_dias' => $cob,
                    'data_ruptura'   => date('Y-m-d', strtotime("$hoje +" . (int) floor($cob) . ' days')),
                    'valor'      => round($valor, 2),
                    'urgencia'   => $cob <= 7 ? 'critica' : ($cob <= 15 ? 'alta' : 'media'),
                ];
            }

            // aging
            $dias = (int) ((strtotime($hoje) - strtotime($e['ultima_movimentacao'])) / 86400);
            $iAging = match (true) {
                $dias <= 30  => 0, $dias <= 60  => 1,
                $dias <= 90  => 2, $dias <= 180 => 3, default => 4,
            };
            $aging[$iAging]['itens']++;
            $aging[$iAging]['valor'] += $valor;

            // estoque × venda
            if ($e['fisico'] > 0 || $e['consumo_90d'] > 0) {
                $dispersao[] = [
                    'id'        => $e['produto'] . '|' . $e['deposito'],
                    'sku'       => $prod['sku'],
                    'produto'   => $prod['nome'],
                    'estoque'   => $e['disponivel'],
                    'vendas_90d'=> $e['consumo_90d'],
                    'valor'     => round($valor, 2),
                    'status'    => $e['status'],
                ];
            }
        }

        foreach ($faixas as &$fx) {
            $fx['itens'] = $contagem[$fx['id']]['itens'];
            $fx['valor'] = round($contagem[$fx['id']]['valor'], 2);
        }
        unset($fx);
        foreach ($aging as &$a) {
            $a['valor'] = round($a['valor'], 2);
        }
        unset($a);

        $peso = ['critica' => 0, 'alta' => 1, 'media' => 2];
        usort($rupturas, static fn($a, $b) =>
            [$peso[$a['urgencia']], $a['cobertura_dias']] <=> [$peso[$b['urgencia']], $b['cobertura_dias']]);

        // Evolução do consumo — o que sustenta a projeção acima.
        $consumo = [];
        $cursor = strtotime($f['de']);
        $fim = strtotime($f['ate']);
        while ($cursor <= $fim) {
            $consumo[date('Y-m-d', $cursor)] = 0;
            $cursor = strtotime('+1 day', $cursor);
        }
        $filtraDeposito = $f['deposito'] !== '';
        $produtosDoDeposito = $filtraDeposito
            ? array_flip(array_column($estoque, 'produto')) : null;
        foreach ($p->colecao('pedidos') as $ped) {
            if (!isset($consumo[$ped['data']])
                || in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            foreach ($ped['itens'] as $it) {
                if ($produtosDoDeposito !== null && !isset($produtosDoDeposito[$it['produto']])) {
                    continue;
                }
                $consumo[$ped['data']] += $it['quantidade'];
            }
        }
        $serieConsumo = [];
        foreach ($consumo as $data => $q) {
            $serieConsumo[] = ['data' => $data, 'valor' => $q];
        }

        ApiResponse::success([
            'cobertura'   => $faixas,
            'rupturas'    => array_slice($rupturas, 0, 60),
            'rupturas_total' => count($rupturas),
            'aging'       => $aging,
            'dispersao'   => $dispersao,
            'consumo'     => $serieConsumo,
            'nota_aging'  => 'Aging pela última movimentação registrada. Item parado com '
                           . 'valor alto é capital imobilizado sem giro.',
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /logistics-analytics — §39
     * Prazo prometido × realizado, custo por região, distribuição de prazo.
     */
    public static function analiseLogistica(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $transp = [];
        foreach ($p->colecao('transportadoras') as $t) {
            $transp[$t['id']] = $t;
        }

        $envios = array_values(array_filter($p->colecao('envios'), static fn($e) =>
            $e['despacho'] >= $f['de'] && $e['despacho'] <= $f['ate']));

        // ── Prometido × realizado, por transportadora ────────────
        $porTransportadora = [];
        // ── Custo e volume por UF ────────────────────────────────
        $porUf = [];
        // ── Distribuição do prazo realizado ──────────────────────
        $distribuicao = [];
        // ── Atrasos ao longo do tempo ────────────────────────────
        $porDia = [];

        foreach ($envios as $e) {
            $t = $transp[$e['transportadora']] ?? null;
            $nome = $t['nome'] ?? $e['transportadora'];

            $porTransportadora[$nome] ??= [
                'transportadora' => $nome, 'envios' => 0, 'entregues' => 0,
                'prometido' => $t['prazo_medio'] ?? 0, 'soma_realizado' => 0,
                'no_prazo' => 0, 'atrasados' => 0, 'custo' => 0.0,
            ];
            $porTransportadora[$nome]['envios']++;
            $porTransportadora[$nome]['custo'] += $e['custo'];

            $porUf[$e['uf']] ??= ['uf' => $e['uf'], 'envios' => 0, 'custo' => 0.0,
                                  'soma_prazo' => 0, 'entregues' => 0, 'atrasados' => 0];
            $porUf[$e['uf']]['envios']++;
            $porUf[$e['uf']]['custo'] += $e['custo'];

            if ($e['situacao'] === 'atrasado') {
                $porTransportadora[$nome]['atrasados']++;
                $porUf[$e['uf']]['atrasados']++;
            }

            if ($e['entrega'] === null) {
                continue;
            }

            $realizado = (int) ((strtotime($e['entrega']) - strtotime($e['despacho'])) / 86400);
            $atraso = (int) ((strtotime($e['entrega']) - strtotime($e['previsao'])) / 86400);

            $porTransportadora[$nome]['entregues']++;
            $porTransportadora[$nome]['soma_realizado'] += $realizado;
            if ($atraso <= 0) {
                $porTransportadora[$nome]['no_prazo']++;
            }

            $porUf[$e['uf']]['entregues']++;
            $porUf[$e['uf']]['soma_prazo'] += $realizado;

            $faixa = match (true) {
                $realizado <= 2  => '0-2',
                $realizado <= 5  => '3-5',
                $realizado <= 10 => '6-10',
                $realizado <= 15 => '11-15',
                default          => '15+',
            };
            $distribuicao[$faixa] = ($distribuicao[$faixa] ?? 0) + 1;

            $dia = substr($e['entrega'], 0, 10);
            $porDia[$dia] ??= ['data' => $dia, 'entregues' => 0, 'atrasados' => 0];
            $porDia[$dia]['entregues']++;
            if ($atraso > 0) {
                $porDia[$dia]['atrasados']++;
            }
        }

        foreach ($porTransportadora as &$t) {
            $t['realizado'] = $t['entregues'] > 0
                ? round($t['soma_realizado'] / $t['entregues'], 1) : null;
            $t['no_prazo_pct'] = $t['entregues'] > 0
                ? round(($t['no_prazo'] / $t['entregues']) * 100, 1) : 0.0;
            $t['custo'] = round($t['custo'], 2);
            $t['custo_medio'] = $t['envios'] > 0 ? round($t['custo'] / $t['envios'], 2) : 0.0;
            // Diferença entre o que foi prometido e o que aconteceu — é a leitura
            // que a tela precisa, não os dois números soltos.
            $t['desvio'] = $t['realizado'] !== null
                ? round($t['realizado'] - $t['prometido'], 1) : null;
            unset($t['soma_realizado']);
        }
        unset($t);

        foreach ($porUf as &$u) {
            $u['custo'] = round($u['custo'], 2);
            $u['custo_medio'] = $u['envios'] > 0 ? round($u['custo'] / $u['envios'], 2) : 0.0;
            $u['prazo_medio'] = $u['entregues'] > 0
                ? round($u['soma_prazo'] / $u['entregues'], 1) : null;
            $u['atraso_pct'] = $u['envios'] > 0
                ? round(($u['atrasados'] / $u['envios']) * 100, 1) : 0.0;
            unset($u['soma_prazo']);
        }
        unset($u);

        $ordemFaixa = ['0-2', '3-5', '6-10', '11-15', '15+'];
        $rotulos = ['0-2' => 'Até 2 dias', '3-5' => '3 a 5 dias', '6-10' => '6 a 10 dias',
                    '11-15' => '11 a 15 dias', '15+' => 'Mais de 15'];
        $dist = [];
        foreach ($ordemFaixa as $k) {
            $dist[] = ['faixa' => $k, 'rotulo' => $rotulos[$k], 'envios' => $distribuicao[$k] ?? 0];
        }

        $transportadoras = array_values($porTransportadora);
        usort($transportadoras, static fn($a, $b) => $b['envios'] <=> $a['envios']);
        $ufs = array_values($porUf);
        usort($ufs, static fn($a, $b) => $b['envios'] <=> $a['envios']);
        $dias = array_values($porDia);
        usort($dias, static fn($a, $b) => strcmp($a['data'], $b['data']));

        ApiResponse::success([
            'transportadoras' => $transportadoras,
            'ufs'             => $ufs,
            'distribuicao'    => $dist,
            'serie_atrasos'   => $dias,
            'resumo' => [
                'envios'    => count($envios),
                'entregues' => array_sum(array_column($transportadoras, 'entregues')),
                'atrasados' => array_sum(array_column($transportadoras, 'atrasados')),
                'custo'     => round(array_sum(array_column($transportadoras, 'custo')), 2),
            ],
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /margin-volume — §40, matriz margem × volume.
     * Mesmo princípio da matriz de estoque: corte por MEDIANA, não por média.
     */
    public static function margemVolume(): void
    {
        $f = bling_filtros();
        $dim = bling_str('dimensao', 'produto', 20);
        if (!in_array($dim, ['produto', 'cliente', 'canal', 'categoria', 'vendedor'], true)) {
            $dim = 'produto';
        }

        $linhas = BlingProvider::atual()->rentabilidade($dim, $f);
        $itens = array_values(array_filter($linhas, static fn($l) => $l['receita'] != 0));

        $mediana = static function (array $v): float {
            if ($v === []) {
                return 0.0;
            }
            sort($v);
            $n = count($v);
            return $n % 2 === 1 ? (float) $v[intdiv($n, 2)] : (($v[$n / 2 - 1] + $v[$n / 2]) / 2);
        };
        $corteVolume = $mediana(array_column($itens, 'receita'));
        $corteMargem = $mediana(array_column($itens, 'margem_pct'));

        foreach ($itens as &$i) {
            $altoVolume = $i['receita'] >= $corteVolume;
            $altaMargem = $i['margem_pct'] >= $corteMargem;
            $i['quadrante'] = match (true) {
                $altoVolume && $altaMargem  => 'motor',
                $altoVolume && !$altaMargem => 'giro',
                !$altoVolume && $altaMargem => 'joia',
                default                     => 'peso',
            };
        }
        unset($i);

        $quadrantes = [
            ['id' => 'motor', 'rotulo' => 'Alto volume e alta margem', 'cor' => 'sucesso',
             'acao' => 'É o que sustenta o resultado — proteger disponibilidade e preço.'],
            ['id' => 'giro',  'rotulo' => 'Alto volume e baixa margem', 'cor' => 'info',
             'acao' => 'Volume sem retorno. Renegociar custo ou revisar desconto.'],
            ['id' => 'joia',  'rotulo' => 'Baixo volume e alta margem', 'cor' => 'aviso',
             'acao' => 'Retorno bom e pouco explorado — candidato a esforço comercial.'],
            ['id' => 'peso',  'rotulo' => 'Baixo volume e baixa margem', 'cor' => 'erro',
             'acao' => 'Consome atenção sem devolver. Avaliar descontinuar.'],
        ];
        foreach ($quadrantes as &$q) {
            $doQ = array_values(array_filter($itens, static fn($i) => $i['quadrante'] === $q['id']));
            $q['itens']   = count($doQ);
            $q['receita'] = round(array_sum(array_column($doQ, 'receita')), 2);
            $q['lucro']   = round(array_sum(array_column($doQ, 'lucro')), 2);
        }
        unset($q);

        ApiResponse::success([
            'dimensao'   => $dim,
            'itens'      => $itens,
            'cortes'     => ['receita' => round($corteVolume, 2),
                             'margem_pct' => round($corteMargem, 1), 'metodo' => 'mediana'],
            'quadrantes' => $quadrantes,
            'dimensoes_disponiveis' => ['produto', 'cliente', 'canal', 'categoria', 'vendedor'],
        ], bling_meta(['filtros' => $f]));
    }
}
