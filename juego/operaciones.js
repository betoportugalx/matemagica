/* =========================================================
   OPERACIONES del juego. Cada una se define aquí y las páginas
   la usan con: Juego.arrancar(OPERACIONES.<nombre>)
   Para añadir una nueva operación basta con crear otro objeto
   con la misma forma (generar, texto, voz, distractores, visual).
   La generación matemática vive en ../comun/generadores.js (GEN).
   ========================================================= */

/* ---------- Ayudas para dibujar los objetos ---------- */
function grupoObjetos(obj, n, tachar) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += '<span class="obj' + (tachar ? " tachado" : "") +
         '" style="animation-delay:' + (i * 55) + 'ms">' + obj + "</span>";
  }
  return '<span class="objs">' + s + "</span>";
}
function columnaObjetos(num, obj, n, tachar) {
  return '<div class="col-v"><span class="num-v">' + num + "</span>" +
         grupoObjetos(obj, n, tachar) + "</div>";
}
/* Grupo donde solo los últimos "tachados" salen tachados (para restas) */
function grupoMezclado(obj, total, tachados) {
  let s = "";
  for (let i = 0; i < total; i++) {
    const t = i >= total - tachados;
    s += '<span class="obj' + (t ? " tachado" : "") +
         '" style="animation-delay:' + (i * 55) + 'ms">' + obj + "</span>";
  }
  return '<span class="objs">' + s + "</span>";
}
/* Rejilla en filas (para multiplicación): "a × b" = a filas de b objetos */
function filasObjetos(obj, filas, cols) {
  const total = filas * cols;
  const delay = total > 40 ? 12 : 55; // con muchos objetos, animación más rápida
  let s = "";
  for (let f = 0; f < filas; f++) {
    s += '<span class="fila-objs">';
    for (let c = 0; c < cols; c++) {
      const i = f * cols + c;
      s += '<span class="obj" style="animation-delay:' + (i * delay) + 'ms">' + obj + "</span>";
    }
    s += "</span>";
  }
  return '<span class="rejilla">' + s + "</span>";
}
/* Grupos de reparto (para división): reparte en "grupos" de "porGrupo" */
function gruposReparto(obj, grupos, porGrupo) {
  let s = "";
  for (let g = 0; g < grupos; g++) {
    s += '<span class="grupo-reparto">';
    for (let i = 0; i < porGrupo; i++) {
      const k = g * porGrupo + i;
      s += '<span class="obj" style="animation-delay:' + (k * 35) + 'ms">' + obj + "</span>";
    }
    s += "</span>";
  }
  return '<span class="reparto">' + s + "</span>";
}

window.OPERACIONES = {};

/* =========================  SUMAS  ========================= */
OPERACIONES.suma = {
  id: "suma",
  brand: "🧮 Sumas para niños",
  titulo: "Elige tu juego de sumas",
  vozSimbolo: "más",

  niveles: [
    { id: "hasta20", nombre: "Sumas hasta 20", emoji: "➕", edad: "5-7 años", desc: "El más jugado",
      destacado: true, visual: true, opciones: 4, max: 20 },
    { id: "hasta10", nombre: "Sumas hasta 10", emoji: "🐣", edad: "4-6 años", desc: "Fácil",
      visual: true, opciones: 3, max: 10 },
    { id: "llevadas", nombre: "Sumas con llevadas", emoji: "🚀", edad: "7-9 años", desc: "Avanzado",
      visual: false, opciones: 4 },
  ],

  generar(nivel) { return window.GEN.suma(nivel.id); },

  texto(q) { return q.a + " + " + q.b + " ="; },

  voz(q) { return window.numeroAVoz(q.a) + " más " + window.numeroAVoz(q.b); },

  distractores(q, nivel) {
    const n = nivel.opciones || 4;
    const ds = nivel.max === 10 ? [1, -1, 2, -2, 3, -3]
      : nivel.max === 20 ? [1, -1, 2, -2, 10, -10, 3, -3]
      : [1, -1, 10, -10, 9, -9, 2, -2];
    const set = new Set([q.r]);
    for (const d of window.shuffle(ds.slice())) {
      if (set.size >= n) break;
      const c = q.r + d;
      if (c >= 0 && !set.has(c)) set.add(c);
    }
    let k = 1;
    while (set.size < n) { const c = q.r + k; if (c >= 0 && !set.has(c)) set.add(c); k++; }
    return window.shuffle([...set]);
  },

  visual(q, obj) {
    return columnaObjetos(q.a, obj, q.a, false) +
           '<span class="vsigno">+</span>' +
           columnaObjetos(q.b, obj, q.b, false);
  },
};

