// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/builders
// PURPOSE: Builders para criação de skeleton loaders
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   templateConfigs from ./templates.js
//   customTemplates from ./state.js
//   createSkeletonElement from ./elements.js
// EXPORTS:
//   buildShapes — Constrói shapes em container
//   createListItem — Cria item de lista
//   buildTable — Constrói tabela skeleton
//   buildForm — Constrói formulário skeleton
//   createFromTemplate — Cria skeleton a partir de template
// BROWSER APIs: document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderBuilders
 * @description Builders de skeleton loaders
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { templateConfigs } from './templates.js';
import { customTemplates } from './state.js';
import { createSkeletonElement } from './elements.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.builders';

export function buildShapes(container: HTMLElement, shapes: DynObj) {
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        
        if (shape.type === 'column') {
            const col = document.createElement('div');
            col.className = 'skeleton-container';
            if (shape.flex) col.style.flex = shape.flex;
            if (shape.shapes) buildShapes(col, shape.shapes);
            container.appendChild(col);
        } else {
            container.appendChild(createSkeletonElement(shape));
        }
    }
}

export function createListItem(cfg: DynObj) {
    const item = document.createElement('div');
    item.className = cfg.layout === 'row' ? 'skeleton-row' : 'skeleton-container';
    if (cfg.gap) item.style.gap = cfg.gap;
    
    if (cfg.shapes) {
        buildShapes(item, cfg.shapes);
    }
    
    return item;
}

export function buildTable(container: HTMLElement, cfg: DynObj) {
    const header = document.createElement('div');
    header.className = 'skeleton-row';
    header.style.gap = '8px';
    for (let h = 0; h < cfg.cols; h++) {
        const th = createSkeletonElement({ width: '100%', height: cfg.header.height, flex: 1 });
        header.appendChild(th);
    }
    container.appendChild(header);
    
    for (let r = 0; r < cfg.rows; r++) {
        const row = document.createElement('div');
        row.className = 'skeleton-row';
        row.style.gap = '8px';
        row.style.marginTop = '4px';
        for (let c = 0; c < cfg.cols; c++) {
            const td = createSkeletonElement({ width: '100%', height: cfg.rowHeight, flex: 1 });
            row.appendChild(td);
        }
        container.appendChild(row);
    }
}

export function buildForm(container: HTMLElement, cfg: DynObj) {
    for (let i = 0; i < cfg.fields.length; i++) {
        const field = cfg.fields[i];
        const fieldEl = document.createElement('div');
        fieldEl.className = 'skeleton-container';
        fieldEl.style.gap = '4px';
        if (i > 0 && cfg.gap) fieldEl.style.marginTop = cfg.gap;
        
        if (field.label) {
            fieldEl.appendChild(createSkeletonElement({ width: '100px', height: '14px' }));
        }
        if (field.input) {
            fieldEl.appendChild(createSkeletonElement(field.input));
        }
        if (field.button) {
            fieldEl.appendChild(createSkeletonElement(field.button));
        }
        
        container.appendChild(fieldEl);
    }
}

export function createFromTemplate(templateName: string) {
    const cfg = (templateConfigs as DynObj)[templateName] || customTemplates.get(templateName);
    if (!cfg) return null;
    
    const container = document.createElement('div');
    container.className = 'skeleton-container';
    container.setAttribute('data-skeleton-template', templateName);
    
    if (cfg.gap) container.style.gap = cfg.gap;
    
    if (cfg.lines) {
        for (let i = 0; i < cfg.lines.length; i++) {
            container.appendChild(createSkeletonElement(cfg.lines[i]));
        }
    }
    
    if (cfg.shapes) {
        buildShapes(container, cfg.shapes);
    }
    
    if (cfg.repeat && cfg.item) {
        for (let j = 0; j < cfg.repeat; j++) {
            const item = createListItem(cfg.item);
            if (j > 0 && cfg.gap) item.style.marginTop = cfg.gap;
            container.appendChild(item);
        }
    }
    
    if (cfg.header && cfg.rows) {
        buildTable(container, cfg);
    }
    
    if (cfg.fields) {
        buildForm(container, cfg);
    }
    
    return container;
}
