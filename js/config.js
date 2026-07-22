// =============================================================
//  A20 · SUMMER 26 — Configuración del torneo
//  Edita aquí: atletas, pruebas, puntos, contraseña de admin y
//  la configuración de Firebase. No hace falta tocar más ficheros.
// =============================================================

// --- Firebase (rellénalo tras crear el proyecto; ver README) ---
// Mientras esté con los valores "PEGA_AQUI_..." la web funciona en
// modo LOCAL (localStorage, sin compartir) para que puedas verla ya.
export const FIREBASE_CONFIG = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI.firebaseapp.com",
  projectId: "PEGA_AQUI_PROJECT_ID",
  storageBucket: "PEGA_AQUI.appspot.com",
  messagingSenderId: "PEGA_AQUI",
  appId: "PEGA_AQUI",
};

// --- Contraseña de administrador (sorteos y asignación de países) ---
// Cámbiala por la que quieras. Es un candado sencillo del lado cliente
// (suficiente para 7 amigos, no es seguridad fuerte).
export const ADMIN_PASSWORD = "a20admin";

// --- Puntuación (configurable) ---
export const POINTS = {
  byPlace: [10, 8, 6, 5, 4, 3, 2], // 1º..7º en pruebas por posición
  teamWin: 8,                       // puntos por jugador del equipo ganador
  teamLose: 0,                      // puntos por jugador del equipo perdedor
  homeRun: 3,                       // puntos extra por home run (béisbol)
};

// --- Atletas (los 7) ---
export const ATHLETES = [
  { id: "david",   name: "David",   dorsal: 1 },
  { id: "inaki",   name: "Iñaki",   dorsal: 2 },
  { id: "charlie", name: "Charlie", dorsal: 3 },
  { id: "dani",    name: "Dani",    dorsal: 4 },
  { id: "viti",    name: "Viti",    dorsal: 5 },
  { id: "javi",    name: "Javi",    dorsal: 6 },
  { id: "jorge",   name: "Jorge",   dorsal: 7 },
];

