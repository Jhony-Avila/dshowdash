<?php
/**
 * Repositories Index - Auto-loader para camada de repositórios
 * @version 1.2.0-ENTERPRISE
 * @created 2026-01-21
 * @updated 2026-07-27 - PermissionsRepository removido (código morto: nenhum arquivo do
 *                       projeto o incluía, e o projeto não tem autoloader).
 *
 * Uso:
 *   require_once __DIR__ . '/../core/repositories/_index.php';
 *   $usersRepo = new UsersRepository($pdo);
 *   $uarpsRepo = new UARPSRepository($pdo);
 */

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';
require_once __DIR__ . '/UsersRepository.php';
require_once __DIR__ . '/UARPSRepository.php';
