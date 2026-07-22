# 🏅 A20 · Summer 26 — Olimpiadas Casa Aveinte

Web de las olimpiadas de fin de semana: programa, pruebas, sorteos, brackets y **ranking en directo**.
Diseño estilo olimpiadas oficiales (dark premium + oro), sin build, 100% estático + Firebase.

**Atletas:** David · Iñaki · Charlie · Dani · Viti · Javi · Jorge
**Pruebas:** ⛳ Fútbol-Golf · ⚾ Béisbol · 🏓 Ping Pong · 🎾 Pádel · 🍺 Beer Pong · 🥤 Flip Cup

---

## 🚀 Verla en local (sin configurar nada)

La web funciona ya en **modo local** (los datos se guardan solo en tu navegador). Necesita un
pequeño servidor porque usa módulos JS (no vale doble clic sobre el HTML):

```bash
# opción 1
npx serve .
# opción 2 (si tienes Python)
python -m http.server 8000
```

Abre la URL que te indique (p. ej. http://localhost:3000 o http://localhost:8000).

> En modo local, cada navegador ve sus propios datos. Para que **todos veáis lo mismo en tiempo real**,
> configura Firebase (abajo).

---

## 🔥 Paso 1 — Firebase (datos compartidos en tiempo real)

1. Entra en <https://console.firebase.google.com> → **Agregar proyecto** (nombre p. ej. `a20-summer26`).
2. En el proyecto: **Compilación → Firestore Database → Crear base de datos** (modo producción, la región que quieras).
3. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)** → registra una app web y copia el objeto `firebaseConfig`.
4. Pega esos valores en [`js/config.js`](js/config.js), en `FIREBASE_CONFIG`:

   ```js
   export const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "a20-summer26.firebaseapp.com",
     projectId: "a20-summer26",
     storageBucket: "a20-summer26.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abcd...",
   };
   ```

   > Estas claves de cliente son **públicas** por diseño en Firebase; no son un secreto. La protección
   > real son las reglas de Firestore.

5. **Reglas de Firestore** (pestaña *Reglas*). Para un finde entre amigos vale con acceso abierto solo
   a este documento (contenido en [`firestore.rules`](firestore.rules)):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /a20/state {
         allow read, write: if true;   // simple: cualquiera con el link
       }
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```

   Publica las reglas. (Es acceso abierto a ese único documento; suficiente para 7 amigos.)

6. Cambia la **contraseña de admin** en `js/config.js` (`ADMIN_PASSWORD`). El admin es quien hace los
   **sorteos** y **asigna los países**; los **resultados** los puede meter cualquiera.

---

## 🌐 Paso 2 — Subir a GitHub

```bash
git add .
git commit -m "A20 Summer 26 web"
gh repo create a20-summer26 --public --source=. --push   # con GitHub CLI
# o crea el repo a mano en github.com y:
#   git remote add origin https://github.com/TU_USUARIO/a20-summer26.git
#   git push -u origin main
```

## ▲ Paso 3 — Desplegar en Vercel

1. Entra en <https://vercel.com> → **Add New → Project** → importa el repo `a20-summer26`.
2. Framework preset: **Other**. Sin build command, sin output dir (es estático). **Deploy**.
3. Comparte la URL (`https://a20-summer26.vercel.app`) con el grupo. ¡Listo!

> Alternativa por CLI: `npm i -g vercel` y luego `vercel` en la carpeta.

---

## 🎮 Cómo se usa

- **Viernes (apertura):** el admin pulsa 🔒 Admin, mete la contraseña, y en **Atletas** asigna un país a
  cada uno (o "Sortear países al azar"). Luego, en **Competición**, pulsa **Sortear** en cada prueba
  para dejar los cuadros listos.
- **Sábado:** cualquiera abre la web y va metiendo resultados: en los brackets se pulsa al ganador de
  cada partido; en fútbol-golf se meten los golpes; en béisbol/flip cup se marca el equipo ganador (y
  los home runs del béisbol). El **ranking y el medallero se actualizan solos** en todos los móviles.
- **Pádel (mecánica del solo):** tras la primera semifinal, aparece un aviso para que el jugador que se
  quedó solo elija compañero de la pareja eliminada.

### Puntuación
- Pruebas por posición (ping pong, pádel, beer pong, fútbol-golf): **10-8-6-5-4-3-2**.
- Pruebas por equipos (béisbol, flip cup): **ganador +8 por jugador**, perdedor 0.
- **Home run:** +3 al bateador (béisbol).
- Todo es configurable en `js/config.js` (`POINTS`).

---

## 📁 Estructura

```
index.html          Estructura y hero
css/styles.css      Tema dark premium + oro y animaciones
js/config.js        ← EDITA AQUÍ: atletas, pruebas, puntos, países, Firebase, contraseña
js/logic.js         Motor puro (brackets, pádel, equipos, ranking) — testeado
js/store.js         Datos en tiempo real (Firestore / fallback localStorage)
js/ui.js            Render e interacciones
js/app.js           Arranque
firestore.rules     Reglas de Firestore de ejemplo
vercel.json         Config estática mínima
```
