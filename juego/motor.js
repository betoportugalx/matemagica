/* =========================================================
   MOTOR COMPARTIDO del juego de matemáticas
   Sirve para sumas, restas, multiplicación y división.
   Cada página carga: estilos-juego.css + motor.js + operaciones.js
   y llama a: Juego.arrancar(OPERACIONES.<operacion>)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Utilidades globales (las usan las operaciones) ---------- */
  window.rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  window.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  window.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  window.OBJETOS = ["🍎", "⭐", "🐣", "🍓", "🐟", "🌸", "🍪", "🐞", "🍋", "🦋", "🍇", "🐢", "🍒", "🐝"];

  // Convierte 0-99 a palabras para la voz (en español)
  const UNI = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho",
    "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
    "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const DEC = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const CENT = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
    "seiscientos", "setecientos", "ochocientos", "novecientos"];
  function menor100(n) {
    if (n < 30) return UNI[n];
    const d = Math.floor(n / 10), u = n % 10;
    return DEC[d] + (u ? " y " + UNI[u] : "");
  }
  // Convierte 0-999 a palabras para la voz (en español)
  window.numeroAVoz = (n) => {
    if (n < 0) return "menos " + window.numeroAVoz(-n);
    if (n < 100) return menor100(n);
    if (n === 100) return "cien";
    if (n > 999) return String(n);
    const c = Math.floor(n / 100), r = n % 100;
    const base = c === 1 ? "ciento" : CENT[c];
    return r ? base + " " + menor100(r) : base;
  };

  const NUM_PREGUNTAS = 10;
  const DURACION_RETO = 15000;

  function arrancar(op) {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => [...document.querySelectorAll(s)];

    const estado = {
      op,
      modo: "aprender",
      voz: true,
      vozObj: null,
      tabla: null,
      visual: true,
      visualTemporal: false,
      nivel: null,
      pregunta: 0,
      puntos: 0,
      correcta: 0,
      cuenta: null,
      bloqueado: false,
      enJuego: false,
    };

    /* ---------- Sonido ---------- */
    let ctx = null;
    function tono(freq, dur, type) {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || "sine";
        o.frequency.value = freq;
        o.connect(g); g.connect(ctx.destination);
        const n = ctx.currentTime;
        g.gain.setValueAtTime(0.06, n);
        g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
        o.start(n); o.stop(n + dur);
      } catch (e) {}
    }
    const beepOk = () => { tono(660, 0.12); setTimeout(() => tono(880, 0.14), 110); };
    const beepMal = () => tono(200, 0.25, "sawtooth");
    const beepFin = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, 0.18), i * 120));

    /* ---------- Voz ---------- */
    let vocesOrdenadas = [];

    // Puntúa cada voz para elegir la más natural, dando prioridad al español.
    function puntuarVoz(v) {
      const n = (v.name + " " + v.lang).toLowerCase();
      let s = 0;
      if (/^es[-_]|[-_]es\b/.test(v.lang.toLowerCase()) || v.lang.toLowerCase().indexOf("es") === 0) s += 100;
      if (/natural|neural|online/.test(n)) s += 60;
      if (/google/.test(n)) s += 45;
      if (/elvira|helena|sabina|monica|mónica|paulina|lucia|lucía|laura|carmen|isabel|estrella|andrea|marisol|sofia|sofía/.test(n)) s += 25;
      if (v.lang.toLowerCase().indexOf("es-es") === 0) s += 12;
      if (v.localService) s += 3;
      return s;
    }

    function cargarVoces() {
      if (!("speechSynthesis" in window)) return;
      const todas = window.speechSynthesis.getVoices() || [];
      vocesOrdenadas = todas.slice().sort((a, b) => puntuarVoz(b) - puntuarVoz(a));
      rellenarSelectorVoz();
      aplicarVozGuardada();
    }

    function rellenarSelectorVoz() {
      const sel = $("#selVoz");
      if (!sel) return;
      const previo = sel.value;
      sel.innerHTML = '<option value="">Automática (recomendada)</option>';
      vocesOrdenadas.forEach((v, i) => {
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = v.name + " (" + v.lang + ")";
        sel.appendChild(o);
      });
      const fila = $("#filaVoz");
      if (fila) fila.classList.toggle("hidden", vocesOrdenadas.length === 0);
      sel.value = previo;
    }

    function setSelVoz(valor) {
      const sel = $("#selVoz");
      if (sel) sel.value = valor;
    }

    function aplicarVozGuardada() {
      let nombre = "";
      try { nombre = localStorage.getItem("mate-voz") || ""; } catch (e) {}
      if (nombre) {
        const idx = vocesOrdenadas.findIndex((v) => v.name === nombre);
        if (idx >= 0) { estado.vozObj = vocesOrdenadas[idx]; setSelVoz(String(idx)); return; }
      }
      estado.vozObj = vocesOrdenadas[0] || null; // la mejor disponible
      setSelVoz("");
    }

    function decir(texto) {
      if (!estado.voz || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        if (estado.vozObj) { u.voice = estado.vozObj; u.lang = estado.vozObj.lang; }
        else { u.lang = "es-ES"; }
        u.rate = 0.95;
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }

    /* ---------- Progreso guardado ---------- */
    const claveProgreso = "mate-progreso-" + op.id;
    function leerProgreso() {
      try { return JSON.parse(localStorage.getItem(claveProgreso)) || {}; } catch (e) { return {}; }
    }
    function mejorEstrellas(id) { return leerProgreso()[id] || 0; }
    function guardarMejor(id, est) {
      const data = leerProgreso();
      if (!data[id] || est > data[id]) data[id] = est;
      try { localStorage.setItem(claveProgreso, JSON.stringify(data)); } catch (e) {}
    }

    /* ---------- Pantallas ---------- */
    function mostrarPantalla(id) {
      ["#screen-nivel", "#screen-juego", "#screen-final"].forEach((s) => $(s).classList.add("hidden"));
      $(id).classList.remove("hidden");
    }

    /* ---------- Cabecera / toggles ---------- */
    function actualizarBotones() {
      $("#btnVoz").classList.toggle("on", estado.voz);
      $("#btnVoz").textContent = estado.voz ? "🔊" : "🔇";
      $("#btnVisual").classList.toggle("on", estado.visual);
    }

    /* ---------- Modos ---------- */
    function setModo(m) {
      estado.modo = m;
      $$(".modo").forEach((x) => x.classList.toggle("activo", x.dataset.modo === m));
      if (m === "aprender") { estado.voz = true; estado.visual = true; }
      else { estado.voz = false; estado.visual = false; }
      $("#modoDesc").textContent = m === "aprender"
        ? "Con dibujos y voz, sin prisa. Ideal para entender."
        : "Sin ayudas y con tiempo. ¡A ver cuántas aciertas!";
      actualizarBotones();
    }

    /* ---------- Pintar niveles ---------- */
    function pintarNiveles() {
      const cont = $("#niveles");
      cont.innerHTML = "";
      op.niveles.forEach((n, i) => {
        const best = mejorEstrellas(n.id);
        const b = document.createElement("button");
        b.className = "nivel n" + (i + 1) + (n.destacado ? " destacado" : "");
        b.innerHTML =
          '<span class="emoji">' + n.emoji + "</span>" +
          '<span class="t">' + n.nombre + "</span>" +
          '<span class="d">' + n.edad + " · " + n.desc + "</span>" +
          (best ? '<span class="best">Mejor: ' + "⭐".repeat(best) + "</span>" : "");
        b.addEventListener("click", () => iniciar(n));
        cont.appendChild(b);
      });
    }

    /* ---------- Apoyo visual ---------- */
    function pintarVisual() {
      const v = $("#visual");
      const mostrar = (estado.visual || estado.visualTemporal) && op.visual && estado.cuenta;
      if (!mostrar) { v.innerHTML = ""; v.classList.add("hidden"); return; }
      v.classList.remove("hidden");
      v.innerHTML = op.visual(estado.cuenta, window.pick(window.OBJETOS));
    }

    /* ---------- Tiempo (modo Reto) ---------- */
    let rafId = null, tInicio = 0;
    function detenerTiempo() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    function iniciarTiempo() {
      const barra = $("#barraTiempo"), fill = $("#tiempoFill");
      if (estado.modo !== "reto") { barra.classList.add("hidden"); detenerTiempo(); return; }
      barra.classList.remove("hidden");
      tInicio = performance.now(); fill.style.width = "100%";
      const tick = () => {
        const t = performance.now() - tInicio;
        const p = Math.max(0, 1 - t / DURACION_RETO);
        fill.style.width = p * 100 + "%";
        if (t >= DURACION_RETO) { seAgoto(); return; }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    /* ---------- Flujo ---------- */
    function iniciar(nivel) {
      estado.nivel = nivel;
      estado.pregunta = 0;
      estado.puntos = 0;
      estado.bloqueado = false;
      estado.enJuego = true;
      // En Aprender respetamos los dibujos del nivel; en Reto, sin ayudas.
      estado.visual = estado.modo === "aprender" ? !!nivel.visual : false;
      if (estado.modo === "aprender") estado.voz = true;
      actualizarBotones();
      mostrarPantalla("#screen-juego");
      siguiente();
    }

    function siguiente() {
      $("#correccion").classList.add("hidden");
      if (estado.pregunta >= NUM_PREGUNTAS) return terminar();
      estado.bloqueado = false;
      estado.visualTemporal = false;

      const q = op.generar(estado.nivel, estado.pregunta, estado);
      estado.cuenta = q;
      estado.correcta = q.r;

      $("#txtProgreso").textContent = "Pregunta " + (estado.pregunta + 1) + " de " + NUM_PREGUNTAS;
      $("#txtPuntos").textContent = estado.puntos;
      $("#barraFill").style.width = (estado.pregunta / NUM_PREGUNTAS) * 100 + "%";
      $("#operacion").innerHTML = op.texto(q) + ' <span class="qmark">?</span>';

      pintarVisual();

      const valores = op.distractores(q, estado.nivel);
      const cont = $("#opciones");
      cont.innerHTML = "";
      valores.forEach((v) => {
        const btn = document.createElement("button");
        btn.className = "opcion";
        btn.type = "button";
        btn.textContent = v;
        btn.dataset.v = v;
        btn.addEventListener("click", () => responder(btn, v));
        cont.appendChild(btn);
      });

      const fb = $("#feedback");
      fb.textContent = "";
      fb.className = "feedback";

      iniciarTiempo();
      setTimeout(() => decir(op.voz(q)), 280);
    }

    function revelarCorrecta() {
      $$(".opcion").forEach((b) => { if (Number(b.dataset.v) === estado.correcta) b.classList.add("ok"); });
    }

    function vozResultado(q) {
      return op.voz(q) + " son " + window.numeroAVoz(q.r);
    }

    // Panel de corrección: tapa el juego, agranda la operación y los dibujos,
    // y espera a que el niño pulse "Siguiente" (no avanza solo).
    function mostrarCorreccion(porTiempo) {
      const conDibujos = op.visual && estado.nivel && estado.nivel.visual !== false;
      $("#corrTitulo").textContent = porTiempo ? "¡Se acabó el tiempo! Mira bien:" : "Casi... ¡mira!";
      $("#corrEcuacion").innerHTML =
        op.texto(estado.cuenta) + ' <span class="corr-resp">' + estado.correcta + "</span>";
      const cv = $("#corrVisual");
      if (conDibujos) {
        cv.classList.remove("hidden");
        cv.innerHTML = op.visual(estado.cuenta, window.pick(window.OBJETOS));
      } else {
        cv.innerHTML = "";
        cv.classList.add("hidden");
      }
      $("#btnContar").classList.toggle("hidden", !conDibujos);
      $("#correccion").classList.remove("hidden");
      if (estado.voz) setTimeout(() => decir(vozResultado(estado.cuenta)), 250);
    }

    function responder(btn, v) {
      if (estado.bloqueado) return;
      estado.bloqueado = true;
      detenerTiempo();
      $$(".opcion").forEach((b) => (b.disabled = true));
      const fb = $("#feedback");

      if (v === estado.correcta) {
        estado.puntos++;
        btn.classList.add("ok");
        $("#txtPuntos").textContent = estado.puntos;
        const feliz = ["¡Muy bien! ⭐", "¡Genial! 🎉", "¡Eres un crack! 💪", "¡Correcto! 🌟"];
        fb.textContent = feliz[window.rnd(0, feliz.length - 1)];
        fb.className = "feedback ok";
        beepOk();
        if (estado.modo === "aprender") decir("¡Muy bien!");
        setTimeout(() => { estado.pregunta++; siguiente(); }, 950);
      } else {
        btn.classList.add("mal");
        revelarCorrecta();
        beepMal();
        mostrarCorreccion(false);
      }
    }

    function seAgoto() {
      if (estado.bloqueado) return;
      estado.bloqueado = true;
      detenerTiempo();
      $$(".opcion").forEach((b) => (b.disabled = true));
      revelarCorrecta();
      beepMal();
      mostrarCorreccion(true);
    }

    function terminar() {
      estado.enJuego = false;
      detenerTiempo();
      mostrarPantalla("#screen-final");
      $("#barraFill").style.width = "100%";
      const st = estado.puntos >= NUM_PREGUNTAS ? 3 : estado.puntos >= Math.ceil(NUM_PREGUNTAS * 0.7) ? 2 : 1;
      guardarMejor(estado.nivel.id, st);
      $("#estrellas").textContent = "⭐".repeat(st) + "☆".repeat(3 - st);
      $("#finalEmoji").textContent = estado.puntos >= NUM_PREGUNTAS ? "🏆" : estado.puntos >= 7 ? "🎉" : "💪";
      $("#tituloFinal").textContent =
        estado.puntos >= NUM_PREGUNTAS ? "¡PERFECTO! Eres increíble" :
        estado.puntos >= 7 ? "¡Muy bien hecho!" : "¡Buen trabajo!";
      $("#detalleFinal").textContent =
        "Acertaste " + estado.puntos + " de " + NUM_PREGUNTAS + " · Modo " +
        (estado.modo === "aprender" ? "Aprender 🎓" : "Reto ⚡");
      beepFin();
    }

    /* ---------- Eventos ---------- */
    function conectar() {
      $("#brand").textContent = op.brand;
      $("#tituloNivel").textContent = op.titulo;
      $("#tituloFinal2") && ($("#tituloFinal2").textContent = op.titulo);
      $$(".modo").forEach((b) => b.addEventListener("click", () => setModo(b.dataset.modo)));
      $("#btnVoz").addEventListener("click", () => {
        estado.voz = !estado.voz;
        actualizarBotones();
        if (!estado.voz && "speechSynthesis" in window) window.speechSynthesis.cancel();
      });
      $("#btnVisual").addEventListener("click", () => {
        estado.visual = !estado.visual;
        estado.visualTemporal = false;
        actualizarBotones();
        if (estado.enJuego) pintarVisual();
      });
      $("#btnSalir").addEventListener("click", () => { estado.enJuego = false; detenerTiempo(); pintarNiveles(); mostrarPantalla("#screen-nivel"); });
      $("#btnOtra").addEventListener("click", () => iniciar(estado.nivel));
      $("#btnNivel").addEventListener("click", () => { pintarNiveles(); mostrarPantalla("#screen-nivel"); });
      $("#btnSiguiente").addEventListener("click", () => {
        $("#correccion").classList.add("hidden");
        estado.pregunta++;
        siguiente();
      });
      $("#btnContar").addEventListener("click", () => decir(vozResultado(estado.cuenta)));

      // Selector de voz (elige la más natural y deja cambiarla)
      const selVoz = $("#selVoz");
      if (selVoz) {
        selVoz.addEventListener("change", () => {
          const v = selVoz.value;
          if (v === "") {
            try { localStorage.removeItem("mate-voz"); } catch (e) {}
            estado.vozObj = vocesOrdenadas[0] || null;
          } else {
            const obj = vocesOrdenadas[Number(v)] || null;
            estado.vozObj = obj;
            try { localStorage.setItem("mate-voz", obj ? obj.name : ""); } catch (e) {}
          }
          estado.voz = true;
          actualizarBotones();
          decir("Hola, así suena la voz. " + op.voz(op.demo || { a: 3, b: 2, r: 5 }));
        });
      }

      // Selector de tabla (multiplicación): permite practicar una tabla concreta.
      const selTabla = $("#selTabla");
      if (selTabla && op.tablas && op.tablas.length) {
        const filaT = $("#filaTabla");
        if (filaT) filaT.classList.remove("hidden");
        selTabla.innerHTML = "";
        op.tablas.forEach((t) => {
          const o = document.createElement("option");
          o.value = String(t);
          o.textContent = "Del " + t;
          selTabla.appendChild(o);
        });
        let guardada = 0;
        try { guardada = parseInt(localStorage.getItem("mate-tabla"), 10) || 0; } catch (e) {}
        selTabla.value = op.tablas.indexOf(guardada) >= 0 ? String(guardada) : String(op.tablas[0]);
        estado.tabla = Number(selTabla.value);
        selTabla.addEventListener("change", () => {
          estado.tabla = Number(selTabla.value);
          try { localStorage.setItem("mate-tabla", String(estado.tabla)); } catch (e) {}
        });
      }
      if ("speechSynthesis" in window) {
        cargarVoces();
        window.speechSynthesis.onvoiceschanged = cargarVoces;
      }
    }

    /* ---------- Arranque ---------- */
    pintarNiveles();
    conectar();
    setModo("aprender");
    mostrarPantalla("#screen-nivel");

    /* Ayuda para pruebas automáticas (sin efecto para el usuario) */
    window.JUEGO = {
      iniciarNivel: (id) => iniciar(op.niveles.find((n) => n.id === id)),
      setModo,
      estado: () => ({ modo: estado.modo, nivel: estado.nivel && estado.nivel.id, pregunta: estado.pregunta, puntos: estado.puntos, correcta: estado.correcta, visual: estado.visual }),
      responderCorrecta: () => {
        const b = $$(".opcion").find((x) => Number(x.dataset.v) === estado.correcta);
        if (b) b.click();
      },
      responderValor: (v) => {
        const b = $$(".opcion").find((x) => Number(x.dataset.v) === v);
        if (b) b.click();
      },
      opciones: () => $$(".opcion").map((b) => Number(b.dataset.v)),
      visualVisible: () => !$("#visual").classList.contains("hidden") && $("#visual").innerHTML.length > 0,
      objetosVisual: () => $$("#visual .obj").length,
      tiempoVisible: () => !$("#barraTiempo").classList.contains("hidden"),
      correccionVisible: () => !$("#correccion").classList.contains("hidden"),
      corrEcuacion: () => $("#corrEcuacion").textContent,
      objetosCorreccion: () => $$("#corrVisual .obj").length,
      siguiente: () => $("#btnSiguiente").click(),
      voces: () => vocesOrdenadas.map((v) => v.name + " (" + v.lang + ")"),
      vozActual: () => (estado.vozObj ? estado.vozObj.name : null),
      selVozValor: () => ($("#selVoz") ? $("#selVoz").value : null),
      tablaActual: () => estado.tabla,
      setTabla: (t) => { estado.tabla = Number(t); const s = $("#selTabla"); if (s) s.value = String(t); },
    };
  }

  window.Juego = { arrancar };
})();
