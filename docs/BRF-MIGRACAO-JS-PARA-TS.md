# BRIEFING — MIGRAÇÃO PROGRESSIVA JS → TypeScript
# Projeto DShowDash | Agent_01

**Data:** 2026-02-25
**Versão:** 1.0.0
**Autor:** Jhony + Claude (Planejamento)
**Executor:** agent_01 (Claude Code)
**Status:** PRONTO PARA EXECUÇÃO

---

## 1. OBJETIVO

Migrar progressivamente arquivos `.js` para `.ts` / `.tsx` no projeto DShowDash, começando pela camada `app/` (90 arquivos) que já está em ES6 puro e bem estruturada. A migração deve ser incremental, sem quebrar nada, e gerar ganho em escala através de padronização.

---

## 2. CONTEXTO DO PROJETO

| Item | Valor |
|------|-------|
| Servidor | srv920234.hstgr.cloud |
| Diretório | /var/www/dshowdash |
| Node.js | v20.20.0 |
| Total arquivos JS | 6.186 |
| Arquivos com ES6 modules | 6.142 |
| Arquivos com JSDoc | 298 |
| Arquivos .ts existentes | 1 (sidebar.d.ts — referência de qualidade) |
| Área inicial (app/) | 90 arquivos JS |
| package.json | NÃO EXISTE — criar |
| tsconfig.json | NÃO EXISTE — criar |
| Vite | NÃO INSTALADO — instalar |
| TypeScript | NÃO INSTALADO — instalar |

---

## 3. ESTRATÉGIA: MIGRAÇÃO GRADUAL (allowJs: true)

A abordagem é **coexistência JS + TS** usando `allowJs: true` no tsconfig. Isso permite:
- Converter arquivo por arquivo sem quebrar imports cruzados
- JS existente continua funcionando normalmente
- TS novo ganha tipagem e autocompletar
- Zero risco de regressão

---

## 4. PRÉ-REQUISITOS (FASE 0 — INFRAESTRUTURA)

### 4.1 Criar package.json

```bash
cd /var/www/dshowdash
cat << 'EOF' > package.json
{
  "name": "dshowdash",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  }
}
EOF
```

### 4.2 Instalar dependências

```bash
cd /var/www/dshowdash
npm install --save-dev typescript vite @vitejs/plugin-react
npm install --save-dev @types/node
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
```

### 4.3 Criar tsconfig.json

```bash
cat << 'EOF' > /var/www/dshowdash/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationDir": "./types",
    "baseUrl": ".",
    "paths": {
      "@app/*": ["app/*"],
      "@core/*": ["public/core/*"],
      "@components/*": ["public/components/*"],
      "@platform/*": ["public/platform/*"],
      "@assets/*": ["public/assets/*"]
    }
  },
  "include": [
    "app/**/*.ts",
    "app/**/*.tsx",
    "app/**/*.js",
    "public/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "backup",
    "storage"
  ]
}
EOF
```

**NOTA:** `strict: false` no início. Após a Fase 1 completa, ativar gradualmente:
1. `noImplicitAny: true`
2. `strictNullChecks: true`
3. `strict: true` (meta final)

### 4.4 Criar vite.config.ts

```bash
cat << 'EOF' > /var/www/dshowdash/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@core': path.resolve(__dirname, 'public/core'),
      '@components': path.resolve(__dirname, 'public/components'),
      '@platform': path.resolve(__dirname, 'public/platform'),
      '@assets': path.resolve(__dirname, 'public/assets')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
EOF
```

### 4.5 Validação da Fase 0

```bash
npx tsc --version
npx tsc --noEmit 2>&1 | head -20
```

Se `tsc --noEmit` retorna zero erros (ou apenas warnings de JS), a infraestrutura está pronta.

---

## 5. FASES DE MIGRAÇÃO

