<?php
// /api/atributos/Permissoes.php — quem ADMINISTRA o catálogo de atributos (decisão do Jhony, 18/11, para quando o módulo abrir a outros):
//   - nível ≥ 80 em geral só PREENCHE valores (e decide sugestões);
//   - kits, dicionário, unidades, vínculos por produto e massa: só o usuário 75 (padrão) ou quem tiver PERMISSÃO EXPLÍCITA;
//   - permissão explícita = trigger UARPS `atributos_catalogo_administrar` com state = 'allow' (linha explícita). Ausência ('inherit'),
//     'deny' ou qualquer erro = NÃO administra (fail-closed). Independente da administração de feature flags do Dash.
declare(strict_types=1);

final class AtributosPermissoes
{
    public const ADMINS_PADRAO = [75];
    public const TRIGGER_ADMIN = 'atributos_catalogo_administrar';
    public const NIVEL_MINIMO = 80;

    /** ATRWEB_ADMINS (lista "1,2") só substitui o padrão onde existir (validação); produção não define → [75]. */
    public static function admins(): array
    {
        $e = getenv('ATRWEB_ADMINS');
        return is_string($e) && preg_match('/^[1-9][0-9]{0,9}(,[1-9][0-9]{0,9})*$/', $e) ? array_map('intval', explode(',', $e)) : self::ADMINS_PADRAO;
    }

    /** @param callable(int,string):array|null $uarps (ex.: [UARPSGate::class, 'checkTrigger']) */
    public static function administra(int $userId, int $nivel, ?callable $uarps = null, ?array $admins = null): bool
    {
        if ($userId <= 0 || $nivel < self::NIVEL_MINIMO) return false;
        if (in_array($userId, $admins ?? self::admins(), true)) return true;
        if ($uarps === null) return false;
        try { $r = $uarps($userId, self::TRIGGER_ADMIN); } catch (Throwable) { return false; }
        return is_array($r) && ($r['state'] ?? null) === 'allow';
    }
}
