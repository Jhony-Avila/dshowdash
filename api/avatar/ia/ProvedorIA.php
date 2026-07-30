<?php
declare(strict_types=1);

/**
 * /api/avatar/ia/ProvedorIA.php — contrato do serviço de IA (AS3 F3, decisão #24).
 * @version 1.0.0  @created 2026-07-30
 *
 * DESACOPLADO de fornecedor: vida.php só conhece esta interface. Trocar de
 * Anthropic para OpenAI (ou um modelo local) = criar outra implementação.
 * A IA APENAS monta combinações do catálogo existente — nunca gera assets.
 */
interface ProvedorIA
{
    /** true quando o provedor tem credenciais configuradas no servidor. */
    public function disponivel(): bool;

    /**
     * Monta um personagem a partir do pedido do usuário.
     * @param string $pedido    ex.: "quero um executivo futurista"
     * @param array  $catalogo  ['base' => [['id','nome','tema','raridade'],…], …]
     * @return array{base:string, camadas:array<string,string>, cores:array<string,string>, nome:string, historia:string}
     * @throws RuntimeException em falha de comunicação/parse
     */
    public function criar(string $pedido, array $catalogo): array;
}
