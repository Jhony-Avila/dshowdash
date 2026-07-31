// app/App.tsx — shell do módulo: rota, preferências, badges e composição das telas.
// @version 1.0.0  @created 2026-07-29
//
// Roteamento por hash dentro do app-shell: #/panel-google-calendar/<rota>.
// Não usamos react-router — o shell já dona do hash e um segundo roteador
// brigaria com ele; o Pipedrive e o Outlook resolvem do mesmo jeito.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient, chaves } from '../lib/api';
import { servico } from '../services';
import type { CalendarEvent } from '../services/types';
import {
  TELAS, TELA_PADRAO, telaPorRota, PREFS_PADRAO, CHAVE_PREFS,
  type Preferencias, type ShellConfig, type TelaId,
} from '../shell/types';
import { SubSidebar } from '../shell/SubSidebar';
import { HeaderInterno } from '../shell/HeaderInterno';
import { FaixaMock, SkeletonBloco } from '../screens/Estados';
import { ToastProvider } from '../shell/Toasts';
import { Hoje } from '../screens/Hoje';
import { Proximos, Equipe } from '../screens/Listas';
import { Calendarios, Recursos } from '../screens/Calendarios';
import { Convites } from '../screens/Convites';
import { Disponibilidade } from '../screens/Disponibilidade';
import { Conflitos, Alertas } from '../screens/Conflitos';
import { Contas, Sincronizacao, Configuracoes } from '../screens/Admin';
import { EventoDrawer } from '../screens/EventoDrawer';
import { NovoEvento } from '../screens/NovoEvento';
import { fusoDoUsuario, hojeYmd, somaDias } from '../lib/tz';
import { useAtalhos } from '../shell/atalhos';
import '../styles/tokens.css';
import '../styles/base.css';

// Agenda (FullCalendar ~207 kB) e Carga (ECharts) só são baixadas por quem
// abre essas telas — quem fica no dashboard não paga o download. Mesmo padrão
// do panel-pipedrive, que já faz isso com a tela de Agenda em produção.
const Agenda = lazy(() => import('../screens/Agenda').then((m) => ({ default: m.Agenda })));
const Carga = lazy(() => import('../screens/Carga').then((m) => ({ default: m.Carga })));
// Relatórios carrega d3-sankey/d3-force — só para quem abre a tela.
const Relatorios = lazy(() => import('../screens/Relatorios').then((m) => ({ default: m.Relatorios })));

const PREFIXO = '#/panel-google-calendar';

function lerPrefs(): Preferencias {
  try {
    const cru = localStorage.getItem(CHAVE_PREFS);
    if (!cru) return PREFS_PADRAO;
    // Merge com o padrão: preferência salva por uma versão antiga não pode
    // deixar campo novo como undefined e quebrar a tela na leitura.
    return { ...PREFS_PADRAO, ...(JSON.parse(cru) as Partial<Preferencias>) };
  } catch {
    return PREFS_PADRAO;
  }
}

function rotaAtual(): TelaId {
  const h = window.location.hash;
  if (!h.startsWith(PREFIXO)) return TELA_PADRAO;
  const resto = h.slice(PREFIXO.length).replace(/^\//, '').split('?')[0];
  return telaPorRota(resto || undefined);
}

export function App({ config }: { config: ShellConfig }) {
  void config;
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Modulo />
      </ToastProvider>
    </QueryClientProvider>
  );
}

