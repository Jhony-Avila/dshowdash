<?php
/**
 * Hostinger API Fetcher
 * @version 1.2.0
 * @changelog Alterado intervalo de 5 para 30 minutos + fallback para comandos locais
 */

class HostingerFetcher {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function getServerMetrics() {
        $baseUrl = $this->config['hostinger']['base_url'];
        $vmId = $this->config['hostinger']['vm_id'];
        $token = $this->config['hostinger']['token'];
        
        // Hostinger API precisa de intervalo maior (30min) para ter dados
        $dateFrom = date('Y-m-d\TH:i:s\Z', strtotime('-30 minutes'));
        $dateTo = date('Y-m-d\TH:i:s\Z');
        
        $url = "{$baseUrl}/virtual-machines/{$vmId}/metrics?date_from={$dateFrom}&date_to={$dateTo}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['hostinger']['timeout']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("Hostinger API Error: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("Hostinger API returned HTTP " . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if ($data === null || json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Failed to parse JSON response: " . json_last_error_msg());
        }
        
        // Verificar se tem dados nas arrays de uso
        $cpuUsageArray = $data['cpu_usage']['usage'] ?? [];
        $ramUsageArray = $data['ram_usage']['usage'] ?? [];
        $diskUsageArray = $data['disk_space']['usage'] ?? [];
        
        // Se API Hostinger não retornar dados, usar comandos locais como fallback
        if (empty($cpuUsageArray) || empty($ramUsageArray) || empty($diskUsageArray)) {
            return $this->getLocalMetrics();
        }
        
        $latestCpu = (float) end($cpuUsageArray);
        $latestRam = (float) end($ramUsageArray);
        $latestDisk = (float) end($diskUsageArray);
        
        $totalMemory = $this->config['specs']['total_memory'];
        $totalDisk = $this->config['specs']['total_disk'];
        
        return [
            'cpu_percent' => round($latestCpu, 2),
            'memory_used' => $latestRam,
            'memory_used_gb' => round($latestRam / 1073741824, 2),
            'memory_percent' => round(($latestRam / $totalMemory) * 100, 2),
            'disk_used' => $latestDisk,
            'disk_used_gb' => round($latestDisk / 1073741824, 2),
            'disk_percent' => round(($latestDisk / $totalDisk) * 100, 2),
            'source' => 'hostinger_api',
            'updated_at' => date('c')
        ];
    }
    
    // Fallback: usar comandos shell locais
    private function getLocalMetrics() {
        // CPU Usage
        $cpuLine = shell_exec("top -bn1 | grep 'Cpu(s)'");
        preg_match('/(\d+\.\d+)\s*id/', $cpuLine, $matches);
        $cpuIdle = isset($matches[1]) ? (float)$matches[1] : 0;
        $cpuUsed = 100 - $cpuIdle;
        
        // Memory Usage
        $memInfo = shell_exec("free -b | grep Mem");
        preg_match('/Mem:\s+(\d+)\s+(\d+)/', $memInfo, $memMatches);
        $memTotal = isset($memMatches[1]) ? (float)$memMatches[1] : $this->config['specs']['total_memory'];
        $memUsed = isset($memMatches[2]) ? (float)$memMatches[2] : 0;
        
        // Disk Usage
        $diskInfo = shell_exec("df -B1 / | tail -1");
        preg_match('/\s+(\d+)\s+(\d+)/', $diskInfo, $diskMatches);
        $diskTotal = isset($diskMatches[1]) ? (float)$diskMatches[1] : $this->config['specs']['total_disk'];
        $diskUsed = isset($diskMatches[2]) ? (float)$diskMatches[2] : 0;
        
        return [
            'cpu_percent' => round($cpuUsed, 2),
            'memory_used' => $memUsed,
            'memory_used_gb' => round($memUsed / 1073741824, 2),
            'memory_percent' => round(($memUsed / $memTotal) * 100, 2),
            'disk_used' => $diskUsed,
            'disk_used_gb' => round($diskUsed / 1073741824, 2),
            'disk_percent' => round(($diskUsed / $diskTotal) * 100, 2),
            'source' => 'local_commands',
            'updated_at' => date('c')
        ];
    }
}