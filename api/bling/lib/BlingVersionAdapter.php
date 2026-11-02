<?php
// Bling / lib/BlingVersionAdapter.php - traducao de codigos da API v3
// @module  bling.version.adapter
// @version 1.0.0
// @created 2026-07-30
//
// §49. O briefing avisa que a API do Bling "pode receber alterações ou breaking
// changes" e mantém changelog ativo. Esta é a única camada que conhece código
// externo. Quando o Bling mudar um número de situação, muda AQUI.
//
// REGRA DE OURO: código desconhecido NÃO vira exceção nem some — vira uma
// situação neutra visível, e é REGISTRADO. Uma situação nova na API não pode
// derrubar a sincronização de um lote inteiro nem sumir com o pedido da tela.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingVersionAdapter
{
    /** Versão da API que este adapter entende. Aparece no /status. */
    public const VERSAO_API = 'v3';

    /**
     * Situações de pedido de venda no Bling v3.
     * Fonte: valores observados no campo `situacao.valor`.
     */
    private const PEDIDO = [
        '0'  => 'rascunho',
        '6'  => 'aguardando_aprovacao',
        '9'  => 'aprovado',
        '12' => 'cancelado',
        '15' => 'faturado',
        '18' => 'nota_emitida',
        '21' => 'separacao',
        '24' => 'enviado',
        '27' => 'entregue',
        '30' => 'devolvido',
        // Grafias por extenso aparecem em alguns endpoints e em webhook.
        'em_aberto'   => 'aguardando_aprovacao',
        'atendido'    => 'entregue',
        'cancelado'   => 'cancelado',
        'em_andamento'=> 'aprovado',
        'faturado'    => 'faturado',
        'rascunho'    => 'rascunho',
    ];

    private const COMPRA = [
        '0'  => 'solicitado',
        '1'  => 'cotacao',
        '2'  => 'aprovado',
        '3'  => 'enviado_fornecedor',
        '4'  => 'recebido_parcial',
        '5'  => 'recebido',
        '6'  => 'cancelado',
        'em_aberto' => 'solicitado',
        'atendido'  => 'recebido',
        'cancelado' => 'cancelado',
    ];

    private const NOTA = [
        '1'  => 'pendente',
        '2'  => 'processando',
        '3'  => 'rejeitada',
        '4'  => 'autorizada',
        '5'  => 'cancelada',
        '6'  => 'inutilizada',
        '7'  => 'processando',
        'pendente'    => 'pendente',
        'emitida'     => 'autorizada',
        'autorizada'  => 'autorizada',
        'cancelada'   => 'cancelada',
        'rejeitada'   => 'rejeitada',
        'denegada'    => 'rejeitada',
        'inutilizada' => 'inutilizada',
    ];

    private const TITULO = [
        '1' => 'aberto',
        '2' => 'liquidado',
        '3' => 'cancelado',
        '4' => 'parcial',
        'aberto'     => 'aberto',
        'em_aberto'  => 'aberto',
        'recebido'   => 'liquidado',
        'pago'       => 'liquidado',
        'liquidado'  => 'liquidado',
        'parcial'    => 'parcial',
        'cancelado'  => 'cancelado',
    ];

    private const ENVIO = [
        '0' => 'aguardando_separacao',
        '1' => 'separado',
        '2' => 'despachado',
        '3' => 'em_transito',
        '4' => 'entregue',
        '5' => 'devolvido',
        '6' => 'extraviado',
    ];

    /** Códigos que já vimos e não sabemos traduzir. Vai para o /status. */
    private static array $desconhecidos = [];

    // ─────────────────────────────────────────────────────────────

    public static function situacaoPedido(?string $codigo): string
    {
        return self::traduzir(self::PEDIDO, $codigo, 'aguardando_aprovacao', 'pedido');
    }

    public static function situacaoCompra(?string $codigo): string
    {
        return self::traduzir(self::COMPRA, $codigo, 'solicitado', 'compra');
    }

    public static function situacaoNota(?string $codigo): string
    {
        return self::traduzir(self::NOTA, $codigo, 'pendente', 'nota');
    }

    public static function situacaoEnvio(?string $codigo): string
    {
        return self::traduzir(self::ENVIO, $codigo, 'aguardando_separacao', 'envio');
    }

    /**
     * Situação de título financeiro.
     *
     * `vencido` NÃO é um estado do Bling — é derivado da data e do saldo. Quem
     * decide isso tem que ser um lugar só: se a tela calculasse por conta
     * própria, dois lugares poderiam discordar sobre o mesmo título.
     */
    public static function situacaoTitulo(?string $codigo, ?string $vencimento,
                                          float $valor, float $liquidado): string
    {
        $base = self::traduzir(self::TITULO, $codigo, 'aberto', 'titulo');

        if ($base === 'cancelado') {
            return 'cancelado';
        }
        if ($liquidado >= $valor - 0.005 && $valor > 0) {
            return 'liquidado';
        }
        if ($liquidado > 0.005) {
            return 'parcial';
        }
        if ($vencimento !== null && $vencimento < gmdate('Y-m-d')) {
            return 'vencido';
        }
        return 'aberto';
    }

    private static function traduzir(array $mapa, ?string $codigo, string $padrao, string $dominio): string
    {
        if ($codigo === null || $codigo === '') {
            return $padrao;
        }
        $chave = strtolower(trim($codigo));
        if (isset($mapa[$chave])) {
            return $mapa[$chave];
        }

        // Código novo: registra e devolve o padrão. Não lança, não descarta.
        $id = "$dominio:$chave";
        if (!isset(self::$desconhecidos[$id])) {
            self::$desconhecidos[$id] = 0;
            error_log("[bling][adapter] situação de $dominio não mapeada: '$codigo' → usando '$padrao'. "
                    . 'Se aparecer com frequência, atualizar BlingVersionAdapter.');
        }
        self::$desconhecidos[$id]++;
        return $padrao;
    }

    /** O que apareceu e não sabemos traduzir. Exposto no /status para virar tarefa. */
    public static function desconhecidos(): array
    {
        $saida = [];
        foreach (self::$desconhecidos as $id => $n) {
            [$dominio, $codigo] = explode(':', $id, 2);
            $saida[] = ['dominio' => $dominio, 'codigo' => $codigo, 'ocorrencias' => $n];
        }
        return $saida;
    }

    /** Cobertura do mapa — usado no smoke para pegar regressão de tradução. */
    public static function cobertura(): array
    {
        return [
            'versao_api' => self::VERSAO_API,
            'pedido' => count(self::PEDIDO), 'compra' => count(self::COMPRA),
            'nota'   => count(self::NOTA),   'titulo' => count(self::TITULO),
            'envio'  => count(self::ENVIO),
        ];
    }
}
