# AS5 — Fase 0: Auditoria Técnica Completa (Parte 10 §604–§605)

**Data:** 2026-07-31 · **Base auditada:** main 7711617 (= produção via branch feat/pipedrive-modulo-completo 006a394)
**Classificação usada (604.6):** MANTER · REFATORAR · SUBSTITUIR · REMOVER · MIGRAR · INVESTIGAR

## 604.1 Front-end

| Elemento | Estado atual | Classificação |
|---|---|---|
| Stack | React 19.2 + TS + Vite 7.3, chunk motor3d isolado (three 0.185 + R3F 9.6 + drei 10.7, 265KB gz lazy), entry 95KB gz | MANTER |
| Estrutura src/ | app(682 LOC) · components(15 arq, 2.541) · domain(163) · engine(459 + 7.389 de partes) · poc3d(9 arq, 1.904) · services(1.644) · styles(1.174) | MANTER (base modular real) |
| App.tsx (shell do painel) | Monólito de layout+estado+abas | SUBSTITUIR na F2 (novo shell viewport-dominante), reaproveitando os componentes |
| Estado | useState locais no App; sem store central, sem undo/redo, sem Command Pattern | SUBSTITUIR na F1 (Avatar State + comandos) |
| Catálogo | Fonte de verdade em TS (AvatarCatalog + engine/partes), banco como espelho de enforcement (homologação TS×banco CONSISTENTE, 392 assets) | REFATORAR na F1 → Asset Registry com banco/API como fonte (§613–§615); TS vira arte procedural referenciada |
| Componentes reaproveitáveis | GradeItens (busca/tiers/favoritos/modos), Vitrine v2, Historico v2, Foto v2, Conquistas v2, Contextos, Dica (portal), AvatarSvg | MANTER |
| Serviços | AvatarService (carga/salvar/histórico/broadcast), VidaService, Progresso (favoritos server-side), Telemetria | MANTER; REFATORAR contratos p/ §624 |
| Event Bus | Inexistente no painel (só BroadcastChannel p/ render publicado) | SUBSTITUIR na F1 (event bus do painel) |
| Feature flags | Inexistentes no painel; o dash TEM panel-feature-flags-admin | INVESTIGAR integração na F1 |
| Funcionalidades inacabadas | Criar com IA (sem chave, compositor local ativo); sockets 3D leva 1 (arte definitiva pendente); morphs de corpo ausentes | manter no roadmap (F8/F5) |

## 604.2 Layout

Header do dash + nav de categorias em grupos (sticky) + palco sticky à esquerda + grade com scroll próprio + barra de salvamento; breakpoints herdados do dash; tooltips por PORTAL no Overlay Root (z-index acima de tudo); aba 3D em canvas com HUD. Débito: palco sticky intercepta cliques em viewport largo (artefato conhecido, produção OK). Classificação geral: SUBSTITUIR na F2 pelo novo shell (§626) preservando padrões que funcionam (portal, sticky do palco como conceito de viewport dominante).

## 604.3 Renderer 2D

SVG em camadas 100% procedural e determinístico (mesma config → mesmo SVG byte a byte, congelarSvg/hashTexto); ordem de camadas fixa (ORDEM_CAMADAS c/ 3 slots aditivos de acessório); recolorização por usaCores; 344 partes TS; thumbnails = mesmo render com viewBox de foco (FOCO_THUMB); foto estilizada via render-foto (medalhão determinístico); sem cache além do natural (leve o suficiente). Resolução: vetorial (SVG), raster só no salvamento (480×480 PNG re-encodado no servidor). Classificação: MANTER (é o ativo mais sólido da base); REFATORAR só os contratos (ParteDef → contrato de asset §613) na F1.

## 604.4 3D atual

