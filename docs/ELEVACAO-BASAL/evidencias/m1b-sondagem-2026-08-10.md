# M1b — Sondagem de imports .ts em runtime + contenção .patch — 2026-08-10 05:39 -03

## P1 — Imports de .ts/.tsx em artefatos servidos (runtime real)
```text
public/bootstrap-v2/kernel/capability-manager.js:6:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/kernel/runtime-context.js:4:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/config.js:1:import { createHealthResult, HEALTH_STATUS } from "./contracts/health-contract.ts";
public/bootstrap-v2/boot-manifest/index.js:37:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/pre-boot/browser-check.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/pre-boot/index.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/module/diagnostics/health-check.js:4:import { createHealthResult, HEALTH_STATUS } from "../../contracts/health-contract.ts";
public/bootstrap-v2/module/debug-mode.js:2:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/module/persistence/boot-persistence.js:1:import { createHealthResult, HEALTH_STATUS } from "../../contracts/health-contract.ts";
public/bootstrap-v2/domain/boot-health-aggregator.js:3:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/manifest-integrity.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/lazy-loader.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/boot-cancellation.js:2:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/circuit-breaker.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/partial-reinit.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/root-cause-analyzer.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/network-detector.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/phase-rollback.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/boot-context.js:12:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/boot-errors.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/domain/module-events.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-4-main.js:11:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-5-ui.js:2:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-6-platform.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-1-core.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-0-critical.js:2:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/phases/phase-2-auth.js:8:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/telemetry/otel-exporter.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/adapters/OpenTelemetryAdapter.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/bootstrap-v2/adapters/environment-adapter.js:1:import { createHealthResult, HEALTH_STATUS } from "../contracts/health-contract.ts";
public/core/runtime/_entry.js:83:} from "./events/catalog/_entry.ts";
public/core/runtime/_entry.js:84:import { VERSION, MODULE_ID, healthCheck } from "./enterprise/strict-mode.ts";
```

**P1 (bloqueio .ts liberado): NAO**

## P2 — Bundles de permissions importam ui-feedback.ts / migration-bridge.ts?
```text
ok (sem .ts): public/components/_shared/permissions/dist/integration.bundle.js
ok (sem .ts): public/components/_shared/permissions/dist/ui-feedback.bundle.js
```

## P3 — /koala/ serve dist compilado (sem .tsx)?
```text
```

## P4 — .patch exposto
```text
public/components/footer/components/registry/index.js.patch
consumidores HTTP de /components/footer/components/registry/index.js (grep em artefatos servidos):
```

> Bloqueio .ts/.tsx adiado: rebuild dos bundles afetados é pré-requisito (estrangulamento §11).

## Smoke pós-contenção
```text
home=200 bundle=200 health=200 patch=200 ts=200  (P1=NAO)
```

> Contenção revertida por falha de validação/smoke.