### FASE 1 — app/shared/ e app/contracts/ (FUNDAÇÃO)
**Prioridade:** MÁXIMA — estes arquivos definem tipos usados por todo o app.

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 1.1 | app/shared/types/index.js | Renomear → .ts, converter Object.freeze → `enum` ou `as const` | Baixa |
| 1.2 | app/shared/utils/index.js | Renomear → .ts, tipar funções | Baixa |
| 1.3 | app/shared/index.js | Renomear → .ts, reexports tipados | Baixa |
| 1.4 | app/contracts/dto/index.js | Renomear → .ts, criar interfaces DTOs | Média |
| 1.5 | app/events/events-contracts.js | Renomear → .ts, tipar contratos de eventos | Média |
| 1.6 | app/events/index.js | Renomear → .ts | Baixa |

**Meta:** 6 arquivos. Criar a base de tipos que será consumida por todas as fases seguintes.

### FASE 2 — app/core/ (INFRAESTRUTURA)
**Prioridade:** ALTA — logger, event-bus, config, telemetry.

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 2.1 | app/core/logger/index.js | → .ts, tipar getLogger/log/info/warn/error | Baixa |
| 2.2 | app/core/event-bus/index.js | → .ts, tipar on/off/emit com generics | Média |
| 2.3 | app/core/config/index.js | → .ts, tipar AppConfig interface | Baixa |
| 2.4 | app/core/telemetry-core/index.js | → .ts | Baixa |
| 2.5 | app/core/index.js | → .ts, barrel reexport tipado | Baixa |

**Meta:** 5 arquivos.

### FASE 3 — app/auth/ e app/permissions/ (SEGURANÇA)
**Prioridade:** ALTA — tipagem forte previne bugs de segurança.

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 3.1 | app/auth/auth-events.js | → .ts | Baixa |
| 3.2 | app/auth/token-manager.js | → .ts, interface TokenPayload | Média |
| 3.3 | app/auth/session-manager.js | → .ts, interface SessionData | Média |
| 3.4 | app/auth/index.js | → .ts | Baixa |
| 3.5 | app/permissions/permissions-guard.js | → .ts | Média |
| 3.6 | app/permissions/routes-access.js | → .ts | Média |
| 3.7 | app/permissions/index.js | → .ts | Baixa |

**Meta:** 7 arquivos.

### FASE 4 — app/global-state/ (ESTADO)

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 4.1 | app/global-state/slices/app.js | → .ts, interface AppSlice | Média |
| 4.2 | app/global-state/slices/session.js | → .ts | Média |
| 4.3 | app/global-state/slices/permissions.js | → .ts | Média |
| 4.4 | app/global-state/slices/layouts.js | → .ts | Baixa |
| 4.5 | app/global-state/slices/flags.js | → .ts | Baixa |
| 4.6 | app/global-state/slices/index.js | → .ts | Baixa |
| 4.7 | app/global-state/index.js | → .ts | Baixa |

**Meta:** 7 arquivos.

### FASE 5 — app/router/ (NAVEGAÇÃO)

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 5.1 | app/router/contracts.js | → .ts, interfaces de rota | Média |
| 5.2 | app/router/navigation.js | → .ts | Média |
| 5.3 | app/router/lifecycle.js | → .ts | Média |
| 5.4 | app/router/utils.js | → .ts | Baixa |
| 5.5 | app/router/integrations.js | → .ts | Baixa |
| 5.6 | app/router/diagnostics.js | → .ts | Baixa |
| 5.7 | app/router/index.js | → .ts | Baixa |

**Meta:** 7 arquivos.

### FASE 6 — app/adapters/ (INTEGRAÇÕES)

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 6.1 | app/adapters/http/index.js | → .ts, interface HttpClient | Média |
| 6.2 | app/adapters/backend/index.js | → .ts | Média |
| 6.3 | app/adapters/telemetry/index.js | → .ts | Baixa |
| 6.4 | app/adapters/index.js | → .ts | Baixa |

**Meta:** 4 arquivos.

