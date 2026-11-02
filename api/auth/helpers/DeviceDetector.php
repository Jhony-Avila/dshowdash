<?php
// DeviceDetector
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Helper para detecção de IP real e informações de dispositivo

declare(strict_types=1);

class DeviceDetector
{
    private static array $cfCidrs = [
        '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
        '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
        '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
    ];

    public static function ipInCidr(string $ip, string $cidr): bool
    {
        [$subnet, $mask] = explode('/', $cidr);
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        $maskLong = -1 << (32 - (int)$mask);
        return ($ipLong & $maskLong) === ($subnetLong & $maskLong);
    }

    public static function isTrustedProxy(string $ip): bool
    {
        foreach (self::$cfCidrs as $cidr) {
            if (self::ipInCidr($ip, $cidr)) return true;
        }
        return false;
    }

    public static function getRealClientIp(): string
    {
        $remote = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        if (isset($_SERVER['HTTP_CF_CONNECTING_IP']) && self::isTrustedProxy($remote)) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }

        if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && self::isTrustedProxy($remote)) {
            $forwardedIps = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($forwardedIps[0]);
        }

        return $remote;
    }

    public static function detectDevice(): array
    {
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $device = 'desktop';
        $browser = 'Unknown';
        $os = 'Unknown';

        if (preg_match('/Mobile|Android|iPhone|iPad/i', $ua)) {
            $device = preg_match('/iPad|Tablet/i', $ua) ? 'tablet' : 'mobile';
        }

        if (preg_match('/Chrome\/([0-9.]+)/i', $ua, $m)) {
            $browser = 'Chrome ' . explode('.', $m[1])[0];
        } elseif (preg_match('/Firefox\/([0-9.]+)/i', $ua, $m)) {
            $browser = 'Firefox ' . explode('.', $m[1])[0];
        } elseif (preg_match('/Safari\/([0-9.]+)/i', $ua) && !preg_match('/Chrome/i', $ua)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge\/([0-9.]+)/i', $ua, $m)) {
            $browser = 'Edge ' . explode('.', $m[1])[0];
        }

        if (preg_match('/Windows NT/i', $ua)) $os = 'Windows';
        elseif (preg_match('/Mac OS X/i', $ua)) $os = 'macOS';
        elseif (preg_match('/Linux/i', $ua)) $os = 'Linux';
        elseif (preg_match('/Android/i', $ua)) $os = 'Android';
        elseif (preg_match('/iOS|iPhone|iPad/i', $ua)) $os = 'iOS';

        return [
            'device_type' => $device,
            'browser' => $browser,
            'os' => $os,
            'user_agent' => $ua
        ];
    }

    public static function getFullContext(): array
    {
        return [
            'ip' => self::getRealClientIp(),
            'device' => self::detectDevice()
        ];
    }
}
