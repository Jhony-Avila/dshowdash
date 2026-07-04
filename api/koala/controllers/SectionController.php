<?php
// /api/koala/controllers/SectionController.php
// Catálogo de seções + galeria de imagens. Área ADMIN-only (403 p/ seller/manager).
// @module koala.controller.section @version 1.0.0
declare(strict_types=1);

class SectionController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        // Toda a gestão de seções é ADMIN-only.
        PermissionService::requireAdmin($koala);

        $id  = (isset($seg[1]) && ctype_digit((string) $seg[1])) ? (int) $seg[1] : null;
        $a2  = $seg[2] ?? null;                       // 'images' | 'activate' | 'deactivate'
        $img = (isset($seg[3]) && ctype_digit((string) $seg[3])) ? (int) $seg[3] : null;
        $a4  = $seg[4] ?? null;                       // 'raw'

        $svc = new SectionService($pdo);
        $imgSvc = new SectionImageService($pdo);

        // ── Imagens ──
        if ($id !== null && $a2 === 'images') {
            // GET /sections/{id}/images/{imgId}/raw — serve o binário (via PHP, sem alias)
            if ($method === 'GET' && $img !== null && $a4 === 'raw') {
                $imgSvc->serve($img); // faz exit
            }
            // GET /sections/{id}/images — galeria
            if ($method === 'GET' && $img === null) {
                ApiResponse::success($imgSvc->list($id));
            }
            // POST /sections/{id}/images — upload multipart
            if ($method === 'POST' && $img === null) {
                AuthHelpers::requireCsrf();
                $file = $_FILES['image'] ?? ($_FILES['file'] ?? null);
                if (!is_array($file)) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'image', 'message' => 'Campo de arquivo "image" ausente.']);
                }
                ApiResponse::success($imgSvc->upload($koala, $id, $file, $_POST), null, 201);
            }
            // DELETE /sections/{id}/images/{imgId} — soft-delete (arquivo vai p/ _trash)
            if ($method === 'DELETE' && $img !== null) {
                AuthHelpers::requireCsrf();
                ApiResponse::success($imgSvc->softDelete($koala, $img));
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        // ── Preview do FRAGMENTO da seção (HTML self-contained, altura auto, sem marca d'água) ──
        // GET /sections/{id}/preview
        if ($method === 'GET' && $id !== null && $a2 === 'preview') {
            $html = (new SectionRenderService($pdo))->renderPreview($id);
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            echo $html;
            exit;
        }

        // ── Ativar/Desativar ──
        if ($method === 'POST' && $id !== null && ($a2 === 'activate' || $a2 === 'deactivate')) {
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->setActive($koala, $id, $a2 === 'activate'));
        }

        // ── Catálogo (CRUD) ──
        if ($method === 'GET' && $id === null) {
            ApiResponse::success($svc->list());
        }
        if ($method === 'GET' && $id !== null) {
            ApiResponse::success($svc->get($id));
        }
        if ($method === 'POST' && $id === null) {
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->create($koala, koala_body()), null, 201);
        }
        if ($method === 'PUT' && $id !== null) {
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->update($koala, $id, koala_body()));
        }
        if ($method === 'DELETE' && $id !== null) {
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->softDelete($koala, $id));
        }

        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
