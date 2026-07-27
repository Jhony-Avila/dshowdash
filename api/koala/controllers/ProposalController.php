<?php
// /api/koala/controllers/ProposalController.php
// @module koala.controller.proposal @version 1.0.0-F2
declare(strict_types=1);

class ProposalController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $svc = new ProposalService($pdo);
        $id  = (isset($seg[1]) && ctype_digit((string) $seg[1])) ? (int) $seg[1] : null;
        $sub = $seg[2] ?? null;

        // Coleção
        if ($id === null) {
            if ($method === 'GET') {
                ApiResponse::success($svc->list($koala, $_GET['status'] ?? null));
            }
            if ($method === 'POST') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->create($koala, koala_body()), null, 201);
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        // Item /{id}
        if ($sub === null) {
            if ($method === 'GET') {
                ApiResponse::success($svc->get($koala, $id));
            }
            if ($method === 'PUT') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->update($koala, $id, koala_body()));
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        // Ações /{id}/{sub}
        if ($method === 'POST' && $sub === 'delete-for-user') {
            AuthHelpers::requireCsrf();
            $svc->deleteForUser($koala, $id);
            ApiResponse::success(['deleted_for_user' => $id]);
        }
        if ($method === 'POST' && $sub === 'status') {
            AuthHelpers::requireCsrf();
            $body = koala_body();
            ApiResponse::success($svc->setStatus($koala, $id, (string) ($body['status'] ?? '')));
        }
        // Duplicar: cria um rascunho novo copiando conteúdo + itens/despesas/pagamentos da origem.
        if ($method === 'POST' && $sub === 'duplicate') {
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->duplicate($koala, $id), null, 201);
        }

        // E4 — import/snapshot
        if ($method === 'POST' && $sub === 'import-client') {
            AuthHelpers::requireCsrf();
            $body = koala_body();
            $ext = (int) ($body['external_client_id'] ?? 0);
            if ($ext <= 0) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'external_client_id']); }
            ApiResponse::success((new SnapshotService($pdo))->importClient($koala, $id, $ext));
        }
        if ($method === 'POST' && $sub === 'import-orcamento') {
            AuthHelpers::requireCsrf();
            $body = koala_body();
            $orc = (int) ($body['orcamento_id'] ?? 0);
            if ($orc <= 0) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'orcamento_id']); }
            ApiResponse::success((new SnapshotService($pdo))->importOrcamento($koala, $id, $orc));
        }

        // E5 — preview da proposta real
        if ($method === 'GET' && $sub === 'preview') {
            $mode = ($_GET['mode'] ?? 'draft') === 'final' ? 'final' : 'draft';
            $html = (new ProposalRenderService($pdo))->renderProposal($koala, $id, $mode);
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            echo $html;
            exit;
        }

        // F3 — geração de PDF (renderizador único; marca d'água segue o status). Escrita => CSRF.
        if ($method === 'POST' && $sub === 'generate-pdf') {
            AuthHelpers::requireCsrf();
            ApiResponse::success((new PdfGenerationService($pdo))->generate($koala, $id));
        }
        // F3 — download/stream do PDF (autenticado; gera on-demand se ainda não existir).
        if ($method === 'GET' && $sub === 'pdf') {
            (new PdfGenerationService($pdo))->stream($koala, $id);
        }

        // F5 — versões (histórico / visualizar congelada / restaurar).
        if ($sub === 'versions') {
            $vsvc = new VersioningService($pdo);
            $vid  = (isset($seg[3]) && ctype_digit((string) $seg[3])) ? (int) $seg[3] : null;
            if ($vid === null) {
                if ($method === 'GET') { ApiResponse::success($vsvc->listVersions($koala, $id)); }
                ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            }
            $vsub = $seg[4] ?? null;
            if ($method === 'GET' && $vsub === 'preview') {
                $html = $vsvc->renderVersion($koala, $id, $vid, null);
                header('Content-Type: text/html; charset=utf-8');
                header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
                echo $html;
                exit;
            }
            if ($method === 'POST' && $vsub === 'restore') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($vsvc->restore($koala, $id, $vid)); // gate gestor/admin no service
            }
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['hint' => 'acao de versao desconhecida']);
        }

        // F5 — atividade (timeline de logs da proposta, readonly).
        if ($method === 'GET' && $sub === 'activity') {
            $svc->get($koala, $id); // auth
            ApiResponse::success((new LogService($pdo))->timeline($id, (int) ($_GET['limit'] ?? 50)));
        }

        // F4 — publicação / link público (ações autenticadas do editor).
        if ($method === 'POST' && $sub === 'publish') {
            AuthHelpers::requireCsrf();
            ApiResponse::success((new PublicationService($pdo))->publish($koala, $id));
        }
        if ($method === 'POST' && $sub === 'revoke') {
            AuthHelpers::requireCsrf();
            ApiResponse::success((new PublicationService($pdo))->revoke($koala, $id));
        }
        if ($method === 'GET' && $sub === 'public-state') {
            ApiResponse::success((new PublicationService($pdo))->publicState($koala, $id));
        }
        if ($method === 'GET' && $sub === 'views') {
            ApiResponse::success((new PublicationService($pdo))->views($koala, $id, (int) ($_GET['limit'] ?? 100)));
        }

        // Sub-recurso de E2 (items).
        if ($sub === 'items') {
            ProposalItemController::route($method, $seg, $koala, $pdo);
        }

        // Despesas Operacionais (espelho dos itens).
        if ($sub === 'expenses') {
            ProposalExpenseController::route($method, $seg, $koala, $pdo);
        }

        // Cliente (snapshot local editável) — GET bloco / PUT edição.
        if ($sub === 'client') {
            $snap = new SnapshotService($pdo);
            if ($method === 'GET') {
                $p = $svc->get($koala, $id);
                ApiResponse::success($snap->getClientBlock($id, $p['client_snapshot_id'] ? (int) $p['client_snapshot_id'] : null));
            }
            if ($method === 'PUT') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($snap->updateClient($koala, $id, koala_body()));
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        // Formas de pagamento vinculadas à proposta.
        if ($sub === 'payment-terms') {
            $psvc = new ProposalPaymentTermService($pdo);
            $tid  = (isset($seg[3]) && ctype_digit((string) $seg[3])) ? (int) $seg[3] : null;
            if ($tid === null) {
                if ($method === 'GET') { ApiResponse::success($psvc->list($koala, $id)); }
                if ($method === 'POST') {
                    AuthHelpers::requireCsrf();
                    ApiResponse::success($psvc->add($koala, $id, koala_body()), null, 201);
                }
                ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            }
            if ($method === 'DELETE') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($psvc->remove($koala, $id, $tid));
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        // Contatos repetíveis do cliente.
        if ($sub === 'contacts') {
            $snap = new SnapshotService($pdo);
            $cid  = (isset($seg[3]) && ctype_digit((string) $seg[3])) ? (int) $seg[3] : null;
            if ($cid === null) {
                if ($method === 'GET') { ApiResponse::success($snap->listContacts($koala, $id)); }
                if ($method === 'POST') {
                    AuthHelpers::requireCsrf();
                    ApiResponse::success($snap->addContact($koala, $id, koala_body()), null, 201);
                }
                ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            }
            if ($method === 'PUT') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($snap->updateContact($koala, $id, $cid, koala_body()));
            }
            if ($method === 'DELETE') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($snap->removeContact($koala, $id, $cid));
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['hint' => 'rota de proposta desconhecida']);
    }
}
