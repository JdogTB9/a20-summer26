// =============================================================
//  A20 · Motor puro del torneo (sin DOM, sin Firebase)
//  Sorteos, brackets, pádel, equipos y cálculo del ranking.
//  Todo son funciones puras -> fáciles de testear con Node.
// =============================================================

// ---------- utilidades ----------
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Puntos por posición (1-indexed). Fuera de rango -> último valor.
export function pointsForPlace(place, byPlace) {
  if (!place || place < 1) return 0;
  return byPlace[Math.min(place, byPlace.length) - 1];
}

// Ranking de competición con empates (1,2,2,4). entries: [{id,value}]
// order 'asc' => menos es mejor; 'desc' => más es mejor.
export function rankWithTies(entries, order = "desc") {
  const sorted = [...entries].sort((a, b) =>
    order === "asc" ? a.value - b.value : b.value - a.value
  );
  const places = {};
  let place = 0;
  let seen = 0;
  let prev = null;
  for (const e of sorted) {
    seen++;
    if (prev === null || e.value !== prev) place = seen;
    places[e.id] = place;
    prev = e.value;
  }
  return places;
}

// =============================================================
//  BRACKET individual (7 jugadores, cuadro de 8 con 1 bye)
// =============================================================
export function initBracket(athleteIds) {
  return { slots: shuffle(athleteIds).slice(0, 7), results: {} };
}

// Resuelve participantes de cada partido a partir de slots + resultados.
export function resolveBracket(b) {
  if (!b || !b.slots || b.slots.length < 7) return null;
  const s = b.slots;
  const r = b.results || {};
  const loser = (a, x, y) => (a === x ? y : x);

  const qf1 = { key: "qf1", a: s[0], b: s[1], winner: r.qf1 || null };
  const qf2 = { key: "qf2", a: s[2], b: s[3], winner: r.qf2 || null };
  const qf3 = { key: "qf3", a: s[4], b: s[5], winner: r.qf3 || null };
  const qf4 = { key: "qf4", a: s[6], b: null, winner: s[6] }; // bye automático

  const sf1 = { key: "sf1", a: qf1.winner, b: qf2.winner, winner: r.sf1 || null };
  const sf2 = { key: "sf2", a: qf3.winner, b: qf4.winner, winner: r.sf2 || null };

  const final = { key: "final", a: sf1.winner, b: sf2.winner, winner: r.final || null };
  const third = {
    key: "third",
    a: sf1.winner ? loser(sf1.winner, sf1.a, sf1.b) : null,
    b: sf2.winner ? loser(sf2.winner, sf2.a, sf2.b) : null,
    winner: r.third || null,
  };
  return { qf1, qf2, qf3, qf4, sf1, sf2, final, third, loser };
}

// Devuelve { athleteId: place } para los que ya tengan posición determinada.
export function bracketPlacements(b) {
  const R = resolveBracket(b);
  if (!R) return {};
  const places = {};
  const loser = R.loser;

  // 5º (empate): perdedores de qf1, qf2, qf3
  for (const qf of [R.qf1, R.qf2, R.qf3]) {
    if (qf.winner) places[loser(qf.winner, qf.a, qf.b)] = 5;
  }
  // 3º / 4º: partido por el tercer puesto
  if (R.third.winner) {
    places[R.third.winner] = 3;
    places[loser(R.third.winner, R.third.a, R.third.b)] = 4;
  }
  // 1º / 2º: final
  if (R.final.winner) {
    places[R.final.winner] = 1;
    places[loser(R.final.winner, R.final.a, R.final.b)] = 2;
  }
  return places;
}

// =============================================================
//  PÁDEL (3 parejas + 1 solo; el solo elige pareja de una eliminada)
// =============================================================
export function initPadel(athleteIds) {
  const s = shuffle(athleteIds).slice(0, 7);
  return {
    pairs: { p0: [s[0], s[1]], p1: [s[2], s[3]], p2: [s[4], s[5]] },
    solo: s[6],
    picked: null,   // miembro de la pareja eliminada elegido por el solo
    dropped: null,  // el otro miembro (queda fuera)
    results: {},    // { sf1:'p0'|'p1', sf2:'p2'|'pD', final:'pKey' }
  };
}

// Devuelve las parejas "vivas" incluida pD si ya está formada.
export function padelPairs(p) {
  const pairs = { ...p.pairs };
  if (p.picked) pairs.pD = [p.solo, p.picked];
  return pairs;
}

export function resolvePadel(p) {
  if (!p || !p.pairs) return null;
  const pairs = padelPairs(p);
  const r = p.results || {};
  const otherOf = (a, b, w) => (w === a ? b : a); // clave perdedora

  const sf1 = { key: "sf1", a: "p0", b: "p1", winner: r.sf1 || null };
  const sf1Loser = sf1.winner ? otherOf("p0", "p1", sf1.winner) : null;

  // El solo elige pareja de la eliminada de sf1 -> pD
  const sf2 = { key: "sf2", a: "p2", b: p.picked ? "pD" : null, winner: r.sf2 || null };
  const sf2Loser = sf2.winner && sf2.a && sf2.b ? otherOf(sf2.a, sf2.b, sf2.winner) : null;

  const final = { key: "final", a: sf1.winner, b: sf2.winner, winner: r.final || null };
  const finalLoser = final.winner ? otherOf(final.a, final.b, final.winner) : null;

  return { pairs, sf1, sf1Loser, sf2, sf2Loser, final, finalLoser };
}

