<?php
// Equipamentos › Atributos — executa api/atributos/index.php DE VERDADE num processo isolado, com sessão sintética em diretório
// temporário (molde: scripts/datatables/testes/_executar-rota.php). Uso: php _executar-rota.php <MÉTODO> <r> <nivel|sem-sessao>
declare(strict_types=1);
[$_, $metodo, $rota, $nivel] = $argv + [null, 'GET', 'atributos', 'sem-sessao'];
$dir = sys_get_temp_dir() . '/eq-teste-' . getmypid();
@mkdir($dir, 0700, true);
session_save_path($dir);
session_start();
if ($nivel !== 'sem-sessao') { $_SESSION['user_id'] = 999004; $_SESSION['level'] = (int) $nivel; $_SESSION['email'] = 'teste@exemplo.invalid'; }
$_SERVER['REQUEST_METHOD'] = $metodo;
$_GET = ['r' => $rota];
$_SERVER['REQUEST_URI'] = '/api/atributos/index.php?r=' . $rota;
register_shutdown_function(static function () use ($dir): void {
    $c = http_response_code();
    fwrite(STDERR, 'HTTP=' . ($c === false ? 200 : $c) . "\n");
    @array_map('unlink', glob($dir . '/*') ?: []); @rmdir($dir);
});
require __DIR__ . '/../../../api/atributos/index.php';
