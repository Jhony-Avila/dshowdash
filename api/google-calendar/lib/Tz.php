<?php
// Google Calendar / Tz - conversao de fuso horario (SEMPRE em PHP, NUNCA em SQL)
// @module google-calendar.tz
// @version 1.0.0
// @created 2026-07-29
//
// ─────────────────────────────────────────────────────────────────────────────
// POR QUE ESTA CLASSE EXISTE  (achado §4.1 do relatorio da Fase 0)
// ─────────────────────────────────────────────────────────────────────────────
// Neste servidor as tabelas de fuso do MySQL NAO estao populadas:
//
//   SELECT COUNT(*) FROM mysql.time_zone_name;                        -> 0
//   SELECT CONVERT_TZ('2026-07-29 12:00','UTC','America/Sao_Paulo');  -> NULL
//   SELECT CONVERT_TZ('2026-07-29 12:00','+00:00','-03:00');          -> 09:00
//
// CONVERT_TZ por NOME devolve NULL, e NULL nao levanta erro: dentro de um WHERE
// de janela de agenda ele simplesmente REMOVE o evento do resultado. O usuario
// ve a agenda mais vazia do que e, e nao ha nada no log. O contorno por offset
// numerico funciona mas e cego a horario de verao.
//
// REGRA DO MODULO, sem excecao:
//   1. o banco guarda SEMPRE UTC (DATETIME em UTC, nunca hora local);
//   2. conversao para o fuso do usuario/calendario acontece AQUI ou no browser;
//   3. nenhuma query deste modulo pode conter CONVERT_TZ.
//
// O PHP resolve fuso por nome corretamente (usa a base do sistema, nao a do
// MySQL), inclusive horario de verao — por isso a conversao mora deste lado.
declare(strict_types=1);

final class Tz
{
    /** Fuso de exibicao padrao quando o usuario/calendario nao declara um. */
    public const PADRAO = 'America/Sao_Paulo';

    /**
     * O default do processo PHP e America/Sao_Paulo (php.ini). O §47.1 do
     * briefing pede explicitamente NAO fixar Sao Paulo na logica, entao todo
     * calculo deste modulo passa por um fuso EXPLICITO — nunca pelo default.
     */
    public static function valido(?string $tz): bool
    {
        if ($tz === null || $tz === '') return false;
        return in_array($tz, \DateTimeZone::listIdentifiers(), true);
    }

    /** Normaliza um identificador de fuso; cai no padrao se invalido. */
    public static function normalizar(?string $tz): string
    {
        return self::valido($tz) ? (string)$tz : self::PADRAO;
    }

    /** Agora, em UTC. */
    public static function agora(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }

    /**
     * Interpreta uma data/hora ESCRITA NO FUSO informado e devolve o instante
     * em UTC. E o caminho de entrada: o formulario manda "2026-07-30 09:00" +
     * "America/Sao_Paulo"; o banco recebe "2026-07-30 12:00" UTC.
     */
    public static function paraUtc(string $local, string $tz): \DateTimeImmutable
    {
        $dt = new \DateTimeImmutable($local, new \DateTimeZone(self::normalizar($tz)));
        return $dt->setTimezone(new \DateTimeZone('UTC'));
    }

    /** Caminho de saida: instante UTC -> hora de parede no fuso pedido. */
    public static function paraLocal(\DateTimeInterface $utc, string $tz): \DateTimeImmutable
    {
        $dt = $utc instanceof \DateTimeImmutable
            ? $utc
            : \DateTimeImmutable::createFromInterface($utc);
        return $dt->setTimezone(new \DateTimeZone(self::normalizar($tz)));
    }

    /**
     * ISO-8601 COM offset (ex.: 2026-07-30T09:00:00-03:00). E o unico formato
     * que atravessa a API deste modulo: o browser reconstroi o instante sem
     * precisar adivinhar fuso, e a exibicao dupla do §47.2 fica trivial.
     */
    public static function iso(\DateTimeInterface $utc, string $tz): string
    {
        return self::paraLocal($utc, $tz)->format('c');
    }

    /** Diferenca de offset, em minutos, entre dois fusos num dado instante. */
    public static function difMinutos(\DateTimeInterface $quando, string $tzA, string $tzB): int
    {
        $a = new \DateTimeZone(self::normalizar($tzA));
        $b = new \DateTimeZone(self::normalizar($tzB));
        return intdiv($a->getOffset($quando) - $b->getOffset($quando), 60);
    }

    /**
     * Evento de dia inteiro NAO e evento de 24 horas (§48). Nao tem hora nem
     * fuso: e um intervalo de DATAS. Esta funcao existe para deixar explicito
     * no codigo quando estamos nesse caminho e impedir a conversao acidental.
     */
    public static function ehDiaInteiro(?string $inicio, ?string $fim): bool
    {
        $d = '/^\d{4}-\d{2}-\d{2}$/';
        return (bool)(preg_match($d, (string)$inicio) && preg_match($d, (string)$fim));
    }

    /** Janela [de, ate) em UTC a partir de datas locais (yyyy-mm-dd) num fuso. */
    public static function janela(string $de, string $ate, string $tz): array
    {
        return [
            self::paraUtc($de . ' 00:00:00', $tz),
            self::paraUtc($ate . ' 00:00:00', $tz)->modify('+1 day'),
        ];
    }
}
