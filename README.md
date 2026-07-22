# 🏅 A20 · Summer 26 — Olimpiadas Casa Aveinte

Web de las olimpiadas de fin de semana: programa, pruebas, sorteos, brackets y **ranking en directo**.
Diseño estilo olimpiadas oficiales (dark premium + oro). **Un único fichero `index.html`** autocontenido
(HTML + CSS + JS dentro) + Firebase opcional para compartir datos en tiempo real.

**Atletas:** David · Iñaki · Charlie · Dani · Viti · Javi · Jorge
**Pruebas:** ⛳ Fútbol-Golf · ⚾ Béisbol · 🏓 Ping Pong · 🎾 Pádel · 🍺 Beer Pong · 🥤 Flip Cup

---

## 🚀 Verla ahora (modo local)

**Haz doble clic en `index.html`** y se abre en el navegador. Ya funciona en **modo local**: los datos se
guardan en tu navegador (y se sincronizan entre pestañas del mismo navegador).

> En modo local cada dispositivo ve sus propios datos. Para que **todos veáis lo mismo en tiempo real**
> (varios móviles), configura Firebase (abajo). Necesita conexión a internet para cargar el SDK de Firebase.

---

## 🔥 Paso 1 — Firebase (datos compartidos en tiempo real)

1. Entra en <https://console.firebase.google.com> → **Agregar proyecto** (p. ej. `a20-summer26`).
2. **Compilación → Firestore Database → Crear base de datos** (modo producción, la región que quieras).
3. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)** → registra una app web y copia el objeto `firebaseConfig`.
4. Abre `index.html` con un editor y busca cerca del principio del `<script>` el bloque `CONFIG.FIREBASE`.
   Sustituye los valores `PEGA_AQUI...` por los tuyos:

   ```js
   FIREBASE: {
     apiKey: "AIza...",
     authDomain: "a20-summer26.firebaseapp.com",
     projectId: "a20-summer26",
     storageBucket: "a20-summer26.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abcd...",
   },
   ```

   > Estas claves de cliente son **públicas** por diseño en Firebase; no son un secreto. La protección
   > real son las reglas de Firestore.

5. **Reglas de Firestore** (pestaña *Reglas*), copia el contenido de [`firestore.rules`](firestore.rules)
   y publica. Es acceso abierto solo al documento del torneo, suficiente para un grupo de amigos.

6. Cambia la **contraseña de admin** en el mismo bloque `CONFIG` (`ADMIN_PASSWORD`). El admin hace los
   **sorteos** y **asigna los países**; los **resultados** los puede meter cualquiera.

Con eso, la etiqueta de la barra superior pasará de 🟡 *Modo local* a 🟢 *En directo*.

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

1. <https://vercel.com> → **Add New → Project** → importa el repo `a20-summer26`.
2. Framework preset: **Other**. Sin build command, sin output dir (es estático). **Deploy**.
3. Comparte la URL (`https://a20-summer26.vercel.app`) con el grupo. ¡Listo!

> Alternativa por CLI: `npm i -g vercel` y luego `vercel` en la carpeta.
> Al estar todo en `index.html`, también puedes arrastrar el fichero a cualquier hosting estático.

---

## 🎮 Cómo se usa

- **Viernes (apertura):** pulsa 🔒 Admin, mete la contraseña, y en **Atletas** asigna un país a cada uno
  (o "Sortear países al azar"). Luego, en **Competición**, pulsa **Sortear** en cada prueba para dejar los
  cuadros listos.
- **Sábado:** cualquiera abre la web y mete resultados: en los brackets se pulsa al ganador de cada
  partido; en fútbol-golf se meten los golpes; en béisbol/flip cup se marca el equipo ganador (y los home
  runs del béisbol). El **ranking y el medallero se actualizan solos**.
- **Pádel (mecánica del solo):** tras la primera semifinal aparece un aviso para que el jugador que se
  quedó solo elija compañero de la pareja eliminada.

### Puntuación
- Pruebas por posición (ping pong, pádel, beer pong, fútbol-golf): **10-8-6-5-4-3-2**.
- Pruebas por equipos (béisbol, flip cup): **ganador +8 por jugador**, perdedor 0.
- **Home run:** +3 al bateador (béisbol).
- Todo configurable en el bloque `CONFIG` dentro de `index.html`.

---

## 📁 Estructura

```
index.html          TODO aquí: HTML + CSS + JS (config, motor, tiempo real, UI)
firestore.rules     Reglas de Firestore de ejemplo
vercel.json         Config estática mínima
README.md           Este archivo
```

> ¿Dónde edito las cosas? Todo está en la sección `CONFIG` al principio del `<script>` de `index.html`:
> atletas, pruebas, puntos, países, Firebase y contraseña de admin.
