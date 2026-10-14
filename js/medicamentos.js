// HU-02: CRUD de medicamentos de uso veterinario.
(() => {
  const c_ent_FILAS_POR_PAGINA = 3;
  const c_txt_ERROR_GUARDAR = 'No se pudo guardar. Revisa que el navegador permita almacenar datos.';
  const c_txt_AMBIENTE = 'temperaturaAmbiente';
  const c_arr_CONDICIONES_FRIO = ['refrigeracion', 'cadenaFrio'];
  let g_ent_paginaActual = 1;
  let g_ent_idEditando = null; // null = creando

  const {
    f_obj_obtenerElemento, f_txt_limpiarNombre, f_txt_normalizarNombre, f_txt_escaparHtml,
    f_mostrarAviso, f_abrirModal, f_cerrarModal, f_mostrarConfirmacion
  } = g_obj_vetInterfaz;

  const g_arr_viasAdministracion = g_obj_vetStorage.f_arr_obtenerViasAdministracion();
  const g_arr_presentaciones = g_obj_vetStorage.f_arr_obtenerPresentaciones();
  const g_arr_condicionesAlmacenamiento = g_obj_vetStorage.f_arr_obtenerCondicionesAlmacenamiento();

  const g_dom_btnNuevoMedicamento = f_obj_obtenerElemento('btn-nuevo-medicamento');
  const g_dom_tblMedicamentosCuerpo = f_obj_obtenerElemento('tbl-medicamentos-cuerpo');
  const g_dom_secEstadoVacioMedicamentos = f_obj_obtenerElemento('sec-estado-vacio-medicamentos');
  const g_dom_lblInfoPaginaMedicamentos = f_obj_obtenerElemento('lbl-info-pagina-medicamentos');
  const g_dom_btnAnteriorMedicamentos = f_obj_obtenerElemento('btn-anterior-medicamentos');
  const g_dom_btnSiguienteMedicamentos = f_obj_obtenerElemento('btn-siguiente-medicamentos');
  const g_dom_mdlFormularioMedicamento = f_obj_obtenerElemento('mdl-formulario-medicamento');
  const g_dom_frmMedicamento = f_obj_obtenerElemento('frm-medicamento');
  const g_dom_lblTituloFormularioMedicamento = f_obj_obtenerElemento('lbl-titulo-formulario-medicamento');
  const g_dom_txtCodigoMedicamento = f_obj_obtenerElemento('txt-codigo-medicamento');
  const g_dom_txtNombreMedicamento = f_obj_obtenerElemento('txt-nombre-medicamento');
  const g_dom_selClasificacionMedicamento = f_obj_obtenerElemento('sel-clasificacion-medicamento');
  const g_dom_selViaAdministracion = f_obj_obtenerElemento('sel-via-administracion');
  const g_dom_selPresentacion = f_obj_obtenerElemento('sel-presentacion');
  const g_dom_secAlmacenamientoMedicamento = f_obj_obtenerElemento('sec-almacenamiento-medicamento');
  const g_dom_secOpcionesAlmacenamiento = f_obj_obtenerElemento('sec-opciones-almacenamiento');

  function f_txt_obtenerEtiqueta(p_arr_catalogo, p_txt_valor) {
    const v_obj_opcion = p_arr_catalogo.find((it_opcion) => it_opcion.valor === p_txt_valor);
    return v_obj_opcion ? v_obj_opcion.etiqueta : p_txt_valor;
  }

  function f_txt_crearOpciones(p_arr_opciones) {
    return '<option value="">Selecciona…</option>' + p_arr_opciones.map((it_opcion) =>
      `<option value="${f_txt_escaparHtml(String(it_opcion.valor))}">${f_txt_escaparHtml(it_opcion.etiqueta)}</option>`).join('');
  }

  // Los catálogos fijos se dibujan una sola vez; las clasificaciones, cada vez que se abre el formulario.
  function f_llenarCatalogos() {
    g_dom_selViaAdministracion.innerHTML = f_txt_crearOpciones(g_arr_viasAdministracion);
    g_dom_selPresentacion.innerHTML = f_txt_crearOpciones(g_arr_presentaciones);
    g_dom_secOpcionesAlmacenamiento.innerHTML = g_arr_condicionesAlmacenamiento.map((it_condicion) => `
      <label class="vd-casillas__opcion">
        <input type="checkbox" name="almacenamiento" value="${it_condicion.valor}" aria-describedby="lbl-error-almacenamiento">
        <span>${f_txt_escaparHtml(it_condicion.etiqueta)}</span>
      </label>`).join('');
  }

  function f_llenarClasificaciones() {
    const v_arr_clasificaciones = g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .sort((p_obj_clasificacionA, p_obj_clasificacionB) =>
        p_obj_clasificacionA.nombre.localeCompare(p_obj_clasificacionB.nombre, 'es'));
    g_dom_selClasificacionMedicamento.innerHTML = f_txt_crearOpciones(v_arr_clasificaciones.map((it_clasificacion) =>
      ({ valor: it_clasificacion.codigo, etiqueta: it_clasificacion.nombre })));
  }

  function f_arr_obtenerOrdenados() {
    return g_obj_vetStorage.f_arr_obtenerMedicamentos()
      .sort((p_obj_medicamentoA, p_obj_medicamentoB) => p_obj_medicamentoA.id - p_obj_medicamentoB.id);
  }

  // ---------- Tabla ----------
  function f_mostrarTabla() {
    const v_arr_medicamentos = f_arr_obtenerOrdenados();
    const v_map_nombresClasificacion = new Map(g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .map((it_clasificacion) => [it_clasificacion.codigo, it_clasificacion.nombre]));
    const v_ent_totalPaginas = Math.max(1, Math.ceil(v_arr_medicamentos.length / c_ent_FILAS_POR_PAGINA));
    g_ent_paginaActual = Math.min(Math.max(1, g_ent_paginaActual), v_ent_totalPaginas);

    const v_ent_inicio = (g_ent_paginaActual - 1) * c_ent_FILAS_POR_PAGINA;
    const v_arr_filasPagina = v_arr_medicamentos.slice(v_ent_inicio, v_ent_inicio + c_ent_FILAS_POR_PAGINA);

    g_dom_tblMedicamentosCuerpo.innerHTML = v_arr_filasPagina.map((it_medicamento) => {
      const v_txt_nombre = f_txt_escaparHtml(it_medicamento.nombre);
      const v_txt_clasificacion = v_map_nombresClasificacion.get(it_medicamento.codigoClasificacion) || 'Sin clasificación';
      const v_txt_almacenamiento = (it_medicamento.almacenamiento || [])
        .map((it_condicion) => f_txt_obtenerEtiqueta(g_arr_condicionesAlmacenamiento, it_condicion)).join(', ');
      return `
      <tr>
        <td class="vd-tabla__celda--codigo">${it_medicamento.id}</td>
        <td>
          <strong>${v_txt_nombre}</strong>
          <small class="vd-tabla__detalle">
            ${f_txt_escaparHtml(v_txt_clasificacion)} ·
            ${f_txt_escaparHtml(f_txt_obtenerEtiqueta(g_arr_viasAdministracion, it_medicamento.viaAdministracion))} ·
            ${f_txt_escaparHtml(f_txt_obtenerEtiqueta(g_arr_presentaciones, it_medicamento.presentacion))}
          </small>
          <small class="vd-tabla__detalle">${f_txt_escaparHtml(v_txt_almacenamiento)}</small>
        </td>
        <td class="vd-tabla__celda--acciones">
          <button type="button" class="vd-boton-icono vd-boton-icono--editar" data-editar="${it_medicamento.id}"
                  title="Editar" aria-label="Editar ${v_txt_nombre}">✏️</button>
          <button type="button" class="vd-boton-icono vd-boton-icono--borrar" data-borrar="${it_medicamento.id}"
                  title="Borrar" aria-label="Borrar ${v_txt_nombre}">🗑️</button>
        </td>
      </tr>`;
    }).join('');

    g_dom_secEstadoVacioMedicamentos.hidden = v_arr_medicamentos.length > 0;
    g_dom_lblInfoPaginaMedicamentos.textContent = `Página ${g_ent_paginaActual} de ${v_ent_totalPaginas}`;
    g_dom_btnAnteriorMedicamentos.disabled = g_ent_paginaActual <= 1;
    g_dom_btnSiguienteMedicamentos.disabled = g_ent_paginaActual >= v_ent_totalPaginas;
  }

  // Avisa que el registro ya no existe (p. ej. se borró en otra pestaña) y refresca la tabla.
  function f_avisarRegistroInexistente() {
    f_mostrarAviso('El medicamento ya no existe. Se actualizó la tabla.', 'error');
    f_mostrarTabla();
  }

  // ---------- Formulario ----------
  // Cada campo apunta a su etiqueta de error con aria-describedby.
  function f_mostrarError(p_dom_campo, p_txt_mensaje) {
    f_obj_obtenerElemento(p_dom_campo.getAttribute('aria-describedby')).textContent = p_txt_mensaje;
    p_dom_campo.classList.toggle('es-invalido', Boolean(p_txt_mensaje));
  }

  function f_limpiarErrores() {
    [g_dom_txtNombreMedicamento, g_dom_selClasificacionMedicamento, g_dom_selViaAdministracion, g_dom_selPresentacion, g_dom_secAlmacenamientoMedicamento]
      .forEach((it_campo) => f_mostrarError(it_campo, ''));
  }

  function f_arr_obtenerCasillasAlmacenamiento() {
    return [...g_dom_secOpcionesAlmacenamiento.querySelectorAll('input[name="almacenamiento"]')];
  }

  function f_abrirFormulario(p_obj_medicamento) {
    g_ent_idEditando = p_obj_medicamento ? p_obj_medicamento.id : null;
    f_llenarClasificaciones();
    g_dom_lblTituloFormularioMedicamento.textContent = p_obj_medicamento ? 'Editar medicamento' : 'Nuevo medicamento';
    g_dom_txtCodigoMedicamento.value = p_obj_medicamento
      ? p_obj_medicamento.id
      : g_obj_vetStorage.f_ent_consultarSiguienteIdMedicamento();
    g_dom_txtNombreMedicamento.value = p_obj_medicamento ? p_obj_medicamento.nombre : '';
    g_dom_selClasificacionMedicamento.value = p_obj_medicamento ? String(p_obj_medicamento.codigoClasificacion) : '';
    g_dom_selViaAdministracion.value = p_obj_medicamento ? p_obj_medicamento.viaAdministracion : '';
    g_dom_selPresentacion.value = p_obj_medicamento ? p_obj_medicamento.presentacion : '';
    const v_arr_almacenamiento = p_obj_medicamento ? p_obj_medicamento.almacenamiento || [] : [];
    f_arr_obtenerCasillasAlmacenamiento().forEach((it_casilla) => {
      it_casilla.checked = v_arr_almacenamiento.includes(it_casilla.value);
    });
    f_limpiarErrores();
    g_dom_mdlFormularioMedicamento.querySelector('.vd-modal__hoja').scrollTop = 0;
    f_abrirModal(g_dom_mdlFormularioMedicamento, g_dom_txtNombreMedicamento);
  }

  // ---------- Acciones ----------
  function h_enviarFormulario(p_obj_evento) {
    p_obj_evento.preventDefault();
    f_limpiarErrores();

    const v_txt_nombre = f_txt_limpiarNombre(g_dom_txtNombreMedicamento.value);
    const v_ent_codigoClasificacion = Number(g_dom_selClasificacionMedicamento.value);
    const v_txt_viaAdministracion = g_dom_selViaAdministracion.value;
    const v_txt_presentacion = g_dom_selPresentacion.value;
    const v_arr_almacenamiento = f_arr_obtenerCasillasAlmacenamiento()
      .filter((it_casilla) => it_casilla.checked)
      .map((it_casilla) => it_casilla.value);
    const v_arr_medicamentos = g_obj_vetStorage.f_arr_obtenerMedicamentos();
    let v_dom_primerCampoInvalido = null;

    function f_marcarInvalido(p_dom_campo, p_txt_mensaje) {
      f_mostrarError(p_dom_campo, p_txt_mensaje);
      v_dom_primerCampoInvalido = v_dom_primerCampoInvalido || p_dom_campo;
    }

    if (!v_txt_nombre) {
      f_marcarInvalido(g_dom_txtNombreMedicamento, 'El nombre es obligatorio.');
    } else {
      const v_txt_nombreNormalizado = f_txt_normalizarNombre(v_txt_nombre);
      const v_obj_duplicado = v_arr_medicamentos.find((it_medicamento) =>
        it_medicamento.id !== g_ent_idEditando &&
        f_txt_normalizarNombre(it_medicamento.nombre) === v_txt_nombreNormalizado);
      if (v_obj_duplicado) {
        f_marcarInvalido(g_dom_txtNombreMedicamento, `Ya existe el medicamento "${v_obj_duplicado.nombre}" (código ${v_obj_duplicado.id}).`);
      }
    }

    if (!v_ent_codigoClasificacion) {
      f_marcarInvalido(g_dom_selClasificacionMedicamento, 'Selecciona una clasificación.');
    } else if (!g_obj_vetStorage.f_arr_obtenerClasificaciones()
      .some((it_clasificacion) => it_clasificacion.codigo === v_ent_codigoClasificacion)) {
      // Se borró en otra pestaña mientras el formulario estaba abierto.
      f_llenarClasificaciones();
      f_marcarInvalido(g_dom_selClasificacionMedicamento, 'La clasificación ya no existe. Selecciona otra.');
    }

    if (!v_txt_viaAdministracion) {
      f_marcarInvalido(g_dom_selViaAdministracion, 'Selecciona la vía de administración.');
    }
    if (!v_txt_presentacion) {
      f_marcarInvalido(g_dom_selPresentacion, 'Selecciona la presentación.');
    }

    if (v_arr_almacenamiento.length === 0) {
      f_marcarInvalido(g_dom_secAlmacenamientoMedicamento, 'Selecciona al menos una condición de almacenamiento.');
    } else if (v_arr_almacenamiento.includes(c_txt_AMBIENTE) &&
               v_arr_almacenamiento.some((it_condicion) => c_arr_CONDICIONES_FRIO.includes(it_condicion))) {
      f_marcarInvalido(g_dom_secAlmacenamientoMedicamento,
        'La temperatura ambiente no se puede combinar con refrigeración ni cadena de frío.');
    }

    if (v_dom_primerCampoInvalido) {
      (v_dom_primerCampoInvalido === g_dom_secAlmacenamientoMedicamento
        ? f_arr_obtenerCasillasAlmacenamiento()[0]
        : v_dom_primerCampoInvalido).focus();
      return;
    }

    const v_obj_datos = {
      nombre: v_txt_nombre,
      codigoClasificacion: v_ent_codigoClasificacion,
      viaAdministracion: v_txt_viaAdministracion,
      presentacion: v_txt_presentacion,
      almacenamiento: v_arr_almacenamiento
    };

    if (g_ent_idEditando === null) {
      const v_obj_nuevoMedicamento = { id: g_obj_vetStorage.f_ent_asignarSiguienteIdMedicamento(), ...v_obj_datos };
      v_arr_medicamentos.push(v_obj_nuevoMedicamento);
      if (!g_obj_vetStorage.f_bol_guardarMedicamentos(v_arr_medicamentos)) {
        f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
        return;
      }
      // Ir a la página donde quedó realmente el nuevo registro.
      const v_ent_indice = f_arr_obtenerOrdenados()
        .findIndex((it_medicamento) => it_medicamento.id === v_obj_nuevoMedicamento.id);
      g_ent_paginaActual = Math.floor(v_ent_indice / c_ent_FILAS_POR_PAGINA) + 1;
      f_mostrarAviso(`Medicamento "${v_txt_nombre}" creado.`);
    } else {
      const v_obj_medicamento = v_arr_medicamentos
        .find((it_medicamento) => it_medicamento.id === g_ent_idEditando);
      if (!v_obj_medicamento) {
        f_cerrarModal(g_dom_mdlFormularioMedicamento);
        f_avisarRegistroInexistente();
        return;
      }
      Object.assign(v_obj_medicamento, v_obj_datos);
      if (!g_obj_vetStorage.f_bol_guardarMedicamentos(v_arr_medicamentos)) {
        f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
        return;
      }
      f_mostrarAviso('Medicamento actualizado.');
    }

    f_cerrarModal(g_dom_mdlFormularioMedicamento);
    f_mostrarTabla();
  }

  // Al corregir un campo se borra su mensaje de error.
  function h_cambiarCampo(p_obj_evento) {
    const v_dom_campo = p_obj_evento.target.name === 'almacenamiento' ? g_dom_secAlmacenamientoMedicamento : p_obj_evento.target;
    if (v_dom_campo.hasAttribute('aria-describedby')) f_mostrarError(v_dom_campo, '');
  }

  function h_clickTabla(p_obj_evento) {
    const v_dom_btnEditar = p_obj_evento.target.closest('[data-editar]');
    const v_dom_btnBorrar = p_obj_evento.target.closest('[data-borrar]');
    if (!v_dom_btnEditar && !v_dom_btnBorrar) return;

    const v_ent_id = Number(v_dom_btnEditar ? v_dom_btnEditar.dataset.editar : v_dom_btnBorrar.dataset.borrar);
    const v_obj_medicamento = g_obj_vetStorage.f_arr_obtenerMedicamentos()
      .find((it_medicamento) => it_medicamento.id === v_ent_id);
    if (!v_obj_medicamento) {
      f_avisarRegistroInexistente();
      return;
    }

    if (v_dom_btnEditar) {
      f_abrirFormulario(v_obj_medicamento);
      return;
    }

    f_mostrarConfirmacion({
      p_txt_icono: '🗑️',
      p_txt_titulo: '¿Eliminar medicamento?',
      p_txt_texto: `Se eliminará "${v_obj_medicamento.nombre}" (código ${v_obj_medicamento.id}). Esta acción no se puede deshacer.`,
      p_txt_textoAceptar: 'Eliminar',
      p_fun_alAceptar: () => {
        const v_arr_medicamentosRestantes = g_obj_vetStorage.f_arr_obtenerMedicamentos()
          .filter((it_medicamento) => it_medicamento.id !== v_ent_id);
        if (!g_obj_vetStorage.f_bol_guardarMedicamentos(v_arr_medicamentosRestantes)) {
          f_mostrarAviso(c_txt_ERROR_GUARDAR, 'error');
          return;
        }
        f_mostrarAviso(`Medicamento "${v_obj_medicamento.nombre}" eliminado.`);
        f_mostrarTabla();
        // El botón que abrió la confirmación desapareció con la fila.
        if (!document.contains(document.activeElement) || document.activeElement === document.body) {
          g_dom_btnNuevoMedicamento.focus();
        }
      }
    });
  }

  function h_clickNuevoMedicamento() {
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

  g_dom_frmMedicamento.addEventListener('submit', h_enviarFormulario);
  g_dom_frmMedicamento.addEventListener('input', h_cambiarCampo);
  g_dom_frmMedicamento.addEventListener('change', h_cambiarCampo);
  g_dom_tblMedicamentosCuerpo.addEventListener('click', h_clickTabla);
  g_dom_btnNuevoMedicamento.addEventListener('click', h_clickNuevoMedicamento);
  g_dom_btnAnteriorMedicamentos.addEventListener('click', h_clickAnterior);
  g_dom_btnSiguienteMedicamentos.addEventListener('click', h_clickSiguiente);

  f_llenarCatalogos();
  f_mostrarTabla();
})();
