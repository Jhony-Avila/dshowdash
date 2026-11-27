-- Volta do OBS-001 (revisão do AZUL, 27/11): NUNCA apaga. Renomeia as 2 tabelas (atômico) para __volta_obs001 — o histórico fica guardado.
-- Se já existir uma cópia __volta_obs001 (volta anterior), o RENAME falha e NADA muda: conferir/mover a cópia antiga antes de repetir.
RENAME TABLE `obs_posse` TO `obs_posse__volta_obs001`, `obs_execucao` TO `obs_execucao__volta_obs001`;
