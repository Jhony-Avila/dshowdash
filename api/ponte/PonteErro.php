<?php
declare(strict_types=1);

/**
 * /api/ponte/PonteErro.php — erro de negócio da Ponte v2 e das libs compartilhadas (Programa PARIDADE TOTAL, W1).
 * Mesmo papel do AvstErro da StudioLib: a lib lança; o endpoint web responde (ApiResponse::error) e a ponte devolve o envelope.
 * `codigo` é o código estável do contrato (NAO_ENCONTRADO, VALIDACAO, CONFLITO, PERMISSAO_NEGADA…); `extra` vai em `data`.
 */
final class PonteErro extends RuntimeException
{
    public function __construct(public readonly string $codigo, public readonly int $status, public readonly ?array $extra = null)
    {
        parent::__construct($codigo, $status);
    }
}