/* =========================  RESTAS  ========================= */
OPERACIONES.resta = {
  id: "resta",
  brand: "➖ Restas para niños",
  titulo: "Elige tu juego de restas",
  vozSimbolo: "menos",

  niveles: [
    { id: "hasta10", nombre: "Restas hasta 10", emoji: "🐣", edad: "4-6 años", desc: "Para empezar",
      destacado: true, visual: true, opciones: 3, max: 10 },
    { id: "hasta20", nombre: "Restas hasta 20", emoji: "➖", edad: "5-7 años", desc: "Un poco más difícil",
      visual: true, opciones: 4, max: 20 },
    { id: "llevadas", nombre: "Restas con llevadas", emoji: "🚀", edad: "7-9 años", desc: "Avanzado (prestando)",
      visual: false, opciones: 4 },
  ],

  generar(nivel) { return window.GEN.resta(nivel.id); },

  texto(q) { return q.a + " − " + q.b + " ="; },

  voz(q) { return window.numeroAVoz(q.a) + " menos " + window.numeroAVoz(q.b); },

  distractores(q, nivel) {
    const n = nivel.opciones || 4;
    const ds = nivel.max === 10 ? [1, -1, 2, -2, 3, -3]
      : nivel.max === 20 ? [1, -1, 2, -2, 10, -10, 3, -3]
      : [1, -1, 10, -10, 9, -9, 2, -2];
    const set = new Set([q.r]);
    for (const d of window.shuffle(ds.slice())) {
      if (set.size >= n) break;
      const c = q.r + d;
      if (c >= 0 && !set.has(c)) set.add(c);
    }
    let k = 1;
    while (set.size < n) { const c = q.r + k; if (c >= 0 && !set.has(c)) set.add(c); k++; }
    return window.shuffle([...set]);
  },

  // Se dibujan los "a" objetos y se tachan los "b" que se quitan:
  // lo que queda sin tachar es el resultado.
  visual(q, obj) {
    return '<div class="col-v"><span class="num-v">' + q.a + "</span>" +
           grupoMezclado(obj, q.a, q.b) + "</div>";
  },
};

/* =====================  MULTIPLICACIÓN  ===================== */
OPERACIONES.multiplicacion = {
  id: "multiplicacion",
  brand: "✖️ Multiplicación para niños",
  titulo: "Elige tu juego de multiplicación",
  vozSimbolo: "por",
  tablas: [2, 3, 4, 5, 6, 7, 8, 9, 10], // habilita el selector "Practica una tabla"

  niveles: [
    { id: "hasta5", nombre: "Tablas del 2 al 5", emoji: "✖️", edad: "6-8 años", desc: "Para empezar",
      visual: true, opciones: 4 },
    { id: "hasta10", nombre: "Tablas del 2 al 10", emoji: "🚀", edad: "7-10 años", desc: "El más jugado",
      destacado: true, visual: true, opciones: 4 },
    { id: "tabla", nombre: "Practica una tabla", emoji: "🎯", edad: "6-10 años", desc: "Elige la tabla abajo",
      visual: true, opciones: 4 },
  ],

  // En "Practica una tabla" se usa la tabla elegida en el selector de la pantalla.
  generar(nivel, pregunta, estado) {
    const tabla = nivel.id === "tabla" ? (estado && estado.tabla) : null;
    return window.GEN.multiplicacion(nivel.id === "tabla" ? "hasta10" : nivel.id, tabla);
  },

  texto(q) { return q.a + " × " + q.b + " ="; },

  voz(q) { return window.numeroAVoz(q.a) + " por " + window.numeroAVoz(q.b); },

  distractores(q, nivel) {
    const n = nivel.opciones || 4;
    const ds = window.shuffle([1, -1, 2, -2, q.a, -q.a, q.b, -q.b]);
    const set = new Set([q.r]);
    for (const d of ds) {
      if (set.size >= n) break;
      const c = q.r + d;
      if (c >= 0 && !set.has(c)) set.add(c);
    }
    let k = 1;
    while (set.size < n) { const c = q.r + k; if (c >= 0 && !set.has(c)) set.add(c); k++; }
    return window.shuffle([...set]);
  },

  // "a × b" = a filas de b objetos
  visual(q, obj) { return filasObjetos(obj, q.a, q.b); },
};

/* =========================  DIVISIÓN  ========================= */
OPERACIONES.division = {
  id: "division",
  brand: "➗ División para niños",
  titulo: "Elige tu juego de división",
  vozSimbolo: "entre",
  demo: { a: 6, b: 2, r: 3 }, // ejemplo para la prueba de voz

  niveles: [
    { id: "hasta5", nombre: "Dividir hasta 5", emoji: "➗", edad: "6-8 años", desc: "Para empezar",
      visual: true, opciones: 3 },
    { id: "hasta10", nombre: "Dividir hasta 10", emoji: "🚀", edad: "7-10 años", desc: "El más jugado",
      destacado: true, visual: true, opciones: 4 },
    { id: "divisores", nombre: "Entre 2, 5 y 10", emoji: "🎯", edad: "6-9 años", desc: "Divisores fáciles",
      visual: true, opciones: 4 },
  ],

  // En el juego, solo divisiones exactas (resultado entero).
  generar(nivel) { return window.GEN.division(nivel.id, "exacta"); },

  texto(q) { return q.a + " ÷ " + q.b + " ="; },

  voz(q) { return window.numeroAVoz(q.a) + " entre " + window.numeroAVoz(q.b); },

  distractores(q, nivel) {
    const n = nivel.opciones || 4;
    const ds = window.shuffle([1, -1, 2, -2, q.b, -q.b, q.a - q.b]);
    const set = new Set([q.r]);
    for (const d of ds) {
      if (set.size >= n) break;
      const c = q.r + d;
      if (c >= 0 && !set.has(c)) set.add(c);
    }
    let k = 1;
    while (set.size < n) { const c = q.r + k; if (c >= 0 && !set.has(c)) set.add(c); k++; }
    return window.shuffle([...set]);
  },

  // Se reparte el total "a" en "b" grupos iguales (cada grupo = resultado).
  visual(q, obj) { return gruposReparto(obj, q.b, q.r); },
};
