// scripts/relogio-mundial-verifica-calculos.mjs
// Verificação NUMÉRICA dos cálculos do Relógio Mundial — astronomia, fusos e mercados.
// @version 1.0.0  @created 2026-07-30
//
// POR QUE ESTE ARQUIVO EXISTE: a suíte de navegador prova que a interface funciona;
// ela não prova que o Sol se põe na hora certa. Aqui os números são conferidos contra
// referências verificáveis, e não contra o próprio código.
//
// COMO RODAR:
//   cd /var/www/dshowdash/public/components/panels/panel-relogio-mundial
//   npx esbuild src/lib/{astro,time,markets,events}.ts src/data/cities.ts \
//     --bundle --format=esm --platform=node --outdir=/tmp/wcm-lib --outbase=src \
//     --alias:@=$PWD/src
//
// `--outbase=src` é obrigatório: sem ele o esbuild ACHATA a saída quando todas as
// entradas vêm da mesma pasta e ANINHA quando vêm de pastas diferentes — o caminho
// dos módulos mudava conforme a lista de entrada.
//   node /var/www/dshowdash/scripts/relogio-mundial-verifica-calculos.mjs
//
// ÂNCORAS DE PRECISÃO: os solstícios de Londres, cujos horários publicados são
// inequívocos (04:43→21:21 em junho, 08:04→15:53 em dezembro). Uma referência tirada
// de memória para uma data qualquer NÃO serve de âncora — foi assim que uma
// "discrepância de 8 min" em Londres acabou sendo erro da referência, não do código.

const LIB = process.env.WCM_LIB || '/tmp/wcm-lib';
const astro = await import(`${LIB}/lib/astro.js`);
const time = await import(`${LIB}/lib/time.js`);
const markets = await import(`${LIB}/lib/markets.js`);
const eventos = await import(`${LIB}/lib/events.js`);
const cidades = await import(`${LIB}/data/cities.js`);
const aeroportos = await import(`${LIB}/data/airports.js`);

let falhas = 0;
const ok = (cond, msg) => {
  console.log((cond ? '  \x1b[32mOK\x1b[0m    │ ' : '  \x1b[31mFALHA\x1b[0m │ ') + msg);
  if (!cond) falhas++;
};
const secao = (t) => console.log(`\n\x1b[1m── ${t} ──\x1b[0m`);
const hm = (d, tz) => (d ? time.fmtHM(d, tz) : '—');
const perto = (a, b, tol) => Math.abs(a - b) <= tol;
const minutos = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));

// ===================== astronomia =====================
secao('nascer/pôr do sol vs. efemérides publicadas');

const LONDRES = [51.5074, -0.1278];

// Âncora 1: solstício de junho em Londres.
{
  const st = astro.sunTimes(new Date('2026-06-21T12:00:00Z'), ...LONDRES);
  const n = hm(st.sunrise, 'Europe/London');
  const p = hm(st.sunset, 'Europe/London');
  ok(perto(minutos(n), minutos('04:43'), 2) && perto(minutos(p), minutos('21:21'), 2),
    `Londres, solstício de junho: ${n} → ${p} (publicado 04:43 → 21:21)`);
}

// Âncora 2: solstício de dezembro em Londres (o teste mais duro — dia curto, Sol raso).
{
  const st = astro.sunTimes(new Date('2026-12-21T12:00:00Z'), ...LONDRES);
  const n = hm(st.sunrise, 'Europe/London');
  const p = hm(st.sunset, 'Europe/London');
  ok(perto(minutos(n), minutos('08:04'), 2) && perto(minutos(p), minutos('15:53'), 2),
    `Londres, solstício de dezembro: ${n} → ${p} (publicado 08:04 → 15:53)`);
}

// Âncora 3: equinócio no equador. O dia deve passar de 12 h por causa da refração
// atmosférica e do semidiâmetro solar — cerca de 7 min a mais. Um resultado de
// exatamente 720 min indicaria que a correção de −0,833° não está sendo aplicada.
{
  const st = astro.sunTimes(new Date('2026-03-20T12:00:00Z'), 0, 0);
  ok(st.daylightMinutes > 722 && st.daylightMinutes < 732,
    `equador no equinócio: ${st.daylightMinutes} min de dia (esperado 723–731, com refração)`);
}

// Simetria em torno do meio-dia solar: qualquer assimetria denuncia erro no ângulo horário.
for (const [nome, lat, lng] of [['Londres', ...LONDRES], ['Oslo', 59.91, 10.75], ['Sydney', -33.87, 151.21]]) {
  const st = astro.sunTimes(new Date('2026-07-30T12:00:00Z'), lat, lng);
  const antes = (st.solarNoon - st.sunrise) / 60000;
  const depois = (st.sunset - st.solarNoon) / 60000;
  ok(perto(antes, depois, 0.5), `${nome}: dia simétrico ao meio-dia solar (${antes.toFixed(1)} / ${depois.toFixed(1)} min)`);
}

