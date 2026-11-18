<?php
// /api/core/PermissaoAuditoria.php — AUDITORIA-PERMISSOES (18/11/2026; P2, pré-requisito do portão multiusuário).
// Grava UMA linha em app_permission_audit_log por mudança de permissão, DENTRO da transação da mudança.
// Diferente do AuditLogger::logPermissionAudit (que engole a falha): aqui a falha LANÇA exceção → quem chamou faz ROLLBACK
// e a permissão não fica meio aplicada. Sem DDL: a coluna `action` é enum('allowed','denied','elevated','revoked');
// a operação exata vai em context_json.operacao.
//   user_id      = AUTOR da mudança (quem fez); o alvo vai em context_json.alvo
//   context_json = {operacao, origem, autor, alvo, antes, depois, motivo}
declare(strict_types=1);

final class PermissaoAuditoria
{
    /** Tabela de destino (configurável só para o teste de falha forçada; em produção é sempre a real). */
    public static string $tabela = 'app_permission_audit_log';

    public const ACOES = ['allowed', 'denied', 'elevated', 'revoked'];

    /**
     * @param array{autor:?int, chave:string, acao:string, operacao:string, origem:string, tipo?:?string, id?:?string,
     *              alvo?:mixed, antes?:mixed, depois?:mixed, motivo?:?string} $d
     */
    public static function registrar(PDO $pdo, array $d): void
    {
        if (!$pdo->inTransaction()) throw new LogicException('PermissaoAuditoria: chamar dentro da transação da mudança.');
        if (!in_array($d['acao'], self::ACOES, true)) throw new InvalidArgumentException('PermissaoAuditoria: acao inválida ' . $d['acao']);
        $ip = self::ip();
        $ctx = ['operacao' => $d['operacao'], 'origem' => $d['origem'], 'autor' => $d['autor'] ?? null,
                'alvo' => $d['alvo'] ?? null, 'antes' => $d['antes'] ?? null, 'depois' => $d['depois'] ?? null, 'motivo' => $d['motivo'] ?? null];
        $st = $pdo->prepare('INSERT INTO `' . str_replace('`', '', self::$tabela) . '`
            (user_id, permission_key, action, resource_type, resource_id, context_json, ip_address, user_agent, ip_user, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))');
        $ok = $st->execute([
            $d['autor'] ?? null,
            mb_substr($d['chave'], 0, 100),
            $d['acao'],
            isset($d['tipo']) ? mb_substr((string) $d['tipo'], 0, 50) : null,
            isset($d['id']) ? mb_substr((string) $d['id'], 0, 100) : null,
            json_encode($ctx, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            $ip,
            mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? (PHP_SAPI === 'cli' ? 'cli' : '')), 0, 500),
            $ip,
        ]);
        if (!$ok || $st->rowCount() !== 1) throw new RuntimeException('PermissaoAuditoria: linha de auditoria não gravada.');
    }

    /** Autor padrão: usuário da sessão (as telas já exigem sessão + nível 80). */
    public static function autorDaSessao(): ?int
    {
        return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
    }

    private static function ip(): ?string
    {
        if (class_exists('AuthHelpers') && method_exists('AuthHelpers', 'getClientIp')) {
            try { return mb_substr(AuthHelpers::getClientIp(), 0, 45); } catch (Throwable) { }
        }
        return isset($_SERVER['REMOTE_ADDR']) ? mb_substr((string) $_SERVER['REMOTE_ADDR'], 0, 45) : (PHP_SAPI === 'cli' ? 'cli' : null);
    }
}