// --- Países disponibles para el sorteo de la ceremonia de apertura ---
export const COUNTRIES = [
  { code: "ES", name: "España",         flag: "🇪🇸" },
  { code: "FR", name: "Francia",        flag: "🇫🇷" },
  { code: "IT", name: "Italia",         flag: "🇮🇹" },
  { code: "DE", name: "Alemania",       flag: "🇩🇪" },
  { code: "PT", name: "Portugal",       flag: "🇵🇹" },
  { code: "BR", name: "Brasil",         flag: "🇧🇷" },
  { code: "AR", name: "Argentina",      flag: "🇦🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "JP", name: "Japón",          flag: "🇯🇵" },
  { code: "NL", name: "Países Bajos",   flag: "🇳🇱" },
  { code: "JM", name: "Jamaica",        flag: "🇯🇲" },
  { code: "NO", name: "Noruega",        flag: "🇳🇴" },
];

// --- Definición de las 6 pruebas ---
// type: 'bracket' (eliminatoria individual) | 'padel' (parejas + solo) |
//       'score' (stroke: menos es mejor) | 'team' (2 equipos)
export const EVENTS = [
  {
    id: "futbolgolf",
    name: "Fútbol-Golf",
    type: "score",
    order: "asc",            // menos golpes = mejor
    day: "day",
    slot: "Sábado · Mañana",
    icon: "⛳",
    tagline: "Recorrido de hoyos por el jardín",
    rules: "Recorrido de \"hoyos\" repartidos por el jardín (dianas, cubos, porterías). Cada jugador intenta meter la pelota en cada hoyo con el menor número de golpes (chuts). Se suman los golpes de todos los hoyos: gana quien menos acumule. Empates permitidos.",
    scoring: "Ranking por golpes totales (asc). 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2.",
  },
  {
    id: "baseball",
    name: "Béisbol",
    type: "team",
    hasHomeRuns: true,
    teamSizes: [4, 3],       // un equipo con suplente (3 vs 3 en campo)
    day: "day",
    slot: "Sábado · Mañana",
    icon: "⚾",
    tagline: "2 equipos · 3 vs 3 + suplente",
    rules: "Dos equipos (3 vs 3 en el campo + 1 suplente en el equipo de 4, rotando). Bola de goma y conos como bases. Se juega un partido; gana el equipo con más carreras.",
    scoring: "Equipo ganador: +8 pts a cada jugador. Perdedor: 0. Cada home run: +3 pts extra al bateador (acumulable, cuente quien lo consiga).",
  },
  {
    id: "pingpong",
    name: "Ping Pong",
    type: "bracket",
    day: "day",
    slot: "Sábado · Tarde",
    icon: "🏓",
    tagline: "Eliminatoria individual",
    rules: "Torneo de eliminatoria individual (cuadro de 8 con 1 bye). Partidos al mejor de lo que decidáis (recomendado: 1 set a 11, o al mejor de 3). El que pierde queda eliminado.",
    scoring: "Por posición final. Campeón=10, finalista=8, 3er puesto=6, 4º=5, resto=4.",
  },
  {
    id: "padel",
    name: "Pádel",
    type: "padel",
    day: "day",
    slot: "Sábado · Tarde",
    icon: "🎾",
    tagline: "Parejas · con mecánica del jugador solo",
    rules: "Eliminatoria por parejas. Al ser 7, el sorteo forma 3 parejas y 1 jugador solo. El jugador solo espera; cuando una pareja queda eliminada, elige a uno de esos dos como compañero y entra a competir. Los dos de la pareja ganadora suman los mismos puntos.",
    scoring: "Por posición de la pareja: campeones=10 (cada uno), finalistas=8, 3er puesto=6, jugador descartado=5.",
  },
  {
    id: "beerpong",
    name: "Beer Pong",
    type: "bracket",
    day: "night",
    slot: "Sábado · Noche",
    icon: "🍺",
    tagline: "Eliminatoria individual",
    rules: "Torneo de eliminatoria individual (cuadro de 8 con 1 bye). El clásico: encestar la pelota en los vasos del rival. El que pierde queda eliminado.",
    scoring: "Por posición final. Campeón=10, finalista=8, 3er puesto=6, 4º=5, resto=4.",
  },
  {
    id: "flipcup",
    name: "Flip Cup",
    type: "team",
    hasHomeRuns: false,
    teamSizes: [4, 3],
    day: "night",
    slot: "Sábado · Noche",
    icon: "🥤",
    tagline: "Relevo por equipos",
    rules: "Dos equipos enfrentados a los lados de una mesa, cada jugador con un vaso. A la señal, el primero bebe, deja el vaso en el borde y lo voltea de un toque hasta dejarlo boca abajo; solo entonces bebe el siguiente. Gana el equipo que completa el relevo antes. Se juega al mejor de N mangas.",
    scoring: "Equipo ganador: +8 pts a cada jugador. Perdedor: 0.",
  },
];

// --- Textos del programa (timeline) ---
export const SCHEDULE = [
  {
    day: "Viernes",
    subtitle: "Ceremonia de Apertura",
    icon: "🔥",
    items: [
      { time: "Tarde", title: "Llegada e instalación", desc: "Nos acomodamos en la casa y preparamos el terreno de juego." },
      { time: "Cena", title: "Bienvenida A20", desc: "Presentación del plan del fin de semana y de esta web." },
      { time: "Noche", title: "Sorteo de países", desc: "Cada atleta recibe su país. ¡Representa con orgullo!" },
      { time: "Noche", title: "Sorteo de emparejamientos", desc: "Se sortean los cuadros de todas las pruebas del sábado." },
      { time: "Noche", title: "Juramento olímpico + antorcha", desc: "Chupito de honor y encendido de la antorcha A20. Sin competición: hoy toca ambiente." },
    ],
  },
  {
    day: "Sábado",
    subtitle: "Las Olimpiadas",
    icon: "🏅",
    items: [
      { time: "Mañana", title: "⛳ Fútbol-Golf", desc: "Recorrido de hoyos por el jardín." },
      { time: "Mañana", title: "⚾ Béisbol", desc: "2 equipos, 3 vs 3 + suplente." },
      { time: "Comida", title: "Avituallamiento", desc: "Recargar pilas para la tarde." },
      { time: "Tarde", title: "🏓 Ping Pong", desc: "Eliminatoria individual, más tranquilo tras comer." },
      { time: "Tarde", title: "🎾 Pádel", desc: "Eliminatoria por parejas." },
      { time: "Noche", title: "🍺 Beer Pong", desc: "Eliminatoria individual." },
      { time: "Noche", title: "🥤 Flip Cup", desc: "Relevo por equipos." },
      { time: "Cierre", title: "🏆 Entrega de premios", desc: "Medallero, pódium y fotos. Farolillo rojo para el último." },
    ],
  },
  {
    day: "Domingo",
    subtitle: "Clausura",
    icon: "🌅",
    items: [
      { time: "Mañana", title: "Desayuno de campeones", desc: "Resaca deportiva y anécdotas del sábado." },
      { time: "Mediodía", title: "Recogida y vuelta", desc: "Hasta la próxima edición de A20." },
    ],
  },
];
