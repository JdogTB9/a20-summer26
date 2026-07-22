// =============================================================
//  A20 · Capa de datos (tiempo real)
//  Backend Firestore si hay config; si no, fallback a localStorage
//  (con sincronización entre pestañas del mismo navegador).
//  Un único documento 'a20/state' con TODO el estado del torneo.
// =============================================================
import { FIREBASE_CONFIG } from "./config.js";

const COLLECTION = "a20";
const DOC_ID = "state";
const LS_KEY = "a20-state-v1";

let backend = null;          // 'firestore' | 'local'
let cache = null;            // estado en memoria
const listeners = new Set();
let fs = null;               // handles de firestore
let bc = null;               // BroadcastChannel (modo local)

export function isConfigured() {
  const k = FIREBASE_CONFIG.apiKey || "";
  return k && !k.startsWith("PEGA_AQUI");
}
export function backendName() { return backend; }
export function getState() { return cache; }

export function subscribe(cb) {
  listeners.add(cb);
  if (cache) cb(cache);
  return () => listeners.delete(cb);
}
function notify() { listeners.forEach((cb) => cb(cache)); }

function setNested(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null || typeof o[keys[i]] !== "object") o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}

// ---------- Firestore ----------
async function initFirestore(defaultState) {
  const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const dbMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const db = dbMod.getFirestore(app);
  const ref = dbMod.doc(db, COLLECTION, DOC_ID);
  fs = { ref, updateDoc: dbMod.updateDoc, setDoc: dbMod.setDoc };

  const snap = await dbMod.getDoc(ref);
  if (!snap.exists()) await dbMod.setDoc(ref, defaultState);

  dbMod.onSnapshot(ref, (s) => {
    if (s.exists()) { cache = s.data(); notify(); }
  });
}

// ---------- localStorage ----------
function initLocal(defaultState) {
  const raw = localStorage.getItem(LS_KEY);
  cache = raw ? JSON.parse(raw) : defaultState;
  if (!raw) localStorage.setItem(LS_KEY, JSON.stringify(cache));
  try { bc = new BroadcastChannel("a20"); bc.onmessage = (e) => { cache = e.data; notify(); }; }
  catch { bc = null; }
  window.addEventListener("storage", (e) => {
    if (e.key === LS_KEY && e.newValue) { cache = JSON.parse(e.newValue); notify(); }
  });
  notify();
}
function localPersist() {
  localStorage.setItem(LS_KEY, JSON.stringify(cache));
  if (bc) { try { bc.postMessage(cache); } catch {} }
}

// ---------- API ----------
export async function init(defaultState) {
  if (isConfigured()) {
    backend = "firestore";
    try { await initFirestore(defaultState); }
    catch (e) {
      console.error("Firestore no disponible, uso modo local:", e);
      backend = "local"; initLocal(defaultState);
    }
  } else {
    backend = "local";
    initLocal(defaultState);
  }
  return backend;
}

// Escribe uno o varios campos (dot-path). Concurrencia segura entre
// campos distintos en Firestore (updateDoc con field paths).
export async function set(entries) {
  if (!cache) cache = {};
  for (const [p, v] of Object.entries(entries)) setNested(cache, p, v);
  notify();
  if (backend === "firestore" && fs) {
    await fs.updateDoc(fs.ref, entries);
  } else {
    localPersist();
  }
}

export async function resetAll(defaultState) {
  cache = JSON.parse(JSON.stringify(defaultState));
  notify();
  if (backend === "firestore" && fs) { await fs.setDoc(fs.ref, cache); }
  else { localPersist(); }
}
