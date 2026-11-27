<?php
// ClienteIp — IP do cliente para decisões de ACESSO (AZUL, 26/11 noite; SEC-002 + revisão do HL-001).
// Regra: o IP vem do REMOTE_ADDR (quem abriu a conexão com o PHP). X-Forwarded-For só vale quando o REMOTE_ADDR é um proxy de confiança
// configurado (HEALTH_TRUSTED_PROXIES, vazio por padrão) e, nesse caso, conta da DIREITA para a esquerda até o primeiro endereço que não é
// proxy de confiança (o 1º item da lista é escrito pelo cliente e nunca decide nada). Endereço inválido = '' (nunca autorizado).
declare(strict_types=1);

final class ClienteIp
{
    /** @param array<string,mixed> $server @param list<string> $confiaveis */
    public static function resolver(array $server, array $confiaveis): string
    {
        $remoto = self::valido((string)($server['REMOTE_ADDR'] ?? ''));
        if ($remoto === '' || !self::naLista($remoto, $confiaveis)) { return $remoto; }
        $cadeia = array_map('trim', explode(',', (string)($server['HTTP_X_FORWARDED_FOR'] ?? '')));
        for ($i = count($cadeia) - 1; $i >= 0; $i--) {
            $ip = self::valido($cadeia[$i]);
            if ($ip === '') { return ''; }                       // cadeia corrompida: não adivinha
            if (!self::naLista($ip, $confiaveis)) { return $ip; }
        }
        return $remoto;
    }

    /** @param list<string> $faixas */
    public static function naLista(string $ip, array $faixas): bool
    {
        $ip = self::valido($ip);
        if ($ip === '') { return false; }
        $bin = inet_pton($ip);
        foreach ($faixas as $faixa) {
            $faixa = trim($faixa);
            if ($faixa === '') { continue; }
            [$rede, $bits] = str_contains($faixa, '/') ? explode('/', $faixa, 2) : [$faixa, null];
            $rbin = @inet_pton($rede);
            if ($rbin === false || strlen($rbin) !== strlen($bin)) { continue; }
            $max = strlen($bin) * 8;
            $n = $bits === null ? $max : (ctype_digit($bits) ? (int)$bits : -1);
            if ($n < 0 || $n > $max) { continue; }
            $bytes = intdiv($n, 8); $resto = $n % 8;
            if (substr($bin, 0, $bytes) !== substr($rbin, 0, $bytes)) { continue; }
            if ($resto === 0) { return true; }
            $m = (0xFF << (8 - $resto)) & 0xFF;
            if ((ord($bin[$bytes]) & $m) === (ord($rbin[$bytes]) & $m)) { return true; }
        }
        return false;
    }

    private static function valido(string $ip): string
    {
        $ip = trim($ip);
        return filter_var($ip, FILTER_VALIDATE_IP) !== false ? $ip : '';
    }
}
