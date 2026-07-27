// app/App.tsx — raiz do painel React.
// @version 2.1.1  @created 2026-07-20
//
// Monta: QueryClient, navegação em duas camadas, roteamento por segmentos e a
// tela ativa. Telas ainda não migradas caem num aviso honesto que direciona
// para a versão legada — nunca numa tela em branco.
//
// v2.1.0 — RESILIÊNCIA DE CHUNK:
//   • ErrorBoundary passou a envolver SÓ o <main> (o conteúdo da rota). O
//     PageHeader e a Navegação ficam FORA — um erro de rota nunca prende a
//     navegação: as abas e a troca de módulo seguem 100% clicáveis.
//   • As rotas usam `lazyComRetry` (1 re-import automático antes de falhar).
//   • `instalarPreloadRecovery()` liga o auto-reload guardado (vite:preloadError);
//     o cleanup remove o listener ao sair do módulo.
//   • `ConteudoRota` limpa a guarda de reload quando uma rota renderiza com
//     sucesso — se a rota lança (chunk faltando) o efeito não roda e a guarda
//     permanece (evita loop de reload).
// v2.1.1 — o ErrorBoundary recebe `key` por rota: um boundary do React não sai
//   sozinho do estado de erro quando os filhos mudam; sem o key, errar numa rota
//   prenderia o <main> no fallback mesmo trocando de aba. O key reseta na troca.
import { Suspense, useEffect, useMemo, type JSX } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient, apiGet, chaves } from '../lib/api';
import { useRota } from '../shell/useRota';
import { GRUPOS, META_TELAS } from '../shell/routing';
import { ErrorBoundary } from '../shell/ErrorBoundary';
import { lazyComRetry } from '../shell/lazyComRetry';
import { instalarPreloadRecovery, limparGuardaReload } from '../shell/preloadRecovery';
import { Navegacao } from '../components/ui/Navegacao';
import { PageHeader } from '../components/ui/PageHeader';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Skeleton, EmptyState } from '../components/ui/Estados';
import type { ShellConfig } from '../shell/types';
import '../styles/tokens.css';
import css from './App.module.css';

// Carregamento sob demanda: cada tela só entra no chunk quando a rota é dela.
// `lazyComRetry` re-importa uma vez em caso de falha transiente antes de propagar.
const Overview = lazyComRetry(() => import('./routes/Overview').then((m) => ({ default: m.Overview })));
const Tabelas  = lazyComRetry(() => import('./routes/Tabelas').then((m)  => ({ default: m.Tabelas })));
const Comparar = lazyComRetry(() => import('./routes/Comparar').then((m) => ({ default: m.Comparar })));
const Bancos   = lazyComRetry(() => import('./routes/Bancos').then((m)   => ({ default: m.Bancos })));
const Conexoes = lazyComRetry(() => import('./routes/Conexoes').then((m) => ({ default: m.Conexoes })));
const Dependencias = lazyComRetry(() => import('./routes/Dependencias').then((m) => ({ default: m.Dependencias })));
const Qualidade    = lazyComRetry(() => import('./routes/Qualidade').then((m)    => ({ default: m.Qualidade })));
const Servidores   = lazyComRetry(() => import('./routes/Servidores').then((m)   => ({ default: m.Servidores })));
const Descoberta   = lazyComRetry(() => import('./routes/Descoberta').then((m)   => ({ default: m.Descoberta })));
const Arvore       = lazyComRetry(() => import('./routes/Arvore').then((m)       => ({ default: m.Arvore })));
const Sensiveis    = lazyComRetry(() => import('./routes/Sensiveis').then((m)    => ({ default: m.Sensiveis })));
const Busca        = lazyComRetry(() => import('./routes/Busca').then((m)        => ({ default: m.Busca })));
const Alertas      = lazyComRetry(() => import('./routes/Alertas').then((m)      => ({ default: m.Alertas })));
const Manutencoes  = lazyComRetry(() => import('./routes/Manutencoes').then((m)  => ({ default: m.Manutencoes })));
const Integracoes  = lazyComRetry(() => import('./routes/Integracoes').then((m)  => ({ default: m.Integracoes })));
const Administracao = lazyComRetry(() => import('./routes/Administracao').then((m) => ({ default: m.Administracao })));

type RotaAtual = ReturnType<typeof useRota>[0];
type IrFn = ReturnType<typeof useRota>[1];

export function App({ config }: { config: ShellConfig }): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <Conteudo config={config} />
    </QueryClientProvider>
  );
}

