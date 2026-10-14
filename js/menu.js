// Menú hamburguesa y datos de la sesión en el encabezado, compartidos por todas las páginas internas.
// Las opciones se definen solo aquí; la opción activa sale de <body data-pagina="...">.
(() => {
  const c_arr_OPCIONES_MENU = [
    { pagina: 'inicio', archivo: 'index.html', icono: '🏠', texto: 'Inicio' },
    { pagina: 'clasificaciones', archivo: 'clasificaciones.html', icono: '🏷️', texto: 'Clasificaciones' },
    { pagina: 'medicamentos', archivo: 'medicamentos.html', icono: '💉', texto: 'Medicamentos' },
    { pagina: 'calcular', archivo: null, icono: '🐾', texto: 'Calcular dosis', detalle: 'Próximamente' }
  ];
  const c_txt_PAGINA_ACTUAL = document.body.dataset.pagina;
  const c_txt_SELECTOR_ENFOCABLES = 'a[href], button';

  function f_txt_crearOpcion(p_obj_opcion) {
    const v_txt_contenido =
      `<span class="vd-menu-lateral__icono" aria-hidden="true">${p_obj_opcion.icono}</span>${p_obj_opcion.texto}` +
      (p_obj_opcion.detalle ? `<small class="vd-menu-lateral__detalle">${p_obj_opcion.detalle}</small>` : '');
    if (!p_obj_opcion.archivo) {
      return `<li><span class="vd-menu-lateral__opcion es-desactivado" aria-disabled="true">${v_txt_contenido}</span></li>`;
    }
    const v_bol_esActiva = p_obj_opcion.pagina === c_txt_PAGINA_ACTUAL;
    return `<li><a href="${p_obj_opcion.archivo}" class="vd-menu-lateral__opcion${v_bol_esActiva ? ' es-activo' : ''}"` +
           `${v_bol_esActiva ? ' aria-current="page"' : ''}>${v_txt_contenido}</a></li>`;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div id="sec-menu-lateral" class="vd-menu-lateral" hidden>
      <div class="vd-menu-lateral__fondo" data-cerrar-menu></div>
      <nav id="nav-principal" class="vd-menu-lateral__panel" aria-label="Menú principal">
        <div class="vd-menu-lateral__encabezado">
          <img src="img/logo-vetdosis.svg" alt="" class="vd-app__logo">
          <strong class="vd-menu-lateral__titulo">VetDosis</strong>
          <button type="button" id="btn-cerrar-menu" class="vd-menu-lateral__cerrar" aria-label="Cerrar menú" data-cerrar-menu>✕</button>
        </div>
        <ul class="vd-menu-lateral__lista">${c_arr_OPCIONES_MENU.map(f_txt_crearOpcion).join('')}</ul>
      </nav>
    </div>`);

  // Arriba a la derecha del encabezado: login conectado y, debajo, cerrar sesión.
  document.querySelector('.vd-app__encabezado').insertAdjacentHTML('beforeend', `
    <div class="vd-app__sesion">
      <span id="lbl-usuario-sesion" class="vd-app__usuario"></span>
      <button type="button" id="btn-cerrar-sesion" class="vd-app__cerrar-sesion">Cerrar sesión</button>
    </div>`);

  const g_dom_btnAbrirMenu = document.getElementById('btn-abrir-menu');
  const g_dom_secMenuLateral = document.getElementById('sec-menu-lateral');
  const g_dom_lblUsuarioSesion = document.getElementById('lbl-usuario-sesion');
  const g_dom_btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

  const g_obj_sesion = g_obj_vetStorage.f_obj_obtenerSesion();
  g_dom_lblUsuarioSesion.textContent = g_obj_sesion ? `👤 ${g_obj_sesion.login}` : '';
  g_dom_lblUsuarioSesion.title = g_obj_sesion ? `Usuario conectado: ${g_obj_sesion.login}` : '';

  function f_abrirMenu() {
    g_dom_secMenuLateral.hidden = false;
    g_dom_btnAbrirMenu.setAttribute('aria-expanded', 'true');
    (g_dom_secMenuLateral.querySelector('.es-activo') ||
     g_dom_secMenuLateral.querySelector(c_txt_SELECTOR_ENFOCABLES)).focus();
  }

  function f_cerrarMenu() {
    if (g_dom_secMenuLateral.hidden) return;
    g_dom_secMenuLateral.hidden = true;
    g_dom_btnAbrirMenu.setAttribute('aria-expanded', 'false');
    g_dom_btnAbrirMenu.focus();
  }

  function h_clickAbrirMenu() {
    f_abrirMenu();
  }

  function h_clickCerrarSesion() {
    g_obj_vetStorage.f_cerrarSesion();
    location.replace('acceso.html');
  }

  function h_clickMenu(p_obj_evento) {
    if (p_obj_evento.target.closest('[data-cerrar-menu]')) f_cerrarMenu();
  }

  // Escape cierra; Tab no se sale del menú mientras está abierto.
  function h_teclaMenu(p_obj_evento) {
    if (g_dom_secMenuLateral.hidden) return;
    if (p_obj_evento.key === 'Escape') {
      f_cerrarMenu();
      return;
    }
    if (p_obj_evento.key !== 'Tab') return;
    const v_arr_enfocables = [...g_dom_secMenuLateral.querySelectorAll(c_txt_SELECTOR_ENFOCABLES)];
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

  g_dom_btnAbrirMenu.addEventListener('click', h_clickAbrirMenu);
  g_dom_secMenuLateral.addEventListener('click', h_clickMenu);
  g_dom_btnCerrarSesion.addEventListener('click', h_clickCerrarSesion);
  document.addEventListener('keydown', h_teclaMenu);
})();
