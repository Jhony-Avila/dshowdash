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

## Próximas partes: P6 (8071) → P9 (15157) → P12 (22676) → P14 (27202) → P17 (33126) → P18 (36006)