function Conteudo({ config }: { config: ShellConfig }): JSX.Element {
  const [rota, ir] = useRota();

  // Auto-recuperação de "build novo no meio da sessão": liga o listener de
  // vite:preloadError (reload guardado, no máx. 1x/sessão). O cleanup remove o
  // listener ao desmontar o módulo — não vaza para o resto do app-shell.
  useEffect(() => instalarPreloadRecovery(), []);

  // Badge de alertas na navegação. `enabled` evita disparar antes de montar.
  const alertas = useQuery({
    queryKey: chaves.dashboard,
    queryFn: ({ signal }) => apiGet<{ counters: Record<string, number> }>('/dashboard', undefined, signal),
    select: (d) => d.counters?.active_alerts ?? 0,
  });

  const migradas = useMemo(
    () => new Set(config.flag?.payload?.react_routes ?? ['overview']),
    [config.flag]
  );

  const grupo = GRUPOS.find((g) => g.id === rota.grupo) ?? GRUPOS[0];
  const tela = grupo.telas.find((t) => t.id === rota.tela) ?? grupo.telas[0];
  const migrada = migradas.has(rota.tela) || migradas.has('*');
  const meta = META_TELAS[rota.tela];

  return (
    <div className={css.raiz} data-dt-rota={`${rota.grupo}/${rota.tela}`}>
      {/* PageHeader e Navegação ficam FORA do ErrorBoundary: um erro de rota
          nunca os derruba — a navegação permanece sempre disponível.
          O wrapper .topoFixo mantém breadcrumb + título + abas + sub-abas
          FIXOS (sticky) no topo da área rolável durante o scroll (variante A). */}
      <div className={css.topoFixo}>
        <PageHeader
        trilha={[
          { label: 'DataTables' },
          { label: grupo.rotulo, icone: grupo.icone },
          { label: tela.rotulo },
        ]}
        titulo={meta?.titulo ?? tela.rotulo}
        subtitulo={meta?.subtitulo}
        icone={meta?.icone ?? grupo.icone}
        ambiente={{ label: 'Produção', cor: '#ef4444' }}
        atualizadoEm={alertas.dataUpdatedAt}
        atualizando={alertas.isFetching}
        aoAtualizar={() => queryClient.invalidateQueries({ queryKey: ['dt'] })}
      />

        <Navegacao rota={rota} ir={ir} alertas={alertas.data ?? 0} />
      </div>

      <main className={css.conteudo}>
        {/* Boundary escopado ao conteúdo da rota (v1.1.0/v2.1.0). O `key` por
            rota RESETA o boundary a cada navegação: um ErrorBoundary do React
            não sai sozinho do estado de erro quando os filhos mudam — sem isto,
            errar numa rota prenderia o <main> no fallback mesmo trocando de aba
            (as abas ficam clicáveis, mas o conteúdo não recuperava). */}
        <ErrorBoundary key={`${rota.grupo}/${rota.tela}`} variant="module">
          {migrada ? (
            <Suspense fallback={<Skeleton linhas={5} altura={40} />}>
              <ConteudoRota rota={rota} ir={ir} />
            </Suspense>
          ) : (
            <EmptyState
              icone="Layers"
              titulo={`"${tela.rotulo}" ainda não foi migrada`}
              descricao={
                'Esta tela continua disponível na versão atual do DataTables. ' +
                'A migração acontece por blocos e cada um é validado antes do próximo.'
              }
              acao={
                <button
                  type="button"
                  className={css.botao}
                  onClick={() => {
                    try { localStorage.setItem('dt_force_impl', 'legacy'); } catch { /* ignora */ }
                    window.location.reload();
                  }}
                >
                  Abrir a versão atual
                </button>
              }
            />
          )}
        </ErrorBoundary>
      </main>

      <CommandPalette ir={ir} rotaAtual={`${rota.grupo}/${rota.tela}`} />
    </div>
  );
}

// Switch de rota isolado. O efeito de limpar a guarda só roda quando ESTE
// componente comita — ou seja, quando a rota lazy resolveu e renderizou SEM
// erro. Se a rota lançar (chunk faltando), o ErrorBoundary captura e o efeito
// não roda: a guarda de reload permanece, evitando loop.
function ConteudoRota({ rota, ir }: { rota: RotaAtual; ir: IrFn }): JSX.Element {
  useEffect(() => { limparGuardaReload(); }, [rota.grupo, rota.tela]);

  return (
    <>
      {rota.tela === 'overview'  && <Overview ir={ir} />}
      {rota.tela === 'tree'      && <Arvore />}
      {rota.tela === 'tables'    && <Tabelas />}
      {rota.tela === 'compare'   && <Comparar />}
      {rota.tela === 'databases' && <Bancos />}
      {rota.tela === 'connections'   && <Conexoes />}
      {rota.tela === 'dependencies'  && <Dependencias />}
      {rota.tela === 'quality'       && <Qualidade />}
      {rota.tela === 'servers'       && <Servidores />}
      {rota.tela === 'discovery'     && <Descoberta />}
      {rota.tela === 'sensitive'     && <Sensiveis />}
      {rota.tela === 'search'        && <Busca />}
      {rota.tela === 'alerts'        && <Alertas />}
      {rota.tela === 'maintenance'   && <Manutencoes />}
      {rota.tela === 'integrations'  && <Integracoes />}
      {rota.tela === 'settings'      && <Administracao />}
    </>
  );
}
