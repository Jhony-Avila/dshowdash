<?php
// /api/koala/controllers/TemplateController.php
// @module koala.controller.template @version 1.0.0
declare(strict_types=1);

class TemplateController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $sub = $seg[1] ?? null;   // id | null
        $act = $seg[2] ?? null;   // 'preview' | 'structure' | 'publish' | 'activate' | 'deactivate'
        $isId = $sub !== null && ctype_digit((string) $sub);
        $mgr = new TemplateManagerService($pdo);

        // ── Leitura aberta (qualquer usuário Koala ativo) ──

        // GET /templates — lista de GESTÃO (id, nome, status, versão publicada, rascunho pendente, updated_at)
        if ($method === 'GET' && $sub === null) {
            ApiResponse::success($mgr->list());
        }

        // GET /templates/{id}/preview?version=draft|published&mode=draft|final — HTML A4 do renderizador único
        if ($method === 'GET' && $isId && $act === 'preview') {
            $version = ($_GET['version'] ?? 'published') === 'draft' ? 'draft' : 'published';
            $mode = ($_GET['mode'] ?? 'draft') === 'final' ? 'final' : 'draft';
            $html = (new TemplateRenderService($pdo))->renderTemplatePreview((int) $sub, $mode, $version);
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            echo $html;
            exit;
        }

        // ── Gestão: ADMIN-only (403 para seller/manager) ──

        // GET /templates/{id} — detalhe completo (estrutura corrente + rascunho + histórico)
        if ($method === 'GET' && $isId && $act === null) {
            PermissionService::requireAdmin($koala);
            ApiResponse::success($mgr->detail((int) $sub));
        }

        // POST /templates — criar: {mode:'scratch'|'duplicate', source_id?, name?, description?}
        if ($method === 'POST' && $sub === null) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            $body = koala_body();
            if (($body['mode'] ?? 'scratch') === 'duplicate') {
                ApiResponse::success($mgr->duplicate($koala, (int) ($body['source_id'] ?? 0), $body), null, 201);
            }
            ApiResponse::success($mgr->createFromScratch($koala, $body), null, 201);
        }

        // PUT /templates/{id} — editar metadados (nome/descrição/segmento)
        if ($method === 'PUT' && $isId && $act === null) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($mgr->updateMeta($koala, (int) $sub, koala_body()));
        }

        // PUT /templates/{id}/structure — salva structure_json como RASCUNHO (valida shape + placeholders)
        if ($method === 'PUT' && $isId && $act === 'structure') {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            $body = koala_body();
            $raw = $body['structure_json'] ?? $body;
            $json = is_string($raw) ? $raw : json_encode($raw, JSON_UNESCAPED_UNICODE);
            ApiResponse::success($mgr->saveStructureDraft($koala, (int) $sub, (string) $json));
        }

        // POST /templates/{id}/publish — congela o rascunho como versão publicada
        if ($method === 'POST' && $isId && $act === 'publish') {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($mgr->publish($koala, (int) $sub));
        }

        // POST /templates/{id}/activate | /deactivate
        if ($method === 'POST' && $isId && ($act === 'activate' || $act === 'deactivate')) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($mgr->setActive($koala, (int) $sub, $act === 'activate'));
        }

        // DELETE /templates/{id} — soft-delete (bloqueia se for o único ativo)
        if ($method === 'DELETE' && $isId && $act === null) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($mgr->softDelete($koala, (int) $sub));
        }

        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
