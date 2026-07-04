<?php
// /api/koala/_init.php
// Bootstrap compartilhado do módulo Koala Docs (requires + CORS).
// SessionGate::start() e auth ficam no index.php/public.php (público não exige auth).
// @module koala.init
// @version 1.0.0
// @created 2026-07-03

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

// Repositórios
require_once __DIR__ . '/repositories/KoalaUserRepository.php';
require_once __DIR__ . '/repositories/ItemCategoryRepository.php';
require_once __DIR__ . '/repositories/ItemRepository.php';
require_once __DIR__ . '/repositories/CommercialTermRepository.php';
require_once __DIR__ . '/repositories/PaymentMethodRepository.php';
require_once __DIR__ . '/repositories/TemplateRepository.php';
require_once __DIR__ . '/repositories/ProposalRepository.php';
require_once __DIR__ . '/repositories/ProposalItemRepository.php';
require_once __DIR__ . '/repositories/ProposalExpenseRepository.php';
require_once __DIR__ . '/repositories/RemoteErpRepository.php';
require_once __DIR__ . '/repositories/ClientSnapshotRepository.php';
require_once __DIR__ . '/repositories/ClientSnapshotContactRepository.php';
require_once __DIR__ . '/repositories/ProposalPaymentTermRepository.php';
require_once __DIR__ . '/repositories/SectionRepository.php';
require_once __DIR__ . '/repositories/SectionImageRepository.php';

// Serviços
require_once __DIR__ . '/services/KoalaTx.php';
require_once __DIR__ . '/services/PermissionService.php';
require_once __DIR__ . '/services/AuthKoalaService.php';
require_once __DIR__ . '/services/ItemCatalogService.php';
require_once __DIR__ . '/services/CommercialTermsService.php';
require_once __DIR__ . '/services/PaymentTermsService.php';
require_once __DIR__ . '/services/UserAdminService.php';
require_once __DIR__ . '/services/TemplateRenderService.php';
require_once __DIR__ . '/services/TemplateManagerService.php';
require_once __DIR__ . '/services/NumberingService.php';
require_once __DIR__ . '/services/ProposalService.php';
require_once __DIR__ . '/services/PricingCalculationService.php';
require_once __DIR__ . '/services/ProposalItemService.php';
require_once __DIR__ . '/services/ProposalExpenseService.php';
require_once __DIR__ . '/services/ProposalPaymentTermService.php';
require_once __DIR__ . '/services/ClientIntegrationService.php';
require_once __DIR__ . '/services/SnapshotService.php';
require_once __DIR__ . '/services/ProposalRenderService.php';
require_once __DIR__ . '/services/SectionService.php';
require_once __DIR__ . '/services/SectionRenderService.php';
require_once __DIR__ . '/services/SectionImageService.php';

// Controllers
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/ItemCategoryController.php';
require_once __DIR__ . '/controllers/ItemController.php';
require_once __DIR__ . '/controllers/CommercialTermController.php';
require_once __DIR__ . '/controllers/PaymentMethodController.php';
require_once __DIR__ . '/controllers/TemplateController.php';
require_once __DIR__ . '/controllers/ProposalController.php';
require_once __DIR__ . '/controllers/ProposalItemController.php';
require_once __DIR__ . '/controllers/ProposalExpenseController.php';
require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/SectionController.php';

CorsPolicy::apply();

/** Lê o corpo JSON de uma requisição de escrita. Retorna [] se vazio; 400 se JSON inválido. */
function koala_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) { return []; }
    $data = json_decode($raw, true);
    if (!is_array($data)) { ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400); }
    return $data;
}
