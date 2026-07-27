// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-templates
// PURPOSE: Skeleton Manager - Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SKELETON_TYPES from ../constants.js
//
// PROVIDES:
//   SKELETON_TEMPLATES — exported value
//   generateSkeletonHTML() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SKELETON_TYPES } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.skeleton-manager.templates.skeleton-templates';

// ============================================================================
// SKELETON TEMPLATES
// ============================================================================

export const SKELETON_TEMPLATES: Record<string, unknown> = {};

SKELETON_TEMPLATES[SKELETON_TYPES.DASHBOARD] = () => '\
  <div class="dsd-container__skeleton dsd-skeleton-dashboard">\
    <div class="dsd-skeleton-dashboard__header">\
      <div class="dsd-skeleton dsd-skeleton--title" style="width: 200px;"></div>\
      <div class="dsd-skeleton-row">\
        <div class="dsd-skeleton dsd-skeleton--button"></div>\
        <div class="dsd-skeleton dsd-skeleton--button-sm"></div>\
      </div>\
    </div>\
    <div class="dsd-skeleton-dashboard__cards">\
      <div class="dsd-skeleton dsd-skeleton--card"></div>\
      <div class="dsd-skeleton dsd-skeleton--card"></div>\
      <div class="dsd-skeleton dsd-skeleton--card"></div>\
      <div class="dsd-skeleton dsd-skeleton--card"></div>\
    </div>\
    <div class="dsd-skeleton-dashboard__main">\
      <div class="dsd-skeleton dsd-skeleton--chart"></div>\
      <div class="dsd-skeleton-stack">\
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>\
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>\
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>\
      </div>\
    </div>\
  </div>\
';

SKELETON_TEMPLATES[SKELETON_TYPES.TABLE] = (rows: number) => {
  rows = rows || 5;
  let rowsHtml = '';
  for (let i = 0; i < rows; i++) {
    rowsHtml += '\
        <div class="dsd-skeleton-table__row">\
          <div class="dsd-skeleton dsd-skeleton--icon dsd-skeleton-table__cell--sm"></div>\
          <div class="dsd-skeleton dsd-skeleton--text dsd-skeleton-table__cell"></div>\
          <div class="dsd-skeleton dsd-skeleton--text-sm dsd-skeleton-table__cell"></div>\
          <div class="dsd-skeleton dsd-skeleton--badge dsd-skeleton-table__cell--md"></div>\
          <div class="dsd-skeleton dsd-skeleton--button-sm dsd-skeleton-table__cell--sm"></div>\
        </div>\
    ';
  }
  
  return `\
    <div class="dsd-container__skeleton dsd-skeleton-table">\
      <div class="dsd-skeleton-table__header">\
        <div class="dsd-skeleton dsd-skeleton--text-sm dsd-skeleton-table__cell--sm"></div>\
        <div class="dsd-skeleton dsd-skeleton--text dsd-skeleton-table__cell"></div>\
        <div class="dsd-skeleton dsd-skeleton--text dsd-skeleton-table__cell"></div>\
        <div class="dsd-skeleton dsd-skeleton--text-sm dsd-skeleton-table__cell--md"></div>\
        <div class="dsd-skeleton dsd-skeleton--text-sm dsd-skeleton-table__cell--sm"></div>\
      </div>\
      ${rowsHtml}\
    </div>\
  `;
};

SKELETON_TEMPLATES[SKELETON_TYPES.LIST] = (items: unknown) => {
  items = items || 4;
  let itemsHtml = '';
  // @ts-expect-error TS migration - TS2365
  for (let i = 0; (i as number) < items; i++) {
    itemsHtml += '\
        <div class="dsd-skeleton-list__item">\
          <div class="dsd-skeleton dsd-skeleton--avatar"></div>\
          <div class="dsd-skeleton-stack" style="flex: 1;">\
            <div class="dsd-skeleton dsd-skeleton--text" style="width: 60%;"></div>\
            <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 40%;"></div>\
          </div>\
          <div class="dsd-skeleton dsd-skeleton--icon"></div>\
        </div>\
    ';
  }
  
  return `\
    <div class="dsd-container__skeleton dsd-skeleton-list">\
      ${itemsHtml}\
    </div>\
  `;
};

SKELETON_TEMPLATES[SKELETON_TYPES.PROFILE] = () => '\
  <div class="dsd-container__skeleton dsd-skeleton-profile">\
    <div class="dsd-skeleton dsd-skeleton-profile__avatar"></div>\
    <div class="dsd-skeleton-profile__info">\
      <div class="dsd-skeleton dsd-skeleton--title" style="width: 180px;"></div>\
      <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 120px;"></div>\
      <div class="dsd-skeleton dsd-skeleton--paragraph" style="margin-top: 16px;"></div>\
      <div class="dsd-skeleton-row" style="margin-top: 16px;">\
        <div class="dsd-skeleton dsd-skeleton--button"></div>\
        <div class="dsd-skeleton dsd-skeleton--button"></div>\
      </div>\
    </div>\
  </div>\
';