secao('latitudes polares');
ok(astro.sunTimes(new Date('2026-07-01T12:00:00Z'), 78.2, 15.6).midnightSun === true,
  'Svalbard em 1º/jul: sol da meia-noite');
ok(astro.sunTimes(new Date('2026-01-01T12:00:00Z'), 78.2, 15.6).polarNight === true,
  'Svalbard em 1º/jan: noite polar');
ok(astro.sunTimes(new Date('2026-01-01T12:00:00Z'), -78.2, 15.6).midnightSun === true,
  'Antártida em 1º/jan: sol da meia-noite (hemisfério oposto)');

secao('posição solar');
{
  const s = astro.solarPosition(new Date('2026-06-21T12:00:00Z'));
  ok(perto(s.lat, 23.44, 0.3), `declinação no solstício de junho: ${s.lat.toFixed(2)}° (Trópico de Câncer ≈ 23,44°)`);
  ok(Math.abs(s.lng) < 3, `longitude subsolar ao meio-dia UTC: ${s.lng.toFixed(2)}° (≈ Greenwich)`);
}
{
  const s = astro.solarPosition(new Date('2026-12-21T12:00:00Z'));
  ok(perto(s.lat, -23.44, 0.3), `declinação no solstício de dezembro: ${s.lat.toFixed(2)}° (Trópico de Capricórnio)`);
}
{
  // O ponto subsolar tem que estar sempre em pleno dia; o antisolar, sempre na noite.
  const d = new Date('2026-07-30T09:00:00Z');
  const s = astro.solarPosition(d);
  ok(astro.sunAltitude(d, s.lat, s.lng) > 89.5, 'Sol a pino no ponto subsolar (altitude ≈ 90°)');
  const [aLng, aLat] = astro.antisolarPoint(d);
  ok(astro.sunAltitude(d, aLat, aLng) < -89.5, 'Sol no nadir no ponto antisolar (altitude ≈ −90°)');
}

// ===================== fusos =====================
secao('offsets, meia hora e horário de verão');