6 GLBs CC0 (Quaternius modular ×4 + RobotExpressive + Pug; 2,1MB total; licenças em LICENCAS.md, exigência §43 atendida); rig humanoide consistente (Head/Neck/Torso/Wrist…), animações por clip com crossfade; materiais recoloríveis por slot; morphs faciais no androide; sockets: 14 no contrato + ancoragem AGNÓSTICA DE RIG (leva 1 com 9 itens procedurais); palco vivo (cenários/hora/clima procedurais); qualidade adaptativa (auto-degrada por FPS); retomada de config; captura p/ header. SEM context-loss handling explícito (GuardaErro cobre erro de asset, não perda de contexto WebGL). Classificação: MANTER arquitetura (decisões #31/#41 válidas p/ F5); SUBSTITUIR modelos low-poly pelo corpo premium (UBC #43, gate §631); INVESTIGAR context loss handling na F5 (§ Parte 8).

## 604.5 Backend

| Elemento | Estado | Classificação |
|---|---|---|
| APIs | studio.php (772 — GET estado/historico/fotos, POST camadas/foto/3d/reativar/meta), vida.php+VidaLib (conquistas/eventos/desbloqueios), vitrine.php v2, favoritos.php, catalog.php, admin.php+AdminGate (fail-closed) | MANTER comportamento; REFATORAR studio.php na F1 (extrair validadores; contratos §624; hoje é 1 arquivo multi-modo) |
| Segurança | Config reconstruído campo a campo; SVG whitelist fail-closed; foto re-encodada GD; user_id SEMPRE da sessão; CSRF; rate 30/h; travas de desbloqueio 403 | MANTER (não regressão permitida) |
| Banco | 17 tabelas avatar_* + app_user_avatars (legado, versões/ativo) + avatar_version_meta (nome/fixado); 392 assets; retenção 100 c/ poda protegendo fixadas+ativa | MIGRAR na F1 p/ modelo §609–§615: faltam avatar_profiles, avatar_states, avatar_state_versions, avatar_asset_versions, avatar_asset_files; app_user_avatars→states/versions com compatibilidade §649 |
| Armazenamento | /public/assets/avatars/studio/ (runtime, fora do git); URLs diretas; sem CDN/filas/jobs | INVESTIGAR na F9/P16 (cache/CDN); filas só quando houver demanda real |
| Migrações | runner v1.1.0 (--checar, filtro de seeds); schema novo = passo root explícito (app perdeu CREATE) | MANTER processo |
| Logs | error_log padrão + telemetria de front | REFATORAR na F1 (§652–§656 logs de auditoria) |

## 604.6 + §605 — Saídas

- Mapa de arquitetura atual: este doc + claude/status-do-projeto.md (projeto).
- Débitos: App monólito; sem store/undo/comandos; catálogo TS-como-fonte; studio.php multi-modo; sem event bus/flags no painel; sem context-loss handling; sem avatar_profiles/states; palco sticky × cliques em viewport largo; bundle do FOOTER congelado (fora do escopo AS5, registrado na decisão #46).
- Inventários: assets (392 no banco = TS, homologado), componentes (15 + 9 poc3d), APIs (8 PHP), tabelas (17+2).
- Mapa de estado: config 2D (AvatarConfig+camadas), config3d, EstiloFoto, HistoricoItem, favoritos/unlocks server-side, prefs locais (modo grade, densidade, favoritos Home).
- Baselines LOCAIS: build entry 95,3KB gz + motor3d 265,6KB gz (lazy) + Estudio3D 12,6KB gz; 1º quadro 3D 5–12ms (HUD, SwiftShader); suíte headless 5/5.
- **PENDENTE (lista Jhony, não bloqueia F1):** baseline de FPS/carregamento EM PRODUÇÃO (dispositivo real) e baseline visual (prints) — pedidos junto da validação final.
- Riscos técnicos: migração app_user_avatars (dados vivos — §647/§649 exigem compatibilidade e rollback); dupla frente na branch do servidor (coordenação via merges, decisão #46); modelos 3D premium dependem de asset externo (UBC).
- Plano de migração: F1 cria tabelas novas AO LADO das atuais (aditivo, root só p/ CREATE), backfill idempotente, leitura dual com fallback, corte por feature flag — SEM big bang.

**Critérios §605: ATENDIDOS** (exceto baselines de produção, movidos para a lista final conforme regime da decisão #45).
