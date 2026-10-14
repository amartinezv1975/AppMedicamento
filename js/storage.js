// Persistencia en localStorage con datos semilla para el prototipo.
// Se llama g_obj_vetStorage para no ocultar la interfaz global Storage del navegador.
const g_obj_vetStorage = (() => {
  const c_obj_CLAVES = {
    clasificaciones: 'vet_clasificaciones',
    medicamentos: 'vet_medicamentos',
    secuenciaClasificacion: 'vet_seq_clasificacion',
    secuenciaMedicamento: 'vet_seq_medicamento'
  };

  const c_arr_CLASIFICACIONES_INICIALES = [
    { codigo: 1, nombre: 'Antibióticos' },
    { codigo: 2, nombre: 'Analgésicos' },
    { codigo: 3, nombre: 'Anestésicos' },
    { codigo: 4, nombre: 'Antifúngicos' },
    { codigo: 5, nombre: 'Fármacos endocrinos' },
    { codigo: 6, nombre: 'Vacunas' },
    { codigo: 7, nombre: 'Antiparasitarios' }
  ];

  // Catálogos fijos de HU-02. El valor es lo que se guarda; la etiqueta es lo que se muestra.
  const c_arr_VIAS_ADMINISTRACION = Object.freeze([
    { valor: 'oral', etiqueta: 'Oral' },
    { valor: 'intramuscular', etiqueta: 'Intramuscular' },
    { valor: 'intravenosa', etiqueta: 'Intravenosa' },
    { valor: 'subcutanea', etiqueta: 'Subcutánea' }
  ].map(Object.freeze));

  const c_arr_PRESENTACIONES = Object.freeze([
    { valor: 'ml', etiqueta: 'Mililitros (ml)' },
    { valor: 'gramos', etiqueta: 'Gramos (g)' },
    { valor: 'pastillas', etiqueta: 'Pastillas' }
  ].map(Object.freeze));

  const c_arr_CONDICIONES_ALMACENAMIENTO = Object.freeze([
    { valor: 'temperaturaAmbiente', etiqueta: 'Temperatura ambiente' },
    { valor: 'refrigeracion', etiqueta: 'Requiere refrigeración' },
    { valor: 'cadenaFrio', etiqueta: 'Cadena de frío' },
    { valor: 'humedad', etiqueta: 'Proteger de la humedad' }
  ].map(Object.freeze));

  // Medicamentos de ejemplo. La clasificación va por nombre y se resuelve a su código al sembrar,
  // así funciona aunque el usuario ya tenga clasificaciones guardadas con otros códigos.
  // Datos de referencia para el prototipo, no son indicación clínica.
  const c_arr_MEDICAMENTOS_INICIALES = [
    ['Amoxicilina', 'Antibióticos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Enrofloxacina', 'Antibióticos', 'intramuscular', 'ml', ['temperaturaAmbiente']],
    ['Penicilina G procaínica', 'Antibióticos', 'intramuscular', 'ml', ['refrigeracion']],
    ['Oxitetraciclina', 'Antibióticos', 'intramuscular', 'ml', ['temperaturaAmbiente']],
    ['Cefalexina', 'Antibióticos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Meloxicam', 'Analgésicos', 'oral', 'ml', ['temperaturaAmbiente']],
    ['Tramadol', 'Analgésicos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Metamizol (dipirona)', 'Analgésicos', 'intravenosa', 'ml', ['temperaturaAmbiente']],
    ['Flunixin meglumina', 'Analgésicos', 'intravenosa', 'ml', ['temperaturaAmbiente']],
    ['Ketamina', 'Anestésicos', 'intramuscular', 'ml', ['temperaturaAmbiente']],
    ['Xilacina', 'Anestésicos', 'intramuscular', 'ml', ['temperaturaAmbiente']],
    ['Propofol', 'Anestésicos', 'intravenosa', 'ml', ['temperaturaAmbiente']],
    ['Ketoconazol', 'Antifúngicos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Griseofulvina', 'Antifúngicos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Insulina porcina', 'Fármacos endocrinos', 'subcutanea', 'ml', ['refrigeracion']],
    ['Levotiroxina', 'Fármacos endocrinos', 'oral', 'pastillas', ['temperaturaAmbiente', 'humedad']],
    ['Vacuna antirrábica', 'Vacunas', 'subcutanea', 'ml', ['cadenaFrio']],
    ['Vacuna séxtuple canina', 'Vacunas', 'subcutanea', 'ml', ['cadenaFrio']],
    ['Ivermectina 1 %', 'Antiparasitarios', 'subcutanea', 'ml', ['temperaturaAmbiente']],
    ['Albendazol', 'Antiparasitarios', 'oral', 'ml', ['temperaturaAmbiente']]
  ];

  function f_obj_leerDato(p_txt_clave, p_obj_valorPorDefecto) {
    try {
      const v_jsn_datosGuardados = localStorage.getItem(p_txt_clave);
      return v_jsn_datosGuardados === null ? p_obj_valorPorDefecto : JSON.parse(v_jsn_datosGuardados);
    } catch {
      return p_obj_valorPorDefecto;
    }
  }

  // Devuelve true si se guardó, false si el navegador lo impidió (cuota, modo privado…).
  function f_bol_guardarDato(p_txt_clave, p_obj_valor) {
    try {
      localStorage.setItem(p_txt_clave, JSON.stringify(p_obj_valor));
      return true;
    } catch (p_obj_error) {
      console.warn('No se pudo guardar en localStorage', p_obj_error);
      return false;
    }
  }

  // Igual a la normalización de la interfaz; se repite aquí porque storage.js carga primero.
  function f_txt_normalizarTexto(p_txt_texto) {
    return p_txt_texto.replace(/\s+/g, ' ').trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // El siguiente código nunca puede chocar con uno existente, aunque la
  // secuencia guardada se haya perdido o dañado.
  function f_ent_calcularSiguienteCodigo(p_txt_claveSecuencia, p_txt_claveDatos, p_txt_campoCodigo) {
    const v_ent_secuencia = Number(f_obj_leerDato(p_txt_claveSecuencia, 0)) || 0;
    const v_ent_codigoMaximo = f_obj_leerDato(p_txt_claveDatos, [])
      .reduce((p_ent_maximo, it_registro) => Math.max(p_ent_maximo, it_registro[p_txt_campoCodigo]), 0);
    return Math.max(v_ent_secuencia, v_ent_codigoMaximo) + 1;
  }

  function f_ent_asignarSiguienteCodigo(p_txt_claveSecuencia, p_txt_claveDatos, p_txt_campoCodigo) {
    const v_ent_siguienteCodigo = f_ent_calcularSiguienteCodigo(p_txt_claveSecuencia, p_txt_claveDatos, p_txt_campoCodigo);
    f_bol_guardarDato(p_txt_claveSecuencia, v_ent_siguienteCodigo);
    return v_ent_siguienteCodigo;
  }

  // Busca la clasificación por nombre; si no existe (p. ej. Antiparasitarios en datos viejos), la crea.
  function f_ent_obtenerCodigoClasificacion(p_txt_nombre) {
    const v_arr_clasificaciones = f_obj_leerDato(c_obj_CLAVES.clasificaciones, []);
    const v_txt_nombreNormalizado = f_txt_normalizarTexto(p_txt_nombre);
    const v_obj_existente = v_arr_clasificaciones
      .find((it_clasificacion) => f_txt_normalizarTexto(it_clasificacion.nombre) === v_txt_nombreNormalizado);
    if (v_obj_existente) return v_obj_existente.codigo;

    const v_ent_codigo = f_ent_asignarSiguienteCodigo(
      c_obj_CLAVES.secuenciaClasificacion, c_obj_CLAVES.clasificaciones, 'codigo');
    v_arr_clasificaciones.push({ codigo: v_ent_codigo, nombre: p_txt_nombre });
    f_bol_guardarDato(c_obj_CLAVES.clasificaciones, v_arr_clasificaciones);
    return v_ent_codigo;
  }

  function f_sembrarMedicamentos() {
    const v_arr_medicamentos = c_arr_MEDICAMENTOS_INICIALES.map(
      ([p_txt_nombre, p_txt_clasificacion, p_txt_via, p_txt_presentacion, p_arr_almacenamiento], p_ent_posicion) => ({
        id: p_ent_posicion + 1,
        nombre: p_txt_nombre,
        codigoClasificacion: f_ent_obtenerCodigoClasificacion(p_txt_clasificacion),
        viaAdministracion: p_txt_via,
        presentacion: p_txt_presentacion,
        almacenamiento: p_arr_almacenamiento
      }));
    f_bol_guardarDato(c_obj_CLAVES.medicamentos, v_arr_medicamentos);
    f_bol_guardarDato(c_obj_CLAVES.secuenciaMedicamento, v_arr_medicamentos.length);
  }

  function f_cargarDatosIniciales() {
    if (f_obj_leerDato(c_obj_CLAVES.clasificaciones, null) === null) {
      f_bol_guardarDato(c_obj_CLAVES.clasificaciones, c_arr_CLASIFICACIONES_INICIALES);
      f_bol_guardarDato(c_obj_CLAVES.secuenciaClasificacion, c_arr_CLASIFICACIONES_INICIALES.length);
    }
    // Antes de HU-02 había 4 medicamentos temporales sin vía de administración: se reemplazan.
    const v_arr_medicamentosGuardados = f_obj_leerDato(c_obj_CLAVES.medicamentos, null);
    const v_bol_sonTemporales = Array.isArray(v_arr_medicamentosGuardados) &&
      v_arr_medicamentosGuardados.some((it_medicamento) => !('viaAdministracion' in it_medicamento));
    if (!Array.isArray(v_arr_medicamentosGuardados) || v_bol_sonTemporales) {
      f_sembrarMedicamentos();
    }
  }

  f_cargarDatosIniciales();

  return {
    f_arr_obtenerClasificaciones: () => f_obj_leerDato(c_obj_CLAVES.clasificaciones, []),
    f_bol_guardarClasificaciones: (p_arr_clasificaciones) =>
      f_bol_guardarDato(c_obj_CLAVES.clasificaciones, p_arr_clasificaciones),
    f_ent_consultarSiguienteCodigo: () => f_ent_calcularSiguienteCodigo(
      c_obj_CLAVES.secuenciaClasificacion, c_obj_CLAVES.clasificaciones, 'codigo'),
    f_ent_asignarSiguienteCodigo: () => f_ent_asignarSiguienteCodigo(
      c_obj_CLAVES.secuenciaClasificacion, c_obj_CLAVES.clasificaciones, 'codigo'),

    f_arr_obtenerMedicamentos: () => f_obj_leerDato(c_obj_CLAVES.medicamentos, []),
    f_bol_guardarMedicamentos: (p_arr_medicamentos) =>
      f_bol_guardarDato(c_obj_CLAVES.medicamentos, p_arr_medicamentos),
    f_ent_consultarSiguienteIdMedicamento: () => f_ent_calcularSiguienteCodigo(
      c_obj_CLAVES.secuenciaMedicamento, c_obj_CLAVES.medicamentos, 'id'),
    f_ent_asignarSiguienteIdMedicamento: () => f_ent_asignarSiguienteCodigo(
      c_obj_CLAVES.secuenciaMedicamento, c_obj_CLAVES.medicamentos, 'id'),

    f_arr_obtenerViasAdministracion: () => c_arr_VIAS_ADMINISTRACION,
    f_arr_obtenerPresentaciones: () => c_arr_PRESENTACIONES,
    f_arr_obtenerCondicionesAlmacenamiento: () => c_arr_CONDICIONES_ALMACENAMIENTO
  };
})();
