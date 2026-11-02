<?php
/**
 * API - UI Context Messages
 * @version 1.2.0
 * @changelog v1.1.0 - Connected to dedicated DSHOWDASH_HOME database
 * @changelog v1.2.0 - Credencial REMOVIDA do codigo (usava root + senha em texto puro no
 *                     webroot) -> passa pelo DatabaseManager, que le do .env. E o erro
 *                     deixou de devolver a mensagem da excecao ao cliente (vazava DSN/schema).
 * @description Endpoint para buscar mensagens contextuais
 * @route GET /api/ui/context-messages.php
 * @database DSHOWDASH_HOME (lido pela conexao DSHOWDASH, consulta qualificada por schema)
 *
 * NOTA p/ quem for mexer: DSHOWDASH_HOME NAO esta registrado em config/db_connection.php.
 * Enquanto a app roda como root no MySQL, a consulta qualificada resolve sem editar aquele
 * arquivo CORE. Ao criar usuario de menor privilegio, registre a conexao DSHOWDASH_HOME e
 * troque por getConnection('DSHOWDASH_HOME') + tabela sem qualificar.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/db_connection.php';

try {
    // Conexão pelo DatabaseManager (credencial vem do .env, nunca do codigo).
    // Os atributos de PDO sao os mesmos que este arquivo usava: ERRMODE_EXCEPTION,
    // DEFAULT_FETCH_MODE=FETCH_ASSOC e EMULATE_PREPARES=false.
    $pdo = getConnection('DSHOWDASH');

    // Query para buscar mensagens ativas
    $sql = "
        SELECT 
            id,
            key_name AS `key`,
            message,
            subtitle,
            category,
            priority,
            start_time,
            end_time,
            days_of_week,
            requires_user_name,
            min_session_time,
            max_session_time,
            system_state
        FROM DSHOWDASH_HOME.ui_context_messages
        WHERE active = 1
        ORDER BY priority DESC, category ASC
    ";
    
    $stmt = $pdo->query($sql);
    $messages = $stmt->fetchAll();
    
    // Processa campos JSON e booleanos
    foreach ($messages as &$msg) {
        // Parse days_of_week JSON
        if ($msg['days_of_week']) {
            $msg['days_of_week'] = json_decode($msg['days_of_week'], true);
        }
        
        // Converte para boolean
        $msg['requires_user_name'] = (bool)$msg['requires_user_name'];
        
        // Converte para int ou null
        $msg['start_time'] = $msg['start_time'] !== null ? (int)$msg['start_time'] : null;
        $msg['end_time'] = $msg['end_time'] !== null ? (int)$msg['end_time'] : null;
        $msg['min_session_time'] = $msg['min_session_time'] !== null ? (int)$msg['min_session_time'] : null;
        $msg['max_session_time'] = $msg['max_session_time'] !== null ? (int)$msg['max_session_time'] : null;
        $msg['priority'] = (int)$msg['priority'];
        $msg['id'] = (int)$msg['id'];
    }
    unset($msg);
    
    // Resposta de sucesso
    echo json_encode([
        'success' => true,
        'data' => $messages,
        'count' => count($messages),
        'database' => 'DSHOWDASH_HOME',
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Throwable $e) {
    // A mensagem da excecao NAO volta para o cliente: em erro de conexao ela carrega
    // DSN, usuario e nome de schema. Detalhe so no log do servidor.
    error_log('[ui/context-messages] ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database error',
        'message' => 'Nao foi possivel carregar as mensagens contextuais.'
    ], JSON_UNESCAPED_UNICODE);
}
