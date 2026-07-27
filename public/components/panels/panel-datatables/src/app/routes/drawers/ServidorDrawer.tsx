// app/routes/drawers/ServidorDrawer.tsx — detalhe do servidor em DRAWER (§12/§19).
// @version 1.0.0  @created 2026-07-21
// Abre pelo botão "Detalhes" no card de Servidores. Resumo (da linha) + GAUGE de
// disponibilidade das conexões + bancos hospedados (filtra /databases por servidor).
import { useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api';
import { fmtInt, fmtBytes, fmtRelativo } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { Icone } from '../../../components/ui/Icone';
import { Gauge } from '../../../components/ui/Gauge';
import { Skeleton, EmptyState } from '../../../components/ui/Estados';
import css from './TabelaDrawer.module.css';

export interface ServidorLinha {
  id: number; name: string; hostname: string | null; ip_masked?: string; provider: string | null;
  environment_label: string | null; connection_count: number; conn_online: number; conn_offline: number;
  database_count: number; total_size: number | null; last_check_at: string | null;
}
interface BancoLinha { id: number; name: string; server_name: string | null; size_bytes: number | null; table_count: number }

export function ServidorDrawer({ servidor, aoFechar }: { servidor: ServidorLinha | null; aoFechar: () => void }): JSX.Element {
  const id = servidor?.id ?? null;

  const qDb = useQuery({
    queryKey: ['dt', 'databases', 'porServidor'],
    queryFn: ({ signal }) => apiGet<BancoLinha[]>('/databases', { limit: 500 }, signal),
    enabled: id !== null,
  });

  const bancos = useMemo(() => {
    const arr = qDb.data ?? [];
    return arr.filter((b) => b.server_name && b.server_name === servidor?.name)
              .sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0));
  }, [qDb.data, servidor]);

  const pctOnline = servidor && servidor.connection_count > 0
    ? Math.round((servidor.conn_online / servidor.connection_count) * 100) : null;

  return (
    <Drawer aberto={id !== null} aoFechar={aoFechar}
      titulo={servidor?.name ?? 'Servidor'} subtitulo={servidor?.hostname ?? undefined}
      icone="Server" largura={600}>
      {servidor && (
        <>
          <div className={css.resumo}>
            <Resumo icone="Cable" rotulo="Conexões" valor={fmtInt(servidor.connection_count)} />
            <Resumo icone="Database" rotulo="Bancos" valor={fmtInt(servidor.database_count)} />
            <Resumo icone="HardDrive" rotulo="Volume" valor={fmtBytes(servidor.total_size)} />
            <Resumo icone="Clock" rotulo="Verificado" valor={servidor.last_check_at ? fmtRelativo(servidor.last_check_at) : '—'} />
          </div>
          <div className={css.tags}>
            {servidor.environment_label && <Badge texto={servidor.environment_label} tom="info" icone="Network" />}
            {servidor.provider && <Badge texto={servidor.provider} fraco icone="Boxes" />}
            {servidor.ip_masked && <span className={css.alterada}><Icone nome="Globe" size={11} /> {servidor.ip_masked}</span>}
          </div>

          <DrawerSecao titulo="Disponibilidade das conexões" icone="Activity">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <Gauge valor={pctOnline} max={100} rotulo="Conexões online" tamanho={158} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge texto={`${fmtInt(servidor.conn_online)} online`} tom="ok" icone="CircleCheck" fraco />
                {servidor.conn_offline > 0 && <Badge texto={`${fmtInt(servidor.conn_offline)} fora`} tom="alerta" icone="CircleX" fraco />}
              </div>
            </div>
          </DrawerSecao>

          <DrawerSecao titulo="Bancos neste servidor" icone="Database" contagem={bancos.length}>
            {qDb.isPending ? <Skeleton linhas={4} altura={18} />
              : bancos.length === 0
                ? <EmptyState icone="Database" titulo="Sem bancos vinculados"
                              descricao="Nenhum banco catalogado aponta para este servidor." />
                : <div className={css.lista}>
                    {bancos.map((b) => (
                      <div key={b.id} className={css.linha}>
                        <span className={css.mono}>{b.name}</span>
                        <span className={css.discreto}>{fmtInt(b.table_count)} tab</span>
                        <Badge texto={fmtBytes(b.size_bytes)} fraco />
                      </div>
                    ))}
                  </div>}
          </DrawerSecao>
        </>
      )}
    </Drawer>
  );
}

function Resumo({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.resumoItem}>
      <span className={css.resumoIcone}><Icone nome={icone} size={14} /></span>
      <span className={css.resumoValor}>{valor}</span>
      <span className={css.resumoRotulo}>{rotulo}</span>
    </div>
  );
}
