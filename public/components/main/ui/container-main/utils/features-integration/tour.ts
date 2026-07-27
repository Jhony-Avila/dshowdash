// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.1-WARN-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: tour
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   metrics, tourManager from ./state.js
//   getCM from ./helpers.js
//   createLogger from ../logger.js
//
// PROVIDES:
//   registerWelcomeTour() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Features Integration - Tour
 * @module features-integration/tour
 * @version 1.1.1-WARN-FIX
 * @changelog v1.1.1-WARN-FIX - TourManager warn→debug (optional feature, not an error)
 * @changelog v1.1.0 - Migrated from console.* to centralized Logger
 */
'use strict';

import { MODULE_ID } from './constants.js';
import { metrics, tourManager } from './state.js';
import { getCM } from './helpers.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.1-WARN-FIX';

const logger = createLogger(`${MODULE_ID}:tour`);

export function registerWelcomeTour() {
  const CM = getCM();
  if (!CM) return;

  tourManager.value = CM.getTourManager ? CM.getTourManager() : null;
  if (!tourManager.value) {
    logger.debug('TourManager not available (optional feature)');
    return;
  }

  const welcomeTour = {
    id: 'welcome',
    name: 'Bem-vindo ao DShowDash',
    description: 'Conheça as principais funcionalidades',
    steps: [
      {
        target: '.dsd-shell__region--nav-rail',
        title: 'Navegação Principal',
        description: 'Use a barra lateral para navegar entre os painéis da aplicação. Clique nos ícones para acessar diferentes seções.',
        position: 'right'
      },
      {
        target: '.dsd-container__header',
        title: 'Cabeçalho do Painel',
        description: 'Aqui você encontra o título do painel atual e os controles de janela.',
        position: 'bottom'
      },
      {
        target: '#features-toolbar',
        title: 'Barra de Ferramentas',
        description: 'Acesse rapidamente: navegação, busca, zoom, favoritos, exportação e acessibilidade.',
        position: 'bottom'
      },
      {
        target: '#ft-btn-search',
        title: 'Busca Rápida',
        description: 'Clique aqui ou pressione Ctrl+F para buscar texto no painel atual.',
        position: 'bottom'
      },
      {
        target: '#ft-btn-command',
        title: 'Paleta de Comandos',
        description: 'Pressione Ctrl+K para abrir a paleta de comandos e acessar todas as funcionalidades rapidamente.',
        position: 'bottom'
      },
      {
        target: '#ft-dropdown-export',
        title: 'Exportar Conteúdo',
        description: 'Exporte o conteúdo do painel como PNG, JPEG, PDF ou SVG.',
        position: 'bottom'
      },
      {
        target: '.dsd-container__content',
        title: 'Área de Conteúdo',
        description: 'Esta é a área principal onde o conteúdo do painel é exibido. Você pode usar scroll para navegar.',
        position: 'top'
      }
    ],
    onComplete() {
      logger.debug('Welcome tour completed');
    }
  };

  try {
    if (tourManager.value.registerTour) {
      (tourManager.value.registerTour as (...args: unknown[]) => unknown)(welcomeTour);
      metrics.toursRegistered++;
      logger.debug('Registered welcome tour');
    }
  } catch (e) {
    metrics.errors++;
    logger.warn('Failed to register welcome tour', { error: (e as Error).message });
  }
}
