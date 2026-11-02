// P14 - Action Capture Runtime (60s)
// Cole este código no DevTools Console
// @version 1.0.0

(function P14_ActionCapture() {
  const DURATION = 60000; // 60 segundos
  const stats = {
    startTime: new Date().toISOString(),
    duration: '60s',
    events: {
      'ui:action': {},
      'action:accepted': {},
      'action:rejected': {},
      'action:unknown': {},
      'action:error': {}
    },
    totals: {
      'ui:action': 0,
      'action:accepted': 0,
      'action:rejected': 0,
      'action:unknown': 0,
      'action:error': 0
    }
  };

  const listeners = [];
  const eventBus = window.EventBus;

  if (!eventBus) {
    console.error('[P14] EventBus não encontrado!');
    return;
  }

  console.log('[P14] 🎯 Captura iniciada - clique nos botões por 60 segundos...');

  // Registrar listeners para cada tipo de evento
  Object.keys(stats.events).forEach(eventType => {
    const handler = (payload) => {
      const actionId = payload?.actionId || payload?.action || 'unknown';
      stats.events[eventType][actionId] = (stats.events[eventType][actionId] || 0) + 1;
      stats.totals[eventType]++;
      
      // Log em tempo real para eventos problemáticos
      if (eventType === 'action:error') {
        console.error(`[P14] ❌ ERROR: ${actionId}`, payload);
      } else if (eventType === 'action:unknown') {
        console.warn(`[P14] ⚠️ UNKNOWN: ${actionId}`, payload);
      } else if (eventType === 'action:rejected') {
        console.warn(`[P14] 🚫 REJECTED: ${actionId}`, payload);
      }
    };

    if (typeof eventBus.on === 'function') {
      eventBus.on(eventType, handler);
      listeners.push({ event: eventType, handler });
    } else if (typeof eventBus.subscribe === 'function') {
      const unsub = eventBus.subscribe(eventType, handler);
      listeners.push({ unsub });
    }
  });

  // Timer de progresso
  let elapsed = 0;
  const progressInterval = setInterval(() => {
    elapsed += 10;
    if (elapsed % 10 === 0) {
      console.log(`[P14] ⏱️ ${elapsed}s - ui:action=${stats.totals['ui:action']} accepted=${stats.totals['action:accepted']} errors=${stats.totals['action:error']}`);
    }
  }, 10000);

  // Finalizar após DURATION
  setTimeout(() => {
    clearInterval(progressInterval);
    
    // Remover listeners
    listeners.forEach(l => {
      if (l.unsub) l.unsub();
      else if (eventBus.off) eventBus.off(l.event, l.handler);
    });

    stats.endTime = new Date().toISOString();

    // Gerar relatório
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('           P14 - RELATÓRIO DE CAPTURA (60s)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 TOTAIS:');
    console.table(stats.totals);
    console.log('');

    // Ordenar por prioridade: error > rejected > unknown
    const problems = [];
    
    Object.entries(stats.events['action:error']).forEach(([id, count]) => {
      problems.push({ actionId: id, type: 'ERROR', count, priority: 1 });
    });
    Object.entries(stats.events['action:rejected']).forEach(([id, count]) => {
      problems.push({ actionId: id, type: 'REJECTED', count, priority: 2 });
    });
    Object.entries(stats.events['action:unknown']).forEach(([id, count]) => {
      problems.push({ actionId: id, type: 'UNKNOWN', count, priority: 3 });
    });

    problems.sort((a, b) => a.priority - b.priority || b.count - a.count);

    if (problems.length > 0) {
      console.log('🔴 PROBLEMAS ENCONTRADOS (ordenado por prioridade):');
      console.table(problems);
    } else {
      console.log('✅ Nenhum problema encontrado!');
    }

    console.log('');
    console.log('📋 ACTIONS ACEITAS:');
    console.table(stats.events['action:accepted']);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 JSON COMPLETO (copie se necessário):');
    console.log(JSON.stringify(stats, null, 2));
    console.log('═══════════════════════════════════════════════════════════');

    // Expor globalmente para inspeção
    window.P14_LAST_CAPTURE = stats;
    console.log('');
    console.log('💡 Acesse window.P14_LAST_CAPTURE para inspecionar os dados');

  }, DURATION);

  console.log('[P14] ⏳ Aguardando 60 segundos... Clique nos botões agora!');
})();
