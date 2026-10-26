
// =====================================
// SALUD PARA MAYORES
// PROTOTIPO LOCAL - 2026
// =====================================

const $ = id => document.getElementById(id);

const CLAVES = {
  usuarios: "spm_usuarios_v2",
  presiones: "spm_presiones_v2",
  medicamentos: "spm_medicamentos_v2",
  mensajes: "spm_mensajes_v2",
  sesion: "spm_sesion_v2"
};

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch {
    return [];
  }
}

function guardar(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

function fechaHora() {
  return new Date().toLocaleString("es-CR");
}

function hoy() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function crear(tag, texto, clase = "") {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

function boton(texto, clase, accion) {
  const b = crear("button", texto, clase);
  b.type = "button";
  b.addEventListener("click", accion);
  return b;
}

// =====================================
// USUARIOS Y ADMINISTRADOR
// =====================================

const ADMIN_CORREO = "admin@ejemplo.test";
const ADMIN_CLAVE = "AdminDemo123";

function usuarios() {
  return leer(CLAVES.usuarios);
}

function iniciarAdministrador() {
  const lista = usuarios();

  if (!lista.some(u => u.rol === "admin")) {
    lista.push({
      id: crypto.randomUUID(),
      nombre: "Administrador",
      correo: ADMIN_CORREO,
      clave: ADMIN_CLAVE,
      rol: "admin",
      estado: "aprobado"
    });

    guardar(CLAVES.usuarios, lista);
  }
}

function sesionActual() {
  const id = sessionStorage.getItem(CLAVES.sesion);

  return usuarios().find(
    u => u.id === id && u.estado === "aprobado"
  ) || null;
}

function cambiarPestana(registro) {
  $("formLogin").hidden = registro;
  $("formRegistro").hidden = !registro;

  $("tabLogin").classList.toggle("activo", !registro);
  $("tabRegistro").classList.toggle("activo", registro);
}

$("tabLogin").onclick = () => cambiarPestana(false);
$("tabRegistro").onclick = () => cambiarPestana(true);

// REGISTRO DE CUENTAS FICTICIAS

$("formRegistro").addEventListener("submit", e => {
  e.preventDefault();

  const nombre = $("registroNombre").value.trim();
  const correo = $("registroCorreo").value.trim().toLowerCase();
  const clave = $("registroClave").value;

  if (!nombre || !correo || clave.length < 6) {
    alert("Completa correctamente los datos.");
    return;
  }

  const lista = usuarios();

  if (lista.some(u => u.correo === correo)) {
    alert("Este correo ya está registrado.");
    return;
  }

  lista.push({
    id: crypto.randomUUID(),
    nombre,
    correo,
    clave,
    rol: "autorizado",
    estado: "pendiente"
  });

  guardar(CLAVES.usuarios, lista);

  $("formRegistro").reset();
  cambiarPestana(false);

  alert(
    "Solicitud enviada. Espera la aprobación " +
    "del administrador."
  );
});

// INICIAR SESIÓN

$("formLogin").addEventListener("submit", e => {
  e.preventDefault();

  const correo = $("loginCorreo").value.trim().toLowerCase();
  const clave = $("loginClave").value;

  const usuario = usuarios().find(
    u => u.correo === correo && u.clave === clave
  );

  if (!usuario) {
    alert("Correo o contraseña incorrectos.");
    return;
  }

  if (usuario.estado !== "aprobado") {
    alert("Tu cuenta no está autorizada.");
    return;
  }

  sessionStorage.setItem(CLAVES.sesion, usuario.id);
  $("formLogin").reset();

  actualizarPantalla();
});

$("cerrarSesion").onclick = () => {
  sessionStorage.removeItem(CLAVES.sesion);
  actualizarPantalla();
};

function actualizarPantalla() {
  const usuario = sesionActual();
  const activo = Boolean(usuario);

  $("pantallaAcceso").hidden = activo;
  $("aplicacion").hidden = !activo;

  if (!usuario) return;

  $("nombreUsuario").textContent = usuario.nombre;
  $("saludoNombre").textContent = usuario.nombre;
  $("rolUsuario").textContent =
    usuario.rol === "admin" ? "Administrador" : "Autorizado";

  const esAdmin = usuario.rol === "admin";

  $("administracion").hidden = !esAdmin;
  $("enlaceAdmin").hidden = !esAdmin;

  if (esAdmin) mostrarAdministracion();

  mostrarPresiones();
  mostrarMedicamentos();
  mostrarMensajes();
}

// =====================================
// ADMINISTRACIÓN
// =====================================

function cambiarEstado(id, estado) {
  const actual = sesionActual();

  if (!actual || actual.rol !== "admin") {
    alert("Solo el administrador puede realizar esta acción.");
    return;
  }

  const lista = usuarios();
  const usuario = lista.find(u => u.id === id);

  if (!usuario || usuario.rol === "admin") return;

  usuario.estado = estado;
  guardar(CLAVES.usuarios, lista);
  mostrarAdministracion();
}

function mostrarAdministracion() {
  const actual = sesionActual();
  if (!actual || actual.rol !== "admin") return;

  const pendientes = $("listaSolicitudes");
  const autorizados = $("listaAutorizados");

  pendientes.replaceChildren();
  autorizados.replaceChildren();

  const lista = usuarios();

  const solicitudes = lista.filter(
    u => u.estado === "pendiente"
  );

  if (!solicitudes.length) {
    pendientes.appendChild(
      crear("p", "No hay solicitudes pendientes.")
    );
  }

  solicitudes.forEach(u => {
    const caja = crear("div", "", "item");
    caja.append(
      crear("h3", u.nombre),
      crear("p", u.correo)
    );

    const acciones = crear("div", "", "acciones");

    acciones.append(
      boton("Aprobar", "aprobar", () => {
        cambiarEstado(u.id, "aprobado");
      }),
      boton("Rechazar", "rechazar", () => {
        cambiarEstado(u.id, "rechazado");
      })
    );

    caja.appendChild(acciones);
    pendientes.appendChild(caja);
  });

  lista.filter(
    u => u.rol !== "admin" && u.estado === "aprobado"
  ).forEach(u => {
    const caja = crear("div", "", "item");

    caja.append(
      crear("strong", u.nombre),
      crear("p", u.correo),
      boton("Revocar acceso", "rechazar", () => {
        cambiarEstado(u.id, "revocado");
      })
    );

    autorizados.appendChild(caja);
  });
}

// =====================================
// PRESIÓN ARTERIAL
// =====================================

let campo = "sys";

function seleccionarCampo(nuevo) {
  campo = nuevo;

  document.querySelectorAll(".pantalla").forEach(p => {
    p.classList.toggle("activa", p.dataset.campo === campo);
  });

  $("campoActivo").textContent =
    "Seleccionado: " + campo.toUpperCase();
}

document.querySelectorAll(".pantalla").forEach(p => {
  p.onclick = () => seleccionarCampo(p.dataset.campo);
});

document.querySelectorAll("[data-num]").forEach(b => {
  b.onclick = () => {
    const input = $(campo);

    if (input.value.length < 3) {
      input.value += b.dataset.num;
    }
  };
});

$("borrarNumero").onclick = () => {
  $(campo).value = $(campo).value.slice(0, -1);
};

$("limpiarNumero").onclick = () => {
  $(campo).value = "";
};

$("guardarPresion").onclick = () => {
  const sys = Number($("sys").value);
  const dia = Number($("dia").value);
  const pulse = Number($("pulse").value);

  if (!sys || !dia || !pulse) {
    alert("Completa SYS, DIA y PULSE.");
    return;
  }

  const registro = {
    id: crypto.randomUUID(),
    fecha: fechaHora(),
    sys,
    dia,
    pulse
  };

  const lista = leer(CLAVES.presiones);
  lista.unshift(registro);

  guardar(CLAVES.presiones, lista);

  ["sys", "dia", "pulse"].forEach(id => {
    $(id).value = "";
  });

  seleccionarCampo("sys");
  mostrarPresiones();

  alert("Presión guardada correctamente.");
};

function mostrarPresiones() {
  const tabla = $("tablaPresion");
  tabla.replaceChildren();

  leer(CLAVES.presiones).forEach(r => {
    const fila = document.createElement("tr");

    [r.fecha, r.sys, r.dia, r.pulse].forEach(valor => {
      fila.appendChild(crear("td", String(valor)));
    });

    const celda = document.createElement("td");

    celda.appendChild(
      boton("Compartir", "secundario", () => {
        agregarMensaje(
          "🩺 Registro de presión\n" +
          "Fecha: " + r.fecha + "\n" +
          "SYS: " + r.sys + "\n" +
          "DIA: " + r.dia + "\n" +
          "PULSE: " + r.pulse
        );

        $("chat").scrollIntoView({ behavior: "smooth" });
      })
    );

    fila.appendChild(celda);
    tabla.appendChild(fila);
  });
}

// =====================================
// MEDICAMENTOS
// =====================================

$("formMedicamento").addEventListener("submit", e => {
  e.preventDefault();

  const nombre = $("medNombre").value.trim();
  const hora = $("medHora").value;

  if (!nombre || !hora) return;

  const lista = leer(CLAVES.medicamentos);

  lista.push({
    id: crypto.randomUUID(),
    nombre,
    hora,
    ultimaToma: "",
    ultimoAviso: ""
  });

  guardar(CLAVES.medicamentos, lista);

  $("formMedicamento").reset();
  mostrarMedicamentos();
});

function mostrarMedicamentos() {
  const contenedor = $("listaMedicamentos");
  contenedor.replaceChildren();

  leer(CLAVES.medicamentos).forEach(m => {
    const caja = crear("div", "", "item");

    const tomado = m.ultimaToma === hoy();

    caja.append(
      crear("h3", m.nombre),
      crear("p", "Horario: " + m.hora),
      crear("p", tomado ? "✅ Tomado hoy" : "⏳ Pendiente")
    );

    const acciones = crear("div", "", "acciones");

    const confirmar = boton(
      "Ya tomé mi medicamento",
      "aprobar",
      () => confirmarMedicamento(m.id)
    );

    confirmar.disabled = tomado;

    acciones.append(
      confirmar,
      boton("Eliminar", "rechazar", () => {
        const lista = leer(CLAVES.medicamentos)
          .filter(x => x.id !== m.id);

        guardar(CLAVES.medicamentos, lista);
        mostrarMedicamentos();
      })
    );

    caja.appendChild(acciones);
    contenedor.appendChild(caja);
  });
}

function confirmarMedicamento(id) {
  const lista = leer(CLAVES.medicamentos);
  const medicamento = lista.find(m => m.id === id);

  if (!medicamento || medicamento.ultimaToma === hoy()) return;

  medicamento.ultimaToma = hoy();
  guardar(CLAVES.medicamentos, lista);

  agregarMensaje(
    "💊 Medicamento confirmado\n" +
    "Nombre: " + medicamento.nombre + "\n" +
    "Confirmación: " + fechaHora()
  );

  mostrarMedicamentos();
  alert("Medicamento marcado como tomado.");
}

function revisarMedicamentos() {
  if (!sesionActual()) return;

  const ahora = new Date();
  const hora = ahora.toTimeString().slice(0, 5);
  const lista = leer(CLAVES.medicamentos);

  let cambios = false;

  lista.forEach(m => {
    if (
      m.hora === hora &&
      m.ultimaToma !== hoy() &&
      m.ultimoAviso !== hoy()
    ) {
      m.ultimoAviso = hoy();
      cambios = true;

      alert("💊 Es hora de tomar: " + m.nombre);
    }
  });

  if (cambios) guardar(CLAVES.medicamentos, lista);
}

setInterval(revisarMedicamentos, 30000);

// =====================================
// CHAT DE DEMOSTRACIÓN
// =====================================

function agregarMensaje(texto, imagen = null) {
  const usuario = sesionActual();

  if (!usuario) return;

  const lista = leer(CLAVES.mensajes);

  lista.push({
    id: crypto.randomUUID(),
    autor: usuario.nombre,
    fecha: fechaHora(),
    texto,
    imagen
  });

  try {
    guardar(CLAVES.mensajes, lista);
    mostrarMensajes();
  } catch {
    alert("No hay espacio para guardar más imágenes.");
  }
}

function mostrarMensajes() {
  const contenedor = $("listaMensajes");
  contenedor.replaceChildren();

  leer(CLAVES.mensajes).forEach(m => {
    const caja = crear("div", "", "mensaje");

    caja.append(
      crear("strong", m.autor),
      crear("div", m.fecha, "fecha"),
      crear("p", m.texto || "")
    );

    if (m.imagen) {
      const img = document.createElement("img");
      img.src = m.imagen;
      img.alt = "Fotografía compartida";
      caja.appendChild(img);
    }

    contenedor.appendChild(caja);
  });

  contenedor.scrollTop = contenedor.scrollHeight;
}

$("formChat").addEventListener("submit", e => {
  e.preventDefault();

  const texto = $("textoMensaje").value.trim();
  const archivo = $("fotoMensaje").files[0];

  if (!texto && !archivo) {
    alert("Escribe un mensaje o selecciona una foto.");
    return;
  }

  if (!archivo) {
    agregarMensaje(texto);
    $("formChat").reset();
    return;
  }

  if (
    !archivo.type.startsWith("image/") ||
    archivo.size > 500000
  ) {
    alert("Selecciona una imagen menor de 500 KB.");
    return;
  }

  const lector = new FileReader();

  lector.onload = () => {
    agregarMensaje(texto, lector.result);
    $("formChat").reset();
  };

  lector.readAsDataURL(archivo);
});

// =====================================
// INICIAR APLICACIÓN
// =====================================

iniciarAdministrador();
actualizarPantalla();
