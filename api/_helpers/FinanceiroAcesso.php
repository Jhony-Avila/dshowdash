<?php
declare(strict_types=1);
// DDI-001 (GPT DATA + critério do GPT Warps, 28/11 10:47): DECISOR ÚNICO da capacidade financeira POR PESSOA `financeiro_asaas_leitura`.
// Só libera com CONCESSÃO PESSOAL VIGENTE: enabled === true E source === 'user_override'. Liberação global ou por rollout, perfil, nível,
// flag ausente ou desligada = NEGA. Falha na consulta individual ou origem indeterminada = FALHA (nunca vira autorização, mesmo com a global
// ligada). Decidir SEMPRE antes de ler cache, consultar dados ou montar a resposta. O resolver do Dash não tem cache entre pedidos: a retirada
// da concessão vale na PRÓXIMA requisição. Códigos para endpoints só-financeiros: NEGA = 403, FALHA = 503, nos dois sem nenhum valor.
// Endpoints MISTOS (cadastral + financeiro) usam permite() e retiram a parte financeira inteira.
final class FinanceiroAcesso
{
    public const FLAG = 'financeiro_asaas_leitura';
    public const PERMITE = 'permite';
    public const NEGA = 'nega';
    public const FALHA = 'falha';

    /** Classifica o resultado do resolver (também usado por quem já tem o array, ex.: AsaasPortao com dependência injetada). */
    public static function deResultado($r): string
    {
        if (!is_array($r)) return self::FALHA;
        $src = $r['source'] ?? null;
        if (!is_string($src) || $src === '' || $src === 'error') return self::FALHA;   // origem indeterminada = interrompe
        return (($r['enabled'] ?? null) === true && $src === 'user_override') ? self::PERMITE : self::NEGA;
    }

    /** @param ?Closure(string,int):array $resolver injetável nos testes; padrão = FeatureFlagResolver do Dash */
    public static function decidir(int $usuario, ?Closure $resolver = null): string
    {
        if ($usuario <= 0) return self::NEGA;
        try {
            $resolver ??= static function (string $k, int $u): array {
                require_once __DIR__ . '/../feature-flags/resolver.php';
                if (!function_exists('getConnection')) require_once __DIR__ . '/../../config/db_connection.php';
                return (new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u);
            };
            $r = $resolver(self::FLAG, $usuario);
        } catch (Throwable $e) {
            error_log('[financeiro] decisão: ' . get_class($e));
            return self::FALHA;
        }
        return self::deResultado($r);
    }

    public static function permite(int $usuario, ?Closure $resolver = null): bool
    {
        return self::decidir($usuario, $resolver) === self::PERMITE;
    }

    /** Endpoint só-financeiro: devolve só se PERMITE; senão responde 403/503 SEM conteúdo e encerra. */
    public static function exigir(int $usuario, ?Closure $resolver = null): void
    {
        $d = self::decidir($usuario, $resolver);
        if ($d === self::PERMITE) return;
        if (!class_exists('ApiResponse')) require_once __DIR__ . '/ApiResponse.php';
        if ($d === self::FALHA) ApiResponse::error('FINANCIAL_ACCESS_UNAVAILABLE', 503, ['message' => 'Não foi possível confirmar o acesso financeiro agora.']);
        ApiResponse::error('FINANCIAL_ACCESS_DENIED', 403, ['message' => 'Sem acesso aos dados financeiros.']);
    }
}
