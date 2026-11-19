<?php
declare(strict_types=1);

/**
 * /api/midia/FotosPortas.php — FOTOS-1 (DSHOW-100): a ORDEM das portas do proxy de fotos, como função pura (testável sem banco, sem
 * sessão e sem flags reais). O index.php usa exatamente estas decisões; a sessão (401) e o CSRF (403) continuam nos helpers do Dash
 * (AuthHelpers), chamados pelo index.php no ponto indicado.
 *   1) antes da sessão: flag `panel_atributos_enabled` desligada para todos → 404; ilegível (source=error) → 500
 *   2) [sessão: AuthHelpers::requireAuth → 401]
 *   3) rota desconhecida para o método → 404
 *   4) pessoa fora da flag → 404 · POST com `panel_atributos_escrita` desligada para a pessoa → 404
 *   5) [CSRF em POST: AuthHelpers::requireCsrfForWrite → 403]
 *   6) não é publicador (piloto: SÓ o 75) → 403 NOT_AUTHORIZED (desfecho recusada)
 */
final class FotosPortas
{
    public const DESLIGADO = ['not_found', 'disabled', 'not_started', 'expired', 'environment_mismatch'];
    public const ROTAS = ['GET' => ['galeria', 'imagem', 'conferir'], 'POST' => ['publicar', 'capa', 'ordem', 'remover', 'restaurar']];

    /** @return array{0:int,1:string}|null null = segue para a sessão */
    public static function antesDaSessao(string $fonteFlag): ?array
    {
        if ($fonteFlag === 'error') return [500, 'INTERNAL_ERROR'];
        return in_array($fonteFlag, self::DESLIGADO, true) ? [404, 'NOT_FOUND'] : null;
    }

    /** Depois da sessão e ANTES do CSRF. @return array{0:int,1:string}|null */
    public static function rotaEFlags(string $metodo, string $rota, bool $flagPessoa, bool $flagEscrita): ?array
    {
        if (!in_array($rota, self::ROTAS[$metodo] ?? [], true)) return [404, 'NOT_FOUND'];
        if (!$flagPessoa) return [404, 'NOT_FOUND'];
        if ($metodo === 'POST' && !$flagEscrita) return [404, 'NOT_FOUND'];
        return null;
    }

    /** Depois do CSRF. @return array{0:int,1:string}|null */
    public static function publicador(int $uid, ?array $publicadores = null): ?array
    {
        return FotosPermissoes::publica($uid, $publicadores) ? null : [403, 'NOT_AUTHORIZED'];
    }
}
