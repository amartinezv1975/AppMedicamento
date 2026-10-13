// Persistencia en localStorage con datos semilla para el prototipo.
// Se llama g_obj_vetStorage para no ocultar la interfaz global Storage del navegador.
const g_obj_vetStorage = (() => {
  const c_obj_CLAVES = {
    clasificaciones: 'vet_clasificaciones',
    medicamentos: 'vet_medicamentos',
    secuenciaClasificacion: 'vet_seq_clasificacion'
  };

  const c_arr_CLASIFICACIONES_INICIALES = [
    { codigo: 1, nombre: 'Antibióticos' },
    { codigo: 2, nombre: 'Analgésicos' },
    { codigo: 3, nombre: 'Anestésicos' },
    { codigo: 4, nombre: 'Antifúngicos' },
    { codigo: 5, nombre: 'Fármacos endocrinos' },
    { codigo: 6, nombre: 'Vacunas' }
  ];

  // Medicamentos de ejemplo para probar la regla de "no borrar con datos asociados".
  const c_arr_MEDICAMENTOS_INICIALES = [
    { id: 1, nombre: 'Amoxicilina', codigoClasificacion: 1 },
    { id: 2, nombre: 'Enrofloxacina', codigoClasificacion: 1 },
    { id: 3, nombre: 'Meloxicam', codigoClasificacion: 2 },
    { id: 4, nombre: 'Vacuna antirrábica', codigoClasificacion: 6 }
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

  function f_cargarDatosIniciales() {
    if (f_obj_leerDato(c_obj_CLAVES.clasificaciones, null) === null) {
      f_bol_guardarDato(c_obj_CLAVES.clasificaciones, c_arr_CLASIFICACIONES_INICIALES);
      f_bol_guardarDato(c_obj_CLAVES.secuenciaClasificacion, c_arr_CLASIFICACIONES_INICIALES.length);
    }
    if (f_obj_leerDato(c_obj_CLAVES.medicamentos, null) === null) {
      f_bol_guardarDato(c_obj_CLAVES.medicamentos, c_arr_MEDICAMENTOS_INICIALES);
    }
  }

  // El siguiente código nunca puede chocar con uno existente, aunque la
  // secuencia guardada se haya perdido o dañado.
  function f_ent_calcularSiguienteCodigo() {
    const v_ent_secuencia = Number(f_obj_leerDato(c_obj_CLAVES.secuenciaClasificacion, 0)) || 0;
    const v_ent_codigoMaximo = f_obj_leerDato(c_obj_CLAVES.clasificaciones, [])
      .reduce((p_ent_maximo, it_clasificacion) => Math.max(p_ent_maximo, it_clasificacion.codigo), 0);
    return Math.max(v_ent_secuencia, v_ent_codigoMaximo) + 1;
  }

  f_cargarDatosIniciales();

  return {
    f_arr_obtenerClasificaciones: () => f_obj_leerDato(c_obj_CLAVES.clasificaciones, []),
    f_bol_guardarClasificaciones: (p_arr_clasificaciones) =>
      f_bol_guardarDato(c_obj_CLAVES.clasificaciones, p_arr_clasificaciones),
    f_arr_obtenerMedicamentos: () => f_obj_leerDato(c_obj_CLAVES.medicamentos, []),
    f_ent_consultarSiguienteCodigo: f_ent_calcularSiguienteCodigo,
    f_ent_asignarSiguienteCodigo() {
      const v_ent_siguienteCodigo = f_ent_calcularSiguienteCodigo();
      f_bol_guardarDato(c_obj_CLAVES.secuenciaClasificacion, v_ent_siguienteCodigo);
      return v_ent_siguienteCodigo;
    }
  };
})();
