// Pantalla de acceso. Por ahora solo exige login y contraseña; no los valida contra ningún usuario.
(() => {
  const f_obj_obtenerElemento = (p_txt_id) => document.getElementById(p_txt_id);
  const g_dom_frmAcceso = f_obj_obtenerElemento('frm-acceso');
  const g_dom_txtLogin = f_obj_obtenerElemento('txt-login');
  const g_dom_txtContrasena = f_obj_obtenerElemento('txt-contrasena');
  const g_dom_lblErrorAcceso = f_obj_obtenerElemento('lbl-error-acceso');

  // Cada campo apunta a su etiqueta de error con aria-describedby.
  function f_mostrarError(p_dom_campo, p_txt_mensaje) {
    f_obj_obtenerElemento(p_dom_campo.getAttribute('aria-describedby')).textContent = p_txt_mensaje;
    p_dom_campo.classList.toggle('es-invalido', Boolean(p_txt_mensaje));
  }

  function h_enviarFormulario(p_obj_evento) {
    p_obj_evento.preventDefault();
    const v_txt_login = g_dom_txtLogin.value.trim();
    const v_bol_hayContrasena = g_dom_txtContrasena.value.trim() !== '';

    f_mostrarError(g_dom_txtLogin, v_txt_login ? '' : 'El usuario es obligatorio.');
    f_mostrarError(g_dom_txtContrasena, v_bol_hayContrasena ? '' : 'La contraseña es obligatoria.');
    g_dom_lblErrorAcceso.textContent = '';
    if (!v_txt_login) {
      g_dom_txtLogin.focus();
      return;
    }
    if (!v_bol_hayContrasena) {
      g_dom_txtContrasena.focus();
      return;
    }

    if (!g_obj_vetStorage.f_bol_iniciarSesion(v_txt_login)) {
      g_dom_lblErrorAcceso.textContent = 'No se pudo iniciar la sesión. Revisa que el navegador permita almacenar datos.';
      return;
    }
    location.href = 'index.html';
  }

  // Al escribir en un campo se borra su mensaje de error.
  function h_escribirCampo(p_obj_evento) {
    if (p_obj_evento.target.hasAttribute('aria-describedby')) f_mostrarError(p_obj_evento.target, '');
  }

  g_dom_frmAcceso.addEventListener('submit', h_enviarFormulario);
  g_dom_frmAcceso.addEventListener('input', h_escribirCampo);
  g_dom_txtLogin.focus();
})();
