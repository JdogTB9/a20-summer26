// =============================================================
//  A20 · UI — render de secciones e interacciones
// =============================================================
import { ATHLETES, EVENTS, COUNTRIES, POINTS, SCHEDULE, ADMIN_PASSWORD } from "./config.js";
import * as store from "./store.js";
import * as L from "./logic.js";

const $ = (sel, root = document) => root.querySelector(sel);
const athleteById = Object.fromEntries(ATHLETES.map((a) => [a.id, a]));
const eventById = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// ---------- admin ----------
function isAdmin() { return sessionStorage.getItem("a20-admin") === "1"; }
function toggleAdmin() {
  if (isAdmin()) { sessionStorage.removeItem("a20-admin"); render(store.getState()); return; }
  const pass = window.prompt("Contraseña de administrador:");
  if (pass == null) return;
  if (pass === ADMIN_PASSWORD) { sessionStorage.setItem("a20-admin", "1"); render(store.getState()); }
  else window.alert("Contraseña incorrecta.");
}

// ---------- helpers de presentación ----------
function countryOf(state, id) { return (state.countries && state.countries[id]) || null; }
function nameChip(state, id) {
  if (!id) return `<span class="chip empty">—</span>`;
  const a = athleteById[id];
  const c = countryOf(state, id);
  const flag = c ? c.flag + " " : "";
  return `<span class="chip">${flag}${a ? a.name : id}</span>`;
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// =============================================================
//  Secciones estáticas (una vez)
// =============================================================
export function renderStatic() {
  renderNav();
  renderPruebas();
  renderPrograma();
}

function renderNav() {
  $("#nav-links").innerHTML = `
    <a href="#atletas">Atletas</a>
    <a href="#programa">Programa</a>
    <a href="#pruebas">Pruebas</a>
    <a href="#competicion">Competición</a>
    <a href="#ranking">Ranking</a>`;
}

function renderPrograma() {
  $("#programa-grid").innerHTML = SCHEDULE.map((day, di) => `
    <div class="day-card reveal" style="--d:${di * 0.08}s">
      <div class="day-head"><span class="day-ic">${day.icon}</span>
        <div><h3>${day.day}</h3><p>${day.subtitle}</p></div>
      </div>
      <ul class="timeline">
        ${day.items.map((it) => `
          <li><span class="t-time">${it.time}</span>
            <div class="t-body"><strong>${it.title}</strong><span>${it.desc}</span></div>
          </li>`).join("")}
      </ul>
    </div>`).join("");
}

function renderPruebas() {
  $("#pruebas-grid").innerHTML = EVENTS.map((ev, i) => `
    <article class="event-card reveal" style="--d:${i * 0.06}s">
      <div class="ev-top">
        <span class="ev-ic">${ev.icon}</span>
        <span class="tag ${ev.day}">${ev.day === "day" ? "☀️ Día" : "🌙 Noche"}</span>
      </div>
      <h3>${ev.name}</h3>
      <p class="ev-tag">${ev.tagline}</p>
      <p class="ev-rules">${esc(ev.rules)}</p>
      <p class="ev-scoring"><strong>Puntos:</strong> ${esc(ev.scoring)}</p>
    </article>`).join("");
}

// =============================================================
//  Render dinámico (en cada cambio de estado)
// =============================================================
export function render(state) {
  if (!state) return;
  document.body.classList.toggle("is-admin", isAdmin());
  $("#admin-btn").textContent = isAdmin() ? "🔓 Admin ON" : "🔒 Admin";
  renderAtletas(state);
  renderCompeticion(state);
  renderRanking(state);
  refreshReveal();
}

// ---------- Atletas / países ----------
function renderAtletas(state) {
  const admin = isAdmin();
  $("#atletas-grid").innerHTML = ATHLETES.map((a, i) => {
    const c = countryOf(state, a.id);
    const opts = COUNTRIES.map((co) =>
      `<option value="${co.code}" ${c && c.code === co.code ? "selected" : ""}>${co.flag} ${co.name}</option>`).join("");
    return `
      <div class="athlete-card reveal" style="--d:${i * 0.05}s">
        <div class="dorsal">${a.dorsal}</div>
        <div class="flag-big">${c ? c.flag : "🏳️"}</div>
        <h3>${a.name}</h3>
        <p class="country">${c ? c.name : "Sin país"}</p>
        ${admin ? `<select class="country-select" data-country-for="${a.id}">
            <option value="">— país —</option>${opts}</select>` : ""}
      </div>`;
  }).join("");

  $("#atletas-admin").innerHTML = admin
    ? `<button class="btn gold" data-action="draw-countries">🎲 Sortear países al azar</button>`
    : "";
}

// ---------- Competición ----------
function renderCompeticion(state) {
  const admin = isAdmin();
  $("#competicion-grid").innerHTML = EVENTS.map((ev) => {
    const st = state.events && state.events[ev.id];
    let body = "";
    if (ev.type === "bracket") body = renderBracket(state, ev, st);
    else if (ev.type === "padel") body = renderPadel(state, ev, st);
    else if (ev.type === "score") body = renderScore(state, ev, st);
    else if (ev.type === "team") body = renderTeam(state, ev, st);

    const drawn = st && (st.slots || st.pairs || st.teams || st.scores);
    const adminBtns = admin ? `
      <div class="comp-admin">
        ${!drawn || ev.type === "score"
          ? `<button class="btn small gold" data-action="draw-event" data-ev="${ev.id}">🎲 Sortear</button>`
          : `<button class="btn small ghost" data-action="draw-event" data-ev="${ev.id}">🔁 Re-sortear</button>`}
        <button class="btn small ghost" data-action="reset-event" data-ev="${ev.id}">🧹 Reiniciar</button>
      </div>` : "";

    return `
      <details class="comp-block" ${drawn ? "open" : ""}>
        <summary><span class="ev-ic">${ev.icon}</span> ${ev.name}
          <span class="tag ${ev.day}">${ev.slot}</span></summary>
        <div class="comp-inner">${adminBtns}${body}</div>
      </details>`;
  }).join("");
}

function matchCell(state, ev, m, opts = {}) {
  const canPlay = m.a && m.b;
  const btn = (id) => {
    if (!id) return `<button class="slot bye" disabled>—</button>`;
    const won = m.winner === id;
    const dis = canPlay ? "" : "disabled";
    return `<button class="slot ${won ? "won" : ""}" ${dis}
      data-action="set-winner" data-ev="${ev.id}" data-match="${m.key}" data-win="${id}">
      ${nameChip(state, id)}</button>`;
  };
  return `<div class="match ${opts.cls || ""}">
      <span class="m-label">${opts.label || ""}</span>
      ${btn(m.a)}<span class="vs">vs</span>${btn(m.b)}
    </div>`;
}

function renderBracket(state, ev, st) {
  if (!st || !st.slots) return `<p class="muted">Pendiente de sorteo del cuadro.</p>`;
  const R = L.resolveBracket(st);
  if (!R) return `<p class="muted">Cuadro incompleto.</p>`;
  const champ = R.final.winner ? `<div class="champ-banner">🏆 Campeón: ${nameChip(state, R.final.winner)}</div>` : "";
  return `
    ${champ}
    <div class="bracket">
      <div class="round"><h4>Cuartos</h4>
        ${matchCell(state, ev, R.qf1)}
        ${matchCell(state, ev, R.qf2)}
        ${matchCell(state, ev, R.qf3)}
        <div class="match"><span class="m-label">bye</span>${nameChip(state, R.qf4.a)}<span class="vs">pasa</span></div>
      </div>
      <div class="round"><h4>Semis</h4>
        ${matchCell(state, ev, R.sf1)}
        ${matchCell(state, ev, R.sf2)}
      </div>
      <div class="round"><h4>Final · 3er puesto</h4>
        ${matchCell(state, ev, R.final, { cls: "final" })}
        ${matchCell(state, ev, R.third, { label: "3º/4º" })}
      </div>
    </div>`;
}

function renderPadel(state, ev, st) {
  if (!st || !st.pairs) return `<p class="muted">Pendiente de sorteo de parejas.</p>`;
  const R = L.resolvePadel(st);
  const pairChip = (key) => {
    const mem = R.pairs[key];
    if (!mem) return `<span class="chip empty">—</span>`;
    return `<span class="pairchip">${nameChip(state, mem[0])}${nameChip(state, mem[1])}</span>`;
  };
  const pairBtn = (matchKey, key, winner) => {
    if (!key || !R.pairs[key]) return `<button class="slot bye" disabled>—</button>`;
    return `<button class="slot ${winner === key ? "won" : ""}"
      data-action="set-winner" data-ev="${ev.id}" data-match="${matchKey}" data-win="${key}">
      ${pairChip(key)}</button>`;
  };

  // Selección del compañero del jugador solo
  let pickBox = "";
  if (R.sf1.winner && !st.picked) {
    const loserKey = R.sf1.winner === "p0" ? "p1" : "p0";
    const mem = st.pairs[loserKey] || [];
    pickBox = `<div class="pick-box">
      <p>🎾 <strong>${nameChip(state, st.solo)}</strong> (jugador solo) elige compañero de la pareja eliminada:</p>
      ${mem.map((id) => `<button class="btn small gold" data-action="padel-pick" data-ev="${ev.id}" data-pick="${id}">${nameChip(state, id)}</button>`).join("")}
    </div>`;
  }

  const champ = R.final.winner ? `<div class="champ-banner">🏆 Campeones: ${pairChip(R.final.winner)}</div>` : "";
  const solo = `<div class="solo-note">🎾 Jugador solo: ${nameChip(state, st.solo)}${st.picked ? ` · compañero: ${nameChip(state, st.picked)} (descartado: ${nameChip(state, st.dropped)})` : ""}</div>`;

  return `
    ${champ}${solo}
    <div class="bracket padel">
      <div class="round"><h4>Semifinal 1</h4>
        <div class="match">${pairBtn("sf1", "p0", R.sf1.winner)}<span class="vs">vs</span>${pairBtn("sf1", "p1", R.sf1.winner)}</div>
        ${pickBox}
      </div>
      <div class="round"><h4>Semifinal 2</h4>
        <div class="match">${pairBtn("sf2", "p2", R.sf2.winner)}<span class="vs">vs</span>${pairBtn("sf2", st.picked ? "pD" : null, R.sf2.winner)}</div>
      </div>
      <div class="round"><h4>Final</h4>
        <div class="match final">${pairBtn("final", R.final.a, R.final.winner)}<span class="vs">vs</span>${pairBtn("final", R.final.b, R.final.winner)}</div>
      </div>
    </div>`;
}

function renderScore(state, ev, st) {
  const scores = (st && st.scores) || {};
  const places = L.scorePlacements(st || {}, ev.order);
  const rows = ATHLETES.map((a) => {
    const val = scores[a.id] ?? "";
    const pl = places[a.id];
    const pts = pl ? L.pointsForPlace(pl, POINTS.byPlace) : "";
    return `<tr>
      <td>${nameChip(state, a.id)}</td>
      <td><input type="number" min="0" class="score-input" data-ev="${ev.id}" data-athlete="${a.id}" value="${val}" placeholder="golpes"></td>
      <td class="ctr">${pl ? pl + "º" : "—"}</td>
      <td class="ctr pts">${pts !== "" ? pts : "—"}</td>
    </tr>`;
  }).join("");
  return `<table class="score-table">
    <thead><tr><th>Atleta</th><th>Golpes</th><th>Pos.</th><th>Pts</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="muted small">Menos golpes = mejor. Cualquiera puede rellenar los resultados.</p>`;
}

function renderTeam(state, ev, st) {
  if (!st || !st.teams) return `<p class="muted">Pendiente de sorteo de equipos.</p>`;
  const admin = isAdmin();
  const pts = L.teamPoints(st, ev, POINTS);
  const teamHtml = st.teams.map((t) => `
    <div class="team ${st.winner === t.key ? "winner" : ""}">
      <div class="team-head">
        <h4>${t.name} ${st.winner === t.key ? "🏆" : ""}</h4>
        <button class="btn small ${st.winner === t.key ? "gold" : "ghost"}" data-action="team-winner" data-ev="${ev.id}" data-team="${t.key}">Gana ${t.name}</button>
      </div>
      <ul class="team-list">
        ${t.members.map((id) => `<li>${nameChip(state, id)}
          ${ev.hasHomeRuns ? `<span class="hr">
            <button class="hr-btn" data-action="hr-dec" data-ev="${ev.id}" data-athlete="${id}">−</button>
            <span class="hr-n">${(st.homeRuns && st.homeRuns[id]) || 0} HR</span>
            <button class="hr-btn" data-action="hr-inc" data-ev="${ev.id}" data-athlete="${id}">+</button>
          </span>` : ""}
          <span class="pts">${pts[id] != null ? pts[id] + " pts" : ""}</span>
        </li>`).join("")}
      </ul>
    </div>`).join("");
  return `<div class="teams">${teamHtml}</div>
    <p class="muted small">Marca el equipo ganador${ev.hasHomeRuns ? " y suma los home runs individuales" : ""}. Abierto a todos.</p>`;
}

// ---------- Ranking / Medallero ----------
function renderRanking(state) {
  const rows = L.computeStandings(state, EVENTS, ATHLETES, POINTS);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const top3 = rows.slice(0, 3);
  const order = [1, 0, 2]; // plata, oro, bronce (visual)
  $("#podium").innerHTML = order.map((idx) => {
    const r = top3[idx];
    if (!r) return "";
    const c = countryOf(state, r.id);
    const cls = idx === 0 ? "silver" : idx === 1 ? "gold" : "bronze";
    const medal = idx === 0 ? "🥈" : idx === 1 ? "🥇" : "🥉";
    return `<div class="pod ${cls}" style="--h:${60 + (idx === 1 ? 60 : idx === 0 ? 30 : 10)}px">
      <div class="pod-name">${c ? c.flag + " " : ""}${r.name}</div>
      <div class="pod-medal">${medal}</div>
      <div class="pod-bar"><span>${r.total}</span></div>
    </div>`;
  }).join("");

  const evHead = EVENTS.map((e) => `<th title="${e.name}">${e.icon}</th>`).join("");
  const body = rows.map((r) => {
    const c = countryOf(state, r.id);
    const cells = EVENTS.map((e) => `<td class="ctr">${r.perEvent[e.id] != null ? r.perEvent[e.id] : "·"}</td>`).join("");
    const medal = r.medal === "gold" ? "🥇" : r.medal === "silver" ? "🥈" : r.medal === "bronze" ? "🥉" : (r.isLast ? "🔴" : "");
    return `<tr class="${r.medal || ""} ${r.isLast ? "last" : ""}">
      <td class="ctr rank">${r.rank}</td>
      <td class="who">${c ? c.flag + " " : ""}<strong>${r.name}</strong> ${medal}</td>
      ${cells}
      <td class="ctr total">${r.total}</td>
    </tr>`;
  }).join("");
  $("#ranking-table").innerHTML = `
    <thead><tr><th>#</th><th>Atleta</th>${evHead}<th>Total</th></tr></thead>
    <tbody>${body}</tbody>`;
}

// =============================================================
//  Eventos (delegación) + acciones que escriben en el store
// =============================================================
export function wireEvents() {
  $("#admin-btn").addEventListener("click", toggleAdmin);
  $("#reset-all-btn").addEventListener("click", async () => {
    if (!isAdmin()) return window.alert("Solo el admin puede reiniciar todo.");
    if (window.confirm("¿Reiniciar TODO el torneo (países, sorteos y resultados)?")) {
      const { buildInitialState } = await import("./app.js");
      await store.resetAll(buildInitialState());
    }
  });

  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
}

async function onClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const state = store.getState();
  const ev = el.dataset.ev ? eventById[el.dataset.ev] : null;
  const st = ev && state.events ? state.events[ev.id] : null;

  const adminOnly = ["draw-event", "reset-event", "draw-countries"];
  if (adminOnly.includes(a) && !isAdmin()) { window.alert("Solo el admin puede hacer sorteos."); return; }

  if (a === "draw-countries") {
    const shuffled = L.shuffle(COUNTRIES);
    const assign = {};
    ATHLETES.forEach((at, i) => { const c = shuffled[i]; assign[at.id] = { code: c.code, name: c.name, flag: c.flag }; });
    await store.set({ countries: assign });
  }

  if (a === "draw-event") {
    let fresh;
    const ids = ATHLETES.map((x) => x.id);
    if (ev.type === "bracket") fresh = L.initBracket(ids);
    else if (ev.type === "padel") fresh = L.initPadel(ids);
    else if (ev.type === "team") fresh = L.initTeams(ids, ev.teamSizes);
    else if (ev.type === "score") fresh = { scores: {} };
    await store.set({ [`events.${ev.id}`]: fresh });
  }

  if (a === "reset-event") {
    await store.set({ [`events.${ev.id}`]: null });
  }

  if (a === "set-winner") {
    const m = el.dataset.match, win = el.dataset.win;
    await setWinner(ev, st, m, win);
  }

  if (a === "padel-pick") {
    const picked = el.dataset.pick;
    const loserKey = st.results.sf1 === "p0" ? "p1" : "p0";
    const mem = st.pairs[loserKey] || [];
    const dropped = mem.find((x) => x !== picked) ?? null;
    await store.set({
      [`events.${ev.id}.picked`]: picked,
      [`events.${ev.id}.dropped`]: dropped,
      [`events.${ev.id}.results.sf2`]: null,
      [`events.${ev.id}.results.final`]: null,
    });
  }

  if (a === "team-winner") {
    await store.set({ [`events.${ev.id}.winner`]: el.dataset.team });
  }
  if (a === "hr-inc" || a === "hr-dec") {
    const id = el.dataset.athlete;
    const cur = (st.homeRuns && st.homeRuns[id]) || 0;
    const next = Math.max(0, cur + (a === "hr-inc" ? 1 : -1));
    await store.set({ [`events.${ev.id}.homeRuns.${id}`]: next });
  }
}

