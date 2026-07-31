// lib/mutations.ts — escrita com atualização otimista e rollback (§60, §61).
// @version 1.0.0  @created 2026-07-30
//
// Arrastar um evento tem de MOVER na hora. Esperar o ida-e-volta faz a grade
// "pular de volta e depois ir", que lê como bug mesmo quando funciona.
//
// O contrato do §60 é o pacote inteiro, não só o pintar-antes:
//   · indicador de salvamento  → toast "salvando"
//   · rollback                 → onError devolve o snapshot
//   · toast                    → sucesso e falha, ambos visíveis
//   · conflito de versão       → 409/412 tratado à parte (§61)
//   · nova tentativa           → a ação de desfazer no toast de erro
// Esconder falha de sincronização é exatamente o que o briefing proíbe.
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { servico } from '../services';
import { ApiError } from './api';
import { useToast } from '../shell/Toasts';
import type { CalendarEvent, EscopoSerie, PayloadEvento } from '../services/types';

/** Todas as caches de evento deste módulo. */
const RAIZ: QueryKey = ['gcal'];

interface CacheEventos { eventos: CalendarEvent[]; total: number }

/**
 * Move/redimensiona um evento com atualização otimista.
 *
 * A mutação toca TODAS as caches de lista que já tenham o evento — a mesma
 * agenda aparece em `/hoje`, `/agenda` e `/proximos`, e corrigir só a visível
 * deixaria as outras mostrando o horário velho até o refetch.
 */
export function useMoverEvento() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (v: {
      evento: CalendarEvent;
      start: string;
      end: string;
      allDay?: boolean;
      escopo?: EscopoSerie;
    }) => servico.updateEvent(v.evento.calendar_id, v.evento.id, {
      start: v.start, end: v.end, all_day: v.allDay ?? v.evento.all_day,
    }, v.escopo ?? 'this'),

    onMutate: async (v) => {
      // Cancela refetch em voo: senão uma resposta antiga sobrescreve o otimista.
      await qc.cancelQueries({ queryKey: RAIZ });

      const anteriores = qc.getQueriesData<CacheEventos>({ queryKey: ['gcal', 'eventos'] });
      const idToast = toast.mostrar('salvando', 'Salvando alteração…');

      for (const [chave, dados] of anteriores) {
        if (!dados?.eventos) continue;
        qc.setQueryData<CacheEventos>(chave, {
          ...dados,
          eventos: dados.eventos.map((e) =>
            e.id === v.evento.id && e.calendar_id === v.evento.calendar_id
              ? { ...e, start: v.start, end: v.end, all_day: v.allDay ?? e.all_day }
              : e),
        });
      }
      return { anteriores, idToast };
    },

    onError: (erro, _v, ctx) => {
      if (ctx?.idToast) toast.fechar(ctx.idToast);
      // Rollback: devolve exatamente o que estava em cada cache.
      ctx?.anteriores.forEach(([chave, dados]) => qc.setQueryData(chave, dados));

      const api = erro instanceof ApiError ? erro : null;
      if (api && (api.status === 409 || api.status === 412)) {
        // §61: alguém mexeu no evento em outra sessão.
        toast.mostrar('erro', 'Este evento mudou em outro lugar. Recarregando a versão atual.');
        void qc.invalidateQueries({ queryKey: RAIZ });
        return;
      }
      toast.mostrar('erro', api?.message ?? 'Não foi possível mover o evento.');
    },

    onSuccess: (_d, _v, ctx) => {
      if (ctx?.idToast) toast.fechar(ctx.idToast);
      toast.mostrar('ok', 'Evento atualizado.');
    },

    onSettled: () => {
      // Sempre reconcilia com o servidor, mesmo no caminho feliz: o backend
      // pode ter ajustado algo (sequence, etag, conflito recalculado).
      void qc.invalidateQueries({ queryKey: RAIZ });
    },
  });
}

/** Criação com toast; sem otimismo — evento novo precisa do id do servidor. */
export function useCriarEvento() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (p: PayloadEvento) => servico.createEvent(p),
    onSuccess: (e) => {
      toast.mostrar('ok', `"${e.summary}" criado.`);
      void qc.invalidateQueries({ queryKey: RAIZ });
    },
    onError: (erro) => {
      const api = erro instanceof ApiError ? erro : null;
      if (api?.status === 422) return;   // o formulário já mostra campo a campo
      toast.mostrar('erro', api?.message ?? 'Não foi possível criar o evento.');
    },
  });
}

/** Resposta a convite, otimista: o clique tem de pintar na hora. */
export function useResponderConvite() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (v: { evento: CalendarEvent; resposta: 'accepted' | 'declined' | 'tentative'; comentario?: string }) =>
      servico.respondInvitation(v.evento.calendar_id, v.evento.id, v.resposta, v.comentario),

    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: RAIZ });
      const anteriores = qc.getQueriesData({ queryKey: RAIZ });
      qc.setQueriesData<CacheEventos>({ queryKey: ['gcal', 'eventos'] }, (d) => {
        if (!d?.eventos) return d;
        return {
          ...d,
          eventos: d.eventos.map((e) =>
            e.id === v.evento.id ? { ...e, my_response: v.resposta } : e),
        };
      });
      return { anteriores };
    },

    onError: (erro, _v, ctx) => {
      ctx?.anteriores.forEach(([chave, dados]) => qc.setQueryData(chave, dados));
      toast.mostrar('erro', erro instanceof ApiError ? erro.message : 'Falha ao responder.');
    },
    onSuccess: (_d, v) => {
      toast.mostrar('ok', {
        accepted: 'Convite aceito.', declined: 'Convite recusado.', tentative: 'Marcado como talvez.',
      }[v.resposta]);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: RAIZ }); },
  });
}
