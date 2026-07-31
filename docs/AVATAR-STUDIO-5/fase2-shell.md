# AS5 — Fase 2: Novo Shell do Studio (checklist normativo + plano)

**Fontes lidas:** P10 §626 · P1 §§1–9, 12–16, 20–22, 38–39 (índice completo mapeado) · P9 (índice §538–§599; seções aplicadas ao shell: §557–§563).
**Flag de corte:** `as5.novo_shell` (OFF = App atual intacto).

## Checklist de requisitos (§626 + P1)

**Layout 3 painéis (P1 §8):** header interno · sidebar esquerda de categorias (ajustável/colapsável) · VIEWPORT CENTRAL DOMINANTE · painel direito catálogo/inspetor (ajustável, scroll próprio).

- [ ] R1 Viewport dominante (P1 §9): avatar direto na área central (sem card), 70–85% da altura em corpo inteiro, palco em altura integral abaixo do header, fundo variável por modo (neutro/estúdio/grade/cenário/equipado).
- [ ] R2 Reenquadramento automático por categoria (P1 §9.4): mapa categoria→câmera 2D (corpo/busto/rosto/olhos/boca/cabelo/roupa/acessório-por-slot/fundo/moldura/aura/efeito/título) — já temos FOCO_THUMB como semente; vira contrato do shell.
- [ ] R3 Sidebar esquerda redimensionável (P1 §16): arraste com degraus 64/84/176/220/280px; modos compacto (ícones+tooltip)/padrão/confortável; grupos colapsáveis (§18); busca de navegação (§19); persistência por usuário (§607.3 → localStorage nesta fase).
- [ ] R4 Painel direito = workspace (P1 §20–§21): cabeçalho fixo (categoria, contagem, equipado, modos, fechar/expandir), filtros fixos em TABS (§22: Todos|Equipados|Favoritos|Novos|Bloqueados; ordenação Padrão|Raridade|Recentes), área de catálogo com scroll INTERNO, área de propriedades (cor/intensidade/material) quando a categoria pedir, largura ajustável persistida.
- [ ] R5 Scroll independente OBRIGATÓRIO (P1 §38–§39): sidebar/viewport/painel cada um com scroll próprio; shell externo estável; avatar NUNCA sai do foco; barra de rolagem visível + voltar-ao-topo.
- [ ] R6 Barra de salvamento fixa no rodapé da viewport (P1 §15): estados Tudo salvo (✓+hora) / Alterações (contagem+categorias+salvar+descartar+comparar) / Salvando (spinner+trava) / Erro (retry+restaurar) — alimentada pelo AvatarStore (temMudancas/undo/redo).
- [ ] R7 Modo foco (P1 §12): F entra/sai, Esc sai; painéis colapsam; controles flutuam.
- [ ] R8 Modo Studio/cinematográfico (P1 §13): apresentação (ocultar painéis→idle→cenário→aura→efeito→título→captura) — versão mínima nesta fase, riqueza na F9.
- [ ] R9 Header interno (§626) + layout responsivo (P9 §581: painéis viram drawers <1024px).
- [ ] R10 Estados de carregamento/erro (P9 §557–§560): skeletons no catálogo, vazio com ação, erro com retry, offline; error boundary do shell.
- [ ] R11 Undo/redo na UI (P9 §561) + autosave de draft (P9 §562, via EstadoService quando flag ligar) + barra inferior de status (P9 §563).
- [ ] R12 Critério principal §626: o avatar permanece visível durante TODA a exploração do catálogo (teste headless dedicado).

## Plano de incrementos (1 commit cada)

1. **S1 Casca:** `shell/` novo (ShellStudio.tsx + regioes: HeaderInterno, SidebarCategorias, ViewportPalco, PainelCatalogo, BarraSalvamento) atrás da flag; AvatarStore instanciado + adaptadores alimentando o palco 2D atual (AvatarSvg); scroll independente (R5) + larguras persistidas (R3/R4 básico); error boundary.
2. **S2 Viewport dominante:** R1+R2 (enquadramento por categoria com transição), fundo por modo, barra de salvamento R6 ligada ao store (undo/redo R11 UI).
3. **S3 Painel direito completo:** R4 com tabs/ordenação reusando GradeItens por dentro (virtualização simples: paginação por janela), propriedades por categoria (cores no topo P1 §28 mínimo).
4. **S4 Modos:** foco (R7), studio mínimo (R8), responsivo (R9), estados (R10), teste R12 + suíte headless do shell.

## Decisões registradas (#47)

O shell novo REUSA os componentes auditados como MANTER (GradeItens/AvatarSvg/Dica/serviços); App.tsx atual permanece o caminho default até o corte da flag — convivência, não substituição big-bang (coerente com F0/§650). Poses/câmera 2D = transform/viewBox do SVG (zoom+foco), sem renderer novo nesta fase.
