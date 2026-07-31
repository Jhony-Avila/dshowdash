// panel-bling/src/app/App.tsx — composição do módulo
// @version 1.1.0  @created 2026-07-30
// @changelog 1.1.0 (Fase 3): cross-filter global, drill-down com recorte, exportação

import React from 'react';
import { TarjaSimulado, CabecalhoPagina, EstadoErro } from '@shared';
import { SubSidebar } from '../shell/SubSidebar';
import { HeaderInterno } from '../shell/HeaderInterno';
import { TelaCatalogo } from '../screens/generic/TelaCatalogo';
import { TELAS_CUSTOM } from '../screens/custom';
import { TELAS_POR_ID } from '../screens/catalog';
import { api, ResumoHeader } from '../services/api';
import { useTelaAtiva, useCarga, useFiltros, salvarFiltros, Filtros, FILTROS_INICIAIS } from './estado';
import { ProvedorSelecao, BarraSelecao, useSelecao, Destino } from './selecao';
import { baixar } from '../lib/exportar';

export function App() {
  return (
    <ProvedorSelecao>
      <Corpo />
    </ProvedorSelecao>
  );
}

function Corpo() {
  const [tela, navegar] = useTelaAtiva();
  // Filtros persistidos: o app-shell remonta o painel a cada troca de hash e
  // `useState` não atravessaria a navegação. Ver nota em estado.ts.
  const [filtros, aoMudarFiltros] = useFiltros();
  const [contaAtiva, setContaAtiva] = React.useState('todas');
  const [gatilhoAtualizar, setGatilhoAtualizar] = React.useState(0);
  const refRaiz = React.useRef<HTMLDivElement>(null);
  const [larguraPainel, setLarguraPainel] = React.useState(1200);
  const selecao = useSelecao();

  // Mede o espaço REAL disponível: a sidebar do app-shell ocupa 312px fixos e
  // não cede, então a largura da janela não diz nada sobre o que sobra aqui.
  React.useEffect(() => {
    if (!refRaiz.current) return;
    const ro = new ResizeObserver(e => {
      const w = e[0]?.contentRect.width ?? 1200;
      if (w > 0) setLarguraPainel(w);
    });
    ro.observe(refRaiz.current);
    return () => ro.disconnect();
  }, []);

  const resumo = useCarga<ResumoHeader>(s => api.headerResumo(s), [gatilhoAtualizar]);
  const contas = useCarga<any>(s => api.contas(s), []);

  const atualizar = React.useCallback(() => setGatilhoAtualizar(g => g + 1), []);

  /**
   * Drill-down (§55): abre a tela JÁ com o recorte que a explica.
   *
   * Levar só a tela é meia entrega — clicar em "notas com erro: 5" e chegar numa
   * lista de 85 notas obriga o usuário a refazer o filtro na mão.
   */
  const abrirDestino = React.useCallback((destino: Destino | string) => {
    const d: Destino = typeof destino === 'string' ? { tela: destino } : destino;
    if (d.filtros) {
      // Zera os filtros de recorte antes de aplicar os novos: herdar o filtro da
      // tela anterior faria a tela de destino abrir com uma interseção que
      // ninguém pediu.
      //
      // Grava DIRETO no armazenamento, sem passar pelo estado: a navegação abaixo
      // faz o shell remontar o painel, e um setState agendado seria descartado
      // antes de virar render. A tela de destino lê o valor já salvo ao montar.
      const novos: Filtros = {
        ...filtros,
        situacao: '', canal: '', deposito: '', fornecedor: '',
        categoria: '', vendedor: '', status: '',
        ...d.filtros,
      };
      salvarFiltros(novos);
      aoMudarFiltros(novos);
    }
    if (d.selecao) selecao.alternar(d.selecao);
    navegar(d.tela);
  }, [navegar, selecao, filtros, aoMudarFiltros]);

  // Badges da sub-sidebar saem do mesmo /header/summary que alimenta o ícone do
  // header do app-shell — um número só, calculado num lugar só.
  const badges = React.useMemo(() => {
    const b: Record<string, number> = {};
    const bd = resumo.dados?.badge;
    if (bd && bd.quantidade > 0) b[bd.tela] = bd.quantidade;
    return b;
  }, [resumo.dados]);

  const simulado = resumo.meta?.simulado ?? true;
  const Custom = tela.custom ? TELAS_CUSTOM[tela.custom] : null;
  const customFaltando = Boolean(tela.custom && !Custom);

  const exportarTela = React.useCallback((formato: 'csv' | 'xlsx' | 'pdf') => {
    if (formato === 'pdf') { window.print(); return; }
    if (!tela.recurso) return;
    baixar(tela.recurso, formato, { ...filtros, ...selecao.comoParametros() });
  }, [tela.recurso, filtros, selecao]);

  const propsTela = {
    tela, filtros, aoMudarFiltros, aoNavegar: abrirDestino, larguraPainel,
    key: `${tela.id}-${gatilhoAtualizar}`,
  };

  return (
    <div
      ref={refRaiz}
      data-bl-root
      data-modulo="bling"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}
    >
      <TarjaSimulado visivel={simulado} />

      <HeaderInterno
        tela={tela}
        contas={contas.dados?.contas ?? []}
        contaAtiva={contaAtiva}
        aoTrocarConta={setContaAtiva}
        estadoConexao={resumo.dados?.estado ?? null}
        ultimaSync={resumo.meta?.ultima_sync ?? null}
        aoAtualizar={atualizar}
        atualizando={resumo.carregando}
        aoNavegar={navegar}
        aoExportar={tela.recurso ? exportarTela : (f => { if (f === 'pdf') window.print(); })}
        exportaDados={Boolean(tela.recurso)}
        larguraPainel={larguraPainel}
      />

      <BarraSelecao />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
        <SubSidebar
          telaAtiva={tela.id}
          aoNavegar={navegar}
          badges={badges}
          larguraPainel={larguraPainel}
        />

        {/* min-width:0 no ITEM do flex, não só na pista: sem isso o grid interno
            empurra a largura e a página inteira passa a rolar na horizontal. */}
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '12px 16px 32px' }}>
          <CabecalhoPagina
            titulo={tela.titulo}
            subtitulo={tela.subtitulo}
            ultimaSync={resumo.meta?.ultima_sync ?? null}
          />

          {customFaltando ? (
            <EstadoErro
              erro={`A tela "${tela.titulo}" declara o componente "${tela.custom}", que não está registrado em screens/custom/index.ts.`}
              quando={new Date().toLocaleString('pt-BR')}
            />
          ) : Custom ? (
            <Custom {...propsTela} />
          ) : tela.recurso ? (
            <TelaCatalogo {...propsTela} />
          ) : (
            <EstadoErro
              erro={`A tela "${tela.titulo}" não declara nem 'custom' nem 'recurso' no catálogo.`}
              quando={new Date().toLocaleString('pt-BR')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
