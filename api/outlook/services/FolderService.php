<?php
// Outlook / FolderService - listagem de pastas (Microsoft Graph)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Lista as pastas de e-mail (padrao + personalizadas) com contadores. O front da
// Fase 1 usa um conjunto fixo bem-conhecido; este endpoint entrega a arvore real
// para as pastas personalizadas (§14).
declare(strict_types=1);

final class OutlookFolderService
{
    private OutlookAuthService $auth;

    public function __construct(PDO $pdo, OutlookAuthService $auth)
    {
        $this->auth = $auth;
        unset($pdo); // reservado p/ cache futuro
    }

    /** @return array ['ok'=>bool,'folders'=>array,'error'=>?string,'error_code'=>?string,'http'=>int] */
    public function listFolders(int $userId, int $accountId): array
    {
        $token = $this->auth->accessTokenFor($userId, $accountId);
        if ($token === null) {
            return ['ok' => false, 'error_code' => 'NEEDS_AUTH', 'http' => 401, 'folders' => []];
        }
        $graph = new GraphClient($token);
        $res = $graph->get('/me/mailFolders', [
            '$top'    => 100,
            '$select' => 'id,displayName,unreadItemCount,totalItemCount,childFolderCount,wellKnownName',
        ]);
        if (($res['status'] ?? 0) === 401) {
            $token = $this->auth->accessTokenFor($userId, $accountId, true);
            if ($token === null) { return ['ok' => false, 'error_code' => 'NEEDS_AUTH', 'http' => 401, 'folders' => []]; }
            $res = (new GraphClient($token))->get('/me/mailFolders', [
                '$top' => 100, '$select' => 'id,displayName,unreadItemCount,totalItemCount,childFolderCount,wellKnownName',
            ]);
        }
        if (!$res['ok']) {
            return ['ok' => false, 'error' => $res['error'] ?? 'Falha ao listar pastas.', 'error_code' => $res['error_code'] ?? 'GRAPH_ERROR', 'http' => $res['status'] ?? 0, 'folders' => []];
        }
        $folders = array_map(static function (array $f): array {
            return [
                'id'           => $f['id'] ?? null,
                'well_known'   => $f['wellKnownName'] ?? null,
                'display_name' => $f['displayName'] ?? '(sem nome)',
                'unread'       => (int)($f['unreadItemCount'] ?? 0),
                'total'        => (int)($f['totalItemCount'] ?? 0),
                'children'     => [],
            ];
        }, $res['data']['value'] ?? []);
        return ['ok' => true, 'folders' => $folders, 'http' => $res['status']];
    }
}
