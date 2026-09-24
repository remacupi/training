"use strict";

let MENUS = [];
let ENTRENOS = [];
const elegidos = new Set();
const CLAVE = "registro-entrenos";

/* ---------- utilidades ---------- */

function leerRegistro() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || "{}");
  } catch {
    return {};
  }
}

function guardarRegistro(reg) {
  localStorage.setItem(CLAVE, JSON.stringify(reg));
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function esc(t) {
  return String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

/* ---------- menús ---------- */

function ingredientesUnicos() {
  const set = new Set();
  MENUS.forEach((m) => m.items.forEach((i) => set.add(i.nombre)));
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

function pintarIngredientes() {
  const texto = document.getElementById("buscador").value.trim().toLowerCase();
  const cont = document.getElementById("ingredientes");
  cont.innerHTML = "";
  ingredientesUnicos()
    .filter((n) => n.toLowerCase().includes(texto))
    .forEach((n) => {
      const b = document.createElement("button");
      b.className = "chip" + (elegidos.has(n) ? " marcado" : "");
      b.textContent = n;
      b.onclick = () => {
        elegidos.has(n) ? elegidos.delete(n) : elegidos.add(n);
        pintarMenus();
      };
      cont.appendChild(b);
    });

  const sel = document.getElementById("elegidos");
  sel.innerHTML = "";
  elegidos.forEach((n) => {
    const b = document.createElement("button");
    b.className = "chip marcado";
    b.textContent = n + " ✕";
    b.onclick = () => {
      elegidos.delete(n);
      pintarMenus();
    };
    sel.appendChild(b);
  });
}

function pintarMenus() {
  pintarIngredientes();
  const filtrados = MENUS.filter((m) => {
    const nombres = m.items.map((i) => i.nombre);
    return [...elegidos].every((e) => nombres.includes(e));
  });

  document.getElementById("resumen").textContent =
    elegidos.size === 0
      ? `${MENUS.length} menús en total`
      : `${filtrados.length} menús con ${[...elegidos].join(" + ")}`;

  const cont = document.getElementById("lista-menus");
  cont.innerHTML = filtrados.length
    ? filtrados
        .map(
          (m) => `
      <article class="tarjeta">
        <p class="etiqueta">${esc(m.comida)}</p>
        <h3>Opción ${m.opcion}</h3>
        <table>
          <thead><tr><th>Ingrediente</th><th>Macro</th><th>Cantidad</th></tr></thead>
          <tbody>
            ${m.items
              .map(
                (i) => `<tr>
                  <td>${esc(i.nombre)}</td>
                  <td><span class="macro ${i.macro}">${i.macro}</span></td>
                  <td>${esc(i.cantidad)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </article>`,
        )
        .join("")
    : `<p class="vacio">Ningún menú lleva todos esos ingredientes a la vez.</p>`;
}

/* ---------- entrenos ---------- */

function pintarEntrenos() {
  const reg = leerRegistro();
  document.getElementById("detalle-entreno").innerHTML = "";
  document.getElementById("lista-entrenos").innerHTML = ENTRENOS.map((e) => {
    const fechas = reg[e.id] || [];
    return `<article class="tarjeta tarjeta-enlace" data-entreno="${e.id}">
      <p class="etiqueta">${esc(e.subtitulo)}</p>
      <h3>${esc(e.titulo)}</h3>
      <p class="ayuda">${e.ejercicios.length} ejercicios</p>
      <p class="ayuda">${
        fechas.length
          ? `Hecho ${fechas.length} ${fechas.length === 1 ? "vez" : "veces"} · última: ${formatearFecha(fechas[0])}`
          : "Todavía sin hacer"
      }</p>
      <span class="etiqueta" style="color:var(--principal)">Ver entreno →</span>
    </article>`;
  }).join("");

  document.querySelectorAll("[data-entreno]").forEach((el) => {
    el.onclick = () => pintarDetalle(el.dataset.entreno);
  });
}

function pintarDetalle(id) {
  const e = ENTRENOS.find((x) => x.id === id);
  if (!e) return;
  const reg = leerRegistro();
  const fechas = reg[id] || [];
  document.getElementById("lista-entrenos").innerHTML = "";
  document.getElementById("detalle-entreno").innerHTML = `
    <button class="boton-secundario" id="volver">← Volver a los entrenos</button>
    <h2 style="font-family:Georgia,serif">${esc(e.titulo)}</h2>
    <p class="ayuda">${esc(e.subtitulo)}</p>
    <div class="tarjeta" style="margin-top:12px;overflow-x:auto">
      <table>
        <thead><tr><th>Orden</th><th>Ejercicio</th><th>S3-S4</th><th>S5-S6</th><th>S7-S8</th><th>S9-S10</th><th>Vídeo</th></tr></thead>
        <tbody>
          ${e.ejercicios
            .map(
              (j) => `<tr>
              <td><strong>${esc(j.orden)}</strong></td>
              <td>${esc(j.nombre)}${j.nota ? `<br><span class="ayuda">${esc(j.nota)}</span>` : ""}</td>
              <td>${esc(j.tempo)}</td>
              <td>${esc(j.reps)}</td>
              <td>${esc(j.series)}</td>
              <td>${esc(j.rir)}</td>
              <td><a href="${esc(j.video)}" target="_blank" rel="noopener">Ver vídeo</a></td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <p style="margin-top:16px"><button class="boton" id="marcar">Marcar como hecho hoy</button></p>
    <p class="etiqueta">Días que lo has hecho</p>
    ${
      fechas.length
        ? `<ul class="fechas">${fechas.map((f) => `<li>${formatearFecha(f)}</li>`).join("")}</ul>`
        : `<p class="ayuda">Aún no hay días guardados.</p>`
    }
  `;
  document.getElementById("volver").onclick = pintarEntrenos;
  document.getElementById("marcar").onclick = () => {
    const r = leerRegistro();
    const lista = r[id] || [];
    lista.unshift(new Date().toISOString());
    r[id] = lista;
    guardarRegistro(r);
    pintarDetalle(id);
  };
}

/* ---------- pestañas e inicio ---------- */

document.querySelectorAll(".pestana").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll(".pestana").forEach((x) => x.classList.remove("activa"));
    b.classList.add("activa");
    const menus = b.dataset.vista === "menus";
    document.getElementById("vista-menus").hidden = !menus;
    document.getElementById("vista-entrenos").hidden = menus;
  };
});

document.getElementById("buscador").oninput = pintarIngredientes;
document.getElementById("limpiar").onclick = () => {
  elegidos.clear();
  document.getElementById("buscador").value = "";
  pintarMenus();
};

(async function iniciar() {
  try {
    const [m, e] = await Promise.all([
      fetch("datos/menus.json").then((r) => r.json()),
      fetch("datos/entrenos.json").then((r) => r.json()),
    ]);
    MENUS = m;
    ENTRENOS = e;
    pintarMenus();
    pintarEntrenos();
  } catch {
    document.querySelector("main").innerHTML =
      '<p class="vacio">No se han podido cargar los datos. Abre la página desde un servidor web (no con doble clic en el archivo).</p>';
  }
})();
