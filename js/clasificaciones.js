// HU-01: CRUD de clasificaciones de medicamentos.
(() => {
  const c_ent_FILAS_POR_PAGINA = 3;
  const c_txt_ERROR_GUARDAR = 'No se pudo guardar. Revisa que el navegador permita almacenar datos.';
  let g_ent_paginaActual = 1;
  let g_ent_codigoEditando = null; // null = creando

  const f_obj_obtenerElemento = (p_txt_id) => document.getElementById(p_txt_id);
  const g_dom_btnNuevaClasificacion = f_obj_obtenerElemento('btn-nueva-clasificacion');
  const g_dom_tblClasificacionesCuerpo = f_obj_obtenerElemento('tbl-clasificaciones-cuerpo');
  const g_dom_secEstadoVacio = f_obj_obtenerElemento('sec-estado-vacio');
  const g_dom_lblInfoPagina = f_obj_obtenerElemento('lbl-info-pagina');
  const g_dom_btnAnterior = f_obj_obtenerElemento('btn-anterior');
  const g_dom_btnSiguiente = f_obj_obtenerElemento('btn-siguiente');
  const g_dom_mdlFormulario = f_obj_obtenerElemento('mdl-formulario');
  const g_dom_frmClasificacion = f_obj_obtenerElemento('frm-clasificacion');
  const g_dom_lblTituloFormulario = f_obj_obtenerElemento('lbl-titulo-formulario');
  const g_dom_txtCodigo = f_obj_obtenerElemento('txt-codigo');
  const g_dom_txtNombre = f_obj_obtenerElemento('txt-nombre');
  const g_dom_lblErrorNombre = f_obj_obtenerElemento('lbl-error-nombre');
  const g_dom_mdlConfirmar = f_obj_obtenerElemento('mdl-confirmar');
  const g_dom_lblIconoConfirmar = f_obj_obtenerElemento('lbl-icono-confirmar');
  const g_dom_lblTituloConfirmar = f_obj_obtenerElemento('lbl-titulo-confirmar');
  const g_dom_lblTextoConfirmar = f_obj_obtenerElemento('lbl-texto-confirmar');
  const g_dom_btnCancelarConfirmar = f_obj_obtenerElemento('btn-cancelar-confirmar');
  const g_dom_btnAceptarConfirmar = f_obj_obtenerElemento('btn-aceptar-confirmar');
  const g_dom_secAviso = f_obj_obtenerElemento('sec-aviso');

  function f_txt_limpiarNombre(p_txt_texto) {
    return p_txt_texto.replace(/\s+/g, ' ').trim();
  }

  // Normaliza para comparar duplicados: sin tildes, minúsculas, espacios simples.
  function f_txt_normalizarNombre(p_txt_texto) {
    return f_txt_limpiarNombre(p_txt_texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function f_arr_obtenerOrdenadas() {
    return g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .sort((p_obj_clasificacionA, p_obj_clasificacionB) => p_obj_clasificacionA.codigo - p_obj_clasificacionB.codigo);
  }

  function f_txt_escaparHtml(p_txt_texto) {
    const v_dom_contenedor = document.createElement('div');
    v_dom_contenedor.textContent = p_txt_texto;
    return v_dom_contenedor.innerHTML;
  }

  // ---------- Tabla ----------
  function f_mostrarTabla() {
    const v_arr_clasificaciones = f_arr_obtenerOrdenadas();
    const v_ent_totalPaginas = Math.max(1, Math.ceil(v_arr_clasificaciones.length / c_ent_FILAS_POR_PAGINA));
    g_ent_paginaActual = Math.min(Math.max(1, g_ent_paginaActual), v_ent_totalPaginas);

    const v_ent_inicio = (g_ent_paginaActual - 1) * c_ent_FILAS_POR_PAGINA;
    const v_arr_filasPagina = v_arr_clasificaciones.slice(v_ent_inicio, v_ent_inicio + c_ent_FILAS_POR_PAGINA);

    g_dom_tblClasificacionesCuerpo.innerHTML = v_arr_filasPagina.map((it_clasificacion) => `
      <tr>
        <td class="vd-tabla__celda--codigo">${it_clasificacion.codigo}</td>
        <td>${f_txt_escaparHtml(it_clasificacion.nombre)}</td>
        <td class="vd-tabla__celda--acciones">
          <button type="button" class="vd-boton-icono vd-boton-icono--editar" data-editar="${it_clasificacion.codigo}"
                  title="Editar" aria-label="Editar ${f_txt_escaparHtml(it_clasificacion.nombre)}">✏️</button>
          <button type="button" class="vd-boton-icono vd-boton-icono--borrar" data-borrar="${it_clasificacion.codigo}"
                  title="Borrar" aria-label="Borrar ${f_txt_escaparHtml(it_clasificacion.nombre)}">🗑️</button>
        </td>
      </tr>`).join('');

    g_dom_secEstadoVacio.hidden = v_arr_clasificaciones.length > 0;
    g_dom_lblInfoPagina.textContent = `Página ${g_ent_paginaActual} de ${v_ent_totalPaginas}`;
    g_dom_btnAnterior.disabled = g_ent_paginaActual <= 1;
    g_dom_btnSiguiente.disabled = g_ent_paginaActual >= v_ent_totalPaginas;
  }

  // ---------- Aviso (toast) ----------
  let g_ent_temporizadorAviso;
  // p_txt_tipo: 'exito' o 'error'.
  function f_mostrarAviso(p_txt_mensaje, p_txt_tipo = 'exito') {
    g_dom_secAviso.textContent = p_txt_mensaje;
    g_dom_secAviso.className = `vd-aviso vd-aviso--${p_txt_tipo} es-visible`;
    clearTimeout(g_ent_temporizadorAviso);
    g_ent_temporizadorAviso = setTimeout(() => g_dom_secAviso.classList.remove('es-visible'), 2600);
  }

  // Avisa que el registro ya no existe (p. ej. se borró en otra pestaña) y refresca la tabla.
  function f_avisarRegistroInexistente() {
    f_mostrarAviso('La clasificación ya no existe. Se actualizó la tabla.', 'error');
    f_mostrarTabla();
  }

  // ---------- Modales (foco atrapado y devuelto al cerrar) ----------
  let g_dom_focoPrevio = null;
  const c_txt_SELECTOR_ENFOCABLES = 'button:not([hidden]):not([disabled]), input:not([readonly]):not([disabled])';

  function f_abrirModal(p_dom_modal, p_dom_elementoInicial) {
    g_dom_focoPrevio = document.activeElement;
    p_dom_modal.hidden = false;
    (p_dom_elementoInicial || p_dom_modal.querySelector(c_txt_SELECTOR_ENFOCABLES)).focus();
  }

  function f_cerrarModal(p_dom_modal) {
    if (p_dom_modal.hidden) return;
    if (p_dom_modal.contains(document.activeElement)) document.activeElement.blur();
    p_dom_modal.hidden = true;
    if (g_dom_focoPrevio && document.contains(g_dom_focoPrevio)) g_dom_focoPrevio.focus();
    g_dom_focoPrevio = null;
  }

  function f_configurarModal(p_dom_modal) {
    function h_clickModal(p_obj_evento) {
      if (p_obj_evento.target.closest('[data-cerrar]')) f_cerrarModal(p_dom_modal);
    }

    function h_teclaModal(p_obj_evento) {
      if (p_obj_evento.key !== 'Tab') return;
      const v_arr_enfocables = [...p_dom_modal.querySelectorAll(c_txt_SELECTOR_ENFOCABLES)];
      const v_dom_primero = v_arr_enfocables[0];
      const v_dom_ultimo = v_arr_enfocables[v_arr_enfocables.length - 1];
      if (p_obj_evento.shiftKey && document.activeElement === v_dom_primero) {
        p_obj_evento.preventDefault();
        v_dom_ultimo.focus();
      } else if (!p_obj_evento.shiftKey && document.activeElement === v_dom_ultimo) {
        p_obj_evento.preventDefault();
        v_dom_primero.focus();
      }
    }

    p_dom_modal.addEventListener('click', h_clickModal);
    p_dom_modal.addEventListener('keydown', h_teclaModal);
  }

  function h_teclaEscape(p_obj_evento) {
    if (p_obj_evento.key === 'Escape') document.querySelectorAll('.js-modal').forEach(f_cerrarModal);
  }

  document.querySelectorAll('.js-modal').forEach(f_configurarModal);
  document.addEventListener('keydown', h_teclaEscape);

  function f_abrirFormulario(p_obj_clasificacion) {
    g_ent_codigoEditando = p_obj_clasificacion ? p_obj_clasificacion.codigo : null;
    g_dom_lblTituloFormulario.textContent = p_obj_clasificacion ? 'Editar clasificación' : 'Nueva clasificación';
    g_dom_txtCodigo.value = p_obj_clasificacion
      ? p_obj_clasificacion.codigo
      : g_obj_vetStorage.f_ent_consultarSiguienteCodigo();
    g_dom_txtNombre.value = p_obj_clasificacion ? p_obj_clasificacion.nombre : '';
    f_mostrarError('');
    f_abrirModal(g_dom_mdlFormulario, g_dom_txtNombre);
  }

  function f_mostrarError(p_txt_mensaje) {
    g_dom_lblErrorNombre.textContent = p_txt_mensaje;
    g_dom_txtNombre.classList.toggle('es-invalido', Boolean(p_txt_mensaje));
  }

  // Confirmación genérica: si p_fun_alAceptar es null, actúa como aviso de solo lectura.
  function f_mostrarConfirmacion({ p_txt_icono, p_txt_titulo, p_txt_texto, p_txt_textoAceptar, p_fun_alAceptar }) {
    g_dom_lblIconoConfirmar.textContent = p_txt_icono;
    g_dom_lblTituloConfirmar.textContent = p_txt_titulo;
    g_dom_lblTextoConfirmar.textContent = p_txt_texto;
    g_dom_btnAceptarConfirmar.hidden = !p_fun_alAceptar;
    g_dom_btnAceptarConfirmar.textContent = p_txt_textoAceptar || 'Aceptar';
    g_dom_btnCancelarConfirmar.textContent = p_fun_alAceptar ? 'Cancelar' : 'Entendido';
    g_dom_btnAceptarConfirmar.onclick = () => {
      f_cerrarModal(g_dom_mdlConfirmar);
      p_fun_alAceptar();
    };
    f_abrirModal(g_dom_mdlConfirmar, g_dom_btnCancelarConfirmar);
  }

  // ---------- Acciones ----------
  function h_enviarFormulario(p_obj_evento) {
    p_obj_evento.preventDefault();
    const v_txt_nombre = f_txt_limpiarNombre(g_dom_txtNombre.value);

    if (!v_txt_nombre) {
      f_mostrarError('El nombre es obligatorio.');
      return;
    }

    const v_arr_clasificaciones = g_obj_vetStorage.f_arr_obtenerClasificaciones();
    const v_txt_nombreNormalizado = f_txt_normalizarNombre(v_txt_nombre);
    const v_obj_duplicada = v_arr_clasificaciones.find((it_clasificacion) =>
      it_clasificacion.codigo !== g_ent_codigoEditando &&
      f_txt_normalizarNombre(it_clasificacion.nombre) === v_txt_nombreNormalizado);
    if (v_obj_duplicada) {
      f_mostrarError(`Ya existe la clasificación "${v_obj_duplicada.nombre}" (código ${v_obj_duplicada.codigo}).`);
      return;
    }

    if (g_ent_codigoEditando === null) {
      const v_obj_nuevaClasificacion = {
        codigo: g_obj_vetStorage.f_ent_asignarSiguienteCodigo(),
        nombre: v_txt_nombre
      };
      v_arr_clasificaciones.push(v_obj_nuevaClasificacion);
      if (!g_obj_vetStorage.f_bol_guardarClasificaciones(v_arr_clasificaciones)) {
        f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
        return;
      }
      // Ir a la página donde quedó realmente el nuevo registro.
      const v_ent_indice = f_arr_obtenerOrdenadas()
        .findIndex((it_clasificacion) => it_clasificacion.codigo === v_obj_nuevaClasificacion.codigo);
      g_ent_paginaActual = Math.floor(v_ent_indice / c_ent_FILAS_POR_PAGINA) + 1;
      f_mostrarAviso(`Clasificación "${v_txt_nombre}" creada.`);
    } else {
      const v_obj_clasificacion = v_arr_clasificaciones
        .find((it_clasificacion) => it_clasificacion.codigo === g_ent_codigoEditando);
      if (!v_obj_clasificacion) {
        f_cerrarModal(g_dom_mdlFormulario);
        f_avisarRegistroInexistente();
        return;
      }
      v_obj_clasificacion.nombre = v_txt_nombre;
      if (!g_obj_vetStorage.f_bol_guardarClasificaciones(v_arr_clasificaciones)) {
        f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
        return;
      }
      f_mostrarAviso('Clasificación actualizada.');
    }

    f_cerrarModal(g_dom_mdlFormulario);
    f_mostrarTabla();
  }

  function h_escribirNombre() {
    f_mostrarError('');
  }

  function h_clickTabla(p_obj_evento) {
    const v_dom_btnEditar = p_obj_evento.target.closest('[data-editar]');
    const v_dom_btnBorrar = p_obj_evento.target.closest('[data-borrar]');
    if (!v_dom_btnEditar && !v_dom_btnBorrar) return;

    const v_ent_codigo = Number(v_dom_btnEditar ? v_dom_btnEditar.dataset.editar : v_dom_btnBorrar.dataset.borrar);
    const v_obj_clasificacion = g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .find((it_clasificacion) => it_clasificacion.codigo === v_ent_codigo);
    if (!v_obj_clasificacion) {
      f_avisarRegistroInexistente();
      return;
    }

    if (v_dom_btnEditar) {
      f_abrirFormulario(v_obj_clasificacion);
      return;
    }

    const v_arr_medicamentosAsociados = g_obj_vetStorage.f_arr_obtenerMedicamentos()
      .filter((it_medicamento) => it_medicamento.codigoClasificacion === v_ent_codigo);
    if (v_arr_medicamentosAsociados.length > 0) {
      f_mostrarConfirmacion({
        p_txt_icono: '⚠️',
        p_txt_titulo: 'No se puede eliminar',
        p_txt_texto: `"${v_obj_clasificacion.nombre}" tiene ${v_arr_medicamentosAsociados.length} medicamento(s) asociado(s): ` +
                     `${v_arr_medicamentosAsociados.map((it_medicamento) => it_medicamento.nombre).join(', ')}.`,
        p_fun_alAceptar: null
      });
      return;
    }

    f_mostrarConfirmacion({
      p_txt_icono: '🗑️',
      p_txt_titulo: '¿Eliminar clasificación?',
      p_txt_texto: `Se eliminará "${v_obj_clasificacion.nombre}" (código ${v_obj_clasificacion.codigo}). Esta acción no se puede deshacer.`,
      p_txt_textoAceptar: 'Eliminar',
      p_fun_alAceptar: () => {
        const v_arr_clasificacionesRestantes = g_obj_vetStorage.f_arr_obtenerClasificaciones()
          .filter((it_clasificacion) => it_clasificacion.codigo !== v_ent_codigo);
        if (!g_obj_vetStorage.f_bol_guardarClasificaciones(v_arr_clasificacionesRestantes)) {
          f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
          return;
        }
        f_mostrarAviso(`Clasificación "${v_obj_clasificacion.nombre}" eliminada.`);
        f_mostrarTabla();
        // El botón que abrió la confirmación desapareció con la fila.
        if (!document.contains(document.activeElement) || document.activeElement === document.body) {
          g_dom_btnNuevaClasificacion.focus();
        }
      }
    });
  }

  function h_clickNuevaClasificacion() {
    f_abrirFormulario(null);
  }

  function h_clickAnterior() {
    g_ent_paginaActual--;
    f_mostrarTabla();
  }

  function h_clickSiguiente() {
    g_ent_paginaActual++;
    f_mostrarTabla();
  }

  g_dom_frmClasificacion.addEventListener('submit', h_enviarFormulario);
  g_dom_txtNombre.addEventListener('input', h_escribirNombre);
  g_dom_tblClasificacionesCuerpo.addEventListener('click', h_clickTabla);
  g_dom_btnNuevaClasificacion.addEventListener('click', h_clickNuevaClasificacion);
  g_dom_btnAnterior.addEventListener('click', h_clickAnterior);
  g_dom_btnSiguiente.addEventListener('click', h_clickSiguiente);

  f_mostrarTabla();
})();
