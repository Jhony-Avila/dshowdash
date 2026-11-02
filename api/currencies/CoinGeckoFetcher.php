<?php
/**
 * CoinGecko API Fetcher
 * @version 1.0.0
 */

class CoinGeckoFetcher {
    private $config;
    private $baseUrl;
    
    public function __construct($config) {
        $this->config = $config;
        $this->baseUrl = $config['coingecko']['base_url'];
    }
    
    public function getBitcoinPrices() {
        $endpoint = $this->baseUrl . $this->config['coingecko']['endpoints']['simple_price'];
        $currencies = implode(',', $this->config['coingecko']['currencies']);
        
        $url = $endpoint . '?ids=bitcoin&vs_currencies=' . $currencies . '&include_24hr_change=true';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['coingecko']['timeout']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: DshowDash/1.0'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("CoinGecko API Error: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("CoinGecko API returned HTTP " . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if (!isset($data['bitcoin'])) {
            throw new Exception("Invalid response from CoinGecko API");
        }
        
        return [
            'usd' => $data['bitcoin']['usd'] ?? null,
            'brl' => $data['bitcoin']['brl'] ?? null,
            'cny' => $data['bitcoin']['cny'] ?? null,
            'usd_24h_change' => $data['bitcoin']['usd_24h_change'] ?? 0,
            'updated_at' => date('c')
        ];
    }
}