// Fija ganador de un partido y limpia los resultados aguas abajo.
async function setWinner(ev, st, matchKey, win) {
  const base = `events.${ev.id}.results.`;
  const upd = { [base + matchKey]: win };
  const clearDown = {
    qf1: ["sf1", "final", "third"], qf2: ["sf1", "final", "third"],
    qf3: ["sf2", "final", "third"], sf1: ["final", "third"], sf2: ["final", "third"],
  };
  if (ev.type === "padel") {
    if (matchKey === "sf1") {
      // cambia la pareja eliminada -> resetea elección del solo y aguas abajo
      upd[`events.${ev.id}.picked`] = null;
      upd[`events.${ev.id}.dropped`] = null;
      upd[base + "sf2"] = null; upd[base + "final"] = null;
    } else if (matchKey === "sf2") { upd[base + "final"] = null; }
  } else {
    (clearDown[matchKey] || []).forEach((k) => (upd[base + k] = null));
  }
  await store.set(upd);
}

async function onChange(e) {
  const state = store.getState();
  if (e.target.matches(".country-select")) {
    if (!isAdmin()) return;
    const id = e.target.dataset.countryFor;
    const code = e.target.value;
    const c = COUNTRIES.find((x) => x.code === code) || null;
    await store.set({ [`countries.${id}`]: c ? { code: c.code, name: c.name, flag: c.flag } : null });
  }
  if (e.target.matches(".score-input")) {
    const evId = e.target.dataset.ev, id = e.target.dataset.athlete;
    const v = e.target.value === "" ? null : Number(e.target.value);
    await store.set({ [`events.${evId}.scores.${id}`]: v });
  }
}

// =============================================================
//  Animaciones: reveal on scroll
// =============================================================
let io = null;
function refreshReveal() {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
  }
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
}
