/* =========================================================
   NÚCLEO COMPARTIDO de generación de operaciones.
   Lo usan el juego (juego/operaciones.js) y las fichas
   (fichas/generador.js) para no duplicar la lógica matemática.

   Todas las funciones devuelven { a, b, r } (y "resto" en
   divisiones con residuo):
     suma/resta:        a OP b = r
     multiplicacion:     a × b = r
     division:           a ÷ b = r   (a = dividendo, b = divisor)
   ========================================================= */
(function () {
  "use strict";

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  /* ---------- Sumas ---------- */
  function suma(level) {
    if (level === "hasta10") { const a = rnd(1, 9); const b = rnd(1, 10 - a); return { a, b, r: a + b }; }
    if (level === "hasta20") { const a = rnd(1, 19); const b = rnd(1, 20 - a); return { a, b, r: a + b }; }
    // Con llevadas: las unidades suman 10 o más
    let u1, u2;
    do { u1 = rnd(1, 9); u2 = rnd(1, 9); } while (u1 + u2 < 10);
    const a = rnd(1, 4) * 10 + u1, b = rnd(1, 4) * 10 + u2;
    return { a, b, r: a + b };
  }

  /* ---------- Restas ---------- */
  function resta(level) {
    if (level === "hasta10") { const a = rnd(2, 10); const b = rnd(1, a - 1); return { a, b, r: a - b }; }
    if (level === "hasta20") { const a = rnd(5, 20); const b = rnd(1, Math.min(a - 1, 10)); return { a, b, r: a - b }; }
    // Con llevadas (prestando): las unidades del sustraendo son mayores
    const u1 = rnd(1, 8), u2 = rnd(u1 + 1, 9), t1 = rnd(2, 9), t2 = rnd(1, t1 - 1);
    const a = t1 * 10 + u1, b = t2 * 10 + u2;
    return { a, b, r: a - b };
  }

  /* ---------- Multiplicación ----------
     level: "hasta5" | "hasta10"
     tabla: null (aleatoria) o un número 2..10 (practica esa tabla)   */
  function multiplicacion(level, tabla) {
    const max = level === "hasta5" ? 5 : 10;
    if (tabla && tabla >= 2 && tabla <= 10) {
      const a = tabla;
      const b = rnd(1, 10); // tabla completa: ×1 ... ×10
      return { a, b, r: a * b };
    }
    const a = rnd(2, max);
    const b = rnd(2, max);
    return { a, b, r: a * b };
  }

  /* ---------- División ----------
     level: "hasta5" | "hasta10" | "divisores"
     tipo:  "exacta" | "residuo" | "mezcla"
     Nunca divide entre 0 (el divisor es siempre >= 2).              */
  function division(level, tipo) {
    let maxD = 10, maxC = 10, divisores = null;
    if (level === "hasta5") { maxD = 5; maxC = 5; }
    else if (level === "divisores") { divisores = [2, 5, 10]; }

    const b = divisores ? divisores[rnd(0, divisores.length - 1)] : rnd(2, maxD);
    const c = rnd(1, maxC);
    const conResto = tipo === "residuo" || (tipo === "mezcla" && rnd(0, 1) === 1);

    if (conResto) {
      const resto = rnd(1, b - 1);          // 0 < resto < divisor
      return { a: b * c + resto, b, r: c, resto };
    }
    return { a: b * c, b, r: c, resto: 0 };
  }

  window.GEN = { rnd, suma, resta, multiplicacion, division };
})();
