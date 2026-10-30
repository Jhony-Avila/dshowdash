<?php
// Google Analytics — executa api/google-analytics/index.php DE VERDADE num processo isolado, com uma sessão sintética em diretório
// temporário (SessionGate::start() não reabre sessão já ativa). Uso: php _executar-rota.php <rota> <nivel|sem-sessao>
// Saída: "HTTP=<código>" em STDERR (função de desligamento: requireAuth encerra com exit) e o corpo JSON em STDOUT. Sem banco, sem rede.
declare(strict_types=1);
[$_, $rota, $nivel] = $argv + [null, 'status', 'sem-sessao'];
$dir = sys_get_temp_dir() . '/ga-teste-' . getmypid();
@mkdir($dir, 0700, true);
session_save_path($dir);
session_start();
if ($nivel !== 'sem-sessao') {
    $_SESSION['user_id'] = 999001;            // usuário sintético
    $_SESSION['level'] = (int)$nivel;
    $_SESSION['email'] = 'teste@exemplo.invalid';
}
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['PATH_INFO'] = '/' . $rota;
$_SERVER['REQUEST_URI'] = '/api/google-analytics/' . $rota;
register_shutdown_function(static function () use ($dir): void {
    $c = http_response_code();
    fwrite(STDERR, 'HTTP=' . ($c === false ? 200 : $c) . "\n");
    @array_map('unlink', glob($dir . '/*') ?: []); @rmdir($dir);
});
require __DIR__ . '/../../../api/google-analytics/index.php';
