// HU-01: CRUD de clasificaciones de medicamentos.
(() => {
  const c_ent_FILAS_POR_PAGINA = 3;
  const c_txt_ERROR_GUARDAR = 'No se pudo guardar. Revisa que el navegador permita almacenar datos.';
  let g_ent_paginaActual = 1;
  let g_ent_codigoEditando = null; // null = creando

  const {
    f_obj_obtenerElemento, f_txt_limpiarNombre, f_txt_normalizarNombre, f_txt_escaparHtml,
    f_mostrarAviso, f_abrirModal, f_cerrarModal, f_mostrarConfirmacion
  } = g_obj_vetInterfaz;

  const g_dom_btnNuevaClasificacion = f_obj_obtenerElemento('btn-nueva-clasificacion');
  const g_dom_tblClasificacionesCuerpo = f_obj_obtenerElemento('tbl-clasificaciones-cuerpo');
  const g_dom_secEstadoVacioClasificaciones = f_obj_obtenerElemento('sec-estado-vacio-clasificaciones');
  const g_dom_lblInfoPaginaClasificaciones = f_obj_obtenerElemento('lbl-info-pagina-clasificaciones');
  const g_dom_btnAnteriorClasificaciones = f_obj_obtenerElemento('btn-anterior-clasificaciones');
  const g_dom_btnSiguienteClasificaciones = f_obj_obtenerElemento('btn-siguiente-clasificaciones');
  const g_dom_mdlFormularioClasificacion = f_obj_obtenerElemento('mdl-formulario-clasificacion');
  const g_dom_frmClasificacion = f_obj_obtenerElemento('frm-clasificacion');
  const g_dom_lblTituloFormularioClasificacion = f_obj_obtenerElemento('lbl-titulo-formulario-clasificacion');
  const g_dom_txtCodigoClasificacion = f_obj_obtenerElemento('txt-codigo-clasificacion');
  const g_dom_txtNombreClasificacion = f_obj_obtenerElemento('txt-nombre-clasificacion');
  const g_dom_lblErrorNombreClasificacion = f_obj_obtenerElemento('lbl-error-nombre-clasificacion');

  function f_arr_obtenerOrdenadas() {
    return g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .sort((p_obj_clasificacionA, p_obj_clasificacionB) => p_obj_clasificacionA.codigo - p_obj_clasificacionB.codigo);
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

    g_dom_secEstadoVacioClasificaciones.hidden = v_arr_clasificaciones.length > 0;
    g_dom_lblInfoPaginaClasificaciones.textContent = `Página ${g_ent_paginaActual} de ${v_ent_totalPaginas}`;
    g_dom_btnAnteriorClasificaciones.disabled = g_ent_paginaActual <= 1;
    g_dom_btnSiguienteClasificaciones.disabled = g_ent_paginaActual >= v_ent_totalPaginas;
  }

  // Avisa que el registro ya no existe (p. ej. se borró en otra pestaña) y refresca la tabla.
  function f_avisarRegistroInexistente() {
    f_mostrarAviso('La clasificación ya no existe. Se actualizó la tabla.', 'error');
    f_mostrarTabla();
  }

  function f_abrirFormulario(p_obj_clasificacion) {
    g_ent_codigoEditando = p_obj_clasificacion ? p_obj_clasificacion.codigo : null;
    g_dom_lblTituloFormularioClasificacion.textContent = p_obj_clasificacion ? 'Editar clasificación' : 'Nueva clasificación';
    g_dom_txtCodigoClasificacion.value = p_obj_clasificacion
      ? p_obj_clasificacion.codigo
      : g_obj_vetStorage.f_ent_consultarSiguienteCodigo();
    g_dom_txtNombreClasificacion.value = p_obj_clasificacion ? p_obj_clasificacion.nombre : '';
    f_mostrarError('');
    f_abrirModal(g_dom_mdlFormularioClasificacion, g_dom_txtNombreClasificacion);
  }

  function f_mostrarError(p_txt_mensaje) {
    g_dom_lblErrorNombreClasificacion.textContent = p_txt_mensaje;
    g_dom_txtNombreClasificacion.classList.toggle('es-invalido', Boolean(p_txt_mensaje));
  }

  // ---------- Acciones ----------
  function h_enviarFormulario(p_obj_evento) {
    p_obj_evento.preventDefault();
    const v_txt_nombre = f_txt_limpiarNombre(g_dom_txtNombreClasificacion.value);

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
        f_cerrarModal(g_dom_mdlFormularioClasificacion);
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

    f_cerrarModal(g_dom_mdlFormularioClasificacion);
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
  g_dom_txtNombreClasificacion.addEventListener('input', h_escribirNombre);
  g_dom_tblClasificacionesCuerpo.addEventListener('click', h_clickTabla);
  g_dom_btnNuevaClasificacion.addEventListener('click', h_clickNuevaClasificacion);
  g_dom_btnAnteriorClasificaciones.addEventListener('click', h_clickAnterior);
  g_dom_btnSiguienteClasificaciones.addEventListener('click', h_clickSiguiente);

  f_mostrarTabla();
})();