function Modulo() {
  const qc = useQueryClient();
  const [tela, setTela] = useState<TelaId>(rotaAtual);
  const [prefs, setPrefs] = useState<Preferencias>(lerPrefs);
  const [busca, setBusca] = useState('');
  const buscaRef = useRef<HTMLInputElement>(null);
  const [eventoAberto, setEventoAberto] = useState<CalendarEvent | null>(null);
  const [criando, setCriando] = useState<{ inicio: string | null; titulo?: string; emails?: string } | null>(null);

  const tz = prefs.fuso || fusoDoUsuario();

  // Hash <-> estado nos dois sentidos: voltar no navegador tem de funcionar.
  useEffect(() => {
    const onHash = () => setTela(rotaAtual());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navegar = useCallback((id: TelaId) => {
    const t = TELAS.find((x) => x.id === id);
    if (!t) return;
    const alvo = `${PREFIXO}/${t.rota}`;
    if (window.location.hash !== alvo) window.location.hash = alvo;
    setTela(id);
  }, []);

  const mudarPrefs = useCallback((p: Partial<Preferencias>) => {
    setPrefs((atual) => {
      const novo = { ...atual, ...p };
      try { localStorage.setItem(CHAVE_PREFS, JSON.stringify(novo)); } catch { /* modo privado */ }
      return novo;
    });
  }, []);

  const status = useQuery({ queryKey: chaves.status, queryFn: () => servico.getStatus() });
  const calendarios = useQuery({ queryKey: chaves.calendarios, queryFn: () => servico.getCalendars() });

  // Badges da sub-sidebar. Janela curta de propósito: badge é sinal de "agora",
  // não contagem histórica — e o §7.3 pede que não seja só o total de eventos.
  const de = hojeYmd(tz);
  const badgeConvites = useQuery({
    queryKey: chaves.convites({ de, ate: somaDias(de, 14), tz, badge: true }),
    queryFn: () => servico.getInvitations({ de, ate: somaDias(de, 14), tz, categoria: 'aguardando' }),
  });
  const badgeConflitos = useQuery({
    queryKey: chaves.conflitos({ de, ate: somaDias(de, 14), tz, badge: true }),
    queryFn: () => servico.getConflicts({ de, ate: somaDias(de, 14), tz }),
  });
  const badgeAlertas = useQuery({ queryKey: chaves.alertas(null), queryFn: () => servico.getAlerts(null) });

  const badges = useMemo(() => ({
    convites: badgeConvites.data?.convites.length ?? 0,
    conflitos: badgeConflitos.data?.conflitos.filter((c) => c.severidade === 'alta').length ?? 0,
    alertas: badgeAlertas.data?.alertas.filter((a) => a.severidade === 'alta').length ?? 0,
    sync: status.data?.stale_calendars ?? 0,
  }), [badgeConvites.data, badgeConflitos.data, badgeAlertas.data, status.data]);

  const listaCal = calendarios.data ?? [];

  const abrirPorId = useCallback(async (calendarId: string, eventId: string) => {
    try {
      setEventoAberto(await servico.getEvent(calendarId, eventId));
    } catch { /* o drawer simplesmente não abre; a tela de origem segue utilizável */ }
  }, []);

  const papelDoCalendario = useCallback((id: string) =>
    listaCal.find((c) => c.id === id)?.access_role ?? 'reader', [listaCal]);

  const telaAtual = TELAS.find((t) => t.id === tela);

  function conteudo() {
    switch (tela) {
      case 'hoje':
        return <Hoje prefs={prefs} tz={tz} onAbrirEvento={setEventoAberto}
                     onIrPara={navegar} onNovoEvento={() => setCriando({ inicio: null })} />;
      case 'agenda':
        return <Agenda prefs={prefs} tz={tz} busca={busca} calendarios={listaCal}
                       onAbrirEvento={setEventoAberto}
                       onVisaoMudou={(v) => mudarPrefs({ visaoAgenda: v })}
                       onMaisOpcoes={(inicio, parcial) => setCriando({ inicio, ...parcial })} />;
      case 'proximos':
        return <Proximos prefs={prefs} tz={tz} busca={busca} calendarios={listaCal}
                         onAbrirEvento={setEventoAberto} />;
      case 'equipe':
        return <Equipe prefs={prefs} tz={tz} busca={busca} calendarios={listaCal}
                       onAbrirEvento={setEventoAberto} />;
      case 'calendarios':
        return <Calendarios calendarios={listaCal} ocultos={prefs.calendariosOcultos}
                            carregando={calendarios.isLoading} erro={calendarios.error}
                            onRetry={() => void calendarios.refetch()}
                            onToggle={alternarCalendario} />;
      case 'recursos':
        return <Recursos prefs={prefs} tz={tz} onAbrirEvento={setEventoAberto} />;
      case 'convites':
        return <Convites tz={tz} onAbrirEvento={setEventoAberto} />;
      case 'disponibilidade':
        return <Disponibilidade prefs={prefs} tz={tz}
                                onCriarEm={(i) => setCriando({ inicio: i })} />;
      case 'conflitos':
        return <Conflitos tz={tz} onAbrirPorId={abrirPorId} />;
      case 'carga':
        return <Carga tz={tz} prefs={prefs} onAbrirEvento={setEventoAberto} />;
      case 'relatorios':
        return <Relatorios tz={tz} prefs={prefs} />;
      case 'alertas':
        return <Alertas onIrParaSync={() => navegar('sincronizacao')}
                        onIrParaContas={() => navegar('contas')} />;
      case 'contas':
        return <Contas status={status.data} />;
      case 'sincronizacao':
        return <Sincronizacao tz={tz} />;
      case 'configuracoes':
        return <Configuracoes prefs={prefs} tzEfetivo={tz} onMudar={mudarPrefs} />;
      default:
        return null;
    }
  }

  function alternarCalendario(id: string) {
    mudarPrefs({
      calendariosOcultos: prefs.calendariosOcultos.includes(id)
        ? prefs.calendariosOcultos.filter((x) => x !== id)
        : [...prefs.calendariosOcultos, id],
    });
  }

  const atualizando = status.isFetching || calendarios.isFetching;

  useAtalhos(useMemo(() => ({
    irPara: navegar,
    novoEvento: () => setCriando({ inicio: null }),
    focarBusca: () => buscaRef.current?.focus(),
    atualizar: () => void qc.invalidateQueries({ queryKey: ['gcal'] }),
    // Esc fecha a camada mais externa primeiro: modal, depois drawer.
    fechar: () => { if (criando) setCriando(null); else if (eventoAberto) setEventoAberto(null); },
    alternarSidebar: () => mudarPrefs({ sidebarColapsada: !prefs.sidebarColapsada }),
  }), [navegar, qc, criando, eventoAberto, mudarPrefs, prefs.sidebarColapsada]));

  return (
    <div className="gc-root" data-gc-react-root="">
      {status.data?.mock && <FaixaMock mensagem={status.data.message} />}

      <div className="gc-layout">
        <SubSidebar
          ativa={tela}
          colapsada={prefs.sidebarColapsada}
          badges={badges}
          onNavegar={navegar}
          onToggle={() => mudarPrefs({ sidebarColapsada: !prefs.sidebarColapsada })}
        />

        <main className="gc-conteudo">
          <HeaderInterno
            status={status.data}
            calendarios={listaCal}
            ocultos={prefs.calendariosOcultos}
            busca={busca}
            buscaRef={buscaRef}
            atualizando={atualizando}
            subtitulo={telaAtual?.descricao
              ?? 'Gestão integrada de agendas, reuniões, disponibilidade e compromissos.'}
            onBusca={setBusca}
            onToggleCalendario={alternarCalendario}
            onAtualizar={() => void qc.invalidateQueries({ queryKey: ['gcal'] })}
            onNovoEvento={() => setCriando({ inicio: null })}
            onConfiguracoes={() => navegar('configuracoes')}
          />

          <div className="gc-scroll">
            <Suspense fallback={<SkeletonBloco linhas={9} altura={30} />}>
              {conteudo()}
            </Suspense>
          </div>
        </main>

        {eventoAberto && (
          <EventoDrawer
            evento={eventoAberto}
            tz={tz}
            prefs={prefs}
            papelCalendario={papelDoCalendario(eventoAberto.calendar_id)}
            podeEscrever={['owner', 'writer'].includes(papelDoCalendario(eventoAberto.calendar_id))}
            onFechar={() => setEventoAberto(null)}
          />
        )}
      </div>

      {criando && (
        <NovoEvento
          calendarios={listaCal}
          tz={tz}
          inicioSugerido={criando.inicio}
          tituloInicial={criando.titulo}
          emailsIniciais={criando.emails}
          onFechar={() => setCriando(null)}
        />
      )}
    </div>
  );
}
