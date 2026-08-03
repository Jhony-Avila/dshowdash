# AUDITORIA DE LACUNAS do briefing (ciclo AS5-GAPS, iniciado 2026-08-03)

Regra: cada parte nunca-lida-a-fundo ganha um turno — índice + normativas,
classificação (✅ feito · ⚙️ implementável-agora · ⛔ bloqueado-em-quê) e
implementação dos itens de maior valor no próprio turno.

## P4 — Auras, poderes, efeitos, cenários e apresentação (§147–§193) · turno 1

✅ Já coberto: taxonomia de auras (15, famílias do §76) · fundos 2D (20) ·
molduras (24, +raridade §167) · banners (15) · títulos (30) · emblemas (20)
· efeitos (24, §157 parcial) · editor de aura intensidade/velocidade (§71) ·
captura/exportação (F6 §368) · histórico (F4).
⚙️ IMPLEMENTADO NESTE TURNO: §150.1 parâmetro RAIO da aura (0.7–1.3, escala
central 120,120 — framework §71) + §150.2 PRESETS RÁPIDOS (Sutil/Padrão/
Intensa) no painel de propriedades.
⚙️ Implementável em turnos futuros: §174–§175 Showcase cinematográfico 2D
(sequência automática no modo Studio via WAAPI — médio esforço) · §158
gatilhos de efeito (equipar/salvar) · §151 modo reduzido (SMIL off por
prefers-reduced-motion via render estático).
⛔ Bloqueado: §152–§156 poderes/partículas e §159.3–§165 cenários 2.5D/3D,
hora/clima/iluminação REAIS → exigem motor 3D (UBC) e/ou arte nova (F9) ·
§178 sound design → assets de áudio · §177 pós-processamento → 3D.

## P6 — Arquitetura técnica (§261–§318) · turno 2

✅ Já coberto pelo programa F0–F9 (P6 é o espelho técnico do que foi construído):
domínios §263 = EstadoAvatar §607 · engine §264 = contrato §401 + Renderizador2d ·
Avatar State §265 = AvatarStore (draft/preview/undo §282) · Asset Registry/Manifest
§266–267 = registry.php + as5_schema + manifest 3D §517 · eventos §280 = BarramentoEventos ·
feature flags §295 = nucleo/flags fail-safe · observabilidade §290–292 = ObservarNucleo/Telemetria ·
versionamento/migrações §299–300 = runner v1.1 + runbook · APIs §301 = §618/§619 ·
banco §302 = as5_schema · IA §303–304 = FabricaIA + ValidadorIA §636 · testes §311 = suíte 18 + ~90 asserções ·
undo/redo §282 ✓ · segurança §298 = fail-closed/CSRF/sanitizador (regras da casa).
⚙️ IMPLEMENTADO NESTE TURNO: §297 redução de movimento — prefers-reduced-motion
congela o SMIL do palco (render estático; fecha também §151 da P4).
⚙️ Futuro: §285 Motion System unificado (biblioteca WAAPI) · §276 virtualização da
grade (392 itens ainda ok; necessário ao escalar catálogo) · §296 i18n (produto é pt-BR).
⛔ Bloqueado/estratégico: §268–271 pipeline de assets automatizado (ferramentaria
build — junto do UBC) · §278–279 offline/sync real · §293 heatmap · §305 SDK ·
§307–308 plugins/marketplace · §313 CI/CD (infra do Jhony).

## Próximas partes: P9 (15157) → P12 (22676) → P14 (27202) → P17 (33126) → P18 (36006)
