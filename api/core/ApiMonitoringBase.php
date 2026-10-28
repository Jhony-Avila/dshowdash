<?php
// Core: API Monitoring Base Class
// @version 2.3.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Removido use statements inválidos
// v2.3.0: Limpeza de imports não utilizados

declare(strict_types=1);

namespace Api\Core;

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/CorsPolicy.php';
require_once __DIR__ . '/SessionGate.php';
require_once __DIR__ . '/UARPSGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

abstract class ApiMonitoringBase {

    protected bool $requireAuth = true;
    protected ?string $requiredAdminTrigger = null;
    protected array $allowedMethods = ['GET'];
    protected array $csrfMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function __construct() {
        \CorsPolicy::apply();
        \SessionGate::start();
    }

    public function handle(): void {
        $method = $_SERVER['REQUEST_METHOD'];

        if (!in_array($method, $this->allowedMethods)) {
            \ApiResponse::error('METHOD_NOT_ALLOWED', 405);
            return;
        }

        if ($this->requireAuth) {
            \AuthHelpers::requireAuth();
        }

        if ($this->requiredAdminTrigger) {
            $userId = $this->getUserId();
            if ($userId) {
                \UARPSGate::enforceTrigger($userId, $this->requiredAdminTrigger);
            } else {
                \ApiResponse::error('UNAUTHORIZED', 401);
                return;
            }
        }

        if (in_array($method, $this->csrfMethods)) {
            \AuthHelpers::requireCsrf();
        }

        $this->process($method);
    }

    abstract protected function process(string $method): void;

    protected function getInput(): ?array {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input ?: null;
    }

    protected function getPagination(): array {
        return [
            'page' => max(1, (int)($_GET['page'] ?? 1)),
            'limit' => min(100, max(1, (int)($_GET['limit'] ?? 50)))
        ];
    }

    protected function getUserId(): ?int {
        return $_SESSION['user_id'] ?? null;
    }

    protected function getDbConnection(): \PDO {
        return \getConnection('DSHOWDASH');
    }

    protected function logError(string $context, \Exception $e): void {
        error_log("{$context}: " . $e->getMessage());
    }

    public static function info(): array {
        return [
            'class' => static::class,
            'version' => '2.3.0-ENTERPRISE',
            'status' => 'active'
        ];
    }

    public static function healthCheck(): array {
        return [
            'status' => 'healthy',
            'class' => static::class,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
