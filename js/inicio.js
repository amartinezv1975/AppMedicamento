// Página de inicio: muestra cuántos registros hay en cada opción.
(() => {
  function f_txt_describirCantidad(p_ent_cantidad, p_txt_singular, p_txt_plural) {
    return `${p_ent_cantidad} ${p_ent_cantidad === 1 ? p_txt_singular : p_txt_plural}`;
  }

  document.getElementById('lbl-total-clasificaciones').textContent = f_txt_describirCantidad(
    g_obj_vetStorage.f_arr_obtenerClasificaciones().length, 'clasificación registrada', 'clasificaciones registradas');
  document.getElementById('lbl-total-medicamentos').textContent = f_txt_describirCantidad(
    g_obj_vetStorage.f_arr_obtenerMedicamentos().length, 'medicamento registrado', 'medicamentos registrados');
})();
