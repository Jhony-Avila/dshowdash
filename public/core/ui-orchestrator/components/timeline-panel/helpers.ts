// Timeline Panel - Helpers Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Funções auxiliares do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-helpers';
const VERSION = '1.0.1-P2-ENTERPRISE';

const formatTimestamp = (date: unknown) => {
    if (!date) return '--:--:--';
    const d = new Date(date as string | number | Date);
    return d.toLocaleTimeString('pt-BR');
};

const generateEventId = () => `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const filterEvents = (events: unknown[], type: string) => {
    if (!type || type === 'all') return events;
    return events.filter((evt: unknown) => (evt as Record<string, unknown>).type === type);
};

const sortEvents = (events: unknown[], order = 'desc') => [...events].sort((a: unknown, b: unknown) => {
    const timeA = new Date((a as Record<string, unknown>).timestamp as string).getTime();
    const timeB = new Date((b as Record<string, unknown>).timestamp as string).getTime();
    return order === 'desc' ? timeB - timeA : timeA - timeB;
});

export { formatTimestamp, generateEventId, filterEvents, sortEvents, MODULE_ID, VERSION };
