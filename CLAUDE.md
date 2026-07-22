# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Web de las olimpiadas **A20 · Summer 26** (Casa Aveinte, verano 2026). 7 atletas, 6 pruebas, datos compartidos en tiempo real vía Firebase Firestore. Publicado en GitHub (`JdogTB9/a20-summer26`) y Vercel.

## Desarrollo local

No hay build, bundler ni dependencias npm. Es un único fichero estático:

```
# Servidor local mínimo (necesario — los módulos ES6 no funcionan con file://)
npx serve .
# o
python -m http.server 8000
```

Abrir `http://localhost:3000` (o el puerto que indique). Las fuentes de Google y el SDK de Firebase cargan desde CDN, así que se necesita conexión a internet.

## Estructura

Todo el código vive en **`index.html`** (≈66 KB). No hay ficheros JS/CSS separados. El fichero tiene cuatro bloques en orden:

1. **`<style>`** — CSS completo. Variables en `:root` (paleta dark + oro). Un único breakpoint `@media (max-width: 760px)`.
2. **`<body>` HTML** — Estructura estática: nav, hero, secciones `#atletas` `#programa` `#pruebas` `#competicion` `#ranking`, footer. Los contenidos dinámicos se inyectan via `innerHTML`.
3. **`<script>` — CONFIG** — Todo lo editable está en el objeto `CONFIG` al inicio del script: `FIREBASE`, `ADMIN_PASSWORD`, `POINTS`, `ATHLETES`, `COUNTRIES`, `EVENTS`, `SCHEDULE`. **Para cambiar atletas, pruebas, puntos o países, editar solo este bloque.**
4. **`<script>` — Lógica** — Motor del torneo → Store → UI → arranque.

## Arquitectura JS (todo en el IIFE del `<script>`)

### Motor del torneo (funciones puras, sin efectos secundarios)
- `initBracket / resolveBracket / bracketPlacements` — eliminatorias individuales (8 slots, 1 bye).
- `initPadel / resolvePadel / padelPlacements` — parejas con mecánica del jugador solo (3 parejas + 1 solo que elige compañero de la pareja eliminada).
- `scorePlacements` — pruebas de puntuación stroke (menos = mejor).
- `initTeams / teamPoints` — pruebas por equipos (béisbol con home runs, flip cup).
- `computeStandings` — ranking global: suma puntos de todos los eventos, detecta empates, asigna medallas y farolillo rojo al último.

### Store (singleton — solo Firestore, sin fallback local)
- Un único documento Firestore: colección `a20`, documento `state`.
- `Store.init(defaultState)` — conecta a Firestore, crea el doc si no existe, abre `onSnapshot`.
- `Store.set(entries)` — escribe campos con dot-notation (`"events.pingpong.results.sf1"`), actualiza cache local y llama `notify()` antes del `ref.update()` async.
- `Store.subscribe(cb)` — registra listener; se llama en cada `onSnapshot`.
- **No hay localStorage ni modo offline.** Si Firebase falla, el indicador muestra error y la web no funciona.

### UI (funciones de render)
- `render(state)` — punto de entrada; llama a `renderAtletas`, `renderCompeticion`, `renderRanking`.
- `renderCompeticion` — antes de reconstruir el HTML, guarda qué `<details>` están cerrados (`data-ev-id`) y los restaura después del render para que el usuario no pierda el estado de colapso.
- `renderRanking` — pódium visual en orden `[1, 0, 2]` (plata-izq, oro-centro, bronce-der), pero clases/medallas/altura se derivan del índice en `top3` (0=oro, 1=plata, 2=bronce).
- Eventos delegados en `onClick` y `onChange` a nivel `document`.

### Flujo de datos
```
onSnapshot → cache → notify() → render() → innerHTML
usuario → onClick/onChange → Store.set() → notify() + ref.update()
```

## Roles y acciones admin

Contraseña: `A20ADMIN` (guardada en `CONFIG.ADMIN_PASSWORD`; visible en el cliente — solo candado de conveniencia).

Acciones **solo admin** (array `adminOnly` en `onClick`): `draw-event`, `reset-event`, `draw-countries`, `draw-order`, `save-countries`.

Acciones **abiertas a todos**: meter resultados en brackets (`set-winner`), scorecard (`score-input`), equipos (`team-winner`, `hr-inc`, `hr-dec`).

## Modelo de datos Firestore (`/a20/state`)

```js
{
  phase: "setup",
  countries: { david: { code, name, flag }, ... },  // asignados en la ceremonia
  athleteOrder: ["javi", "david", ...],              // orden de elección de países (opcional)
  events: {
    pingpong: { slots: [...7 ids], results: { qf1, qf2, qf3, sf1, sf2, final, third } },
    padel:    { pairs: {p0,p1,p2}, solo, picked, dropped, results: {...} },
    futbolgolf: { scores: { david: 12, inaki: 9, ... } },
    baseball: { teams: [{key,name,members}], winner, homeRuns: { david: 2 } },
    flipcup:  { teams: [...], winner: null, homeRuns: {} },
    beerpong: { slots: [...], results: {...} },
  }
}
```

## Puntuación

- Pruebas por posición (bracket/padel/score): `[10, 8, 6, 5, 4, 3, 2]` para posiciones 1–7.
- Pruebas por equipos (béisbol, flip cup): ganador `+5` por jugador, perdedor `0`.
- Home runs (béisbol): `+1` extra al bateador.
- Empates: misma posición → mismos puntos (soportado en `rankWithTies`).

## Push a GitHub

```powershell
$env:PATH += ";C:\Program Files\GitHub CLI"
$t = gh auth token
git remote set-url origin "https://JdogTB9:$t@github.com/JdogTB9/a20-summer26.git"
git push origin main
git remote set-url origin "https://github.com/JdogTB9/a20-summer26.git"
```

Vercel despliega automáticamente en cada push a `main`.

## Reglas Firestore (consola Firebase)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /a20/state { allow read, write: if true; }
    match /{document=**} { allow read, write: if false; }
  }
}
```

## Advertencias conocidas

- **Banderas en Windows desktop**: los emojis de bandera (`🇪🇸`) se ven como letras en Windows. Se ven correctamente en iOS y Android (principal dispositivo de uso).
- **onChange en móvil**: si llega una actualización de Firestore mientras el admin tiene un `<select>` nativo abierto, el DOM se reconstruye y la selección puede perderse. Usar el botón **"💾 Guardar países"** para garantizar que los países se persisten en Firestore.
- **Scroll restoration**: `history.scrollRestoration = "manual"` + `scrollTo(0,0)` post-render para evitar que el navegador salte a un anchor al refrescar.