### FASE 7 — app/sessions/, app/pages/, app/login-modal/, app/preloader/, app/app-shell/

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 7.1 | app/sessions/sessions-api.js | → .ts | Média |
| 7.2 | app/sessions/index.js | → .ts | Baixa |
| 7.3 | app/pages/system-pages.js | → .ts | Baixa |
| 7.4 | app/login-modal/index.js | → .ts | Baixa |
| 7.5 | app/preloader/index.js | → .ts | Baixa |
| 7.6 | app/app-shell/index.js | → .ts | Baixa |

**Meta:** 6 arquivos.

### FASE 8 — app/ui/ (COMPONENTES — candidatos a .tsx)

Esta fase é a maior e onde React + TSX entram em ação.

| Subpasta | Arquivos | Ação |
|----------|----------|------|
| app/ui/layout/ (header, footer, sidebar, main) | 5 | → .tsx se renderizam DOM, .ts se orquestram |
| app/ui/cards/ (card-01 a card-12) | 13 | → .tsx (componentes visuais) |
| app/ui/panels/ (panel-01 a panel-19 + especiais) | 27 | → .tsx (componentes visuais) |
| app/ui/primitives/ | 1 | → .ts |
| app/ui/index.js | 1 | → .ts |

**Meta:** 47 arquivos.

**Critério .ts vs .tsx:**
- Se o arquivo **cria elementos DOM** (createElement, innerHTML, render) → `.tsx`
- Se o arquivo apenas **orquestra/exporta** → `.ts`
- Na dúvida → `.ts` (pode mudar depois)

---

## 6. TOTAIS

| Fase | Área | Arquivos | Complexidade |
|------|------|----------|-------------|
| 0 | Infraestrutura | 4 configs | Setup |
| 1 | shared + contracts + events | 6 | Baixa |
| 2 | core | 5 | Baixa-Média |
| 3 | auth + permissions | 7 | Média |
| 4 | global-state | 7 | Média |
| 5 | router | 7 | Média |
| 6 | adapters | 4 | Média |
| 7 | sessions, pages, etc. | 6 | Baixa |
| 8 | ui (cards, panels, layout) | 47 | Alta |
| **TOTAL** | | **89 arquivos** | |

---

## 7. PROTOCOLOS OBRIGATÓRIOS

### 7.1 PNR (Protocolo de Não Regressão)
- Toda mudança é progressão comprovada
- Não quebrar contratos existentes
- Não quebrar imports de arquivos JS que consomem os arquivos migrados

### 7.2 Backup Obrigatório
Antes de cada fase:
```bash
FASE="fase_N"
TS=$(date +"%Y%m%d_%H%M%S")
mkdir -p /backup/ts_migration_${FASE}_${TS}
cp -r /var/www/dshowdash/app/<subpasta> /backup/ts_migration_${FASE}_${TS}/
```

### 7.3 Processo por Arquivo

Para CADA arquivo:

1. **Backup** do original
2. **Ler o arquivo completo** — entender toda a lógica
3. **Renomear** `.js` → `.ts` (ou `.tsx`)
4. **Adicionar tipos** — interfaces, parâmetros, retornos
5. **Validar** com `npx tsc --noEmit`
6. **Verificar** que imports de outros arquivos JS continuam funcionando
7. **Registrar** no log: `/home/agent_01/logs/ts-migration.log`

### 7.4 Regras de Tipagem

- **NÃO usar `any`** exceto em interoperabilidade forçada com window.* legado
- **Preferir `unknown`** quando o tipo não é certo
- **Criar interfaces** para objetos com formato definido
- **Usar `as const`** para objetos frozen (substituir Object.freeze)
- **Usar union types** para strings limitadas (ex: status, themes)
- **Usar generics** em funções de coleção/utilidade
- **Referenciar sidebar.d.ts** como padrão de qualidade

### 7.5 Padrão de Conversão: Object.freeze → as const

```typescript
// ANTES (JS)
export const STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
});

// DEPOIS (TS)
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];
// Resultado: 'idle' | 'loading' | 'success' | 'error'
```

### 7.6 Padrão de Conversão: Funções

```typescript
// ANTES (JS)
export function log(level, message, context = {}) {
  // ...
}

// DEPOIS (TS)
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  // ...
}
```

