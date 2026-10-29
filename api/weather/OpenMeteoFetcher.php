<?php
/**
 * Open-Meteo API Fetcher
 * @version 1.0.0
 */

class OpenMeteoFetcher {
    private $config;
    private $baseUrl;
    
    public function __construct($config) {
        $this->config = $config;
        $this->baseUrl = $config['openmeteo']['base_url'];
    }
    
    public function getSaoPauloWeather() {
        $endpoint = $this->baseUrl . $this->config['openmeteo']['endpoints']['forecast'];
        $coords = $this->config['openmeteo']['sao_paulo'];
        
        $params = [
            'latitude' => $coords['latitude'],
            'longitude' => $coords['longitude'],
            'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
            'daily' => 'weather_code,temperature_2m_max,temperature_2m_min',
            'forecast_days' => 7,
            'timezone' => $coords['timezone']
        ];
        
        $url = $endpoint . '?' . http_build_query($params);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['openmeteo']['timeout']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: DshowDash/1.0'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("Open-Meteo API Error: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("Open-Meteo API returned HTTP " . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if (!isset($data['current'])) {
            throw new Exception("Invalid response from Open-Meteo API");
        }
        
        $current = $data['current'];

        // daily é NÃO-FATAL: se a Open-Meteo não devolver daily, forecast fica []
        // e o current segue INTACTO (não derruba o endpoint).
        $forecast = [];
        if (isset($data['daily']['time']) && is_array($data['daily']['time'])) {
            $daily = $data['daily'];
            $days = count($daily['time']);
            for ($i = 0; $i < $days; $i++) {
                $code = $daily['weather_code'][$i] ?? 0;
                $forecast[] = [
                    'date'         => $daily['time'][$i],
                    'weather_code' => $code,
                    'temp_max'     => isset($daily['temperature_2m_max'][$i]) ? round($daily['temperature_2m_max'][$i]) : null,
                    'temp_min'     => isset($daily['temperature_2m_min'][$i]) ? round($daily['temperature_2m_min'][$i]) : null,
                    'condition'    => $this->getWeatherCondition($code),
                    'icon'         => $this->getWeatherIcon($code)
                ];
            }
        }

        return [
            'temperature' => round($current['temperature_2m'], 1),
            'feels_like' => round($current['apparent_temperature'], 1),
            'humidity' => $current['relative_humidity_2m'],
            'precipitation' => $current['precipitation'],
            'weather_code' => $current['weather_code'],
            'wind_speed' => round($current['wind_speed_10m'], 1),
            'condition' => $this->getWeatherCondition($current['weather_code']),
            'icon' => $this->getWeatherIcon($current['weather_code']),
            'forecast' => $forecast,
            'updated_at' => date('c')
        ];
    }
    
    private function getWeatherCondition($code) {
        $conditions = [
            0 => 'Céu limpo',
            1 => 'Principalmente limpo',
            2 => 'Parcialmente nublado',
            3 => 'Nublado',
            45 => 'Neblina',
            48 => 'Neblina com geada',
            51 => 'Chuvisco leve',
            53 => 'Chuvisco moderado',
            55 => 'Chuvisco intenso',
            61 => 'Chuva leve',
            63 => 'Chuva moderada',
            65 => 'Chuva forte',
            71 => 'Neve leve',
            73 => 'Neve moderada',
            75 => 'Neve forte',
            77 => 'Granizo',
            80 => 'Pancada de chuva leve',
            81 => 'Pancada de chuva moderada',
            82 => 'Pancada de chuva forte',
            95 => 'Tempestade',
            96 => 'Tempestade com granizo leve',
            99 => 'Tempestade com granizo forte'
        ];
        
        return $conditions[$code] ?? 'Desconhecido';
    }
    
    private function getWeatherIcon($code) {
        $icons = [
            0 => '☀️',
            1 => '🌤️',
            2 => '⛅',
            3 => '☁️',
            45 => '🌫️',
            48 => '🌫️',
            51 => '🌦️',
            53 => '🌦️',
            55 => '🌧️',
            61 => '🌧️',
            63 => '🌧️',
            65 => '⛈️',
            71 => '🌨️',
            73 => '🌨️',
            75 => '❄️',
            77 => '🌨️',
            80 => '🌦️',
            81 => '⛈️',
            82 => '⛈️',
            95 => '⛈️',
            96 => '⛈️',
            99 => '⛈️'
        ];
        
        return $icons[$code] ?? '🌤️';
    }
}
