<?php
// Bling / lib/BlingMock.php - gerador de dados simulados COERENTES
// @module  bling.mock
// @version 1.0.0
// @created 2026-07-30
//
// PROPOSITO (§60): produzir um retrato de operacao que se sustente sob analise.
// A regra que governa este arquivo: NADA e sorteado de forma independente.
// Tudo desce em cascata de um unico grafo:
//
//   canais -> pedidos -> itens(produto) -> nota -> expedicao -> titulo a receber
//   fornecedores -> pedidos de compra -> itens -> recebimento -> titulo a pagar
//   produtos -> estoque por deposito -> giro/cobertura -> necessidade de compra
//
// Por isso o faturamento da tela de Vendas bate com o da Visao Geral, que bate
// com o do Sankey, que bate com o das Contas a Receber - por CONSTRUCAO, nao por
// revisao manual. Foi a falta disso que gerou incoerencia entre telas no modulo GA.
//
// DETERMINISMO: seed fixo. Duas chamadas seguidas devolvem os mesmos numeros;
// caso contrario o dono veria o dashboard "tremer" a cada refresh e nenhum
// numero poderia ser conferido entre telas.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingMock
{
    /** Seed do gerador. Fixo de proposito - ver nota de determinismo acima. */
    private const SEED = 20260730;

    /** Data de referencia do grafo. Ancorada em "hoje" para as telas fazerem sentido. */
    private static ?string $hoje = null;

    /** Grafo memoizado por processo. */
    private static ?array $grafo = null;

    /** Estado do PRNG deterministico (LCG - nao depende de mt_rand global). */
    private static int $estado = self::SEED;

    // ─────────────────────────────────────────────────────────────
    // PRNG deterministico
    // ─────────────────────────────────────────────────────────────

    private static function reseed(int $s): void
    {
        self::$estado = $s;
    }

    /** Inteiro pseudoaleatorio em [0, 2^31). LCG de Park-Miller. */
    private static function prox(): int
    {
        self::$estado = (int) ((self::$estado * 48271) % 2147483647);
        if (self::$estado <= 0) {
            self::$estado += 2147483646;
        }
        return self::$estado;
    }

    /** Inteiro em [min, max]. */
    private static function inteiro(int $min, int $max): int
    {
        if ($max <= $min) {
            return $min;
        }
        return $min + (self::prox() % ($max - $min + 1));
    }

    /** Float em [0,1). */
    private static function fracao(): float
    {
        return self::prox() / 2147483647.0;
    }

    /** Float em [min, max] com casas decimais. */
    private static function decimal(float $min, float $max, int $casas = 2): float
    {
        return round($min + self::fracao() * ($max - $min), $casas);
    }

    /** Escolhe um item de uma lista. */
    private static function escolher(array $lista)
    {
        return $lista[self::prox() % count($lista)];
    }

    /**
     * Escolhe respeitando pesos. Usado para que a distribuicao de canais e
     * situacoes pareca uma operacao real, e nao um sorteio uniforme.
     */
    private static function escolherPesado(array $pesos): string
    {
        $total = array_sum($pesos);
        $ponto = self::fracao() * $total;
        $acum = 0.0;
        foreach ($pesos as $chave => $peso) {
            $acum += $peso;
            if ($ponto <= $acum) {
                return (string) $chave;
            }
        }
        return (string) array_key_last($pesos);
    }

    // ─────────────────────────────────────────────────────────────
    // Grafo
    // ─────────────────────────────────────────────────────────────

    public static function hoje(): string
    {
        return self::$hoje ??= date('Y-m-d');
    }

    /** Ponto de entrada: devolve (e memoiza) o grafo completo. */
    public static function grafo(): array
    {
        if (self::$grafo !== null) {
            return self::$grafo;
        }

        self::reseed(self::SEED);

        $g = [];
        $g['contas']        = self::gerarContas();
        $g['unidades']      = self::gerarUnidades();
        $g['canais']        = self::gerarCanais();
        $g['depositos']     = self::gerarDepositos();
        $g['categorias']    = self::gerarCategorias();
        $g['transportadoras'] = self::gerarTransportadoras();
        $g['vendedores']    = self::gerarVendedores();
        $g['formas_pagamento']    = self::gerarFormasPagamento();
        $g['categorias_financeiras'] = self::gerarCategoriasFinanceiras();
        $g['fornecedores']  = self::gerarFornecedores($g);
        $g['produtos']      = self::gerarProdutos($g);
        $g['estoque']       = self::gerarEstoque($g);
        $g['clientes']      = self::gerarClientes($g);
        $g['pedidos']       = self::gerarPedidos($g);
        $g['notas']         = self::gerarNotas($g);
        $g['envios']        = self::gerarEnvios($g);
        $g['receber']       = self::gerarReceber($g);
        $g['compras']       = self::gerarCompras($g);
        $g['pagar']         = self::gerarPagar($g);
        $g['webhooks']      = self::gerarWebhooks($g);
        $g['sync']          = self::gerarSync($g);

        // Derivados: dependem do grafo pronto.
        $g['estoque']       = self::enriquecerEstoque($g);
        $g['produtos']      = self::enriquecerProdutos($g);

        return self::$grafo = $g;
    }

    // ── Cadastros base ───────────────────────────────────────────

    private static function gerarContas(): array
    {
        return [
            [
                'id' => 'conta-matriz', 'nome' => 'Dshow Matriz',
                'cnpj_mascarado' => '12.***.***/0001-**', 'unidade' => 'Matriz',
                'ambiente' => 'producao', 'situacao' => 'mock',
                'ultima_sync' => gmdate('c', strtotime('-6 minutes')),
                'pendencias' => 12, 'padrao' => true,
            ],
            [
                'id' => 'conta-filial-sp', 'nome' => 'Dshow Filial SP',
                'cnpj_mascarado' => '12.***.***/0002-**', 'unidade' => 'Filial São Paulo',
                'ambiente' => 'producao', 'situacao' => 'mock',
                'ultima_sync' => gmdate('c', strtotime('-19 minutes')),
                'pendencias' => 4, 'padrao' => false,
            ],
        ];
    }

    private static function gerarUnidades(): array
    {
        return [
            ['id' => 'un-matriz',  'conta' => 'conta-matriz',    'nome' => 'Matriz',            'uf' => 'PR'],
            ['id' => 'un-sp',      'conta' => 'conta-filial-sp', 'nome' => 'Filial São Paulo',  'uf' => 'SP'],
            ['id' => 'un-cd',      'conta' => 'conta-matriz',    'nome' => 'Centro de Distribuição', 'uf' => 'PR'],
        ];
    }

    /** Pesos = participacao real esperada de cada canal no volume de pedidos. */
    private static function gerarCanais(): array
    {
        return [
            ['id' => 'ml',        'nome' => 'Mercado Livre',    'tipo' => 'marketplace', 'peso' => 0.34, 'integrado' => true],
            ['id' => 'ecommerce', 'nome' => 'E-commerce',       'tipo' => 'loja',        'peso' => 0.24, 'integrado' => true],
            ['id' => 'loja-int',  'nome' => 'Loja Integrada',   'tipo' => 'loja',        'peso' => 0.11, 'integrado' => true],
            ['id' => 'balcao',    'nome' => 'Venda direta',     'tipo' => 'interno',     'peso' => 0.18, 'integrado' => false],
            ['id' => 'representante', 'nome' => 'Representantes','tipo' => 'interno',    'peso' => 0.09, 'integrado' => false],
            ['id' => 'amazon',    'nome' => 'Amazon',           'tipo' => 'marketplace', 'peso' => 0.04, 'integrado' => true],
        ];
    }

    private static function gerarDepositos(): array
    {
        return [
            ['id' => 'dep-geral',   'nome' => 'Depósito Geral',       'unidade' => 'un-matriz', 'padrao' => true],
            ['id' => 'dep-cd',      'nome' => 'Centro de Distribuição','unidade' => 'un-cd',    'padrao' => false],
            ['id' => 'dep-sp',      'nome' => 'Filial SP',            'unidade' => 'un-sp',     'padrao' => false],
            ['id' => 'dep-full',    'nome' => 'Fulfillment ML',       'unidade' => 'un-cd',     'padrao' => false],
        ];
    }

    private static function gerarCategorias(): array
    {
        $nomes = [
            'Áudio profissional', 'Iluminação cênica', 'Painéis de LED', 'Estruturas e treliças',
            'Cabos e conectores', 'Projeção', 'Acessórios', 'Peças de reposição',
        ];
        $saida = [];
        foreach ($nomes as $i => $nome) {
            $saida[] = ['id' => 'cat-' . ($i + 1), 'nome' => $nome];
        }
        return $saida;
    }

    private static function gerarTransportadoras(): array
    {
        return [
            ['id' => 'tr-1', 'nome' => 'Transportadora Sul',   'prazo_medio' => 4,  'confiabilidade' => 0.94],
            ['id' => 'tr-2', 'nome' => 'ExpressLog',           'prazo_medio' => 3,  'confiabilidade' => 0.91],
            ['id' => 'tr-3', 'nome' => 'Correios',             'prazo_medio' => 7,  'confiabilidade' => 0.86],
            ['id' => 'tr-4', 'nome' => 'Mercado Envios',       'prazo_medio' => 3,  'confiabilidade' => 0.96],
            ['id' => 'tr-5', 'nome' => 'Retirada no balcão',   'prazo_medio' => 0,  'confiabilidade' => 1.00],
        ];
    }

    private static function gerarVendedores(): array
    {
        $nomes = ['Ana Ribeiro', 'Carlos Menezes', 'Daniela Prado', 'Eduardo Lima',
                  'Fernanda Costa', 'Gustavo Alves', 'Helena Martins', 'Rafael Souza'];
        $saida = [];
        foreach ($nomes as $i => $nome) {
            $saida[] = [
                'id' => 'vend-' . ($i + 1), 'nome' => $nome,
                'comissao_pct' => self::decimal(1.5, 4.5, 2),
                'meta_mensal'  => self::inteiro(60, 240) * 1000,
            ];
        }
        return $saida;
    }

    private static function gerarFormasPagamento(): array
    {
        return [
            ['id' => 'fp-pix',       'nome' => 'PIX',              'prazo_dias' => 0,  'taxa_pct' => 0.0,  'peso' => 0.26],
            ['id' => 'fp-cartao',    'nome' => 'Cartão de crédito','prazo_dias' => 30, 'taxa_pct' => 3.49, 'peso' => 0.31],
            ['id' => 'fp-boleto',    'nome' => 'Boleto',           'prazo_dias' => 21, 'taxa_pct' => 0.9,  'peso' => 0.24],
            ['id' => 'fp-prazo',     'nome' => 'Faturado 30/60',   'prazo_dias' => 45, 'taxa_pct' => 0.0,  'peso' => 0.14],
            ['id' => 'fp-transfer',  'nome' => 'Transferência',    'prazo_dias' => 1,  'taxa_pct' => 0.0,  'peso' => 0.05],
        ];
    }

    private static function gerarCategoriasFinanceiras(): array
    {
        return [
            ['id' => 'cf-rec-venda',   'nome' => 'Receita de vendas',      'tipo' => 'receita'],
            ['id' => 'cf-rec-servico', 'nome' => 'Receita de serviços',    'tipo' => 'receita'],
            ['id' => 'cf-rec-locacao', 'nome' => 'Receita de locação',     'tipo' => 'receita'],
            ['id' => 'cf-desp-forn',   'nome' => 'Fornecedores',           'tipo' => 'despesa'],
            ['id' => 'cf-desp-frete',  'nome' => 'Fretes',                 'tipo' => 'despesa'],
            ['id' => 'cf-desp-imp',    'nome' => 'Impostos',               'tipo' => 'despesa'],
            ['id' => 'cf-desp-folha',  'nome' => 'Folha de pagamento',     'tipo' => 'despesa'],
            ['id' => 'cf-desp-oper',   'nome' => 'Despesas operacionais',  'tipo' => 'despesa'],
            ['id' => 'cf-desp-mkt',    'nome' => 'Marketing',              'tipo' => 'despesa'],
        ];
    }

    private static function gerarFornecedores(array $g): array
    {
        $nomes = [
            'Áudio Tech Distribuidora', 'LED Master Importação', 'Stage Light Brasil',
            'Cabos & Cia', 'Pro Sound Import', 'Estruturas Metálicas RS',
            'Óptica Projeção Ltda', 'Conectores Premium', 'Global Stage Supply',
            'Iluminação Profissional SA', 'MegaSom Atacado', 'Truss Solutions',
            'Digital Display Import', 'Painel LED Direct', 'AudioParts Brasil',
            'Rental Gear Supply', 'Backline Distribuidora', 'Tech Stage Import',
        ];
        $saida = [];
        foreach ($nomes as $i => $nome) {
            $prazo = self::inteiro(7, 60);
            $pontualidade = self::decimal(0.55, 0.99, 3);
            $saida[] = [
                'id'            => 'forn-' . ($i + 1),
                'bling_id'      => 900000 + $i,
                'nome'          => $nome,
                'cnpj_mascarado'=> sprintf('%02d.***.***/0001-**', self::inteiro(10, 99)),
                'uf'            => self::escolher(['SP', 'PR', 'RS', 'SC', 'MG', 'RJ', 'GO']),
                'prazo_entrega_dias' => $prazo,
                'pontualidade'  => $pontualidade,
                'cadastro_completo' => self::fracao() > 0.22,
                'ativo'         => self::fracao() > 0.06,
            ];
        }
        return $saida;
    }

    private static function gerarProdutos(array $g): array
    {
        $prefixos = [
            'cat-1' => ['Caixa ativa', 'Mesa de som', 'Amplificador', 'Microfone', 'Monitor de palco'],
            'cat-2' => ['Moving head', 'Refletor LED', 'Strobo', 'Canhão seguidor', 'Máquina de fumaça'],
            'cat-3' => ['Painel LED P', 'Processadora de vídeo', 'Módulo LED', 'Gabinete LED'],
            'cat-4' => ['Treliça Q', 'Base de estrutura', 'Sapata', 'Talha', 'Torre elevatória'],
            'cat-5' => ['Cabo XLR', 'Cabo P10', 'Multicabo', 'Conector Speakon', 'Extensão'],
            'cat-6' => ['Projetor', 'Tela de projeção', 'Lente zoom', 'Suporte de projetor'],
            'cat-7' => ['Case', 'Suporte', 'Tripé', 'Bolsa de transporte'],
            'cat-8' => ['Alto-falante reposição', 'Driver', 'Fonte', 'Placa de potência'],
        ];
        $marcas = ['Dshow', 'ProLine', 'StageMax', 'LumenTech', 'SoundCore', 'BrightWave', 'GenericPro'];

        $saida = [];
        $n = 0;
        foreach ($prefixos as $catId => $bases) {
            $quantidade = self::inteiro(22, 34);
            for ($i = 0; $i < $quantidade; $i++) {
                $n++;
                $base   = self::escolher($bases);
                $marca  = self::escolher($marcas);
                $modelo = strtoupper(self::escolher(['X', 'S', 'K', 'M', 'V'])) . self::inteiro(100, 999);

                $custo = self::decimal(35, 4800, 2);
                $markup = self::decimal(1.28, 2.35, 3);
                $preco = round($custo * $markup, 2);

                // Uma fatia dos produtos tem cadastro incompleto de proposito (§23).
                $temGtin   = self::fracao() > 0.17;
                $temImagem = self::fracao() > 0.13;
                $temPeso   = self::fracao() > 0.21;
                $temDim    = self::fracao() > 0.28;
                $temNcm    = self::fracao() > 0.09;

                $saida[] = [
                    'id'          => 'prod-' . $n,
                    'bling_id'    => 700000 + $n,
                    'sku'         => sprintf('%s-%s-%04d', strtoupper(substr($catId, 4)), substr($marca, 0, 3), $n),
                    'gtin'        => $temGtin ? (string) (7890000000000 + $n * 7) : null,
                    'nome'        => "$base $marca $modelo",
                    'tipo'        => self::fracao() > 0.9 ? 'kit' : (self::fracao() > 0.82 ? 'variacao' : 'simples'),
                    'categoria'   => $catId,
                    'marca'       => $marca,
                    'unidade'     => self::escolher(['UN', 'PC', 'CJ', 'M']),
                    'custo'       => $custo,
                    'preco'       => $preco,
                    'preco_promocional' => self::fracao() > 0.86 ? round($preco * self::decimal(0.82, 0.94, 3), 2) : null,
                    'peso_kg'     => $temPeso ? self::decimal(0.2, 78, 3) : null,
                    'dimensoes'   => $temDim ? sprintf('%dx%dx%d', self::inteiro(10, 180), self::inteiro(10, 120), self::inteiro(5, 90)) : null,
                    'ncm'         => $temNcm ? (string) self::inteiro(84000000, 95999999) : null,
                    'origem'      => self::escolher(['nacional', 'importado', 'nacional', 'nacional']),
                    'imagem'      => $temImagem,
                    'descricao_ok'=> self::fracao() > 0.19,
                    'fornecedor'  => self::escolher($g['fornecedores'])['id'],
                    'ativo'       => self::fracao() > 0.05,
                    'variacoes'   => 0,
                    'canais'      => array_values(array_filter(
                        array_map(static fn($c) => self::fracao() > 0.45 ? $c['id'] : null, $g['canais'])
                    )),
                ];
            }
        }

        // Variacoes: apenas produtos marcados como 'variacao' recebem filhos.
        foreach ($saida as &$p) {
            if ($p['tipo'] === 'variacao') {
                $p['variacoes'] = self::inteiro(2, 6);
            }
        }
        unset($p);

        return $saida;
    }

    private static function gerarEstoque(array $g): array
    {
        $saida = [];
        foreach ($g['produtos'] as $p) {
            foreach ($g['depositos'] as $d) {
                // Nem todo produto existe em todo deposito - isso e o que produz
                // as divergencias e rupturas que as telas precisam mostrar.
                if (!$d['padrao'] && self::fracao() > 0.55) {
                    continue;
                }

                $fisico    = self::fracao() > 0.08 ? self::inteiro(0, 260) : self::inteiro(-8, 0);
                $reservado = $fisico > 0 ? self::inteiro(0, (int) min(40, $fisico)) : 0;
                $minimo    = self::inteiro(4, 45);

                $saida[] = [
                    'produto'    => $p['id'],
                    'deposito'   => $d['id'],
                    'fisico'     => $fisico,
                    'reservado'  => $reservado,
                    'disponivel' => $fisico - $reservado,
                    'minimo'     => $minimo,
                    'maximo'     => $minimo * self::inteiro(3, 8),
                    'divergencia'=> self::fracao() > 0.94 ? self::inteiro(-12, 12) : 0,
                    'ultima_movimentacao' => date('Y-m-d', strtotime(self::hoje() . ' -' . self::inteiro(0, 210) . ' days')),
                ];
            }
        }
        return $saida;
    }

    private static function gerarClientes(array $g): array
    {
        $primeiros = ['Marina', 'Rodrigo', 'Patrícia', 'Bruno', 'Camila', 'Thiago', 'Juliana',
                      'Felipe', 'Larissa', 'Marcelo', 'Beatriz', 'André', 'Vanessa', 'Ricardo'];
        $ultimos = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Almeida', 'Nunes',
                    'Carvalho', 'Barbosa', 'Rocha', 'Dias', 'Moreira'];
        $empresas = ['Produtora', 'Eventos', 'Locações', 'Cenografia', 'Audiovisual',
                     'Studio', 'Entretenimento', 'Live', 'Produções'];

        $saida = [];
        for ($i = 1; $i <= 190; $i++) {
            $pj = self::fracao() > 0.42;
            $nome = $pj
                ? self::escolher($empresas) . ' ' . self::escolher($ultimos) . ' ' . self::escolher(['ME', 'Ltda', 'SA', 'Eireli'])
                : self::escolher($primeiros) . ' ' . self::escolher($ultimos);

            $saida[] = [
                'id'        => 'cli-' . $i,
                'bling_id'  => 500000 + $i,
                'nome'      => $nome,
                'tipo'      => $pj ? 'juridica' : 'fisica',
                'documento_mascarado' => $pj
                    ? sprintf('%02d.***.***/0001-**', self::inteiro(10, 99))
                    : sprintf('***.%03d.***-**', self::inteiro(100, 999)),
                'uf'        => self::escolher(['SP', 'PR', 'RJ', 'MG', 'RS', 'SC', 'BA', 'GO', 'PE', 'CE']),
                'cadastro_completo' => self::fracao() > 0.18,
                'ativo'     => self::fracao() > 0.11,
            ];
        }
        return $saida;
    }

    // ── Movimento ────────────────────────────────────────────────

    /**
     * Pedidos de venda dos ultimos 365 dias.
     * A curva tem sazonalidade e um pico proposital (§60 "pico de pedidos"),
     * para as telas de anomalia terem o que detectar.
     */
    private static function gerarPedidos(array $g): array
    {
        $pesosCanal = [];
        foreach ($g['canais'] as $c) {
            $pesosCanal[$c['id']] = $c['peso'];
        }
        $pesosPagamento = [];
        foreach ($g['formas_pagamento'] as $f) {
            $pesosPagamento[$f['id']] = $f['peso'];
        }

        $saida = [];
        $numero = 10000;

        for ($d = 364; $d >= 0; $d--) {
            $data = date('Y-m-d', strtotime(self::hoje() . " -$d days"));
            $dow  = (int) date('N', strtotime($data));
            $mes  = (int) date('n', strtotime($data));

            // Base + sazonalidade anual + queda no fim de semana.
            $base = 5.0;
            $base *= 1 + 0.28 * sin(($mes / 12) * 2 * M_PI);
            if ($dow >= 6) {
                $base *= 0.35;
            }
            // Pico proposital nos ultimos 45..38 dias.
            if ($d <= 45 && $d >= 38) {
                $base *= 2.6;
            }
            // Queda proposital nos ultimos 9 dias (dispara insight de queda de vendas).
            if ($d <= 9) {
                $base *= 0.62;
            }

            $qtd = max(0, (int) round($base + self::decimal(-1.6, 1.6, 2)));

            for ($i = 0; $i < $qtd; $i++) {
                $numero++;
                $canal   = self::escolherPesado($pesosCanal);
                $cliente = self::escolher($g['clientes']);
                $vend    = self::escolher($g['vendedores']);
                $forma   = self::escolherPesado($pesosPagamento);

                // Itens do pedido - e daqui que sai TODO o faturamento do modulo.
                $nItens = self::inteiro(1, 5);
                $itens  = [];
                $subtotal = 0.0;
                $custoTotal = 0.0;
                for ($k = 0; $k < $nItens; $k++) {
                    $prod = self::escolher($g['produtos']);
                    $q    = self::inteiro(1, 6);
                    $unit = $prod['preco_promocional'] ?? $prod['preco'];
                    $itens[] = [
                        'produto'  => $prod['id'],
                        'sku'      => $prod['sku'],
                        'nome'     => $prod['nome'],
                        'quantidade' => $q,
                        'unitario' => $unit,
                        'total'    => round($unit * $q, 2),
                        'custo_unitario' => $prod['custo'],
                    ];
                    $subtotal   += $unit * $q;
                    $custoTotal += $prod['custo'] * $q;
                }

                $desconto = self::fracao() > 0.68 ? round($subtotal * self::decimal(0.02, 0.14, 3), 2) : 0.0;
                $frete    = $canal === 'balcao' ? 0.0 : self::decimal(0, 320, 2);
                $total    = round($subtotal - $desconto + $frete, 2);

                $situacao = self::situacaoPedido($d);

                $saida[] = [
                    'id'         => 'ped-' . $numero,
                    'numero'     => (string) $numero,
                    'bling_id'   => 300000 + $numero,
                    'data'       => $data,
                    'situacao'   => $situacao,
                    'cliente'    => $cliente['id'],
                    'vendedor'   => $vend['id'],
                    'canal'      => $canal,
                    'conta'      => $canal === 'balcao' ? 'conta-filial-sp' : 'conta-matriz',
                    'itens'      => $itens,
                    'qtd_itens'  => $nItens,
                    'subtotal'   => round($subtotal, 2),
                    'desconto'   => $desconto,
                    'frete'      => $frete,
                    'total'      => $total,
                    'custo'      => round($custoTotal, 2),
                    'forma_pagamento' => $forma,
                    'atualizado_em'   => $data . 'T' . sprintf('%02d:%02d:00Z', self::inteiro(8, 20), self::inteiro(0, 59)),
                ];
            }
        }

        return $saida;
    }

    /**
     * Situacao coerente com a idade do pedido: pedido de ontem nao esta entregue,
     * pedido de 6 meses atras nao esta aguardando aprovacao.
     */
    private static function situacaoPedido(int $diasAtras): string
    {
        if ($diasAtras <= 1) {
            return self::escolherPesado([
                'aguardando_aprovacao' => 0.45, 'aprovado' => 0.35,
                'rascunho' => 0.12, 'faturado' => 0.08,
            ]);
        }
        if ($diasAtras <= 4) {
            return self::escolherPesado([
                'aprovado' => 0.34, 'faturado' => 0.26, 'nota_emitida' => 0.18,
                'separacao' => 0.12, 'aguardando_aprovacao' => 0.07, 'cancelado' => 0.03,
            ]);
        }
        if ($diasAtras <= 12) {
            return self::escolherPesado([
                'enviado' => 0.32, 'nota_emitida' => 0.20, 'entregue' => 0.20,
                'separacao' => 0.11, 'faturado' => 0.09, 'aprovado' => 0.04, 'cancelado' => 0.04,
            ]);
        }
        return self::escolherPesado([
            'entregue' => 0.82, 'cancelado' => 0.06, 'devolvido' => 0.03,
            'enviado' => 0.04, 'aprovado' => 0.03, 'nota_emitida' => 0.02,
        ]);
    }

    /** Notas fiscais: derivadas dos pedidos que passaram do faturamento. */
    private static function gerarNotas(array $g): array
    {
        $comNota = ['faturado', 'nota_emitida', 'separacao', 'enviado', 'entregue', 'devolvido'];
        $saida = [];
        $numero = 40000;

        foreach ($g['pedidos'] as $p) {
            if (!in_array($p['situacao'], $comNota, true)) {
                continue;
            }
            $numero++;

            // A maioria autoriza; uma fatia rejeita com motivo real (§30.3).
            $sit = self::escolherPesado([
                'autorizada' => 0.885, 'rejeitada' => 0.052,
                'pendente' => 0.028, 'cancelada' => 0.025, 'processando' => 0.010,
            ]);

            $erro = null;
            if ($sit === 'rejeitada') {
                $erro = self::escolher([
                    ['codigo' => '539', 'mensagem' => 'Duplicidade de NF-e com diferença na chave de acesso'],
                    ['codigo' => '204', 'mensagem' => 'Duplicidade de NF-e'],
                    ['codigo' => '610', 'mensagem' => 'Total da NF-e difere do somatório dos itens'],
                    ['codigo' => '778', 'mensagem' => 'NCM informado não existe na tabela'],
                    ['codigo' => '225', 'mensagem' => 'Falha no schema XML'],
                    ['codigo' => '215', 'mensagem' => 'Falha no schema XML — campo obrigatório ausente'],
                ]);
            }

            $saida[] = [
                'id'        => 'nf-' . $numero,
                'numero'    => (string) $numero,
                'serie'     => '1',
                'chave'     => sprintf('%044d', self::inteiro(1, 999999999) * 1000 + $numero),
                'pedido'    => $p['id'],
                'cliente'   => $p['cliente'],
                'conta'     => $p['conta'],
                'emissao'   => $p['data'],
                'valor'     => $p['total'],
                'situacao'  => $sit,
                'finalidade'=> 'normal',
                'tipo'      => 'saida',
                'erro'      => $erro,
                'tentativas'=> $sit === 'rejeitada' ? self::inteiro(1, 4) : 1,
                'danfe'     => $sit === 'autorizada',
                'xml'       => $sit === 'autorizada',
            ];
        }
        return $saida;
    }

    /** Expedicoes: derivadas das notas autorizadas. */
    private static function gerarEnvios(array $g): array
    {
        $porPedido = [];
        foreach ($g['pedidos'] as $p) {
            $porPedido[$p['id']] = $p;
        }

        $saida = [];
        $n = 0;
        foreach ($g['notas'] as $nf) {
            if ($nf['situacao'] !== 'autorizada') {
                continue;
            }
            $p = $porPedido[$nf['pedido']] ?? null;
            if ($p === null || $p['canal'] === 'balcao') {
                continue;
            }
            $n++;

            $tr = self::escolher($g['transportadoras']);
            $prazo = max(1, $tr['prazo_medio'] + self::inteiro(-1, 3));
            $despacho = date('Y-m-d', strtotime($p['data'] . ' +' . self::inteiro(0, 2) . ' days'));
            $previsao = date('Y-m-d', strtotime($despacho . " +$prazo days"));

            $situacao = match ($p['situacao']) {
                'entregue'  => 'entregue',
                'enviado'   => self::fracao() > 0.82 ? 'atrasado' : 'em_transito',
                'separacao' => 'separado',
                'devolvido' => 'devolvido',
                default     => 'aguardando_separacao',
            };

            $entrega = null;
            if ($situacao === 'entregue') {
                $atraso = self::fracao() > $tr['confiabilidade'] ? self::inteiro(1, 9) : self::inteiro(-2, 1);
                $entrega = date('Y-m-d', strtotime($previsao . ' ' . ($atraso >= 0 ? "+$atraso" : $atraso) . ' days'));

                // Entrega NUNCA pode ser anterior ao despacho.
                //
                // Com transportadora de prazo curto (a retirada no balcão tem
                // prazo 0), `previsao` fica colada no despacho e um atraso
                // negativo produzia entrega ANTES do envio — 24 casos no smoke.
                // Uma data impossível dessas envenena todo o cálculo de prazo
                // realizado do §39, e o gráfico de prometido × realizado passaria
                // a mostrar média puxada por valores negativos.
                if ($entrega < $despacho) {
                    $entrega = $despacho;
                }
            }

            $saida[] = [
                'id'         => 'env-' . $n,
                'pedido'     => $p['id'],
                'nota'       => $nf['id'],
                'cliente'    => $p['cliente'],
                'transportadora' => $tr['id'],
                'servico'    => self::escolher(['Padrão', 'Expresso', 'Econômico']),
                'rastreamento' => strtoupper(self::escolher(['BR', 'AA', 'DS'])) . self::inteiro(100000000, 999999999) . 'BR',
                'despacho'   => $despacho,
                'previsao'   => $previsao,
                'entrega'    => $entrega,
                'custo'      => $p['frete'] > 0 ? $p['frete'] : self::decimal(18, 240, 2),
                'situacao'   => $situacao,
                'uf'         => self::escolher(['SP', 'PR', 'RJ', 'MG', 'RS', 'SC', 'BA', 'GO', 'PE', 'CE']),
                'ocorrencia' => self::fracao() > 0.93
                    ? self::escolher(['Destinatário ausente', 'Endereço insuficiente', 'Avaria na embalagem', 'Aguardando retirada'])
                    : null,
            ];
        }
        return $saida;
    }

    /** Contas a receber: um titulo por pedido faturado, com parcelas quando cabe. */
    private static function gerarReceber(array $g): array
    {
        $formas = [];
        foreach ($g['formas_pagamento'] as $f) {
            $formas[$f['id']] = $f;
        }
        $comTitulo = ['faturado', 'nota_emitida', 'separacao', 'enviado', 'entregue'];

        $saida = [];
        $n = 0;
        foreach ($g['pedidos'] as $p) {
            if (!in_array($p['situacao'], $comTitulo, true)) {
                continue;
            }
            $forma = $formas[$p['forma_pagamento']];
            $parcelas = $forma['prazo_dias'] >= 30 ? self::inteiro(1, 3) : 1;
            $valorParcela = round($p['total'] / $parcelas, 2);

            for ($i = 1; $i <= $parcelas; $i++) {
                $n++;
                $venc = date('Y-m-d', strtotime($p['data'] . ' +' . ($forma['prazo_dias'] * $i) . ' days'));
                $vencido = $venc < self::hoje();

                if ($vencido) {
                    // Titulo vencido: a maioria foi liquidada; uma fatia e inadimplencia real.
                    $sit = self::escolherPesado(['liquidado' => 0.86, 'vencido' => 0.11, 'parcial' => 0.03]);
                } else {
                    $sit = self::escolherPesado(['aberto' => 0.94, 'liquidado' => 0.06]);
                }

                $recebido = match ($sit) {
                    'liquidado' => $valorParcela,
                    'parcial'   => round($valorParcela * self::decimal(0.2, 0.8, 2), 2),
                    default     => 0.0,
                };

                $saida[] = [
                    'id'        => 'rec-' . $n,
                    'titulo'    => sprintf('REC-%06d', $n),
                    'pedido'    => $p['id'],
                    'cliente'   => $p['cliente'],
                    'conta'     => $p['conta'],
                    'emissao'   => $p['data'],
                    'vencimento'=> $venc,
                    'parcela'   => "$i/$parcelas",
                    'valor'     => $valorParcela,
                    'recebido'  => $recebido,
                    'saldo'     => round($valorParcela - $recebido, 2),
                    'situacao'  => $sit,
                    'forma'     => $forma['id'],
                    'categoria' => 'cf-rec-venda',
                    'atraso_dias' => $sit === 'vencido' ? (int) ((strtotime(self::hoje()) - strtotime($venc)) / 86400) : 0,
                ];
            }
        }
        return $saida;
    }

    /** Pedidos de compra: reposicao dos produtos com giro. */
    private static function gerarCompras(array $g): array
    {
        $saida = [];
        $numero = 8000;

        for ($d = 300; $d >= 0; $d -= 1) {
            if (self::fracao() > 0.42) {
                continue;
            }
            $numero++;
            $data = date('Y-m-d', strtotime(self::hoje() . " -$d days"));
            $forn = self::escolher($g['fornecedores']);

            $nItens = self::inteiro(1, 8);
            $itens = [];
            $valor = 0.0;
            $qtdTotal = 0;
            $qtdRecebida = 0;
            for ($k = 0; $k < $nItens; $k++) {
                $prod = self::escolher($g['produtos']);
                $q    = self::inteiro(2, 40);
                $unit = round($prod['custo'] * self::decimal(0.9, 1.08, 3), 2);
                $itens[] = [
                    'produto' => $prod['id'], 'sku' => $prod['sku'], 'nome' => $prod['nome'],
                    'quantidade' => $q, 'unitario' => $unit, 'total' => round($unit * $q, 2),
                ];
                $valor += $unit * $q;
                $qtdTotal += $q;
            }

            $previsao = date('Y-m-d', strtotime($data . ' +' . $forn['prazo_entrega_dias'] . ' days'));
            $situacao = self::situacaoCompra($d, $previsao);

            $recebimento = null;
            if ($situacao === 'recebido' || $situacao === 'recebido_parcial') {
                $atraso = self::fracao() > $forn['pontualidade'] ? self::inteiro(2, 21) : self::inteiro(-3, 2);
                $recebimento = date('Y-m-d', strtotime($previsao . ' ' . ($atraso >= 0 ? "+$atraso" : $atraso) . ' days'));
                $qtdRecebida = $situacao === 'recebido' ? $qtdTotal : (int) round($qtdTotal * self::decimal(0.3, 0.85, 2));
            }

            $saida[] = [
                'id'          => 'oc-' . $numero,
                'numero'      => (string) $numero,
                'bling_id'    => 200000 + $numero,
                'fornecedor'  => $forn['id'],
                'conta'       => 'conta-matriz',
                'emissao'     => $data,
                'previsao'    => $previsao,
                'recebimento' => $recebimento,
                'itens'       => $itens,
                'qtd_itens'   => $nItens,
                'qtd_total'   => $qtdTotal,
                'qtd_recebida'=> $qtdRecebida,
                'valor'       => round($valor, 2),
                'situacao'    => $situacao,
                'comprador'   => self::escolher(['Ana Ribeiro', 'Marcelo Dias', 'Patrícia Rocha']),
                'divergencia' => $situacao === 'recebido' && self::fracao() > 0.91,
                'atualizado_em' => $data . 'T12:00:00Z',
            ];
        }
        return $saida;
    }

    private static function situacaoCompra(int $diasAtras, string $previsao): string
    {
        if ($diasAtras <= 3) {
            return self::escolherPesado(['solicitado' => 0.4, 'cotacao' => 0.3, 'aprovado' => 0.3]);
        }
        if ($diasAtras <= 20) {
            // Atrasado = previsao ja passou e ainda nao recebeu.
            if ($previsao < self::hoje() && self::fracao() > 0.55) {
                return self::escolherPesado(['enviado_fornecedor' => 0.6, 'recebido_parcial' => 0.4]);
            }
            return self::escolherPesado([
                'enviado_fornecedor' => 0.42, 'recebido' => 0.28,
                'recebido_parcial' => 0.16, 'aprovado' => 0.11, 'cancelado' => 0.03,
            ]);
        }
        return self::escolherPesado(['recebido' => 0.87, 'recebido_parcial' => 0.06, 'cancelado' => 0.07]);
    }

    /** Contas a pagar: uma por compra recebida + despesas recorrentes. */
    private static function gerarPagar(array $g): array
    {
        $saida = [];
        $n = 0;

        foreach ($g['compras'] as $oc) {
            if (in_array($oc['situacao'], ['solicitado', 'cotacao', 'cancelado'], true)) {
                continue;
            }
            $n++;
            $venc = date('Y-m-d', strtotime($oc['emissao'] . ' +' . self::inteiro(21, 60) . ' days'));
            $vencido = $venc < self::hoje();
            $sit = $vencido
                ? self::escolherPesado(['liquidado' => 0.89, 'vencido' => 0.08, 'parcial' => 0.03])
                : self::escolherPesado(['aberto' => 0.95, 'liquidado' => 0.05]);

            $pago = match ($sit) {
                'liquidado' => $oc['valor'],
                'parcial'   => round($oc['valor'] * self::decimal(0.2, 0.75, 2), 2),
                default     => 0.0,
            };

            $saida[] = [
                'id'         => 'pag-' . $n,
                'titulo'     => sprintf('PAG-%06d', $n),
                'compra'     => $oc['id'],
                'fornecedor' => $oc['fornecedor'],
                'conta'      => $oc['conta'],
                'emissao'    => $oc['emissao'],
                'competencia'=> substr($oc['emissao'], 0, 7),
                'vencimento' => $venc,
                'valor'      => $oc['valor'],
                'pago'       => $pago,
                'saldo'      => round($oc['valor'] - $pago, 2),
                'situacao'   => $sit,
                'categoria'  => 'cf-desp-forn',
                'recorrente' => false,
                'atraso_dias'=> $sit === 'vencido' ? (int) ((strtotime(self::hoje()) - strtotime($venc)) / 86400) : 0,
            ];
        }

        // Despesas recorrentes: dao corpo ao fluxo de caixa (§34).
        $recorrentes = [
            ['nome' => 'Folha de pagamento', 'categoria' => 'cf-desp-folha', 'valor' => 148000, 'dia' => 5],
            ['nome' => 'Aluguel galpão',     'categoria' => 'cf-desp-oper',  'valor' => 27500,  'dia' => 10],
            ['nome' => 'Energia elétrica',   'categoria' => 'cf-desp-oper',  'valor' => 9200,   'dia' => 15],
            ['nome' => 'Impostos federais',  'categoria' => 'cf-desp-imp',   'valor' => 62000,  'dia' => 20],
            ['nome' => 'Mídia paga',         'categoria' => 'cf-desp-mkt',   'valor' => 38000,  'dia' => 8],
        ];
        for ($m = 12; $m >= -2; $m--) {
            $mes = date('Y-m', strtotime(self::hoje() . " -$m months"));
            foreach ($recorrentes as $r) {
                $n++;
                $venc = sprintf('%s-%02d', $mes, $r['dia']);
                $vencido = $venc < self::hoje();
                $valor = round($r['valor'] * self::decimal(0.93, 1.09, 3), 2);
                $sit = $vencido ? (self::fracao() > 0.05 ? 'liquidado' : 'vencido') : 'aberto';

                $saida[] = [
                    'id' => 'pag-' . $n, 'titulo' => sprintf('PAG-%06d', $n),
                    'compra' => null, 'fornecedor' => null, 'conta' => 'conta-matriz',
                    'emissao' => $venc, 'competencia' => $mes, 'vencimento' => $venc,
                    'valor' => $valor,
                    'pago' => $sit === 'liquidado' ? $valor : 0.0,
                    'saldo' => $sit === 'liquidado' ? 0.0 : $valor,
                    'situacao' => $sit, 'categoria' => $r['categoria'],
                    'descricao' => $r['nome'], 'recorrente' => true,
                    'atraso_dias' => $sit === 'vencido' ? (int) ((strtotime(self::hoje()) - strtotime($venc)) / 86400) : 0,
                ];
            }
        }

        return $saida;
    }

    private static function gerarWebhooks(array $g): array
    {
        $eventos = ['order.created', 'order.updated', 'invoice.issued', 'invoice.rejected',
                    'product.updated', 'stock.changed', 'payment.received', 'shipment.updated'];
        $saida = [];
        for ($i = 1; $i <= 260; $i++) {
            $quando = strtotime(self::hoje() . ' -' . self::inteiro(0, 14) . ' days -' . self::inteiro(0, 1439) . ' minutes');
            $sit = self::escolherPesado([
                'processado' => 0.855, 'falhou' => 0.055,
                'duplicado' => 0.045, 'na_fila' => 0.03, 'dlq' => 0.015,
            ]);
            $saida[] = [
                'id'        => 'wh-' . $i,
                'evento'    => self::escolher($eventos),
                'origem'    => 'bling',
                'recebido_em' => gmdate('c', $quando),
                'situacao'  => $sit,
                'tentativas'=> $sit === 'processado' ? 1 : self::inteiro(1, 5),
                'duracao_ms'=> self::inteiro(28, 2400),
                'correlation_id' => 'bl-' . substr(md5((string) $i), 0, 16),
                'resultado' => $sit === 'falhou' ? self::escolher([
                    'Timeout ao consultar detalhe do recurso',
                    'HTTP 429 — limite de requisições atingido',
                    'Payload sem campo obrigatório `id`',
                ]) : null,
            ];
        }
        usort($saida, static fn($a, $b) => strcmp($b['recebido_em'], $a['recebido_em']));
        return $saida;
    }

    private static function gerarSync(array $g): array
    {
        $recursos = [
            'sales-orders' => 'Pedidos de venda', 'products' => 'Produtos',
            'inventory' => 'Estoque', 'invoices' => 'Notas fiscais',
            'contacts' => 'Contatos', 'suppliers' => 'Fornecedores',
            'purchase-orders' => 'Pedidos de compra', 'receivables' => 'Contas a receber',
            'payables' => 'Contas a pagar', 'shipments' => 'Envios',
            'warehouses' => 'Depósitos', 'categories' => 'Categorias',
        ];
        $saida = [];
        foreach ($recursos as $chave => $rotulo) {
            $sit = self::escolherPesado([
                'ok' => 0.72, 'atencao' => 0.14, 'parcial' => 0.08, 'erro' => 0.06,
            ]);
            $ultima = strtotime(self::hoje() . ' -' . self::inteiro(0, 180) . ' minutes');
            $consultados = self::inteiro(120, 9800);
            $criados = (int) round($consultados * self::decimal(0.01, 0.09, 3));
            $atualizados = (int) round($consultados * self::decimal(0.05, 0.31, 3));
            $erros = $sit === 'ok' ? 0 : self::inteiro(1, 48);

            $saida[] = [
                'recurso'      => $chave,
                'rotulo'       => $rotulo,
                'conta'        => 'conta-matriz',
                'situacao'     => $sit,
                'ultima_execucao' => gmdate('c', $ultima),
                'proxima_execucao'=> gmdate('c', $ultima + 900),
                'duracao_s'    => self::decimal(1.2, 184.0, 1),
                'consultados'  => $consultados,
                'criados'      => $criados,
                'atualizados'  => $atualizados,
                'ignorados'    => max(0, $consultados - $criados - $atualizados - $erros),
                'erros'        => $erros,
                'pagina'       => self::inteiro(1, 42),
                'cursor'       => 'cur_' . substr(md5($chave), 0, 12),
                'watermark'    => gmdate('c', $ultima - 900),
                'limite_consumido_pct' => self::inteiro(6, 88),
                'retry'        => $sit === 'erro' ? self::inteiro(1, 4) : 0,
                'estrategia'   => self::fracao() > 0.25 ? 'incremental' : 'reconciliacao',
            ];
        }
        return $saida;
    }

    // ── Derivados (dependem do grafo pronto) ─────────────────────

    /** Acrescenta giro, cobertura e classificacao ao estoque. */
    private static function enriquecerEstoque(array $g): array
    {
        // Unidades vendidas por produto nos ultimos 90 dias -> giro real.
        $corte = date('Y-m-d', strtotime(self::hoje() . ' -90 days'));
        $vendido = [];
        foreach ($g['pedidos'] as $p) {
            if ($p['data'] < $corte || in_array($p['situacao'], ['cancelado', 'rascunho'], true)) {
                continue;
            }
            foreach ($p['itens'] as $it) {
                $vendido[$it['produto']] = ($vendido[$it['produto']] ?? 0) + $it['quantidade'];
            }
        }

        $saida = [];
        foreach ($g['estoque'] as $e) {
            $consumo90 = $vendido[$e['produto']] ?? 0;
            $consumoDia = $consumo90 / 90;
            $cobertura = $consumoDia > 0 ? round($e['disponivel'] / $consumoDia, 1) : null;
            $giro = $e['fisico'] > 0 ? round(($consumo90 / 90 * 365) / max(1, $e['fisico']), 2) : 0.0;

            $e['consumo_90d']  = $consumo90;
            $e['consumo_dia']  = round($consumoDia, 3);
            $e['cobertura_dias'] = $cobertura;
            $e['giro_anual']   = $giro;
            $e['status'] = match (true) {
                $e['fisico'] < 0                                 => 'negativo',
                $e['disponivel'] <= 0                            => 'zerado',
                $e['disponivel'] < $e['minimo']                  => 'critico',
                $cobertura !== null && $cobertura < 15           => 'baixa_cobertura',
                $consumo90 === 0 && $e['fisico'] > 0             => 'parado',
                default                                          => 'normal',
            };
            $saida[] = $e;
        }
        return $saida;
    }

    /** Acrescenta margem, ultima venda e score de qualidade cadastral (§23). */
    private static function enriquecerProdutos(array $g): array
    {
        $ultimaVenda = [];
        $unidades = [];
        $receita = [];
        foreach ($g['pedidos'] as $p) {
            if (in_array($p['situacao'], ['cancelado', 'rascunho'], true)) {
                continue;
            }
            foreach ($p['itens'] as $it) {
                $pid = $it['produto'];
                if (!isset($ultimaVenda[$pid]) || $p['data'] > $ultimaVenda[$pid]) {
                    $ultimaVenda[$pid] = $p['data'];
                }
                $unidades[$pid] = ($unidades[$pid] ?? 0) + $it['quantidade'];
                $receita[$pid]  = ($receita[$pid] ?? 0) + $it['total'];
            }
        }

        $estoquePorProduto = [];
        foreach ($g['estoque'] as $e) {
            $estoquePorProduto[$e['produto']] = ($estoquePorProduto[$e['produto']] ?? 0) + $e['disponivel'];
        }

        $saida = [];
        foreach ($g['produtos'] as $p) {
            $preco = $p['preco_promocional'] ?? $p['preco'];
            $p['margem_pct']  = $preco > 0 ? round((($preco - $p['custo']) / $preco) * 100, 1) : 0.0;
            $p['ultima_venda']= $ultimaVenda[$p['id']] ?? null;
            $p['unidades_vendidas'] = $unidades[$p['id']] ?? 0;
            $p['receita']     = round($receita[$p['id']] ?? 0, 2);
            $p['estoque_total'] = $estoquePorProduto[$p['id']] ?? 0;

            // Score de qualidade cadastral (§23): 16 criterios, peso igual.
            $criterios = [
                'sku'        => $p['sku'] !== '',
                'gtin'       => $p['gtin'] !== null,
                'descricao'  => $p['descricao_ok'],
                'imagens'    => $p['imagem'],
                'categoria'  => $p['categoria'] !== '',
                'marca'      => $p['marca'] !== '',
                'unidade'    => $p['unidade'] !== '',
                'peso'       => $p['peso_kg'] !== null,
                'dimensoes'  => $p['dimensoes'] !== null,
                'origem'     => $p['origem'] !== '',
                'tributacao' => $p['ncm'] !== null,
                'custo'      => $p['custo'] > 0,
                'preco'      => $p['preco'] > 0,
                'estoque'    => ($estoquePorProduto[$p['id']] ?? 0) > 0,
                'fornecedor' => $p['fornecedor'] !== '',
                'canal'      => count($p['canais']) > 0,
            ];
            $atendidos = count(array_filter($criterios));
            $p['qualidade_score'] = (int) round(($atendidos / count($criterios)) * 100);
            $p['qualidade_pendencias'] = array_keys(array_filter($criterios, static fn($v) => !$v));

            $saida[] = $p;
        }
        return $saida;
    }
}
