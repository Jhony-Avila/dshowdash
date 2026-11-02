// Dependency Checker
// @version 4.1.0-FIX-MSG
// @changelog v4.1.0-FIX-MSG: Fix: retorno de globals missing agora inclui missingDependency para mensagem correta no phase-runner
// @changelog v4.0.0-ACTION3: Validação de globais via phase-globals-contract (Ação 3 Briefing)
// @changelog v3.1.0-MODULAR: Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: validateGlobalsAvailable from boot-manifest/phase-globals-contract.js
// RECEIVES (via createDependencyChecker):
//   phaseResults — Map de resultados por phase-id
//   options.resolveGlobal — (name) => truthy/falsy (ex: windowAdapter.get)
//   options.logger — Logger para warnings de deps opcionais ausentes
// PROVIDES: createDependencyChecker(phaseResults, options)
//   .check(phase) — Verifica dependsOn (phase-id) + globais (required/optional)
// BROWSER-APIS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { validateGlobalsAvailable } from '../../../../boot-manifest/phase-globals-contract.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.execution.dependency-checker';

/**
 * Cria um dependency checker que valida:
 * 1. dependsOn — phases anteriores completaram com sucesso
 * 2. Globais required — existem via resolveGlobal (windowAdapter.get)
 * 3. Globais optional — log warning se ausentes (não bloqueia)
 *
 * @param {Object} phaseResults — Map { 'phase-X': { status: 'success'|'recovered'|... } }
 * @param {Object} [options]
 * @param {Function} [options.resolveGlobal] — (name) => truthy se global existe
 * @param {Object} [options.logger] — Logger para warnings
 * @returns {Object} { check(phase) }
 */
interface Phase {
  id: string;
  dependsOn?: string[];
  [key: string]: unknown;
}

interface DependencyCheckerOptions {
  resolveGlobal?: ((name: string) => unknown) | null;
  logger?: Record<string, Function> | null;
}

export function createDependencyChecker(phaseResults: Record<string, { status: string; [key: string]: unknown }>, options: DependencyCheckerOptions) {
  if (options === undefined) options = {};
  const resolveGlobal = options.resolveGlobal || null;
  const logger = options.logger || null;

  return {
    check: function(phase: Phase) {
      // ── 1. Verificação de dependsOn (phase-id) ──
      if (phase.dependsOn && phase.dependsOn.length) {
        for (let i = 0; i < phase.dependsOn.length; i++) {
          const dep = phase.dependsOn[i];
          const depResult = phaseResults[dep];

          if (!depResult || (depResult.status !== 'success' && depResult.status !== 'recovered')) {
            return {
              satisfied: false,
              missingDependency: dep
            };
          }
        }
      }

      // ── 2. Verificação de globais (se resolveGlobal foi fornecido) ──
      if (resolveGlobal && phase.id) {
        const globalsCheck = validateGlobalsAvailable(phase.id, resolveGlobal);

        // 2a. Globais required ausentes → bloqueia execução
        if (!globalsCheck.satisfied) {
          return {
            satisfied: false,
            missingDependency: 'required globals: ' + globalsCheck.missingRequired.join(', '),
            missingGlobals: globalsCheck.missingRequired,
            type: 'required_globals'
          };
        }

        // 2b. Globais optional ausentes → warning (não bloqueia)
        if (globalsCheck.missingOptional.length > 0 && logger) {
          try {
            logger.warn('[dependency-checker] Phase ' + phase.id + ' — optional globals missing: ' + globalsCheck.missingOptional.join(', '));
          } catch (e) {
            // Logger pode falhar em situações degradadas
          }
        }
      }

      return { satisfied: true };
    }
  };
}

export default { createDependencyChecker };
