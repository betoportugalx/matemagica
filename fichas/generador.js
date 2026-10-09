/* =========================================================
   GENERADOR COMPARTIDO de fichas para imprimir.
   Sirve para sumas, restas, multiplicaciones y divisiones.
   Cada página llama a: iniciarFichas('suma' | 'resta' |
   'multiplicacion' | 'division').
   La generación matemática vive en ../comun/generadores.js (GEN).
   ========================================================= */
"use strict";

const $ = (s) => document.querySelector(s);

const OPS_FICHAS = {
  suma: {
    id: "suma",
    signo: "+",
    frase: "Resuelve las sumas.",
    edad: "4-9 años",
    nivelDef: "hasta20",
    niveles: ["hasta10", "hasta20", "llevadas"],
    titulo: { hasta10: "Sumas hasta 10", hasta20: "Sumas hasta 20", llevadas: "Sumas con llevadas" },
    generar: (nv) => window.GEN.suma(nv),
  },

  resta: {
    id: "resta",
    signo: "−",
    frase: "Resuelve las restas.",
    edad: "4-9 años",
    nivelDef: "hasta10",
    niveles: ["hasta10", "hasta20", "llevadas"],
    titulo: { hasta10: "Restas hasta 10", hasta20: "Restas hasta 20", llevadas: "Restas con llevadas" },
    generar: (nv) => window.GEN.resta(nv),
  },

  multiplicacion: {
    id: "multiplicacion",
    signo: "×",
    frase: "Resuelve las multiplicaciones.",
    edad: "6-10 años",
    nivelDef: "hasta10",
    niveles: ["hasta5", "hasta10"],
    titulo: { hasta5: "Multiplicaciones (tablas del 2 al 5)", hasta10: "Multiplicaciones (tablas del 2 al 10)" },
    generar: (nv, cfg) => window.GEN.multiplicacion(nv, cfg.tabla === "todas" ? null : Number(cfg.tabla)),
  },

  division: {
    id: "division",
    signo: "÷",
    frase: "Resuelve las divisiones.",
    edad: "7-10 años",
    nivelDef: "hasta10",
    niveles: ["hasta5", "hasta10"],
    titulo: { hasta5: "Divisiones (divisor hasta 5)", hasta10: "Divisiones (divisor hasta 10)" },
    generar: (nv, cfg) => window.GEN.division(nv, cfg.tipo || "exacta"),
  },
};

let OP = OPS_FICHAS.suma;

function leerOpciones() {
  const cfg = {};
  const t = $("#tabla");
  if (t) cfg.tabla = t.value;
  const ti = $("#tipo");
  if (ti) cfg.tipo = ti.value;
  return cfg;
}

function poblarNiveles() {
  const sel = $("#nivel");
  sel.innerHTML = "";
  OP.niveles.forEach((id) => {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = OP.titulo[id];
    sel.appendChild(o);
  });
  sel.value = OP.nivelDef;
}

// Muestra u oculta los selectores propios de cada operación.
function actualizarSelectores() {
  const filaTabla = $("#filaTabla");
  const filaTipo = $("#filaTipo");
  if (filaTabla) filaTabla.classList.toggle("hidden", OP.id !== "multiplicacion");
  if (filaTipo) filaTipo.classList.toggle("hidden", OP.id !== "division");
}

function subtitulo() {
  let t = OP.frase;
  if (OP.id === "division") {
    const tipo = $("#tipo") ? $("#tipo").value : "exacta";
    if (tipo !== "exacta") t = "Resuelve las divisiones. Escribe el cociente y el resto.";
  }
  return t + " · " + OP.edad;
}

function hojaEjercicios(lista, nv, formato) {
  const items = lista.map((c) => {
    if (formato === "vertical") {
      return '<div class="item-v"><div class="num">' + c.a + "</div>" +
             '<div class="num">' + OP.signo + " " + c.b + '</div><div class="linea"></div>' +
             '<div class="espacio"></div></div>';
    }
    return '<div class="item"><span class="op">' + c.a + " " + OP.signo + " " + c.b + " =</span>" +
           '<span class="resp"></span></div>';
  }).join("");
  const gridCls = formato === "vertical" ? "grid-v" : "grid";
  return (
    '<article class="pagina">' +
      '<div class="titulo-hoja">' + OP.titulo[nv] + "</div>" +
      '<p class="sub">' + subtitulo() + "</p>" +
      '<div class="nombre"><span>Nombre:</span><span>Fecha:</span></div>' +
      '<div class="' + gridCls + '">' + items + "</div>" +
    "</article>"
  );
}

function hojaSoluciones(lista, nv) {
  const filas = lista.map((c) => {
    let txt = c.a + " " + OP.signo + " " + c.b + " = <b>" + c.r + "</b>";
    if (OP.id === "division" && c.resto) txt += ' <small>(resto ' + c.resto + ")</small>";
    return "<div>" + txt + "</div>";
  }).join("");
  return (
    '<article class="pagina">' +
      '<div class="titulo-hoja">Soluciones · ' + OP.titulo[nv] + "</div>" +
      '<p class="sub">Hoja para el adulto</p>' +
      '<div class="clave-grid">' + filas + "</div>" +
    "</article>"
  );
}

function generar() {
  const nv = $("#nivel").value;
  const formato = $("#formato").value;
  const cantidad = parseInt($("#cantidad").value, 10);
  const conClave = $("#clave").checked;
  const cfg = leerOpciones();

  const lista = [];
  for (let i = 0; i < cantidad; i++) lista.push(OP.generar(nv, cfg));

  let html = hojaEjercicios(lista, nv, formato);
  if (conClave) html += hojaSoluciones(lista, nv);
  $("#hojas").innerHTML = html;
}

// El formato vertical es mejor para las llevadas: se ajusta automáticamente.
function setFormatoAuto() {
  $("#formato").value = $("#nivel").value === "llevadas" ? "vertical" : "horizontal";
}

function iniciarFichas(opId) {
  OP = OPS_FICHAS[opId] || OPS_FICHAS.suma;
  const selOp = $("#operacion");
  if (selOp) selOp.value = OP.id;

  poblarNiveles();
  actualizarSelectores();
  setFormatoAuto();
  generar();

  if (selOp) {
    selOp.addEventListener("change", () => {
      OP = OPS_FICHAS[selOp.value] || OPS_FICHAS.suma;
      poblarNiveles();
      actualizarSelectores();
      setFormatoAuto();
      generar();
    });
  }
  $("#nivel").addEventListener("change", () => { setFormatoAuto(); generar(); });
  $("#formato").addEventListener("change", generar);
  $("#cantidad").addEventListener("change", generar);
  $("#clave").addEventListener("change", generar);
  const t = $("#tabla"); if (t) t.addEventListener("change", generar);
  const ti = $("#tipo"); if (ti) ti.addEventListener("change", generar);
  $("#btnGen").addEventListener("click", generar);
}