const D = new Date('2026-07-30T12:00:00Z');
ok(time.offsetMinutes(D, 'Asia/Kolkata') === 330, `Índia = +${time.offsetMinutes(D, 'Asia/Kolkata')} min (fuso de meia hora)`);
ok(time.offsetMinutes(D, 'Asia/Kathmandu') === 345, `Nepal = +${time.offsetMinutes(D, 'Asia/Kathmandu')} min (quarto de hora)`);
ok(time.offsetMinutes(D, 'Pacific/Chatham') === 765, `Chatham = +${time.offsetMinutes(D, 'Pacific/Chatham')} min (+12:45)`);
ok(time.offsetMinutes(D, 'Europe/London') === 60, 'Londres em julho = +60 min (BST)');
ok(time.offsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Europe/London') === 0, 'Londres em janeiro = 0 (GMT)');

ok(time.dstInfo(D, 'Europe/London').active === true, 'Londres: DST ativo em julho');
ok(time.dstInfo(D, 'America/Sao_Paulo').observes === false, 'São Paulo: não observa DST (abolido em 2019)');
ok(time.dstInfo(D, 'Australia/Sydney').active === false, 'Sydney: DST inativo em julho (hemisfério sul)');
ok(time.dstInfo(new Date('2026-01-15T12:00:00Z'), 'Australia/Sydney').active === true, 'Sydney: DST ativo em janeiro');
ok(time.dstInfo(D, 'Asia/Tokyo').observes === false, 'Tóquio: não observa DST');

{
  // A UE muda no último domingo de outubro, às 01:00 UTC.
  const t = time.nextTransition(D, 'Europe/London');
  ok(t && t.at.toISOString().startsWith('2026-10-25') && t.gainsHour === false,
    `próxima transição em Londres: ${t ? t.at.toISOString() : 'nenhuma'} (esperado 25/out/2026, atrasando)`);
}

secao('calendário');
ok(time.isoWeek(new Date('2026-01-01T12:00:00Z'), 'UTC') === 1, 'semana ISO de 1º/jan/2026 = 1');
ok(time.isoWeek(new Date('2026-12-31T12:00:00Z'), 'UTC') === 53, `semana ISO de 31/dez/2026 = ${time.isoWeek(new Date('2026-12-31T12:00:00Z'), 'UTC')}`);
ok(perto(time.julianDay(new Date('2000-01-01T12:00:00Z')), 2451545.0, 1e-6), 'dia juliano da época J2000 = 2451545,0');
ok(time.dayShift(new Date('2026-07-30T23:00:00Z'), 'America/Sao_Paulo', 'Asia/Tokyo') === 1,
  'Tóquio já está no dia seguinte às 20h de São Paulo');

{
  // instantFromZoned tem que ser o inverso exato de zonedParts, inclusive em fuso
  // de meia hora — é o que sustenta toda a navegação de grade de mercados.
  const alvo = time.instantFromZoned(2026, 7, 30, 14, 30, 'Asia/Kolkata');
  const p = time.zonedParts(alvo, 'Asia/Kolkata');
  ok(p.year === 2026 && p.month === 7 && p.day === 30 && p.hour === 14 && p.minute === 30,
    `ida e volta de horário de parede na Índia: ${p.hour}:${String(p.minute).padStart(2, '0')}`);
}

// ===================== mercados =====================
secao('estado das bolsas');

const estado = (id, iso) => markets.marketStatusById(id, new Date(iso)).state;

ok(estado('nyse', '2026-07-30T13:00:00Z') === 'pre', 'NYSE às 09:00 ET = pré-abertura');
ok(estado('nyse', '2026-07-30T14:00:00Z') === 'aberto', 'NYSE às 10:00 ET = aberto');
ok(estado('nyse', '2026-07-30T20:30:00Z') === 'after', 'NYSE às 16:30 ET = after-market');
ok(estado('nyse', '2026-08-01T14:00:00Z') === 'fim-de-semana', 'NYSE no sábado = fim de semana');
ok(estado('nyse', '2026-07-03T14:00:00Z') === 'feriado', 'NYSE em 3/jul (Independence Day observado) = feriado');

ok(estado('sse', '2026-07-30T02:00:00Z') === 'aberto', 'SSE às 10:00 em Xangai = aberto');
ok(estado('sse', '2026-07-30T04:00:00Z') === 'pausa', 'SSE às 12:00 em Xangai = pausa de almoço');
ok(estado('sse', '2026-07-30T06:00:00Z') === 'aberto', 'SSE às 14:00 em Xangai = aberto (sessão da tarde)');

ok(estado('tadawul', '2026-08-02T09:00:00Z') === 'aberto', 'Tadawul no DOMINGO = aberto (semana Dom–Qui)');
ok(estado('tadawul', '2026-07-31T09:00:00Z') === 'fim-de-semana', 'Tadawul na SEXTA = fim de semana');

ok(estado('b3', '2026-07-30T14:00:00Z') === 'aberto', 'B3 às 11:00 em São Paulo = aberto');
ok(estado('b3', '2026-02-17T14:00:00Z') === 'feriado', 'B3 na terça de Carnaval = feriado');

{
  // A próxima transição precisa ser futura, mudar o estado e nunca apontar para um
  // dia não útil (o bug original devolvia "entra em fim de semana às 09:30 do sábado").
  for (const id of ['nyse', 'b3', 'jpx', 'tadawul']) {
    for (const iso of ['2026-07-30T14:00:00Z', '2026-08-01T10:00:00Z', '2026-12-25T10:00:00Z']) {
      const s = markets.marketStatusById(id, new Date(iso));
      const t = s.next;
      const valido = t && t.at > new Date(iso) && t.state !== s.state
        && t.state !== 'fim-de-semana' && t.state !== 'feriado';
      ok(Boolean(valido), `${id} em ${iso.slice(0, 10)}: ${s.state} → ${t ? t.state + ' @ ' + t.at.toISOString().slice(0, 16) : 'nenhuma'}`);
    }
  }
}

// ===================== camada de eventos =====================
secao('eventos (feriado do dia e DST próximo)');
{
  const bra = cidades.getCity('sao-paulo');
  const usa = cidades.getCity('new-york');
  const jpn = cidades.getCity('tokyo');

  // 7 de setembro é feriado nacional no Brasil e dia útil comum nos EUA.
  const setembro = new Date('2026-09-07T15:00:00Z');
  ok(eventos.holidayOf(bra, setembro)?.def.name === 'Independência do Brasil',
    `São Paulo em 7/set: ${eventos.holidayOf(bra, setembro)?.def.name}`);
  ok(eventos.holidayOf(usa, setembro)?.def.name === 'Labor Day',
    `Nova York em 7/set: ${eventos.holidayOf(usa, setembro)?.def.name} (Labor Day cai na mesma data em 2026)`);

  // 30 de julho não é feriado em lugar nenhum da base.
  const julho = new Date('2026-07-30T12:00:00Z');
  ok(eventos.holidayOf(bra, julho) === null, 'São Paulo em 30/jul: sem feriado');

  // O feriado é lido no DIA CIVIL DA CIDADE, não no dia UTC — em Tóquio o
  // ano-novo começa 9 h antes de Greenwich.
  ok(eventos.holidayOf(jpn, new Date('2025-12-31T16:00:00Z'))?.def.name === '元日',
    'Tóquio já está em 1º/jan às 16h UTC de 31/dez (dia civil local)');

  // DST: aviso só dentro da janela de 7 dias.
  const dezDiasAntes = new Date('2026-10-15T12:00:00Z');
  const doisDiasAntes = new Date('2026-10-23T12:00:00Z');
  ok(eventos.dstBadge(cidades.getCity('london'), dezDiasAntes).daysToChange > 7,
    `Londres em 15/out: faltam ${eventos.dstBadge(cidades.getCity('london'), dezDiasAntes).daysToChange} dias (fora da janela)`);
  ok(eventos.dstBadge(cidades.getCity('london'), doisDiasAntes).daysToChange <= 7,
    `Londres em 23/out: faltam ${eventos.dstBadge(cidades.getCity('london'), doisDiasAntes).daysToChange} dias (dentro da janela)`);
  ok(eventos.dstBadge(bra, julho).observes === false, 'São Paulo nunca entra na camada de DST');

  // A agenda unificada tem que estar ordenada no tempo.
  const agenda = eventos.upcomingEvents(julho, 45, [bra, usa, cidades.getCity('london')]);
  const ordenada = agenda.every((e, i) => i === 0 || agenda[i - 1].at <= e.at);
  ok(agenda.length > 0 && ordenada, `agenda com ${agenda.length} eventos, em ordem cronológica`);
}

// ===================== aeroportos =====================
secao('aeroportos (códigos, geometria e o campo "status")');
{
  const A = aeroportos.AIRPORTS;
  ok(A.length === 156, `${A.length} aeroportos na base`);
  ok(A.every((x) => /^[A-Z]{3}$/.test(x.iata)), 'todos os IATA com 3 letras maiúsculas');
  ok(A.every((x) => /^[A-Z0-9]{4}$/.test(x.icao)), 'todos os ICAO com 4 caracteres');
  ok(A.every((x) => x.elev === null || Number.isInteger(x.elev)), 'elevação íntegra (inteiro em pés)');
  ok(A.every((x) => x.muni && x.muni.length > 0), 'todo aeroporto tem município');

  // A cidade-sede tem que existir, senão o pino some do mapa sem aviso.
  const orfaos = A.filter((x) => !cidades.getCity(x.cityId)).map((x) => x.iata);
  ok(orfaos.length === 0, `toda cidade-sede existe${orfaos.length ? ' — órfãos: ' + orfaos : ''}`);

  // O fuso do aeroporto tem que bater com o da cidade — o cabeçalho de
  // data/airports.ts afirma isso, e afirmação em comentário também precisa de prova.
  const fusoDivergente = A.filter((x) => cidades.getCity(x.cityId)?.tz !== x.tz).map((x) => x.iata);
  ok(fusoDivergente.length === 0, `fuso do aeroporto = fuso da cidade em todos os casos${fusoDivergente.length ? ' — exceto ' + fusoDivergente : ''}`);

  // O valor da camada está na COORDENADA ser a do aeroporto, não a da cidade.
  const distancias = A.map((x) => {
    const c = cidades.getCity(x.cityId);
    const dLat = (x.lat - c.lat) * 111;
    const dLng = (x.lng - c.lng) * 111 * Math.cos((c.lat * Math.PI) / 180);
    return Math.hypot(dLat, dLng);
  });
  const longe = distancias.filter((d) => d > 5).length;
  ok(longe > 100, `${longe} de ${A.length} aeroportos a mais de 5 km do centro (coordenada é do aeroporto, não da cidade)`);
  ok(Math.max(...distancias) < 90, `maior distância aeroporto↔centro: ${Math.round(Math.max(...distancias))} km (acima de 90 km indicaria pareamento errado)`);

  // "Status" é dado REAL, não enfeite: se todos fossem `true` o campo não informaria nada.
  const semServico = A.filter((x) => !x.scheduled).map((x) => x.iata);
  ok(semServico.length > 0, `campo scheduled_service discrimina: sem serviço regular em ${semServico.join(', ')}`);
  ok(aeroportos.servicoLabel(aeroportos.AIRPORT_BY_IATA.KBP) === 'Sem serviço regular programado',
    'KBP (Kiev) rotulado como sem serviço regular');
  ok(aeroportos.elevacaoLabel(aeroportos.AIRPORT_BY_IATA.LPB).endsWith('m'),
    `elevação convertida para metros: LPB (El Alto) = ${aeroportos.elevacaoLabel(aeroportos.AIRPORT_BY_IATA.LPB)}`);
}

console.log(`\n════════════════════════════════════════`);
console.log(falhas === 0 ? 'TODAS AS VERIFICAÇÕES NUMÉRICAS PASSARAM' : `${falhas} FALHA(S)`);
console.log(`════════════════════════════════════════\n`);
process.exit(falhas ? 1 : 0);
