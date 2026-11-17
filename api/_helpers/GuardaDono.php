<?php
/**
 * GuardaDono — UARPS-DONO (P0, 17/11/2026)
 *
 * Duas travas que NÃO dependem do UARPS (que hoje libera "inherit" e falha aberto):
 *
 *  1. dshow_exigir_nivel(): restaura o nível de antes da migração P3 nas rotas de
 *     administração (requireAdmin = 80; requireSuperAdmin = 100). O nível é lido do
 *     BANCO (MAX(app_roles.level) dos vínculos ativos), não da sessão, para que um
 *     rebaixamento valha na hora. Erro de banco => NEGA (fail-closed) e registra.
 *
 *  2. dshow_proteger_dono(): nenhuma ação de escrita cujo alvo seja o usuário dono
 *     (id 75) passa, a menos que venha do próprio dono.
 *
 * Toda negação vai para o error_log com o prefixo [UARPS-DONO].
 * Reverter: voltar à release anterior (revert-all.sh do backup UARPS-DONO).
 */
declare(strict_types=1);

if (!defined('DSHOW_DONO_ID')) {
    define('DSHOW_DONO_ID', 75);
}

if (!function_exists('dshow_nivel_real')) {
    /** Nível efetivo do usuário pelo banco. null = erro (quem chama deve negar). */
    function dshow_nivel_real(int $userId): ?int
    {
        if ($userId <= 0) {
            return 0;
        }
        try {
            $pdo = getConnection('DSHOWDASH');
            $st = $pdo->prepare(
                "SELECT MAX(r.level)
                   FROM app_user_roles ur
                   JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
                   JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL AND u.status = 'active'
                  WHERE ur.user_id = ? AND ur.deleted_at IS NULL
                    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())"
            );
            $st->execute([$userId]);
            $v = $st->fetchColumn();
            return ($v === null || $v === false) ? 0 : (int) $v;
        } catch (Throwable $e) {
            error_log('[UARPS-DONO] erro ao ler nível do usuário ' . $userId . ': ' . $e->getMessage());
            return null;
        }
    }
}

if (!function_exists('dshow_guarda_negar')) {
    function dshow_guarda_negar(string $codigo, string $mensagem, array $meta = []): void
    {
        if (class_exists('ApiResponse')) {
            ApiResponse::error($codigo, 403, ['message' => $mensagem] + $meta);   // encerra
        }
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => $codigo, 'meta' => ['message' => $mensagem] + $meta]);
        exit;
    }
}

if (!function_exists('dshow_exigir_nivel')) {
    function dshow_exigir_nivel(int $userId, int $minimo, string $contexto): void
    {
        $nivel = dshow_nivel_real($userId);
        if ($nivel === null || $nivel < $minimo) {
            error_log(sprintf('[UARPS-DONO] NEGADO nivel user=%d nivel=%s minimo=%d rota=%s metodo=%s ip=%s',
                $userId, $nivel === null ? 'erro-banco' : (string) $nivel, $minimo, $contexto,
                $_SERVER['REQUEST_METHOD'] ?? '-', $_SERVER['REMOTE_ADDR'] ?? '-'));
            dshow_guarda_negar('NIVEL_INSUFICIENTE', 'Acesso negado - requer privilégios de administrador',
                ['required_level' => $minimo]);
        }
    }
}

if (!function_exists('dshow_proteger_dono')) {
    /**
     * Nega a ação se o dono aparecer como alvo em $_GET ou no corpo JSON, sob qualquer
     * uma das chaves informadas (valor simples, lista, ou em itens aninhados de um bulk).
     */
    function dshow_proteger_dono(int $userId, array $chaves, string $contexto): void
    {
        if ($userId === DSHOW_DONO_ID) {
            return;
        }
        $corpo = json_decode((string) file_get_contents('php://input'), true);
        $fontes = [$_GET, is_array($corpo) ? $corpo : [], $_POST];

        $achou = false;
        $varrer = function ($dado) use (&$varrer, &$achou, $chaves): void {
            if (!is_array($dado) || $achou) {
                return;
            }
            foreach ($dado as $k => $v) {
                if (is_string($k) && in_array($k, $chaves, true)) {
                    foreach ((array) $v as $x) {
                        if (is_scalar($x) && (string) (int) $x === trim((string) $x) && (int) $x === DSHOW_DONO_ID) {
                            $achou = true;
                            return;
                        }
                    }
                }
                if (is_array($v)) {
                    $varrer($v);
                }
            }
        };
        foreach ($fontes as $f) {
            $varrer($f);
        }

        if ($achou) {
            error_log(sprintf('[UARPS-DONO] NEGADO acao-sobre-dono user=%d rota=%s acao=%s metodo=%s ip=%s',
                $userId, $contexto, (string) ($_GET['action'] ?? '-'),
                $_SERVER['REQUEST_METHOD'] ?? '-', $_SERVER['REMOTE_ADDR'] ?? '-'));
            dshow_guarda_negar('DONO_PROTEGIDO', 'Ação sobre a conta do dono só pode ser feita pelo próprio dono.');
        }
    }
}
