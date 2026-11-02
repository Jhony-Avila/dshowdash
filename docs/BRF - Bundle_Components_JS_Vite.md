# BRIEFING — Bundle de Componentes Críticos JS via Vite (Lote 1)

## 1. Contexto

O bootstrap-v2 foi bundlado com sucesso (148 → 3 requests). Os próximos
gargalos são os componentes carregados no first load:

| Componente       | Requests | Tamanho | Arquivos |
|------------------|----------|---------|----------|
| preloader        | 27       | 69KB    | 47       |
| session-manager  | 18       | 40KB    | 19       |
| error-boundary   | 9        | 26KB    | 9        |
| **Total**        | **54**   | **135KB** | **75** |

Esses componentes são carregados via dynamic import pelo bootstrap durante
as phases de boot. Cada um puxa dezenas de micro-módulos internos em cascata.

## 2. Objetivo

Bundlar cada componente em 1 arquivo JS usando o Vite, reduzindo 54 requests
para 3 (1 bundle por componente).

## 3. Estratégia

Mesmo padrão do bootstrap: Vite como bundler, externals para dependências
fora do componente, output em dist/ dentro de cada componente.

### 3.1 — Preloader (27 requests → 1)
- Entry: /components/preloader/index.js
- Output: /components/preloader/dist/preloader.bundle.js
- External: /core/*, /components/* (exceto /components/preloader/*), /assets/*, /boot/*, /app/*, /modules/*, /platform/*

### 3.2 — Session-Manager (18 requests → 1)
- Entry: /components/session-manager/index.js
- Output: /components/session-manager/dist/session-manager.bundle.js
- External: /core/*, /components/* (exceto /components/session-manager/*), /assets/*, /boot/*, /app/*, /modules/*, /platform/*

### 3.3 — Error-Boundary (9 requests → 1)
- Entry: /components/error-boundary/index.js
- Output: /components/error-boundary/dist/error-boundary.bundle.js
- External: /core/*, /components/* (exceto /components/error-boundary/*), /assets/*, /boot/*, /app/*, /modules/*, /platform/*

## 4. Implementação

### 4.1 — Vite Config Unificado
Criar UM config reutilizável com multi-entry:
/var/www/dshowdash/public/components/vite.components.config.js

O config deve aceitar um parâmetro (env variable ou arg) indicando qual
componente bundlar, OU definir 3 entries separadas.

Alternativa aceitável: 1 config por componente se multi-entry for complexo.

### 4.2 — Build Script
/var/www/dshowdash/public/components/build-components.sh

Deve bundlar os 3 componentes em sequência e reportar resultados.

### 4.3 — Integração com Bootstrap

Os componentes são carregados via dynamic import no bootstrap bundle.
O bootstrap faz: import('/components/preloader/index.js')

Após o bundle, o bootstrap precisa importar os bundles em vez dos index.js.
Há 2 abordagens:

**Opção A (preferida):** Criar um arquivo index.js que re-exporta do bundle:
```js
// components/preloader/index.js (substituído)
export * from './dist/preloader.bundle.js';
```
Assim o bootstrap não precisa mudar — continua importando de index.js.

**Opção B:** Alterar os import paths no bootstrap bundle — mais invasivo.

Usar Opção A.

## 5. Fases de Execução

### FASE 1 — Diagnóstico
1. Mapear imports externos de cada componente
2. Verificar que cada index.js é o entry point real
3. Apresentar diagnóstico antes de criar configs

### FASE 2 — Build
1. Criar config(s) Vite
2. Criar build script
3. Executar builds dos 3 componentes
4. Validar: node --check em cada bundle, tamanho, warnings
5. Apresentar resultados ANTES de integrar

### FASE 3 — Integração
1. Backup dos index.js originais
2. Substituir cada index.js com re-export do bundle (Opção A)
3. Validar no browser: zero erros, navegação funcional
4. Medir requests antes/depois

## 6. O que NÃO fazer
- Não alterar lógica dos componentes
- Não alterar o bootstrap bundle
- Não minificar na primeira versão
- Não remover arquivos fonte
- Não bundlar dependências externas

## 7. Critérios de Aceite
1. 3 bundles gerados em dist/ de cada componente
2. Bootstrap inicia sem erros
3. Requests de components reduzidos de 82 para ~28
4. "All bridges initialized" no console
5. Build script reproduzível

## 8. Rollback
Se falhar: restaurar cada index.js do backup. Bundles são artefatos — fontes intactas.
