<?php
/**
 * AwesomeAPI Fetcher (Brazilian Exchange Rate API)
 * @version 2.0.0
 * @changelog Migrado de exchangerate.host para AwesomeAPI
 */

class ExchangeRateFetcher {
    private $config;
    private $baseUrl;
    
    public function __construct($config) {
        $this->config = $config;
        $this->baseUrl = $config['awesomeapi']['base_url'];
    }
    
    public function getExchangeRates($pairs = []) {
        if (empty($pairs)) {
            $pairs = ['USD-BRL', 'USD-CNY'];
        }
        
        $pairsString = implode(',', $pairs);
        $endpoint = $this->baseUrl . $this->config['awesomeapi']['endpoints']['last'];
        $url = $endpoint . '/' . $pairsString;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['awesomeapi']['timeout']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: DshowDash/1.0'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("AwesomeAPI Error: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("AwesomeAPI returned HTTP " . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if (!$data || !is_array($data)) {
            throw new Exception("Invalid response from AwesomeAPI");
        }
        
        $rates = [];
        foreach ($data as $key => $value) {
            $currency = str_replace('USD', '', $key);
            $rates[$currency] = [
                'rate' => (float)$value['bid'],
                'high' => (float)$value['high'],
                'low' => (float)$value['low'],
                'variation' => (float)$value['varBid'],
                'percent_change' => (float)$value['pctChange']
            ];
        }
        
        return [
            'rates' => $rates,
            'updated_at' => date('c')
        ];
    }
    
    public function getRate($targetCurrency) {
        $pair = 'USD-' . strtoupper($targetCurrency);
        $data = $this->getExchangeRates([$pair]);
        
        $currency = strtoupper($targetCurrency);
        
        if (!isset($data['rates'][$currency])) {
            throw new Exception("Currency {$currency} not found in response");
        }
        
        return [
            'pair' => $pair,
            'rate' => $data['rates'][$currency]['rate'],
            'high' => $data['rates'][$currency]['high'],
            'low' => $data['rates'][$currency]['low'],
            'variation' => $data['rates'][$currency]['variation'],
            'percent_change' => $data['rates'][$currency]['percent_change'],
            'updated_at' => $data['updated_at']
        ];
    }
}