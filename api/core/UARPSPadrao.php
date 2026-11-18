<?php
declare(strict_types=1);

// /api/core/UARPSPadrao.php
// UARPS-INHERIT (17/11/2026): "inherit" (ou sem linha) deixa de significar ALLOW e passa a
// resolver o PADRÃO DO PERFIL: o nível do usuário (MAX(app_roles.level) dos vínculos ativos)
// comparado com o nível mínimo do trigger, definido pelas regras abaixo (primeira que casar).
//
// Precedência no UARPSGate::checkTrigger:
//   linha explícita 'allow' => libera · 'deny' => nega · 'inherit'/sem linha => este padrão.
//   Nível 100 (Super Admin) sempre passa no padrão (o dono não perde acesso).
//   Nível ilegível (erro de banco) => NEGA e registra.
//
// Dois modos, por família de trigger:
//   'aplicar' => o padrão decide (nega de verdade).
//   'sombra'  => continua liberando como antes, mas registra em app_uarps_divergence_log
//                toda vez que o padrão negaria (para medir antes de virar a chave).
//
// Reverter: voltar à release anterior. Virar a UI de 'sombra' para 'aplicar' = mudar
// MODO_UI abaixo (com portão próprio, depois de ler o log de divergências).

final class UARPSPadrao
{
    // Gates de API (gate:*, trigger:gate:*, api:*): quem passa hoje por inherit é só o 75 (nível 100).
    public const MODO_API = 'aplicar';
    // Triggers de interface (navegação, painel, header, footer, system): medir primeiro.
    public const MODO_UI = 'sombra';

    // [regex, nível mínimo, rótulo] — a primeira que casar vale.
    private const REGRAS = [
        // Super Admin
        ['/^gate:admin:(settings:super|roles:.+)$/', 100, 'gate-super'],
        ['/^api:permissions:super-admin$/', 100, 'api-super'],
        // Administração (mesmo nível do antigo requireAdmin = AccessLevels::ADMIN)
        ['/^gate:admin(:|$)/', 80, 'gate-admin'],
        ['/^trigger:gate:(admin|diagnostics)$/', 80, 'gate-admin'],
        ['/^api:.*(admin|uarps-status|permission-audit|users)/', 80, 'api-admin'],
        // Interface de administração
        ['/^trigger:(navigation|navrail|navrail-group|route|sidebar|nav|panel|header|footer):.*(admin|audit-trail|orchestrator|permission|user-management|uarps|feature-flags|notification-rules|health-dashboard|enterprise)/', 80, 'ui-admin'],
        ['/^trigger:header:(errors-status|jobs-status|server-[a-z-]+)$/', 80, 'ui-admin-monitor'],
        ['/^trigger:navrail:(api|code|database)$/', 80, 'ui-admin-tecnico'],
        // Demais gates não catalogados: na dúvida, administração
        ['/^(gate|api):/', 80, 'gate-nao-catalogado'],
    ];

    // Padrão para o resto da interface: qualquer um (como hoje).
    private const PADRAO_UI = 0;

    /** @return array{0:int,1:string} [nível mínimo, rótulo da regra] */
    public static function nivelMinimo(string $triggerId): array
    {
        foreach (self::REGRAS as [$re, $min, $rotulo]) {
            if (preg_match($re, $triggerId) === 1) {
                return [$min, $rotulo];
            }
        }
        return [self::PADRAO_UI, 'ui-padrao'];
    }

    /**
     * DSHOW-032 (origem: Codex DSHOW-032; decisão do Jhony 18/11): gate:admin:* (e trigger:gate:admin) NÃO é liberado por
     * nível nem por inherit — exige permissão EXPLÍCITA (state = allow) dada pelo dono. Sem allow: negado, em qualquer nível.
     */
    public static function exigeExplicito(string $triggerId): bool
    {
        return preg_match('/^(trigger:)?gate:admin(:|$)/', $triggerId) === 1;
    }

    public static function ehGateApi(string $triggerId): bool
    {
        return preg_match('/^(gate:|trigger:gate:|api:)/', $triggerId) === 1;
    }

    public static function modo(string $triggerId): string
    {
        return self::ehGateApi($triggerId) ? self::MODO_API : self::MODO_UI;
    }
}
