<?php
// scripts/lib/BlingApiFalsa.php — serve o grafo do mock como se fosse a API v3
// @version 1.0.0  @created 2026-07-30  (Fase 5)
//
// PARA QUE SERVE
// A Fase 4 provou o pipeline com 1 produto e 1 pedido. Isso mostra que ele
// funciona, não que ele funciona COM VOLUME e com a variedade de estados que os
// dados reais têm.
//
// Esta classe converte o grafo coerente do BlingMock (221 produtos, 1538
// pedidos, 1405 notas, 1966 títulos) DE VOLTA para o formato bruto da API v3 do
// Bling — paginado, com códigos de situação numéricos, com documentos completos
// — e responde como o servidor do Bling responderia.
//
// O resultado é que a carga inicial inteira roda pelo caminho REAL
// (paginar → normalizar → adaptar versão → upsert → FK) contra o banco de
// verdade, e depois as 52 telas podem ser servidas pelo BlingReal e comparadas,
// número a número, com o mesmo mock que gerou os dados.
//
// ⚠️ TRADUÇÃO INVERSA DE PROPÓSITO.
// O mock guarda a situação já no vocabulário interno ('entregue', 'liquidado').
// Aqui ela volta a ser o CÓDIGO que o Bling manda ('27', '2'). Sem isso o
// BlingVersionAdapter não seria exercitado — e o adapter é justamente a peça que
// absorve mudança de versão da API.
//
// ⚠️ DOCUMENTOS COMPLETOS DE PROPÓSITO.
// O mock guarda CPF/CNPJ já mascarados. A API real manda o documento inteiro.
// Aqui ele é reconstituído (sinteticamente) para que o mascaramento na ORIGEM
// (§62) seja exercitado de verdade em vez de receber um dado já mascarado.
declare(strict_types=1);

