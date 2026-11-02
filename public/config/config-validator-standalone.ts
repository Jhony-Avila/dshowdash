// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Uso: npx tsx config-validator-standalone.ts [path-to-config.js]
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   fs from fs
//   path from path
//   fileURLToPath from url
//
// PROVIDES:
//   (none — internal module)
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.window
//   window.APP_CONFIG
// ═══════════════════════════════════════════════════════════════
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface JsonSchema {
    type?: string;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    additionalProperties?: boolean;
    items?: JsonSchema;
    minItems?: number;
    uniqueItems?: boolean;
    pattern?: string;
    minimum?: number;
    maximum?: number;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

interface AppConfig {
    app: { version: string; build: string };
    timeouts: Record<string, number>;
    modules: { cards: string[]; panels: Array<{ id: string; title: string; layout: string; featured: boolean; span: number; enabled: boolean; lazy: boolean }> };
    [key: string]: any;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const VERSION = '2.0.0-P4-ENTERPRISE';
const MODULE_ID = 'config.config-validator-standalone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI sempre mostra output
const _log = (...args: any[]): void => console.debug(...args);
const _error = (...args: any[]): void => console.error(...args);

// Carregar schema
function loadSchema(): JsonSchema {
  const schemaPath = path.join(__dirname, 'schemas', 'app-config.schema.json');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(schemaContent);
}

// Carregar config (simula ambiente browser)
async function loadConfig(configPath: string): Promise<AppConfig> {
  const fullPath = path.resolve(configPath);

  // Simular window.APP_CONFIG
  (global as any).window = {
    APP_CONFIG: null,
    location: { hostname: 'localhost' }
  };

  const module = await import(fullPath);
  return module.default || module.appConfig;
}

// Validar (mesma lógica do browser)
class SimpleValidator {
  private schema: JsonSchema;
  private errors: string[];

  constructor(schema: JsonSchema) {
    this.schema = schema;
    this.errors = [];
  }

  validate(data: unknown): ValidationResult {
    this.errors = [];
    this._validateObject(data as Record<string, unknown>, this.schema, '');
    return {
      valid: this.errors.length === 0,
      errors: this.errors
    };
  }

  private _validateObject(data: Record<string, unknown>, schema: JsonSchema, path: string): void {
    if (schema.type && typeof data !== schema.type && schema.type !== 'integer') {
      this.errors.push(`${path || 'root'}: esperado '${schema.type}', recebido '${typeof data}'`);
      return;
    }

    if (schema.type === 'integer' && !Number.isInteger(data)) {
      this.errors.push(`${path || 'root'}: esperado integer`);
      return;
    }

    if (schema.required) {
      schema.required.forEach(prop => {
        if (!(prop in data)) {
          this.errors.push(`${path}.${prop}: propriedade obrigatória ausente`);
        }
      });
    }

    if (schema.properties) {
      Object.keys(schema.properties).forEach(prop => {
        if (prop in data) {
          const propSchema = schema.properties![prop];
          const propPath = path ? `${path}.${prop}` : prop;

          if (propSchema.type === 'object') {
            this._validateObject(data[prop] as Record<string, unknown>, propSchema, propPath);
          } else if (propSchema.type === 'array') {
            this._validateArray(data[prop] as unknown[], propSchema, propPath);
          } else {
            this._validatePrimitive(data[prop], propSchema, propPath);
          }
        }
      });
    }

    if (schema.additionalProperties === false && schema.properties) {
      const allowed = Object.keys(schema.properties);
      const extra = Object.keys(data).filter(k => !allowed.includes(k));
      extra.forEach(prop => {
        this.errors.push(`${path}.${prop}: propriedade não permitida`);
      });
    }
  }

  private _validateArray(data: unknown[], schema: JsonSchema, path: string): void {
    if (schema.minItems && data.length < schema.minItems) {
      this.errors.push(`${path}: array muito curto (mínimo ${schema.minItems})`);
    }
    if (schema.uniqueItems && new Set(data).size !== data.length) {
      this.errors.push(`${path}: array deve ter itens únicos`);
    }
    if (schema.items) {
      data.forEach((item, i) => {
        if (schema.items!.type === 'object') {
          this._validateObject(item as Record<string, unknown>, schema.items!, `${path}[${i}]`);
        } else {
          this._validatePrimitive(item, schema.items!, `${path}[${i}]`);
        }
      });
    }
  }

  private _validatePrimitive(data: unknown, schema: JsonSchema, path: string): void {
    if (schema.type) {
      const actual = Array.isArray(data) ? 'array' : typeof data;
      const expected = schema.type === 'integer' ? 'number' : schema.type;
      if (actual !== expected) {
        this.errors.push(`${path}: esperado '${schema.type}', recebido '${actual}'`);
      }
    }
    if (schema.pattern && typeof data === 'string') {
      if (!new RegExp(schema.pattern).test(data)) {
        this.errors.push(`${path}: não corresponde ao padrão`);
      }
    }
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        this.errors.push(`${path}: menor que mínimo ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        this.errors.push(`${path}: maior que máximo ${schema.maximum}`);
      }
    }
  }
}

// Main
async function main(): Promise<void> {
  const configPath = process.argv[2] || path.join(__dirname, 'app.config.js');

  _log('🔍 DshowDash Config Validator\n');
  _log(`Config: ${configPath}`);
  _log(`Schema: ${path.join(__dirname, 'schemas/app-config.schema.json')}\n`);

  try {
    // Carregar
    const schema = loadSchema();
    const config = await loadConfig(configPath);

    // Validar
    const validator = new SimpleValidator(schema);
    const result = validator.validate(config);

    if (result.valid) {
      _log('✅ Configuração VÁLIDA\n');
      _log('Propriedades validadas:');
      _log(`  - app.version: ${config.app.version}`);
      _log(`  - app.build: ${config.app.build}`);
      _log(`  - timeouts: ${Object.keys(config.timeouts).length} definidos`);
      _log(`  - modules.cards: ${config.modules.cards.length} cards`);
      _log(`  - modules.panels: ${config.modules.panels.length} panels`);
      process.exit(0);
    } else {
      _log('❌ Configuração INVÁLIDA\n');
      _log('Erros encontrados:\n');
      result.errors.forEach((error, i) => {
        _log(`  ${i + 1}. ${error}`);
      });
      process.exit(1);
    }

  } catch (error: unknown) {
    _error('💥 Erro ao validar:', (error as Error).message);
    process.exit(1);
  }
}

main();
