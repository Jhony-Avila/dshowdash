// nucleo/estado.ts — AVATAR STATE: store + Command Pattern + Event Bus (AS5 F1).
// @version 1.0.0  @created 2026-07-31
//
// Fonte ÚNICA de verdade (§608): persisted → draft → preview; UI, renderer
// e persistência derivam DAQUI. Toda mutação passa por COMANDO com inverso
// explícito (undo/redo de graça, trilha de auditoria de graça). Zero
// dependências: funciona em React (useSyncExternalStore), em testes node e
// em qualquer renderer. Estado temporário (§607.2) NUNCA entra aqui — vive
// nos componentes.
import type { EstadoAvatar } from './contratos';
import { checksumEstado, estadoVazio } from './contratos';

// ── Event Bus tipado (§606.1) ───────────────────────────────────────

export interface MapaEventos {
  'estado:mudou': { origem: string; checksum: string };
  'comando:executado': { nome: string; podeDesfazer: boolean };
  'comando:desfeito': { nome: string };
  'comando:refeito': { nome: string };
  'draft:descartado': Record<string, never>;
  'persistencia:salva': { versao: number };
}

type Ouvinte<K extends keyof MapaEventos> = (dados: MapaEventos[K]) => void;

export class BarramentoEventos {
  private ouvintes = new Map<keyof MapaEventos, Set<Ouvinte<keyof MapaEventos>>>();

  em<K extends keyof MapaEventos>(evento: K, fn: Ouvinte<K>): () => void {
    if (!this.ouvintes.has(evento)) this.ouvintes.set(evento, new Set());
    this.ouvintes.get(evento)!.add(fn as Ouvinte<keyof MapaEventos>);
    return () => { this.ouvintes.get(evento)?.delete(fn as Ouvinte<keyof MapaEventos>); };
  }

  emitir<K extends keyof MapaEventos>(evento: K, dados: MapaEventos[K]): void {
    this.ouvintes.get(evento)?.forEach((fn) => {
      try { fn(dados); } catch { /* ouvinte com erro nunca derruba o bus */ }
    });
  }
}

// ── Command Pattern (§606.1) ────────────────────────────────────────

export interface Comando {
  nome: string;
  /** aplica a mudança e retorna o estado NOVO (imutável). */
  executar(estado: EstadoAvatar): EstadoAvatar;
  /** inverso EXPLÍCITO — comandos sem inverso não entram na pilha de undo. */
  desfazer?(estado: EstadoAvatar): EstadoAvatar;
}

/** Fábrica do comando mais comum: trocar um caminho do estado com inverso automático. */
export function comandoDeCampo(
  nome: string,
  aplicar: (e: EstadoAvatar) => EstadoAvatar,
  capturarInverso: (antes: EstadoAvatar) => (e: EstadoAvatar) => EstadoAvatar,
): (estadoAtual: EstadoAvatar) => Comando {
  return (estadoAtual) => {
    const inverso = capturarInverso(estadoAtual);
    return { nome, executar: aplicar, desfazer: inverso };
  };
}

// ── Store (persisted → draft → preview, §608) ───────────────────────

const LIMITE_UNDO = 100;

export class AvatarStore {
  readonly bus = new BarramentoEventos();
  private persisted: EstadoAvatar;
  private draft: EstadoAvatar;
  private preview: EstadoAvatar | null = null; // hover/experimentar — §607.2
  private pilhaDesfazer: Comando[] = [];
  private pilhaRefazer: Comando[] = [];
  private assinantes = new Set<() => void>();
  private versaoPersistida = 0;

  constructor(inicial?: EstadoAvatar, versao = 0) {
    this.persisted = inicial ?? estadoVazio();
    this.draft = this.persisted;
    this.versaoPersistida = versao;
  }

  // — leitura (o que a UI/renderer enxergam: preview > draft) —
  get estadoVisivel(): EstadoAvatar { return this.preview ?? this.draft; }
  get estadoDraft(): EstadoAvatar { return this.draft; }
  get estadoPersistido(): EstadoAvatar { return this.persisted; }
  get versao(): number { return this.versaoPersistida; }
  get temMudancas(): boolean { return this.draft !== this.persisted; }
  get podeDesfazer(): boolean { return this.pilhaDesfazer.length > 0; }
  get podeRefazer(): boolean { return this.pilhaRefazer.length > 0; }

  /** contrato do useSyncExternalStore do React (e de qualquer outro host). */
  assinar = (fn: () => void): (() => void) => {
    this.assinantes.add(fn);
    return () => this.assinantes.delete(fn);
  };

  private notificar(origem: string): void {
    this.assinantes.forEach((fn) => { try { fn(); } catch { /* host */ } });
    this.bus.emitir('estado:mudou', { origem, checksum: checksumEstado(this.estadoVisivel) });
  }

  // — mutação SÓ por comando —
  executar(cmd: Comando): void {
    const novo = cmd.executar(this.draft);
    if (novo === this.draft) return; // no-op não polui pilha
    this.draft = novo;
    if (cmd.desfazer) {
      this.pilhaDesfazer.push(cmd);
      if (this.pilhaDesfazer.length > LIMITE_UNDO) this.pilhaDesfazer.shift();
      this.pilhaRefazer = [];
    }
    this.preview = null;
    this.bus.emitir('comando:executado', { nome: cmd.nome, podeDesfazer: !!cmd.desfazer });
    this.notificar(`comando:${cmd.nome}`);
  }

  desfazer(): void {
    const cmd = this.pilhaDesfazer.pop();
    if (!cmd?.desfazer) return;
    this.draft = cmd.desfazer(this.draft);
    this.pilhaRefazer.push(cmd);
    this.bus.emitir('comando:desfeito', { nome: cmd.nome });
    this.notificar('desfazer');
  }

  refazer(): void {
    const cmd = this.pilhaRefazer.pop();
    if (!cmd) return;
    this.draft = cmd.executar(this.draft);
    this.pilhaDesfazer.push(cmd);
    this.bus.emitir('comando:refeito', { nome: cmd.nome });
    this.notificar('refazer');
  }

  // — preview (experimentar sem comprometer o draft, §608) —
  visualizar(transforma: (e: EstadoAvatar) => EstadoAvatar): void {
    this.preview = transforma(this.draft);
    this.notificar('preview');
  }

  limparPreview(): void {
    if (this.preview === null) return;
    this.preview = null;
    this.notificar('preview:fim');
  }

  // — ciclo com a persistência —
  descartarDraft(): void {
    this.draft = this.persisted;
    this.preview = null;
    this.pilhaDesfazer = [];
    this.pilhaRefazer = [];
    this.bus.emitir('draft:descartado', {});
    this.notificar('descartar');
  }

  /** chamado APÓS o servidor confirmar o save (§619.1: versão do lock otimista). */
  confirmarPersistencia(novaVersao: number): void {
    this.persisted = this.draft;
    this.versaoPersistida = novaVersao;
    this.bus.emitir('persistencia:salva', { versao: novaVersao });
    this.notificar('persistencia');
  }

  /** carga inicial / troca de avatar / restauração de versão. */
  hidratar(estado: EstadoAvatar, versao: number): void {
    this.persisted = estado;
    this.draft = estado;
    this.preview = null;
    this.pilhaDesfazer = [];
    this.pilhaRefazer = [];
    this.versaoPersistida = versao;
    this.notificar('hidratar');
  }
}