if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingApiFalsa
{
    /** Itens por página, como a API v3. */
    public const LIMITE = 100;

    private array $grafo;

    /** @var array<string,int> endpoint => páginas servidas */
    public array $paginasServidas = [];

    /** Mapa inverso: vocabulário interno => código que o Bling manda. */
    private const COD_PEDIDO = [
        'rascunho' => '0', 'aguardando_aprovacao' => '6', 'aprovado' => '9',
        'cancelado' => '12', 'faturado' => '15', 'nota_emitida' => '18',
        'separacao' => '21', 'enviado' => '24', 'entregue' => '27',
        'devolvido' => '30',
    ];
    private const COD_COMPRA = [
        'solicitado' => '0', 'cotacao' => '1', 'aprovado' => '2',
        'enviado_fornecedor' => '3', 'recebido_parcial' => '4',
        'recebido' => '5', 'cancelado' => '6',
    ];
    private const COD_NOTA = [
        'pendente' => '1', 'processando' => '2', 'rejeitada' => '3',
        'autorizada' => '4', 'cancelada' => '5', 'inutilizada' => '6',
    ];
    private const COD_TITULO = [
        'aberto' => '1', 'liquidado' => '2', 'cancelado' => '3', 'parcial' => '4',
        // `vencido` NÃO é estado do Bling — é derivado da data e do saldo.
        // Aqui ele volta a ser 'aberto', que é o que o Bling mandaria.
        'vencido' => '1',
    ];

    public function __construct(array $grafo)
    {
        $this->grafo = $grafo;
    }

    /**
     * Instala as rotas no transporte falso.
     *
     * Cada rota recebe a URL com `pagina` e `limite` e devolve a fatia
     * correspondente — a paginação é EXERCITADA, não simulada.
     */
    public function instalar(BlingTransporteFalso $t): void
    {
        $rotas = [
            'categorias/produtos'   => fn() => $this->categorias(),
            '/depositos'            => fn() => $this->depositos(),
            'canais-venda'          => fn() => $this->canais(),
            'contatos/fornecedores' => fn() => $this->fornecedores(),
            '/contatos?'            => fn() => $this->contatos(),
            '/produtos'             => fn() => $this->produtos(),
            'estoques/saldos'       => fn() => $this->estoque(),
            'pedidos/vendas'        => fn() => $this->pedidos(),
            'pedidos/compras'       => fn() => $this->compras(),
            '/nfe'                  => fn() => $this->notas(),
            'contas/receber'        => fn() => $this->receber(),
            'contas/pagar'          => fn() => $this->pagar(),
        ];

        // ⚠️ A ordem importa: `responder()` casa por SUBSTRING e o primeiro
        // match vence. `contatos/fornecedores` tem que ser registrado ANTES de
        // `/contatos?`, senão os fornecedores cairiam na rota de contatos.
        foreach ($rotas as $trecho => $fabrica) {
            $t->responder($trecho, function ($metodo, $url) use ($trecho, $fabrica) {
                parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
                $pagina = max(1, (int) ($q['pagina'] ?? 1));
                $this->paginasServidas[$trecho] = max(
                    $this->paginasServidas[$trecho] ?? 0, $pagina);
                return new BlingResposta(200, ['data' => $this->fatia($fabrica(), $pagina)]);
            });
        }
    }

    /** Total de registros que esta API vai entregar, por recurso. */
    public function totais(): array
    {
        return [
            'categorias'   => count($this->categorias()),
            'depositos'    => count($this->depositos()),
            'canais'       => count($this->canais()),
            'fornecedores' => count($this->fornecedores()),
            'contatos'     => count($this->contatos()),
            'produtos'     => count($this->produtos()),
            'estoque'      => count($this->estoque()),
            'pedidos'      => count($this->pedidos()),
            'compras'      => count($this->compras()),
            'notas'        => count($this->notas()),
            'receber'      => count($this->receber()),
            'pagar'        => count($this->pagar()),
        ];
    }

    // ─────────────────────────────────────────────────────────────

    private function fatia(array $itens, int $pagina): array
    {
        return array_slice($itens, ($pagina - 1) * self::LIMITE, self::LIMITE);
    }

    /** id interno do mock ('prod-12') => id numérico estável do Bling. */
    private static function idNum(string $idMock, int $base): int
    {
        if (preg_match('/(\d+)$/', $idMock, $m)) {
            return $base + (int) $m[1];
        }
        // Sem número no id (ex.: 'dep-geral', 'ml'): hash estável.
        return $base + (crc32($idMock) % 90000);
    }

    /**
     * Reconstitui um documento completo a partir do id.
     *
     * Sintético e determinístico — não é o documento de ninguém. Existe para
     * que o mascaramento na origem (§62) receba um documento INTEIRO e possa
     * ser verificado de verdade.
     */
    private static function documento(string $id, bool $juridica): string
    {
        $n = abs(crc32($id));
        return $juridica
            ? str_pad((string) ($n % 100000000), 8, '0', STR_PAD_LEFT) . '0001' . str_pad((string) ($n % 100), 2, '0', STR_PAD_LEFT)
            : str_pad((string) ($n % 100000000000), 11, '0', STR_PAD_LEFT);
    }

    // ── cadastros ────────────────────────────────────────────────

    private function categorias(): array
    {
        return array_map(static fn($c) => [
            'id' => (string) self::idNum($c['id'], 50000),
            'descricao' => $c['nome'],
        ], $this->grafo['categorias'] ?? []);
    }

    private function depositos(): array
    {
        return array_map(static fn($d) => [
            'id' => (string) self::idNum($d['id'], 90000),
            'descricao' => $d['nome'],
            'padrao' => (bool) ($d['padrao'] ?? false),
        ], $this->grafo['depositos'] ?? []);
    }

    private function canais(): array
    {
        return array_map(static fn($c) => [
            'id' => (string) self::idNum($c['id'], 20000),
            'descricao' => $c['nome'],
            'tipo' => $c['tipo'] ?? 'proprio',
        ], $this->grafo['canais'] ?? []);
    }

    private function fornecedores(): array
    {
        return array_map(static fn($f) => [
            'id' => (string) ($f['bling_id'] ?? self::idNum($f['id'], 900000)),
            'nome' => $f['nome'],
            // Documento COMPLETO: é o que a API real manda.
            'numeroDocumento' => self::documento($f['id'], true),
            'tipo' => 'J',
            'uf' => $f['uf'] ?? null,
            'situacao' => ($f['ativo'] ?? true) ? 'A' : 'I',
        ], $this->grafo['fornecedores'] ?? []);
    }

    private function contatos(): array
    {
        return array_map(static function ($c) {
            $juridica = ($c['tipo'] ?? 'fisica') === 'juridica';
            return [
                'id' => (string) ($c['bling_id'] ?? self::idNum($c['id'], 500000)),
                'nome' => $c['nome'],
                'numeroDocumento' => self::documento($c['id'], $juridica),
                'tipo' => $juridica ? 'J' : 'F',
                'uf' => $c['uf'] ?? null,
                'situacao' => ($c['ativo'] ?? true) ? 'A' : 'I',
            ];
        }, $this->grafo['clientes'] ?? []);
    }

    private function produtos(): array
    {
        return array_map(static fn($p) => [
            'id' => (string) ($p['bling_id'] ?? self::idNum($p['id'], 700000)),
            'nome' => $p['nome'],
            'codigo' => $p['sku'] ?? '',
            'gtin' => $p['gtin'] ?? null,
            // ⚠️ Preço como STRING pt-BR em parte dos itens: é assim que a API
            // v3 responde em alguns endpoints, e `Number()` puro daria NaN.
            'preco' => number_format((float) $p['preco'], 2, ',', '.'),
            'precoCusto' => (float) $p['custo'],
            'categoria' => ['id' => (string) self::idNum((string) $p['categoria'], 50000)],
            'fornecedor' => isset($p['fornecedor'])
                ? ['id' => (string) self::idNum((string) $p['fornecedor'], 900000)] : null,
            'unidade' => $p['unidade'] ?? 'UN',
            'marca' => $p['marca'] ?? null,
            'situacao' => ($p['ativo'] ?? true) ? 'A' : 'I',
            'tipo' => $p['tipo'] ?? 'simples',
            'descricaoCurta' => ($p['descricao_ok'] ?? false) ? $p['nome'] . ' — descrição completa' : '',
            'imagemURL' => ($p['imagem'] ?? false) ? 'https://exemplo/img.jpg' : null,
            'tributacao' => ['ncm' => $p['ncm'] ?? null, 'origem' => $p['origem'] ?? null],
            'dimensoes' => self::dimensoes($p),
        ], $this->grafo['produtos'] ?? []);
    }

    private static function dimensoes(array $p): array
    {
        $d = explode('x', (string) ($p['dimensoes'] ?? ''));
        return [
            'pesoLiquido' => (float) ($p['peso_kg'] ?? 0),
            'largura' => (float) ($d[0] ?? 0),
            'altura'  => (float) ($d[1] ?? 0),
            'profundidade' => (float) ($d[2] ?? 0),
        ];
    }

    private function estoque(): array
    {
        return array_map(static fn($e) => [
            'produto'  => ['id' => (string) self::idNum((string) $e['produto'], 700000)],
            'deposito' => ['id' => (string) self::idNum((string) $e['deposito'], 90000)],
            'saldoFisico' => (float) $e['fisico'],
            'reservado' => (float) $e['reservado'],
            'estoqueMinimo' => (float) ($e['minimo'] ?? 0),
            'estoqueMaximo' => (float) ($e['maximo'] ?? 0),
        ], $this->grafo['estoque'] ?? []);
    }

    // ── movimento ────────────────────────────────────────────────

    private function pedidos(): array
    {
        $canais = [];
        foreach ($this->grafo['canais'] ?? [] as $c) {
            $canais[$c['id']] = self::idNum($c['id'], 20000);
        }

        // ⚠️ O envio vai DENTRO do pedido, que é como a API v3 o expõe — não
        // existe recurso "envio" separado. O grafo do mock guarda os dois
        // separados; aqui eles voltam a ser um só, como o Bling manda.
        $transportadoras = [];
        foreach ($this->grafo['transportadoras'] ?? [] as $t) {
            $transportadoras[$t['id']] = $t['nome'] ?? '';
        }
        $envioPorPedido = [];
        foreach ($this->grafo['envios'] ?? [] as $e) {
            $envioPorPedido[$e['pedido']] = $e;
        }

        return array_map(static function ($p) use ($canais, $transportadoras, $envioPorPedido) {
            return [
                'id' => (string) ($p['bling_id'] ?? self::idNum($p['id'], 310000)),
                'numero' => (string) $p['numero'],
                'data' => $p['data'],
                'dataSaida' => $p['data'],
                // Código numérico: é o que faz o BlingVersionAdapter trabalhar.
                'situacao' => ['id' => self::COD_PEDIDO[$p['situacao']] ?? '6',
                               'valor' => self::COD_PEDIDO[$p['situacao']] ?? '6'],
                'contato' => ['id' => (string) self::idNum((string) $p['cliente'], 500000)],
                'loja' => isset($canais[$p['canal'] ?? ''])
                    ? ['id' => (string) $canais[$p['canal']]] : null,
                'total' => (float) $p['total'],
                'desconto' => ['valor' => (float) ($p['desconto'] ?? 0)],
                'transporte' => self::transporte(
                    $envioPorPedido[$p['id']] ?? null, $transportadoras, (float) ($p['frete'] ?? 0)),
                'itens' => array_map(static fn($it, $i) => [
                    'id' => $p['id'] . '-i' . $i,
                    'produto' => ['id' => (string) self::idNum((string) $it['produto'], 700000)],
                    'codigo' => $it['sku'] ?? '',
                    'descricao' => $it['nome'] ?? '',
                    'quantidade' => (float) $it['quantidade'],
                    'valor' => (float) $it['unitario'],
                    'valorCusto' => (float) ($it['custo_unitario'] ?? 0),
                ], $p['itens'], array_keys($p['itens'])),
            ];
        }, $this->grafo['pedidos'] ?? []);
    }

    /** Bloco `transporte` do pedido, no formato da v3. */
    private static function transporte(?array $envio, array $transportadoras, float $frete): array
    {
        if ($envio === null) {
            return ['frete' => $frete];
        }
        return [
            'frete' => $frete,
            'transportador' => ['nome' => $transportadoras[$envio['transportadora']] ?? null],
            'servico' => $envio['servico'] ?? null,
            'prazoEntrega' => $envio['previsao'] ?? null,
            'etiqueta' => ['uf' => $envio['uf'] ?? null],
            // Rastreio dentro do volume: é onde a v3 o coloca.
            'volumes' => [['codigoRastreamento' => $envio['rastreamento'] ?? null]],
        ];
    }

    private function compras(): array
    {
        return array_map(static function ($c) {
            return [
                'id' => (string) ($c['bling_id'] ?? self::idNum($c['id'], 208000)),
                'numero' => (string) $c['numero'],
                'data' => $c['emissao'],
                'dataPrevista' => $c['previsao'] ?? null,
                'situacao' => ['valor' => self::COD_COMPRA[$c['situacao']] ?? '0'],
                'fornecedor' => ['id' => (string) self::idNum((string) $c['fornecedor'], 900000)],
                'total' => (float) $c['valor'],
                'itens' => array_map(static fn($it, $i) => [
                    'id' => $c['id'] . '-i' . $i,
                    'produto' => ['id' => (string) self::idNum((string) $it['produto'], 700000)],
                    'codigo' => $it['sku'] ?? '',
                    'descricao' => $it['nome'] ?? '',
                    'quantidade' => (float) $it['quantidade'],
                    'valor' => (float) $it['unitario'],
                ], $c['itens'], array_keys($c['itens'])),
            ];
        }, $this->grafo['compras'] ?? []);
    }

    private function notas(): array
    {
        return array_map(static fn($n) => [
            'id' => (string) self::idNum($n['id'], 400000),
            'numero' => (string) $n['numero'],
            'serie' => (string) $n['serie'],
            'dataEmissao' => $n['emissao'],
            'valorNota' => (float) $n['valor'],
            'situacao' => self::COD_NOTA[$n['situacao']] ?? '1',
            'tipo' => ($n['tipo'] ?? 'saida') === 'saida' ? '1' : '0',
            'finalidade' => $n['finalidade'] ?? 'normal',
            'chaveAcesso' => $n['chave'] ?? null,
            'contato' => ['id' => (string) self::idNum((string) $n['cliente'], 500000)],
            'pedido' => isset($n['pedido'])
                ? ['id' => (string) self::idNum((string) $n['pedido'], 310000)] : null,
        ], $this->grafo['notas'] ?? []);
    }

    private function receber(): array
    {
        return array_map(static fn($t) => [
            'id' => (string) self::idNum($t['id'], 910000),
            'numeroDocumento' => $t['titulo'],
            'dataEmissao' => $t['emissao'],
            'vencimento' => $t['vencimento'],
            'valor' => (float) $t['valor'],
            'saldo' => (float) $t['saldo'],
            'situacao' => self::COD_TITULO[$t['situacao']] ?? '1',
            'contato' => ['id' => (string) self::idNum((string) $t['cliente'], 500000)],
            'parcela' => $t['parcela'] ?? null,
        ], $this->grafo['receber'] ?? []);
    }

    private function pagar(): array
    {
        return array_map(static fn($t) => [
            'id' => (string) self::idNum($t['id'], 920000),
            'numeroDocumento' => $t['titulo'],
            'dataEmissao' => $t['emissao'],
            'vencimento' => $t['vencimento'],
            'valor' => (float) $t['valor'],
            'saldo' => (float) $t['saldo'],
            'situacao' => self::COD_TITULO[$t['situacao']] ?? '1',
            'contato' => ['id' => (string) self::idNum((string) $t['fornecedor'], 900000)],
        ], $this->grafo['pagar'] ?? []);
    }
}
