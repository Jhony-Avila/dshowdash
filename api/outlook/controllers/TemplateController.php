<?php
// Outlook / TemplateController - modelos de e-mail (§22)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Modelos sao dados LOCAIS (tabela outlook_templates) — NAO dependem do Azure/Graph,
// apenas do banco OUTLOOK_DSHOW. Enquanto o banco nao e provisionado, o modo real
// devolve placeholder (available:false). O CRUD real sera implementado na Fase 2
// (repositorio + servico sobre outlook_templates, escopado por user_id). No modo de
// testes, o MockController serve tudo a partir da sessao.
declare(strict_types=1);

final class OutlookTemplateController
{
    public static function route(string $method, array $segments, ?PDO $pdo = null): void
    {
        unset($pdo, $segments);
        if ($method === 'GET') {
            ApiResponse::success([
                'available'  => false,
                'templates'  => [],
                'categories' => [
                    'Propostas', 'Cobrança', 'Acompanhamento comercial', 'Confirmação de pedido',
                    'Solicitação de documentos', 'Atendimento', 'Compras', 'Financeiro', 'Geral',
                ],
                'message'    => 'Os modelos usam o banco local (outlook_templates), provisionado na Fase 2.',
            ]);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Modelos indisponíveis até o provisionamento do banco (Fase 2).',
        ]);
    }
}
