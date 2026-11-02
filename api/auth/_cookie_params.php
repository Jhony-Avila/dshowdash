<?php
// Parâmetros unificados de sessão/cookie
// FONTE ÚNICA DA VERDADE para todos os endpoints de auth
// @version 2.0.0-ENTERPRISE
// @updated 2026-01-25
// v2.0.0: P1 FIX - Consolidado como SSOT, usado por SessionGate

function envBool(string $key, bool $default = false): bool {
    $value = getenv($key);
    if ($value === false) return $default;
    return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
}

// HTTPS detection (atrás de proxy/CDN)
// Se FORCE_SECURE_COOKIES=true (default), sempre retorna true
function detectSecure(): bool {
    if (envBool('FORCE_SECURE_COOKIES', true)) {
        return true;
    }

    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
    if (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) return true;
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') return true;

    if (!empty($_SERVER['HTTP_CF_VISITOR'])) {
        $cfv = json_decode($_SERVER['HTTP_CF_VISITOR'], true);
        if (isset($cfv['scheme']) && strtolower($cfv['scheme']) === 'https') return true;
    }

    return false;
}

// Normaliza domínio de cookie para apex+subdomínios
function deriveCookieDomain(string $host, string $envDomain = ''): string {
    $envDomain = trim($envDomain);
    if ($envDomain !== '') {
        if ($envDomain[0] !== '.') $envDomain = '.' . $envDomain;
        return $envDomain;
    }

    $host = strtolower(trim($host));
    if ($host === '') return '';

    if (strpos($host, ':') !== false) {
        $host = explode(':', $host, 2)[0];
    }

    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return '';
    }

    if ($host === 'dshowdash.com.br' ||
        $host === 'www.dshowdash.com.br' ||
        str_ends_with($host, '.dshowdash.com.br')) {
        return '.dshowdash.com.br';
    }

    return '';
}

// Valida e normaliza SameSite a partir de ENV (default Lax)
function resolveSameSite(): string {
    $samesite = strtoupper(trim((string)(getenv('SESSION_COOKIE_SAMESITE') ?: 'LAX')));
    if (!in_array($samesite, ['LAX', 'STRICT', 'NONE'], true)) {
        $samesite = 'LAX';
    }
    return $samesite;
}

// FONTE ÚNICA: Retorna parâmetros de cookie padronizados
// Usado por SessionGate::getCookieParams()
function getSessionCookieParams(): array {
    $lifetime  = (int)(getenv('SESSION_COOKIE_LIFETIME') ?: 604800);
    $envDomain = (string)(getenv('SESSION_COOKIE_DOMAIN') ?: '');
    $host      = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
    $domain    = deriveCookieDomain($host, $envDomain);
    $sameSite  = resolveSameSite();
    $secure    = detectSecure();

    // Se SameSite=None, Secure DEVE ser true
    if ($sameSite === 'NONE') {
        $secure = true;
    }

    return [
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => $domain,
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => $sameSite
    ];
}

// Deve ser chamado ANTES de session_start()
// @deprecated Use SessionGate::start() que já aplica os params
function applySessionCookieParams(): void {
    session_set_cookie_params(getSessionCookieParams());
}

// Reemite o cookie de sessão com os parâmetros atuais
function renewSessionCookie(): void {
    if (headers_sent($file, $line)) {
        error_log("renewSessionCookie: headers already sent at $file:$line");
        return;
    }

    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    $params  = session_get_cookie_params();
    $name    = session_name();
    $id      = session_id();

    if ($id === '') {
        return;
    }

    $expires = time() + (int)($params['lifetime'] ?? 604800);

    setcookie(
        $name,
        $id,
        [
            'expires'  => $expires,
            'path'     => $params['path']     ?? '/',
            'domain'   => $params['domain']   ?? '',
            'secure'   => (bool)($params['secure']   ?? true),
            'httponly' => (bool)($params['httponly'] ?? true),
            'samesite' => $params['samesite'] ?? 'Lax',
        ]
    );
}
