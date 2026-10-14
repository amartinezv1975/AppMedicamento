// Utilidades de interfaz compartidas por las páginas de mantenimiento: aviso, modales y confirmación.
const g_obj_vetInterfaz = (() => {
  const c_txt_SELECTOR_ENFOCABLES =
    'button:not([hidden]):not([disabled]), input:not([readonly]):not([disabled]), select:not([disabled])';

  const f_obj_obtenerElemento = (p_txt_id) => document.getElementById(p_txt_id);
  const g_dom_secAviso = f_obj_obtenerElemento('sec-aviso');
  const g_dom_mdlConfirmar = f_obj_obtenerElemento('mdl-confirmar');
  const g_dom_lblIconoConfirmar = f_obj_obtenerElemento('lbl-icono-confirmar');
  const g_dom_lblTituloConfirmar = f_obj_obtenerElemento('lbl-titulo-confirmar');
  const g_dom_lblTextoConfirmar = f_obj_obtenerElemento('lbl-texto-confirmar');
  const g_dom_btnCancelarConfirmar = f_obj_obtenerElemento('btn-cancelar-confirmar');
  const g_dom_btnAceptarConfirmar = f_obj_obtenerElemento('btn-aceptar-confirmar');

  // ---------- Texto ----------
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

  function f_txt_escaparHtml(p_txt_texto) {
    const v_dom_contenedor = document.createElement('div');
    v_dom_contenedor.textContent = p_txt_texto;
    return v_dom_contenedor.innerHTML;
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

  // ---------- Modales (foco atrapado y devuelto al cerrar) ----------
  let g_dom_focoPrevio = null;

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

  function f_cerrarTodosLosModales() {
    document.querySelectorAll('.js-modal').forEach(f_cerrarModal);
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
    if (p_obj_evento.key === 'Escape') f_cerrarTodosLosModales();
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

  document.querySelectorAll('.js-modal').forEach(f_configurarModal);
  document.addEventListener('keydown', h_teclaEscape);

  return {
    f_obj_obtenerElemento,
    f_txt_limpiarNombre,
    f_txt_normalizarNombre,
    f_txt_escaparHtml,
    f_mostrarAviso,
    f_abrirModal,
    f_cerrarModal,
    f_mostrarConfirmacion
  };
})();