export function padelPlacements(p) {
  const R = resolvePadel(p);
  if (!R) return {};
  const places = {};
  const assign = (pairKey, place) => {
    const members = R.pairs[pairKey];
    if (members) members.forEach((id) => { if (id != null) places[id] = place; });
  };

  // Jugador descartado (el que el solo no eligió) -> 4º
  if (p.dropped != null) places[p.dropped] = 4;
  // 3º: pareja perdedora de sf2
  if (R.sf2Loser) assign(R.sf2Loser, 3);
  // 1º / 2º: final
  if (R.final.winner) {
    assign(R.final.winner, 1);
    if (R.finalLoser) assign(R.finalLoser, 2);
  }
  return places;
}

// =============================================================
//  PRUEBA POR PUNTUACIÓN (fútbol-golf: menos golpes = mejor)
// =============================================================
export function scorePlacements(scoreState, order = "asc") {
  const scores = (scoreState && scoreState.scores) || {};
  const entries = Object.entries(scores)
    .filter(([, v]) => v != null && v !== "" && !Number.isNaN(Number(v)))
    .map(([id, v]) => ({ id, value: Number(v) }));
  if (!entries.length) return {};
  return rankWithTies(entries, order);
}

// =============================================================
//  PRUEBA POR EQUIPOS (béisbol / flip cup) -> devuelve PUNTOS
// =============================================================
export function initTeams(athleteIds, teamSizes = [4, 3]) {
  const s = shuffle(athleteIds);
  return {
    teams: [
      { key: "A", name: "Equipo A", members: s.slice(0, teamSizes[0]) },
      { key: "B", name: "Equipo B", members: s.slice(teamSizes[0], teamSizes[0] + teamSizes[1]) },
    ],
    winner: null,        // 'A' | 'B'
    homeRuns: {},        // { athleteId: nºhomeRuns }
  };
}

export function teamPoints(state, event, cfg) {
  const pts = {};
  if (!state || !state.teams) return pts;
  const hr = state.homeRuns || {};
  for (const team of state.teams) {
    for (const id of team.members) {
      let p = 0;
      if (state.winner) p += team.key === state.winner ? cfg.teamWin : cfg.teamLose;
      if (event.hasHomeRuns && hr[id]) p += Number(hr[id]) * cfg.homeRun;
      pts[id] = p;
    }
  }
  return pts;
}

// =============================================================
//  PUNTOS POR PRUEBA (dispatch por tipo) y RANKING GLOBAL
// =============================================================
export function eventPoints(event, eventState, cfg) {
  if (!eventState) return {};
  if (event.type === "bracket") {
    return mapPlacesToPoints(bracketPlacements(eventState), cfg.byPlace);
  }
  if (event.type === "padel") {
    return mapPlacesToPoints(padelPlacements(eventState), cfg.byPlace);
  }
  if (event.type === "score") {
    return mapPlacesToPoints(scorePlacements(eventState, event.order), cfg.byPlace);
  }
  if (event.type === "team") {
    return teamPoints(eventState, event, cfg);
  }
  return {};
}

function mapPlacesToPoints(places, byPlace) {
  const pts = {};
  for (const [id, place] of Object.entries(places)) {
    pts[id] = pointsForPlace(place, byPlace);
  }
  return pts;
}

// Ranking global: suma de puntos de todas las pruebas.
// Devuelve [{id, total, perEvent:{eventId:pts}, rank, medal}]
export function computeStandings(state, events, athletes, cfg) {
  const perEvent = {}; // id -> {eventId: pts}
  athletes.forEach((a) => (perEvent[a.id] = {}));

  for (const ev of events) {
    const pts = eventPoints(ev, state.events?.[ev.id], cfg);
    for (const [id, p] of Object.entries(pts)) {
      if (!perEvent[id]) perEvent[id] = {};
      perEvent[id][ev.id] = p;
    }
  }

  const rows = athletes.map((a) => {
    const pe = perEvent[a.id] || {};
    const total = Object.values(pe).reduce((s, x) => s + (x || 0), 0);
    return { id: a.id, name: a.name, dorsal: a.dorsal, total, perEvent: pe };
  });

  // Orden por total desc; ranking con empates.
  rows.sort((a, b) => b.total - a.total);
  let rank = 0, seen = 0, prev = null;
  for (const row of rows) {
    seen++;
    if (prev === null || row.total !== prev) rank = seen;
    row.rank = rank;
    prev = row.total;
  }
  // Medallas por rank (1,2,3) y farolillo rojo (último rank).
  const maxRank = rows.length ? rows[rows.length - 1].rank : 0;
  for (const row of rows) {
    row.medal = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : null;
    row.isLast = row.rank === maxRank && maxRank > 1;
  }
  return rows;
}
