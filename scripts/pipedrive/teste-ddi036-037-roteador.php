<?php
// Roteador do servidor FALSO do Pipedrive para o teste DDI-036/037 (php -S 127.0.0.1:<porta> este-arquivo). Nenhuma rede externa, dados fictícios.
header('Content-Type: application/json');
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); $c = $_GET['cursor'] ?? '';
if (str_contains($p, '/sem-data')) { echo json_encode(['success' => true]); return; }                       // INVÁLIDA: sem "data"
if (str_contains($p, '/data-texto')) { echo json_encode(['success' => true, 'data' => 'x']); return; }      // INVÁLIDA: data não é lista
if (str_contains($p, '/vazia')) { echo json_encode(['success' => true, 'data' => null]); return; }          // VAZIA comprovada (v1)
if (str_contains($p, '/duas-paginas')) {
    if ($c === '') { echo json_encode(['success' => true, 'data' => [['id' => 1], ['id' => 2]], 'additional_data' => ['next_cursor' => 'p2']]); return; }
    echo json_encode(['success' => true, 'data' => [['id' => 3]], 'additional_data' => ['next_cursor' => null]]); return;
}
if (str_contains($p, '/sem-fim')) { echo json_encode(['success' => true, 'data' => [['id' => 9]], 'additional_data' => ['next_cursor' => 'mais']]); return; }
http_response_code(404); echo json_encode(['success' => false, 'error' => 'not found']);
