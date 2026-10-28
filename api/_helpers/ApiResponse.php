<?php
/**
 * ApiResponse - Helper centralizado para respostas de API
 * @version 1.0.0-ENTERPRISE
 * @description Contrato único de resposta para toda a API
 * @created 2026-01-19
 * 
 * CONTRATO OFICIAL:
 * {
 *   "ok": boolean,
 *   "data": mixed|null,
 *   "error": string|null,
 *   "meta": object|null
 * }
 * 
 * Uso:
 *   ApiResponse::success($data, $meta);
 *   ApiResponse::error('ERRO_CODE', 400, $meta);
 *   ApiResponse::json(['custom' => 'response']);
 */

class ApiResponse {
    
    // Códigos de erro padronizados
    const ERR_NOT_AUTHENTICATED = 'NOT_AUTHENTICATED';
    const ERR_AUTH_REQUIRED = self::ERR_NOT_AUTHENTICATED;  // alias retrocompatível
    const ERR_NOT_AUTHORIZED = 'NOT_AUTHORIZED';
    const ERR_INVALID_CSRF = 'INVALID_CSRF_TOKEN';
    const ERR_METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED';
    const ERR_INVALID_JSON = 'INVALID_JSON';
    const ERR_INVALID_ACTION = 'INVALID_ACTION';
    const ERR_ID_REQUIRED = 'ID_REQUIRED';
    const ERR_NOT_FOUND = 'NOT_FOUND';
    const ERR_DATABASE_ERROR = 'DATABASE_ERROR';
    const ERR_INTERNAL_ERROR = 'INTERNAL_ERROR';
    const ERR_VALIDATION_ERROR = 'VALIDATION_ERROR';
    const ERR_CORS_BLOCKED = 'CORS_BLOCKED';
    
    /**
     * Resposta de sucesso
     * @param mixed $data Dados a retornar
     * @param array|null $meta Metadados opcionais
     * @param int $httpCode Código HTTP (default 200)
     */
    public static function success($data = null, ?array $meta = null, int $httpCode = 200): void {
        self::sendHeaders();
        http_response_code($httpCode);
        
        $response = [
            'ok' => true,
            'data' => $data,
            'error' => null
        ];
        
        if ($meta !== null) {
            $response['meta'] = $meta;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Resposta de erro
     * @param string $errorCode Código do erro
     * @param int $httpCode Código HTTP
     * @param array|null $meta Metadados opcionais (detalhes do erro)
     */
    public static function error(string $errorCode, int $httpCode = 400, ?array $meta = null): void {
        self::sendHeaders();
        http_response_code($httpCode);
        
        $response = [
            'ok' => false,
            'data' => null,
            'error' => $errorCode
        ];
        
        if ($meta !== null) {
            $response['meta'] = $meta;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Resposta JSON customizada (para compatibilidade durante migração)
     * @param array $data Array completo a ser retornado
     * @param int $httpCode Código HTTP
     */
    public static function json(array $data, int $httpCode = 200): void {
        self::sendHeaders();
        http_response_code($httpCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Resposta de lista paginada
     * @param array $items Lista de itens
     * @param int $total Total de registros
     * @param int $page Página atual
     * @param int $limit Itens por página
     */
    public static function paginated(array $items, int $total, int $page = 1, int $limit = 20): void {
        self::success($items, [
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => (int)ceil($total / $limit)
            ],
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envia headers padrão JSON
     */
    private static function sendHeaders(): void {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
    }
    
    /**
     * Helper para capturar exceções
     * @param Exception $e Exceção capturada
     * @param bool $includeTrace Incluir stack trace (apenas em dev)
     */
    public static function exception(\Throwable $e, bool $includeTrace = false): void {
        $meta = ['message' => 'Erro interno'];

        if ($includeTrace && getenv('APP_ENV') !== 'production') {
            $meta['trace'] = $e->getTraceAsString();
        }

        error_log("API Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());

        self::error(self::ERR_INTERNAL_ERROR, 500, $meta);
    }

    /**
     * Constrói resposta de sucesso como string JSON (para cache Redis)
     * Não envia headers nem termina execução - retorna string para caching
     *
     * @param mixed $data Dados a retornar
     * @param array|null $meta Metadados opcionais
     * @return string JSON encoded response
     *
     * Uso com Redis:
     *   $json = ApiResponse::buildSuccess($data, $meta);
     *   RedisHelper::cacheAndReturn($key, $json, $ttl);
     */
    public static function buildSuccess($data = null, ?array $meta = null): string {
        $response = [
            'ok' => true,
            'data' => $data,
            'error' => null
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Constrói resposta de erro como string JSON (para cache Redis)
     * Não envia headers nem termina execução - retorna string para caching
     *
     * @param string $errorCode Código do erro
     * @param array|null $meta Metadados opcionais (detalhes do erro)
     * @return string JSON encoded response
     *
     * Uso com Redis:
     *   $json = ApiResponse::buildError('ERRO_CODE', $meta);
     *   RedisHelper::cacheAndReturn($key, $json, $ttl);
     */
    public static function buildError(string $errorCode, ?array $meta = null): string {
        $response = [
            'ok' => false,
            'data' => null,
            'error' => $errorCode
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