SKELETON_TEMPLATES[SKELETON_TYPES.FORM] = (fields: unknown) => {
  fields = fields || 4;
  let fieldsHtml = '';
  // @ts-expect-error TS migration - TS2365
  for (let i = 0; (i as number) < fields; i++) {
    fieldsHtml += '\
        <div class="dsd-skeleton-form__field">\
          <div class="dsd-skeleton dsd-skeleton--label"></div>\
          <div class="dsd-skeleton dsd-skeleton--input"></div>\
        </div>\
    ';
  }
  
  return `\
    <div class="dsd-container__skeleton dsd-skeleton-form">\
      <div class="dsd-skeleton dsd-skeleton--title" style="width: 200px;"></div>\
      ${fieldsHtml}\
      <div class="dsd-skeleton-form__field">\
        <div class="dsd-skeleton dsd-skeleton--label"></div>\
        <div class="dsd-skeleton dsd-skeleton--textarea"></div>\
      </div>\
      <div class="dsd-skeleton-row" style="justify-content: flex-end; margin-top: 16px;">\
        <div class="dsd-skeleton dsd-skeleton--button"></div>\
        <div class="dsd-skeleton dsd-skeleton--button"></div>\
      </div>\
    </div>\
  `;
};

SKELETON_TEMPLATES[SKELETON_TYPES.CARDS] = (count: number) => {
  count = count || 6;
  let cardsHtml = '';
  for (let i = 0; i < count; i++) {
    cardsHtml += '\
          <div class="dsd-skeleton-stack">\
            <div class="dsd-skeleton dsd-skeleton--image"></div>\
            <div class="dsd-skeleton dsd-skeleton--text" style="width: 80%;"></div>\
            <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 50%;"></div>\
          </div>\
    ';
  }
  
  return `\
    <div class="dsd-container__skeleton">\
      <div class="dsd-skeleton-row" style="justify-content: space-between; margin-bottom: 24px;">\
        <div class="dsd-skeleton dsd-skeleton--title" style="width: 180px;"></div>\
        <div class="dsd-skeleton dsd-skeleton--button-sm"></div>\
      </div>\
      <div class="dsd-skeleton-grid">\
        ${cardsHtml}\
      </div>\
    </div>\
  `;
};

SKELETON_TEMPLATES[SKELETON_TYPES.CHART] = () => '\
  <div class="dsd-container__skeleton">\
    <div class="dsd-skeleton-row" style="justify-content: space-between; margin-bottom: 24px;">\
      <div class="dsd-skeleton dsd-skeleton--title" style="width: 160px;"></div>\
      <div class="dsd-skeleton-row">\
        <div class="dsd-skeleton dsd-skeleton--badge"></div>\
        <div class="dsd-skeleton dsd-skeleton--badge"></div>\
        <div class="dsd-skeleton dsd-skeleton--badge"></div>\
      </div>\
    </div>\
    <div class="dsd-skeleton dsd-skeleton--chart"></div>\
    <div class="dsd-skeleton-row" style="justify-content: center; margin-top: 16px; gap: 24px;">\
      <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 80px;"></div>\
      <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 80px;"></div>\
      <div class="dsd-skeleton dsd-skeleton--text-sm" style="width: 80px;"></div>\
    </div>\
  </div>\
';

SKELETON_TEMPLATES[SKELETON_TYPES.GENERIC] = () => '\
  <div class="dsd-container__skeleton">\
    <div class="dsd-skeleton dsd-skeleton--title"></div>\
    <div class="dsd-skeleton-stack" style="margin-top: 16px;">\
      <div class="dsd-skeleton dsd-skeleton--text"></div>\
      <div class="dsd-skeleton dsd-skeleton--text" style="width: 90%;"></div>\
      <div class="dsd-skeleton dsd-skeleton--text" style="width: 75%;"></div>\
    </div>\
    <div class="dsd-skeleton dsd-skeleton--card" style="margin-top: 24px;"></div>\
  </div>\
';

/**
 * Gera HTML do skeleton
 * @param {string} type
 * @param {Object} params
 * @param {Object} customTemplates
 * @returns {string}
 */
export function generateSkeletonHTML(type: string, params: Record<string, unknown>, customTemplates: unknown) {
  params = params || {};
  customTemplates = customTemplates || {};
  
  const allTemplates = Object.assign({}, SKELETON_TEMPLATES, customTemplates);
  const template = allTemplates[type] || allTemplates[SKELETON_TYPES.GENERIC];
  
  if (typeof template === 'function') {
    return template(params.count || params.rows || params.items || params.fields);
  }
  
  return template;
}

export default {
  SKELETON_TEMPLATES,
  generateSkeletonHTML
};
