<?php
// Outlook / RulesController - regras automáticas (§16)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// As regras da Caixa de Entrada vivem no Graph (/me/mailFolders/inbox/messageRules) —
// dependem do Azure. A implementacao real entra na Fase 3; ate la o modo real devolve
// placeholder. No modo de testes, o MockController serve tudo (com "aplicar agora").
declare(strict_types=1);

final class OutlookRulesController
{
    public static function route(string $method, array $segments, ?PDO $pdo = null): void
    {
        unset($pdo, $segments);
        if ($method === 'GET') {
            ApiResponse::success([
                'available' => false,
                'rules'     => [],
                'message'   => 'As regras automáticas usam o Microsoft Graph (Fase 3).',
            ]);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Regras automáticas indisponíveis até a integração com a Microsoft.',
        ]);
    }
}
