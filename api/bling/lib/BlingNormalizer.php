<?php
// Bling / lib/BlingNormalizer.php - payload do Bling -> modelo interno
// @module  bling.normalizer
// @version 1.0.0
// @created 2026-07-30
//
// §49: esta é a camada que ABSORVE mudança de API. O briefing avisa que a
// documentação do Bling "pode receber alterações ou breaking changes", e o
// changelog deles é ativo.
//
// A regra: nenhuma tela, nenhum controller e nenhum repositório conhece nome de
// campo do Bling. Se amanhã `situacao.valor` virar `situacao.id`, muda AQUI e
// mais nada quebra.
//
// TOLERÂNCIA A CAMPO AUSENTE é deliberada: um recurso que perde um campo
// opcional não pode derrubar a sincronização inteira. Campo faltando vira null;
// campo OBRIGATÓRIO faltando levanta exceção, porque aí a linha seria lixo.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingNormalizer
{
    // ── Utilitários de leitura tolerante ────────────────────────

    /**
     * Lê um caminho aninhado aceitando VÁRIOS nomes possíveis.
     * `campo($p, 'contato.nome', 'cliente.nome')` cobre as duas grafias sem
     * espalhar `??` pelo código.
     */
    private static function campo(array $p, string ...$caminhos): mixed
    {
        foreach ($caminhos as $caminho) {
            $atual = $p;
            $achou = true;
            foreach (explode('.', $caminho) as $parte) {
                if (is_array($atual) && array_key_exists($parte, $atual)) {
                    $atual = $atual[$parte];
                } else {
                    $achou = false;
                    break;
                }
            }
            if ($achou && $atual !== null && $atual !== '') {
                return $atual;
            }
        }
        return null;
    }

    private static function texto(array $p, string ...$c): ?string
    {
        $v = self::campo($p, ...$c);
        return $v === null ? null : (is_scalar($v) ? trim((string) $v) : null);
    }

    private static function numero(array $p, string ...$c): float
    {
        $v = self::campo($p, ...$c);
        if ($v === null) {
            return 0.0;
        }
        if (is_numeric($v)) {
            return (float) $v;
        }
        // "1.234,56" (pt-BR) e "1234.56" chegam dependendo do endpoint.
        $s = str_replace(['.', ','], ['', '.'], (string) $v);
        return is_numeric($s) ? (float) $s : 0.0;
    }

    private static function inteiro(array $p, string ...$c): int
    {
        return (int) self::numero($p, ...$c);
    }

    /** Data ISO (YYYY-MM-DD) ou null. Aceita dd/mm/yyyy, que alguns endpoints devolvem. */
    private static function data(array $p, string ...$c): ?string
    {
        $v = self::texto($p, ...$c);
        if ($v === null) {
            return null;
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $v, $m)) {
            return "$m[1]-$m[2]-$m[3]";
        }
        if (preg_match('#^(\d{2})/(\d{2})/(\d{4})#', $v, $m)) {
            return "$m[3]-$m[2]-$m[1]";
        }
        $t = strtotime($v);
        return $t === false ? null : date('Y-m-d', $t);
    }

    /**
     * DATETIME em UTC.
     * O Bling responde em horário de Brasília. Gravar isso como se fosse UTC
     * desloca tudo em 3 horas e o pedido das 23h aparece no dia seguinte.
     */
    private static function dataHoraUtc(array $p, string ...$c): ?string
    {
        $v = self::texto($p, ...$c);
        if ($v === null) {
            return null;
        }
        try {
            // Sem fuso explícito no texto = America/Sao_Paulo.
            $tz = preg_match('/(Z|[+-]\d{2}:?\d{2})$/', $v)
                ? null : new DateTimeZone('America/Sao_Paulo');
            $d = $tz ? new DateTimeImmutable($v, $tz) : new DateTimeImmutable($v);
            return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        } catch (Throwable) {
            return null;
        }
    }

    /** Hash do payload: quando não muda, não reescreve a linha. */
    public static function hash(array $payload): string
    {
        return md5(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');
    }

    private static function exigir(?string $v, string $campo, string $recurso): string
    {
        if ($v === null || $v === '') {
            throw new RuntimeException("Payload de $recurso sem campo obrigatório: $campo");
        }
        return $v;
    }

    // ── Recursos ────────────────────────────────────────────────

    public static function contato(array $p): array
    {
        $tipo = strtolower((string) (self::texto($p, 'tipo', 'tipoPessoa') ?? ''));
        return [
            'bling_id'   => self::exigir(self::texto($p, 'id'), 'id', 'contato'),
            'nome'       => self::texto($p, 'nome', 'razaoSocial') ?? '(sem nome)',
            'tipo_pessoa'=> str_starts_with($tipo, 'j') ? 'juridica' : 'fisica',
            'documento'  => preg_replace('/\D/', '', (string) (self::texto($p, 'numeroDocumento', 'cnpj', 'cpf') ?? '')) ?: null,
            'email'      => self::texto($p, 'email'),
            'telefone'   => self::texto($p, 'telefone', 'celular'),
            'uf'         => substr((string) (self::texto($p, 'endereco.geral.uf', 'endereco.uf', 'uf') ?? ''), 0, 2) ?: null,
            'cidade'     => self::texto($p, 'endereco.geral.municipio', 'endereco.municipio', 'cidade'),
            'is_cliente' => 1,
            'is_fornecedor' => self::campo($p, 'tipos.fornecedor') ? 1 : 0,
            'is_ativo'   => self::situacaoAtiva($p),
            'payload_hash' => self::hash($p),
        ];
    }

    public static function fornecedor(array $p): array
    {
        return [
            'bling_id'  => self::exigir(self::texto($p, 'id'), 'id', 'fornecedor'),
            'nome'      => self::texto($p, 'nome', 'razaoSocial') ?? '(sem nome)',
            'documento' => preg_replace('/\D/', '', (string) (self::texto($p, 'numeroDocumento', 'cnpj') ?? '')) ?: null,
            'uf'        => substr((string) (self::texto($p, 'endereco.geral.uf', 'endereco.uf', 'uf') ?? ''), 0, 2) ?: null,
            'prazo_entrega_dias' => self::inteiro($p, 'prazoEntrega') ?: null,
            'cadastro_completo'  => (self::texto($p, 'numeroDocumento', 'cnpj') && self::texto($p, 'email')) ? 1 : 0,
            'is_ativo'  => self::situacaoAtiva($p),
            'payload_hash' => self::hash($p),
        ];
    }

    public static function produto(array $p): array
    {
        $tipoBruto = strtolower((string) (self::texto($p, 'formato', 'tipo') ?? 'S'));
        return [
            'bling_id' => self::exigir(self::texto($p, 'id'), 'id', 'produto'),
            'sku'      => self::texto($p, 'codigo', 'sku'),
            'gtin'     => self::texto($p, 'gtin', 'codigoBarras'),
            'nome'     => self::texto($p, 'nome', 'descricao') ?? '(sem nome)',
            'tipo'     => match (true) {
                str_starts_with($tipoBruto, 'v') => 'variacao',
                str_starts_with($tipoBruto, 'e'),
                str_starts_with($tipoBruto, 'k') => 'kit',
                $tipoBruto === 'servico'         => 'servico',
                default                          => 'simples',
            },
            'categoria_bling_id' => self::texto($p, 'categoria.id'),
            'marca'    => self::texto($p, 'marca'),
            'unidade'  => self::texto($p, 'unidade'),
            'ncm'      => preg_replace('/\D/', '', (string) (self::texto($p, 'tributacao.ncm', 'ncm') ?? '')) ?: null,
            'origem'   => self::texto($p, 'tributacao.origem', 'origem'),
            'peso_kg'  => self::numero($p, 'dimensoes.pesoLiquido', 'pesoLiquido') ?: null,
            'dimensoes'=> self::dimensoes($p),
            'tem_imagem'   => self::campo($p, 'midia.imagens.internas', 'imagens') ? 1 : 0,
            'descricao_ok' => mb_strlen((string) (self::texto($p, 'descricaoCurta', 'descricao') ?? '')) > 20 ? 1 : 0,
            'fornecedor_bling_id' => self::texto($p, 'fornecedor.id'),
            'situacao' => self::texto($p, 'situacao'),
            'is_ativo' => self::situacaoAtiva($p),
            'preco'    => self::numero($p, 'preco'),
            'preco_promocional' => self::numero($p, 'precoPromocional') ?: null,
            'custo'    => self::numero($p, 'precoCusto', 'custo'),
            'payload_hash' => self::hash($p),
        ];
    }

    private static function dimensoes(array $p): ?string
    {
        $l = self::numero($p, 'dimensoes.largura');
        $a = self::numero($p, 'dimensoes.altura');
        $c = self::numero($p, 'dimensoes.profundidade', 'dimensoes.comprimento');
        return ($l || $a || $c) ? sprintf('%gx%gx%g', $l, $a, $c) : null;
    }

    public static function pedidoVenda(array $p): array
    {
        return [
            'bling_id'    => self::exigir(self::texto($p, 'id'), 'id', 'pedido'),
            'numero'      => self::texto($p, 'numero', 'numeroPedidoLoja'),
            'data_pedido' => self::data($p, 'data', 'dataSaida') ?? date('Y-m-d'),
            'situacao_bling' => self::texto($p, 'situacao.valor', 'situacao.id', 'situacao'),
            'contato_bling_id'  => self::texto($p, 'contato.id', 'cliente.id'),
            'canal_bling_id'    => self::texto($p, 'loja.id', 'canal.id'),
            'vendedor'    => self::texto($p, 'vendedor.nome', 'vendedor.id'),
            'forma_pagamento' => self::texto($p, 'formaPagamento.nome', 'formaPagamento.id'),
            'desconto'    => self::numero($p, 'desconto.valor', 'desconto'),
            'frete'       => self::numero($p, 'transporte.frete', 'frete'),
            'total'       => self::numero($p, 'total', 'totalProdutos'),
            'itens'       => self::itensPedido($p),
            'criado_externo_em'     => self::dataHoraUtc($p, 'dataCriacao', 'data'),
            'atualizado_externo_em' => self::dataHoraUtc($p, 'dataAlteracao', 'dataCriacao'),
            'payload_hash' => self::hash($p),
        ];
    }

    private static function itensPedido(array $p): array
    {
        $brutos = self::campo($p, 'itens', 'items');
        if (!is_array($brutos)) {
            return [];
        }
        $saida = [];
        foreach ($brutos as $i) {
            if (!is_array($i)) {
                continue;
            }
            $qtd = self::numero($i, 'quantidade');
            $unit = self::numero($i, 'valor', 'valorUnitario', 'preco');
            $saida[] = [
                'bling_id'  => self::texto($i, 'id'),
                'produto_bling_id' => self::texto($i, 'produto.id', 'idProduto'),
                'sku'       => self::texto($i, 'codigo', 'produto.codigo'),
                'descricao' => self::texto($i, 'descricao', 'produto.nome'),
                'quantidade'=> $qtd,
                'valor_unitario' => $unit,
                // O Bling nem sempre manda o total do item. Derivar é seguro:
                // quantidade × unitário é a definição.
                'valor_total'    => self::numero($i, 'valorTotal') ?: round($qtd * $unit, 2),
                'custo_unitario' => self::numero($i, 'valorCusto', 'produto.precoCusto'),
            ];
        }
        return $saida;
    }

    public static function pedidoCompra(array $p): array
    {
        return [
            'bling_id'   => self::exigir(self::texto($p, 'id'), 'id', 'compra'),
            'numero'     => self::texto($p, 'numero'),
            'fornecedor_bling_id' => self::texto($p, 'fornecedor.id', 'contato.id'),
            'situacao_bling' => self::texto($p, 'situacao.valor', 'situacao'),
            'data_emissao'  => self::data($p, 'data') ?? date('Y-m-d'),
            'data_previsao' => self::data($p, 'dataPrevista', 'previsaoEntrega'),
            'valor'      => self::numero($p, 'total'),
            'comprador'  => self::texto($p, 'comprador.nome', 'comprador'),
            'itens'      => self::itensPedido($p),
            'payload_hash' => self::hash($p),
        ];
    }

    public static function nota(array $p): array
    {
        return [
            'bling_id'  => self::exigir(self::texto($p, 'id'), 'id', 'nota'),
            'numero'    => self::texto($p, 'numero'),
            'serie'     => self::texto($p, 'serie'),
            'chave'     => preg_replace('/\D/', '', (string) (self::texto($p, 'chaveAcesso', 'chave') ?? '')) ?: null,
            'pedido_bling_id' => self::texto($p, 'pedido.id', 'idPedido'),
            'contato_bling_id'=> self::texto($p, 'contato.id'),
            'data_emissao' => self::data($p, 'dataEmissao', 'data') ?? date('Y-m-d'),
            'valor'     => self::numero($p, 'valorNota', 'total'),
            'situacao_bling' => self::texto($p, 'situacao'),
            'finalidade'=> self::texto($p, 'finalidade'),
            'tipo'      => ((int) (self::campo($p, 'tipo') ?? 1)) === 0 ? 'entrada' : 'saida',
            'erro_codigo'   => self::texto($p, 'erro.codigo', 'situacaoRetorno.codigo'),
            'erro_mensagem' => self::texto($p, 'erro.mensagem', 'situacaoRetorno.mensagem'),
            'url_danfe' => self::texto($p, 'linkDanfe', 'linkPDF'),
            'url_xml'   => self::texto($p, 'linkXml', 'xml'),
            'payload_hash' => self::hash($p),
        ];
    }

    public static function contaReceber(array $p): array
    {
        $valor = self::numero($p, 'valor');
        return [
            'bling_id'   => self::exigir(self::texto($p, 'id'), 'id', 'conta a receber'),
            'titulo'     => self::texto($p, 'numeroDocumento', 'historico'),
            'contato_bling_id' => self::texto($p, 'contato.id'),
            'pedido_bling_id'  => self::texto($p, 'vendedor.id', 'idOrigem'),
            'categoria_bling_id' => self::texto($p, 'categoria.id'),
            'forma_bling_id'     => self::texto($p, 'formaPagamento.id', 'portador.id'),
            'data_emissao'    => self::data($p, 'dataEmissao'),
            'data_vencimento' => self::data($p, 'vencimento', 'dataVencimento') ?? date('Y-m-d'),
            'valor'         => $valor,
            // ⚠️ QUITADO TEM SALDO ZERO — testar `> 0` inverte o significado.
            // A versão anterior fazia `numero(valorPago, saldo) > 0 ? valor - saldo : valorPago`.
            // Num título liquidado a API manda `saldo: 0` e nenhum `valorPago`:
            // a condição dava falso e o recebido virava 0, ou seja, "nada pago".
            // O adapter então via saldo em aberto com vencimento passado e
            // marcava VENCIDO. Na homologação, 1.703 de 1.966 títulos ficaram
            // vencidos — com dados reais, a tela mostraria a empresa inteira
            // inadimplente.
            //
            // O que decide é a PRESENÇA do campo, não o valor dele.
            'valor_recebido'=> self::recebido($p, $valor),
            'situacao_bling'=> self::texto($p, 'situacao'),
            'payload_hash'  => self::hash($p),
        ];
    }

    /**
     * Quanto já foi pago de um título.
     *
     * A API v3 expressa isso de duas formas, dependendo do endpoint: `valorPago`
     * (quanto entrou) ou `saldo` (quanto falta). Zero é um valor LEGÍTIMO nas
     * duas — saldo zero significa quitado, valorPago zero significa intocado —
     * então a escolha tem que ser pela presença da chave.
     */
    private static function recebido(array $p, float $valor): float
    {
        if (self::temChave($p, 'saldo')) {
            return max(0.0, $valor - self::numero($p, 'saldo'));
        }
        if (self::temChave($p, 'valorPago')) {
            return self::numero($p, 'valorPago');
        }
        // Nenhum dos dois veio: não dá para afirmar que foi pago.
        return 0.0;
    }

    /** A chave existe no payload, mesmo valendo 0? `campo()` trata 0 como ausente. */
    private static function temChave(array $p, string $caminho): bool
    {
        $atual = $p;
        foreach (explode('.', $caminho) as $parte) {
            if (!is_array($atual) || !array_key_exists($parte, $atual)) {
                return false;
            }
            $atual = $atual[$parte];
        }
        return $atual !== null && $atual !== '';
    }

    /**
     * Dados de transporte contidos no pedido.
     *
     * ⚠️ Não existe recurso "envio" na API v3: transportadora, rastreio e prazo
     * vêm DENTRO do pedido, em `transporte`. A leitura tolerante mora aqui, e
     * não no serviço, porque é exatamente isto que o normalizador existe para
     * fazer — o serviço não deveria saber que o Bling ora chama de
     * `transportador.nome`, ora de `contato.nome`.
     *
     * @return array{transportadora:?string,servico:?string,rastreamento:?string,previsao:?string,uf:?string}
     */
    public static function transporteDoPedido(array $p): array
    {
        $t = is_array($p['transporte'] ?? null) ? $p['transporte'] : [];
        $volumes = is_array($t['volumes'] ?? null) ? $t['volumes'] : [];
        $volume = $volumes !== [] ? (is_array(reset($volumes)) ? reset($volumes) : []) : [];

        return [
            'transportadora' => self::texto($t, 'transportador.nome', 'contato.nome', 'nome'),
            'servico'        => self::texto($t, 'servico', 'frete.servico', 'volumes.0.servico'),
            'rastreamento'   => self::texto($volume, 'codigoRastreamento', 'rastreamento')
                                ?? self::texto($t, 'codigoRastreamento'),
            'previsao'       => self::data($t, 'prazoEntrega', 'dataPrevista', 'previsaoEntrega'),
            'uf'             => self::texto($t, 'etiqueta.uf', 'enderecoEntrega.uf', 'uf'),
        ];
    }

    public static function contaPagar(array $p): array
    {
        $r = self::contaReceber($p);
        $r['fornecedor_bling_id'] = self::texto($p, 'contato.id', 'fornecedor.id');
        $r['valor_pago'] = $r['valor_recebido'];
        $r['competencia'] = substr((string) ($r['data_emissao'] ?? $r['data_vencimento']), 0, 7);
        $r['descricao'] = self::texto($p, 'historico', 'descricao');
        unset($r['valor_recebido'], $r['contato_bling_id']);
        return $r;
    }

    public static function estoque(array $p): array
    {
        return [
            'produto_bling_id'  => self::exigir(self::texto($p, 'produto.id', 'idProduto'), 'produto.id', 'estoque'),
            'deposito_bling_id' => self::texto($p, 'deposito.id', 'idDeposito'),
            'fisico'    => self::numero($p, 'saldoFisico', 'saldoFisicoTotal', 'quantidade'),
            'reservado' => self::numero($p, 'reservado', 'saldoReservado'),
            'minimo'    => self::numero($p, 'estoqueMinimo') ?: null,
            'maximo'    => self::numero($p, 'estoqueMaximo') ?: null,
        ];
    }

    public static function deposito(array $p): array
    {
        return [
            'bling_id'  => self::exigir(self::texto($p, 'id'), 'id', 'depósito'),
            'nome'      => self::texto($p, 'descricao', 'nome') ?? '(sem nome)',
            'is_padrao' => self::campo($p, 'padrao') ? 1 : 0,
        ];
    }

    public static function categoria(array $p): array
    {
        return [
            'bling_id' => self::exigir(self::texto($p, 'id'), 'id', 'categoria'),
            'nome'     => self::texto($p, 'descricao', 'nome') ?? '(sem nome)',
            'parent_bling_id' => self::texto($p, 'categoriaPai.id', 'idCategoriaPai'),
            'payload_hash' => self::hash($p),
        ];
    }

    public static function canal(array $p): array
    {
        return [
            'bling_id'  => self::exigir(self::texto($p, 'id'), 'id', 'canal'),
            'nome'      => self::texto($p, 'descricao', 'nome') ?? '(sem nome)',
            'tipo'      => self::texto($p, 'tipo'),
            'integrado' => 1,
        ];
    }

    /** `situacao` vem como 'A'/'I', 1/0 ou 'Ativo'. Todos significam a mesma coisa. */
    private static function situacaoAtiva(array $p): int
    {
        $v = self::campo($p, 'situacao');
        if ($v === null) {
            return 1;
        }
        if (is_bool($v)) {
            return $v ? 1 : 0;
        }
        if (is_numeric($v)) {
            return ((int) $v) === 0 ? 0 : 1;
        }
        $s = strtolower(trim((string) $v));
        return in_array($s, ['i', 'inativo', 'inactive', '0', 'false'], true) ? 0 : 1;
    }
}
