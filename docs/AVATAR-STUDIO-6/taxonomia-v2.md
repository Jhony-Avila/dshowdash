# Taxonomia v2 — contrato de preservação, inventário e mapa (mega programa 10 partes)

> Ondas 1361–1371 · decisões #145–#147 · flags `as6.tax_v2` (dep. `as6.acess_hub` → `as6.acess_v2`). Fonte da estrutura: `src/workspace/taxonomia.ts` (registry em DADOS — adicionar categoria = adicionar dado, nunca condicional).

## Contrato de preservação (Parte 1 — INVIOLÁVEL)

1. Taxonomia é METADADO DE NAVEGAÇÃO. Nenhum id de asset, slot, camada, conflito, anchor (viewBox) ou serialização (§619) muda por causa dela.
2. `engine/partes/*` é arte — nunca editado pela taxonomia.
3. `accessory` segue como tipo técnico (categoria `acessorio`, 8 slots #140); a divisão em mães (Cabeça e Rosto, Joias, Costas, Companheiros, Especiais) é visual.
4. Salvo legado NUNCA re-slota (#141); migração de navegação (ex.: coroa → Adornos) não toca no slot.
5. Ferramentas (Estúdio 3D, Presets, Coleções, Conquistas, IA, Vitrine, Histórico, Foto, Missões, Evolução…) NUNCA viram assets; seção própria na navegação (shell) e Modo clássico intocado.
6. Categoria/subcategoria sem arte = `em_breve` (selo) ou `oculta` — nada vazio publicado como completo.
7. Itens fora do briefing (consultor, timeline, versões, tour, som, temporadas…): classificados no doc claude/32 do projeto; nada removido; DESCONHECIDO = preservado.
8. Rollback em camadas: `tax_v2` off → navegação #143+#144 · `acess_hub` off → chips §68.3 · `acess_v2` off → 3 slots #41 — cada camada byte a byte.

## Inventário (baseline 2026-08-11)

Client-side (`engine/partes/`): bases 20 · espécies 16 · cabelos 50 · olhos 40 · bocas 40 · roupas+sobrepeças 30 · acessórios 30 · fundos 20 · molduras 24 · efeitos 24 · auras 15 · banners 15 · emblemas 20 ≈ 304 renderáveis (+ arquétipos/títulos/personalidades/emotes como dados). Banco: 49 categorias · 398 assets · 12 coleções (tabelas `avatar_categories`/`avatar_category_groups`/`avatar_assets` prontas para o registry hidratar do CMS — RUNBOOK-BANCO).

## Estado das 10 partes

| Parte | Estado | Nota |
|---|---|---|
| 1 Auditoria/contrato | ✔ | este doc + claude/32/33 (projeto) |
| 2 Navegação | ✔ | acordeão de mães, subcats na dock, breadcrumb §16, busca global §17 com caminho na paleta (Ctrl+K) |
| 3 Registry/modelo | ✔ núcleo | `taxonomia.ts` (id/estado/ordem/subcats/chipsTema); hidratação via CMS pendente de backend |
| 4 Personagem | ✔ parcial | Rosto/Cabelo/Olhos/Boca + chips por TEMA (dados reais); corpo modular (nariz/sobrancelha/orelha/dentes/mãos/pés) EXIGE ARTE (§108–111) — em_breve |
| 5 Vestuário | ✔ parcial | Roupa (chips por tema)/Sobrepeça; Calçados/Uniformes/Fantasias finas EXIGEM ARTE — em_breve |
| 6 Expressão e Movimento | infra | mãe em_breve; emotes/personalidades/idles seguem no palco/paleta; animação = contrato próprio (não força renderer de roupas) |
| 7 Ambiente | ✔ parcial | Fundo (chips por tema); cenário/clima/hora/câmera são ferramentas do palco (não assets) |
| 8 Identidade Visual | ✔ | Moldura/Banner/Emblema (chips por tema); Aura/Efeitos em Elementos Especiais; IDs/ownership/raridade/favoritos intocados |
| 9 Ferramentas | ✔ | seção na sidebar + paleta rotulada "Ferramenta:"; suíte prova preservação |
| 10 Migração/testes/rollout | ✔ contínua | acessorios-v2 (5 seções), suíte completa, flags, blocos com deploy |

## Mapa de migração de navegação (IDs INTACTOS)

chapeus→Cabeça e Rosto/Coberturas · ace_coroa→Adornos (§8) · oculos/tapa-olhos/headsets-vr→Visão · mascaras→Proteção facial (breve) · rosto-marcas→Modificações · fones→Áudio · brincos→Joias/Orelhas · colares+lencos+gravatas(breve)→Pescoço · insignias→Peito · pulseiras(breve)→Braços · capas→Costas/Capas · mochilas(=jetpack)→Propulsores · asas(breve)→Costas/Asas · aureolas→Especiais/Auréolas · companheiros→Companheiros/Drones · base/cabelo/olhos/boca→Personagem · roupa/roupa_sobre→Vestuário · fundo→Ambiente · efeito/aura→Elementos Especiais · moldura/banner/emblema→Identidade Visual.

## O que destrava as partes restantes (fora do client)

Arte nova (corpo modular, vestuário subdividido, equipamentos, joias finas, máscaras/gravatas/asas/pulseiras, pets/robôs, runas) → subcategorias em_breve já esperam no registry. Backend CMS (RUNBOOK-BANCO) → registry passa a hidratar de `avatar_categories`/`avatar_category_groups`. Animações (P6) → contrato próprio a definir com a arte de movimento.
