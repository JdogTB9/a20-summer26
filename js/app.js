// =============================================================
//  A20 · Bootstrap
// =============================================================
import * as store from "./store.js";
import * as ui from "./ui.js";

// Estado inicial del torneo (documento único en Firestore/localStorage).
export function buildInitialState() {
  return {
    phase: "setup",
    countries: {}, // athleteId -> { code, name, flag }
    events: {},    // eventId   -> estado de la prueba (se crea al sortear)
    createdAt: Date.now(),
  };
}

async function main() {
  ui.renderStatic();
  ui.wireEvents();

  const backend = await store.init(buildInitialState());

  const ind = document.getElementById("backend-indicator");
  if (ind) {
    if (backend === "firestore") {
      ind.innerHTML = `<span class="dot live"></span> En directo`;
      ind.title = "Conectado a Firebase: todos veis lo mismo en tiempo real.";
    } else {
      ind.innerHTML = `<span class="dot local"></span> Modo local`;
      ind.title = "Sin Firebase configurado: los datos son solo de este navegador. Ver README.";
    }
  }

  store.subscribe(ui.render);
  if (store.getState()) ui.render(store.getState());
}

main().catch((e) => {
  console.error(e);
  document.getElementById("backend-indicator").textContent = "⚠️ error";
});
