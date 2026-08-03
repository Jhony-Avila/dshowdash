# AS5 — Fase 1: Fundação Arquitetural — CONCLUÍDA (Parte 10 §606–§625)

**Período:** 2026-07-31 · **Commits:** 1446d272 · 9f0bfac4 · 5a3375d1 · 0d598786 · 29f8df9f · (este)

## Checklist §606.1 — entregáveis centrais

| Entregável | Status | Onde |
|---|---|---|
| Avatar State (domínios §607, fluxo §608) | ✅ | nucleo/estado.ts (AvatarStore) |
| Asset Registry | ✅ | api/avatar/registry.php + services/RegistryService.ts (flag) |
| Contratos de renderer | ✅ | nucleo/contratos.ts (RendererAdapter — render puro) |
| Sistema de categorias/slots | ✅ | SlotId unificado 2D+3D + taxonomia no banco |
| Compatibilidade + regras | ✅ | Regra declarativa §616–§617 + avaliarRegras |
| Command Pattern | ✅ | Comando c/ inverso explícito, pilhas undo/redo |
| Event Bus | ✅ | BarramentoEventos tipado |
| Persistência + versionamento | ✅ | api/avatar/estado.php (§619: lock otimista, versões imutáveis idempotentes, publicar/restaurar) + services/EstadoService.ts (flag) |
| Feature flags | ✅ | nucleo/flags.ts (fail-safe; as5.registry_api / as5.estado_api / as5.novo_shell…) |
| Design Tokens / componentes básicos | ⏩ F2/P15 | tokens atuais servem; o Design System completo é a Parte 15, consumido pelo novo shell |
| Logging / telemetria | ✅ | envelope §624 c/ traceId + error_log; ObservarNucleo (bus→telemetria) |
| Error boundaries | ✅ parcial | GuardaErro (3D) já existia; boundary do shell novo nasce na F2 junto do shell |

## Checklist §606.2 — decisões formais

Identificadores (AssetId prefixado), enums (Raridade/StatusAsset/RendererId/QualidadeTier/PapelArquivo), slots (SLOTS_EQUIPAMENTO), estados/versões (schema_version + checksum), contratos de asset (AssetContrato ↔ §613–§615), política de fallback (flag OFF/erro ⇒ caminho legado SEMPRE), política de cache (no_cache nas APIs de estado; catálogo paginado), política de licença (LICENCAS.md + license_id no banco — CMS na P11).

## Modelo de dados e migração

5 tabelas novas ADITIVAS (§610–§615) em sql/avatar/as5_schema.sql, idempotentes, validadas 2× em MariaDB real. app_user_avatars intocada; adaptadores legado↔domínios prontos (nucleo/adaptadores.ts — roundtrip 2D sem perda testado; 3D parcial POR DECISÃO: roupa/cabeca/mochila ficam no config3d até a F5/P8 definir o modelo 3D). Backfill/corte: atrás das flags nas fases seguintes. **Aplicação no servidor: passo root (lista final).**

## Validação

tsc limpo · teste node do núcleo (26 asserções: store/undo/redo/bus/preview/persistência/checksum/4 regras/roundtrips) · queries do registry e fluxo do estado provados no MariaDB real (perfil lazy, 409 por checksum, idempotência de versão, UNIQUE de duplicata).

## Aberto (transversal, não bloqueia F2)

Integração de flags com o panel-feature-flags-admin do dash (hoje: endpoint opcional + padrões locais) · logs de auditoria §656 completos (hoje: source/created_by nas versões) — evoluem na F9/P16.