### 7.7 Compatibilidade com JS existente

Arquivos JS que importam de arquivos migrados **continuam funcionando** porque:
- `allowJs: true` está ativo no tsconfig
- Vite resolve `.ts` e `.js` transparentemente
- Os exports permanecem idênticos

Para garantir, após cada renomeação, verificar:
```bash
# Buscar quem importa do arquivo migrado
grep -rn "from.*app/shared/types" /var/www/dshowdash/app/ /var/www/dshowdash/public/ --include="*.js" 2>/dev/null
```

Se houver imports com extensão `.js` explícita, atualizar para sem extensão ou com `.ts`.

---

## 8. VALIDAÇÃO POR FASE

Após cada fase completa:

```bash
# 1. TypeScript check
cd /var/www/dshowdash && npx tsc --noEmit 2>&1 | tail -5

# 2. Contagem de progresso
echo "=== PROGRESSO ===" && \
TS_COUNT=$(find /var/www/dshowdash/app -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l) && \
JS_COUNT=$(find /var/www/dshowdash/app -name "*.js" | grep -v node_modules | wc -l) && \
TOTAL=$((TS_COUNT + JS_COUNT)) && \
echo "TS/TSX: $TS_COUNT | JS restante: $JS_COUNT | Total: $TOTAL | Progresso: $((TS_COUNT * 100 / TOTAL))%"

# 3. Registrar no log
echo "[$(date -Iseconds)] Fase N concluída - $TS_COUNT arquivos TS" >> /home/agent_01/logs/ts-migration.log
```

---

## 9. ORDEM DE EXECUÇÃO

```
FASE 0 (Infraestrutura) → FASE 1 (Types/Contracts) → FASE 2 (Core) →
FASE 3 (Auth) → FASE 4 (State) → FASE 5 (Router) →
FASE 6 (Adapters) → FASE 7 (Misc) → FASE 8 (UI/TSX)
```

**Cada fase só inicia após a anterior estar 100% validada.**

---

## 10. CRITÉRIOS DE SUCESSO

- [ ] Infraestrutura TS + Vite + React instalada e funcional
- [ ] `npx tsc --noEmit` retorna zero erros
- [ ] 89 arquivos de app/ migrados para .ts/.tsx
- [ ] Zero regressão — app funciona normalmente no navegador
- [ ] Tipos exportados são consumíveis por outros módulos
- [ ] Log de migração completo em /home/agent_01/logs/ts-migration.log
- [ ] Backup de cada fase em /backup/ts_migration_*

---

## 11. COMANDO PARA INICIAR O AGENTE

```bash
/root/run_agent.sh agent_01 "Leia o briefing /var/www/dshowdash/docs/BRF-MIGRACAO-JS-PARA-TS.md e execute a migração. Comece pela FASE 0 (infraestrutura): crie package.json, instale dependências, crie tsconfig.json e vite.config.ts. Valide que tsc --noEmit funciona. Depois execute FASE 1 (app/shared e app/contracts). Siga os protocolos PNR e de backup. Registre progresso em /home/agent_01/logs/ts-migration.log. Comunique-se sempre em português. Execute todas as fases sequencialmente sem parar."
```

---

## 12. ESCOPO FUTURO (PÓS app/)

Após a conclusão das 8 fases acima, o próximo alvo será:
1. `public/core/` — 237 arquivos (runtime, events, auth, contracts)
2. `public/platform/` — 52 arquivos
3. `public/bootstrap-v2/` — 208 arquivos
4. `public/components/` — 5.548 arquivos (maior esforço, pode ser automatizado em batches)

Esses escopos serão detalhados em briefings dedicados após a conclusão deste.

---

**FIM DO BRIEFING — MIGRAÇÃO JS → TypeScript v1.0.0**

*Documento gerado em: 2026-02-25*
*Status: PRONTO PARA EXECUÇÃO*
*Localização: /var/www/dshowdash/docs/BRF-MIGRACAO-JS-PARA-TS.md*
