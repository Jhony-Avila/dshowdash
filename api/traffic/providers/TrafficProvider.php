<?php
/**
 * TrafficProvider - Interface genérica de provedor de trânsito.
 * @version 1.0.0
 * @description Desacopla a aplicação do formato de resposta de qualquer provedor
 *   (TomTom hoje; HERE amanhã). Cada implementação DEVE retornar dados JÁ NORMALIZADOS
 *   nos modelos internos (ver models/TrafficModels.php).
 */

interface TrafficProvider {
    /**
     * @param array $bounds ['north','south','west','east']
     * @return array Lista de TrafficFlowSegment (arrays normalizados)
     */
    public function getTrafficFlow(array $bounds): array;

    /**
     * @param array $bounds ['north','south','west','east']
     * @return array Lista de TrafficIncident (arrays normalizados)
     */
    public function getIncidents(array $bounds): array;

    /** @return string Identificador do provedor ('tomtom'|'here'|'mock') */
    public function name(): string;

    /**
     * Healthcheck leve do provedor.
     * @return array ['status' => 'up'|'down'|'degraded', 'detail' => string]
     */
    public function health(): array;
}
