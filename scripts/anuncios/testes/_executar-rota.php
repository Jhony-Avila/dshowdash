<?php
// Anúncios — executa api/anuncios/stats.php DE VERDADE num processo isolado, com uma sessão sintética em diretório temporário
// (SessionGate::start() não reabre sessão já ativa). Uso: php _executar-rota.php <user_id|sem-sessao> <nivel> [query]
// Saída: "HTTP=<código>" em STDERR (função de desligamento) e o corpo em STDOUT. Só SELECT no banco; nada é escrito.
declare(strict_types=1);
[$_, $uid, $nivel, $query] = $argv + [null, 'sem-sessao', '0', ''];
$dir = sys_get_temp_dir() . '/anx-teste-' . getmypid();
@mkdir($dir, 0700, true);
session_save_path($dir);
session_start();
if ($uid !== 'sem-sessao') {
    $_SESSION['user_id'] = (int)$uid;
    $_SESSION['level'] = (int)$nivel;
    $_SESSION['email'] = 'teste@exemplo.invalid';
}
parse_str((string)$query, $_GET);
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/anuncios/stats.php' . ($query !== '' ? '?' . $query : '');
register_shutdown_function(static function () use ($dir): void {
    $c = http_response_code();
    fwrite(STDERR, 'HTTP=' . ($c === false ? 200 : $c) . "\n");
    @array_map('unlink', glob($dir . '/*') ?: []); @rmdir($dir);
});
require __DIR__ . '/../../../api/anuncios/stats.php';
