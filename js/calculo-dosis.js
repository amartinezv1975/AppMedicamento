// HU-03: cálculo de la dosis en ml para un paciente, con varios medicamentos agregados uno por uno.
// Los resultados viven solo en pantalla; no se guarda historial.
(() => {
  const c_txt_UNIDAD_ML_KG = 'mlKg';
  const c_txt_UNIDAD_PORCENTAJE = 'porcentaje';
  const c_ent_MG_ML_POR_PORCENTAJE = 10; // 1 % = 1 g/100 ml = 10 mg/ml
  const c_dec_DOSIS_MINIMA_VISIBLE = 0.005; // por debajo, a 2 decimales se vería 0,00
  const c_obj_ETIQUETAS_UNIDAD = { mgKg: 'mg/kg', mlKg: 'ml/kg', mgMl: 'mg/ml', porcentaje: '%' };
  const c_obj_FORMATO_DOS_DECIMALES = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const c_obj_FORMATO_DATO_INGRESADO = new Intl.NumberFormat('es', { maximumFractionDigits: 6 }); // se muestra como se escribió

  // Cada fila: { idFila, idMedicamento, nombre, dosis, unidadDosis, concentracion, unidadConcentracion, mililitros }
  let g_arr_dosisCalculadas = [];
  let g_ent_siguienteFila = 1;

  const {
    f_obj_obtenerElemento, f_txt_limpiarNombre, f_txt_escaparHtml, f_mostrarAviso, f_mostrarConfirmacion
  } = g_obj_vetInterfaz;

  const g_dom_frmCalculoDosis = f_obj_obtenerElemento('frm-calculo-dosis');
  const g_dom_txtNombrePaciente = f_obj_obtenerElemento('txt-nombre-paciente');
  const g_dom_txtPesoPaciente = f_obj_obtenerElemento('txt-peso-paciente');
  const g_dom_lblPacienteBloqueado = f_obj_obtenerElemento('lbl-paciente-bloqueado');
  const g_dom_selMedicamentoDosis = f_obj_obtenerElemento('sel-medicamento-dosis');
  const g_dom_txtDosisRecomendada = f_obj_obtenerElemento('txt-dosis-recomendada');
  const g_dom_selUnidadDosis = f_obj_obtenerElemento('sel-unidad-dosis');
  const g_dom_secConcentracionFarmaco = f_obj_obtenerElemento('sec-concentracion-farmaco');
  const g_dom_txtConcentracionFarmaco = f_obj_obtenerElemento('txt-concentracion-farmaco');
  const g_dom_selUnidadConcentracion = f_obj_obtenerElemento('sel-unidad-concentracion');
  const g_dom_lblResumenPaciente = f_obj_obtenerElemento('lbl-resumen-paciente');
  const g_dom_tblDosisCuerpo = f_obj_obtenerElemento('tbl-dosis-cuerpo');
  const g_dom_secEstadoVacioDosis = f_obj_obtenerElemento('sec-estado-vacio-dosis');
  const g_dom_btnLimpiarCalculo = f_obj_obtenerElemento('btn-limpiar-calculo');

  // ---------- Utilidades ----------
  // Acepta coma o punto decimal. Devuelve NaN si el texto no es un número válido.
  function f_dec_convertirNumero(p_txt_valor) {
    const v_txt_valor = p_txt_valor.trim();
    return /^\d+([.,]\d+)?$/.test(v_txt_valor) ? Number(v_txt_valor.replace(',', '.')) : NaN;
  }

  function f_txt_formatearMililitros(p_dec_mililitros) {
    return p_dec_mililitros < c_dec_DOSIS_MINIMA_VISIBLE
      ? `< ${c_obj_FORMATO_DOS_DECIMALES.format(0.01)} ml`
      : `${c_obj_FORMATO_DOS_DECIMALES.format(p_dec_mililitros)} ml`;
  }

  // Fórmula: ml = (peso kg × dosis mg/kg) / concentración mg/ml. Con dosis en ml/kg: ml = peso × dosis.
  function f_dec_calcularMililitros(p_dec_peso, p_dec_dosis, p_txt_unidadDosis, p_dec_concentracion, p_txt_unidadConcentracion) {
    if (p_txt_unidadDosis === c_txt_UNIDAD_ML_KG) return p_dec_peso * p_dec_dosis;
    const v_dec_concentracionMgMl = p_txt_unidadConcentracion === c_txt_UNIDAD_PORCENTAJE
      ? p_dec_concentracion * c_ent_MG_ML_POR_PORCENTAJE
      : p_dec_concentracion;
    return (p_dec_peso * p_dec_dosis) / v_dec_concentracionMgMl;
  }

  // Cada campo apunta a su etiqueta de error con aria-describedby.
  function f_mostrarError(p_dom_campo, p_txt_mensaje) {
    f_obj_obtenerElemento(p_dom_campo.getAttribute('aria-describedby')).textContent = p_txt_mensaje;
    p_dom_campo.classList.toggle('es-invalido', Boolean(p_txt_mensaje));
  }

  function f_txt_validarNumeroPositivo(p_txt_valor, p_txt_nombreCampo) {
    if (!p_txt_valor.trim()) return `${p_txt_nombreCampo} es un dato obligatorio.`;
    const v_dec_numero = f_dec_convertirNumero(p_txt_valor);
    if (Number.isNaN(v_dec_numero)) return `${p_txt_nombreCampo} debe ser un número (ej: 12,5).`;
    if (v_dec_numero <= 0) return `${p_txt_nombreCampo} debe ser mayor que 0.`;
    return '';
  }

  // ---------- Dibujo ----------
  // Lista ordenada por nombre con todos los medicamentos registrados; el resultado siempre se da en ml.
  function f_llenarMedicamentos() {
    const v_arr_presentaciones = g_obj_vetStorage.f_arr_obtenerPresentaciones();
    const v_arr_medicamentos = g_obj_vetStorage.f_arr_obtenerMedicamentos()
      .slice()
      .sort((p_obj_medicamentoA, p_obj_medicamentoB) => p_obj_medicamentoA.nombre.localeCompare(p_obj_medicamentoB.nombre, 'es'));
    const v_txt_vacio = v_arr_medicamentos.length ? 'Selecciona un medicamento' : 'No hay medicamentos registrados';
    g_dom_selMedicamentoDosis.innerHTML = `<option value="">${v_txt_vacio}</option>` +
      v_arr_medicamentos.map((it_medicamento) => {
        const v_obj_presentacion = v_arr_presentaciones.find((it_opcion) => it_opcion.valor === it_medicamento.presentacion);
        const v_txt_presentacion = v_obj_presentacion ? ` · ${v_obj_presentacion.etiqueta}` : '';
        return `<option value="${it_medicamento.id}">${f_txt_escaparHtml(it_medicamento.nombre + v_txt_presentacion)}</option>`;
      }).join('');
  }

  // Con dosis en ml/kg la concentración no se usa, así que se esconde.
  function f_actualizarConcentracion() {
    const v_bol_usaConcentracion = g_dom_selUnidadDosis.value !== c_txt_UNIDAD_ML_KG;
    g_dom_secConcentracionFarmaco.hidden = !v_bol_usaConcentracion;
    if (!v_bol_usaConcentracion) f_mostrarError(g_dom_txtConcentracionFarmaco, '');
  }

  // Con medicamentos en la lista, nombre y peso quedan fijos para que los resultados no cambien por debajo.
  function f_bloquearPaciente(p_bol_bloquear) {
    g_dom_txtNombrePaciente.readOnly = p_bol_bloquear;
    g_dom_txtPesoPaciente.readOnly = p_bol_bloquear;
    g_dom_lblPacienteBloqueado.hidden = !p_bol_bloquear;
  }

  function f_mostrarResultados() {
    const v_bol_hayDosis = g_arr_dosisCalculadas.length > 0;
    g_dom_secEstadoVacioDosis.hidden = v_bol_hayDosis;
    f_bloquearPaciente(v_bol_hayDosis);
    g_dom_lblResumenPaciente.textContent = v_bol_hayDosis
      ? `${f_txt_limpiarNombre(g_dom_txtNombrePaciente.value)} · ` +
        `${c_obj_FORMATO_DATO_INGRESADO.format(f_dec_convertirNumero(g_dom_txtPesoPaciente.value))} kg`
      : '';

    g_dom_tblDosisCuerpo.innerHTML = g_arr_dosisCalculadas.map((it_dosis) => {
      const v_txt_nombre = f_txt_escaparHtml(it_dosis.nombre);
      const v_txt_detalle = `${c_obj_FORMATO_DATO_INGRESADO.format(it_dosis.dosis)} ${c_obj_ETIQUETAS_UNIDAD[it_dosis.unidadDosis]}` +
        (it_dosis.unidadDosis === c_txt_UNIDAD_ML_KG ? '' :
          ` · ${c_obj_FORMATO_DATO_INGRESADO.format(it_dosis.concentracion)} ${c_obj_ETIQUETAS_UNIDAD[it_dosis.unidadConcentracion]}`);
      return `
      <tr>
        <td>
          ${v_txt_nombre}
          <small class="vd-tabla__detalle">${f_txt_escaparHtml(v_txt_detalle)}</small>
        </td>
        <td class="vd-tabla__celda--dosis">${f_txt_formatearMililitros(it_dosis.mililitros)}</td>
        <td class="vd-tabla__celda--acciones">
          <button type="button" class="vd-boton-icono vd-boton-icono--borrar" data-quitar="${it_dosis.idFila}"
                  title="Quitar" aria-label="Quitar ${v_txt_nombre}">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  }

  function f_limpiarMedicamento() {
    g_dom_selMedicamentoDosis.value = '';
    g_dom_txtDosisRecomendada.value = '';
    g_dom_txtConcentracionFarmaco.value = '';
  }

  // ---------- Calcular ----------
  function h_enviarFormulario(p_obj_evento) {
    p_obj_evento.preventDefault();
    const v_txt_nombrePaciente = f_txt_limpiarNombre(g_dom_txtNombrePaciente.value);
    const v_ent_idMedicamento = Number(g_dom_selMedicamentoDosis.value);
    const v_bol_usaConcentracion = g_dom_selUnidadDosis.value !== c_txt_UNIDAD_ML_KG;
    const v_bol_esPorcentaje = g_dom_selUnidadConcentracion.value === c_txt_UNIDAD_PORCENTAJE;

    const v_txt_errorConcentracion = !v_bol_usaConcentracion ? '' :
      f_txt_validarNumeroPositivo(g_dom_txtConcentracionFarmaco.value, 'La concentración') ||
      (v_bol_esPorcentaje && f_dec_convertirNumero(g_dom_txtConcentracionFarmaco.value) > 100
        ? 'Un porcentaje no puede ser mayor que 100.' : '');
    const v_txt_errorMedicamento = !v_ent_idMedicamento ? 'Selecciona un medicamento.' :
      g_arr_dosisCalculadas.some((it_dosis) => it_dosis.idMedicamento === v_ent_idMedicamento)
        ? 'Este medicamento ya está en la lista. Quítalo si quieres calcularlo de nuevo.' : '';

    // Se muestran todos los errores a la vez y el foco va al primer campo con error.
    const v_arr_validaciones = [
      [g_dom_txtNombrePaciente, v_txt_nombrePaciente ? '' : 'El nombre del paciente es obligatorio.'],
      [g_dom_txtPesoPaciente, f_txt_validarNumeroPositivo(g_dom_txtPesoPaciente.value, 'El peso')],
      [g_dom_selMedicamentoDosis, v_txt_errorMedicamento],
      [g_dom_txtDosisRecomendada, f_txt_validarNumeroPositivo(g_dom_txtDosisRecomendada.value, 'La dosis')],
      [g_dom_txtConcentracionFarmaco, v_txt_errorConcentracion]
    ];
    v_arr_validaciones.forEach(([it_campo, it_error]) => f_mostrarError(it_campo, it_error));
    const v_arr_primerError = v_arr_validaciones.find(([, it_error]) => it_error);
    if (v_arr_primerError) {
      v_arr_primerError[0].focus();
      return;
    }

    const v_obj_medicamento = g_obj_vetStorage.f_arr_obtenerMedicamentos()
      .find((it_medicamento) => it_medicamento.id === v_ent_idMedicamento);
    if (!v_obj_medicamento) {
      // Lo borraron en otra pestaña después de llenar la lista.
      f_llenarMedicamentos();
      f_mostrarError(g_dom_selMedicamentoDosis, 'El medicamento ya no existe. Selecciona otro.');
      g_dom_selMedicamentoDosis.focus();
      return;
    }

    g_dom_txtNombrePaciente.value = v_txt_nombrePaciente;
    const v_dec_peso = f_dec_convertirNumero(g_dom_txtPesoPaciente.value);
    const v_dec_dosis = f_dec_convertirNumero(g_dom_txtDosisRecomendada.value);
    const v_dec_concentracion = v_bol_usaConcentracion ? f_dec_convertirNumero(g_dom_txtConcentracionFarmaco.value) : null;
    g_arr_dosisCalculadas.push({
      idFila: g_ent_siguienteFila++,
      idMedicamento: v_obj_medicamento.id,
      nombre: v_obj_medicamento.nombre,
      dosis: v_dec_dosis,
      unidadDosis: g_dom_selUnidadDosis.value,
      concentracion: v_dec_concentracion,
      unidadConcentracion: g_dom_selUnidadConcentracion.value,
      mililitros: f_dec_calcularMililitros(v_dec_peso, v_dec_dosis, g_dom_selUnidadDosis.value,
        v_dec_concentracion, g_dom_selUnidadConcentracion.value)
    });

    f_mostrarResultados();
    f_limpiarMedicamento();
    g_dom_selMedicamentoDosis.focus();
    f_mostrarAviso(`Dosis de "${v_obj_medicamento.nombre}" calculada.`);
  }

  // ---------- Quitar y blanquear ----------
  function h_clickTabla(p_obj_evento) {
    const v_dom_btnQuitar = p_obj_evento.target.closest('[data-quitar]');
    if (!v_dom_btnQuitar) return;
    const v_ent_idFila = Number(v_dom_btnQuitar.dataset.quitar);
    const v_obj_dosis = g_arr_dosisCalculadas.find((it_dosis) => it_dosis.idFila === v_ent_idFila);
    g_arr_dosisCalculadas = g_arr_dosisCalculadas.filter((it_dosis) => it_dosis.idFila !== v_ent_idFila);
    f_mostrarResultados();
    g_dom_selMedicamentoDosis.focus();
    f_mostrarAviso(`"${v_obj_dosis.nombre}" se quitó de la lista.`);
  }

  function f_blanquearPantalla() {
    g_arr_dosisCalculadas = [];
    g_dom_frmCalculoDosis.reset();
    g_dom_frmCalculoDosis.querySelectorAll('[aria-describedby]')
      .forEach((it_campo) => f_mostrarError(it_campo, ''));
    f_actualizarConcentracion();
    f_mostrarResultados();
    g_dom_txtNombrePaciente.focus();
    f_mostrarAviso('Pantalla en blanco. Puedes ingresar otro paciente.');
  }

  function h_clickLimpiarCalculo() {
    const v_ent_cantidad = g_arr_dosisCalculadas.length;
    f_mostrarConfirmacion({
      p_txt_icono: '🧹',
      p_txt_titulo: '¿Blanquear la pantalla?',
      p_txt_texto: 'Se borrarán los datos del paciente' +
        (v_ent_cantidad ? ` y ${v_ent_cantidad} ${v_ent_cantidad === 1 ? 'medicamento calculado' : 'medicamentos calculados'}` : '') +
        '. Esta acción no se puede deshacer.',
      p_txt_textoAceptar: 'Blanquear',
      p_fun_alAceptar: f_blanquearPantalla
    });
  }

  // Al escribir o cambiar un campo se borra su mensaje de error.
  function h_cambiarCampo(p_obj_evento) {
    if (p_obj_evento.target.hasAttribute('aria-describedby')) f_mostrarError(p_obj_evento.target, '');
  }

  function h_cambiarUnidadDosis() {
    f_actualizarConcentracion();
  }

  g_dom_frmCalculoDosis.addEventListener('submit', h_enviarFormulario);
  g_dom_frmCalculoDosis.addEventListener('input', h_cambiarCampo);
  g_dom_selUnidadDosis.addEventListener('change', h_cambiarUnidadDosis);
  g_dom_tblDosisCuerpo.addEventListener('click', h_clickTabla);
  g_dom_btnLimpiarCalculo.addEventListener('click', h_clickLimpiarCalculo);

  f_llenarMedicamentos();
  f_actualizarConcentracion();
  f_mostrarResultados();
})();
