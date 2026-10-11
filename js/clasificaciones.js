// HU-01: CRUD de clasificaciones de medicamentos.
(() => {
  const POR_PAGINA = 3;
  let paginaActual = 1;
  let codigoEditando = null; // null = creando

  const $ = (id) => document.getElementById(id);
  const tablaBody = $('tablaBody');
  const vacio = $('vacio');
  const infoPagina = $('infoPagina');
  const btnAnterior = $('btnAnterior');
  const btnSiguiente = $('btnSiguiente');
  const modalForm = $('modalForm');
  const form = $('formClasificacion');
  const inputCodigo = $('inputCodigo');
  const inputNombre = $('inputNombre');
  const errorNombre = $('errorNombre');
  const modalConfirm = $('modalConfirm');

  // Normaliza para comparar duplicados: sin tildes, minúsculas, espacios simples.
  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function limpiarNombre(texto) {
    return texto.replace(/\s+/g, ' ').trim();
  }

  function ordenadas() {
    return Storage.getClasificaciones().sort((a, b) => a.codigo - b.codigo);
  }

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // ---------- Render ----------
  function render() {
    const lista = ordenadas();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    paginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);

    const inicio = (paginaActual - 1) * POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + POR_PAGINA);

    tablaBody.innerHTML = pagina.map((c) => `
      <tr>
        <td class="cell-codigo">${c.codigo}</td>
        <td>${escapar(c.nombre)}</td>
        <td class="cell-acciones">
          <button type="button" class="icon-btn edit" data-editar="${c.codigo}"
                  title="Editar" aria-label="Editar ${escapar(c.nombre)}">✏️</button>
          <button type="button" class="icon-btn delete" data-borrar="${c.codigo}"
                  title="Borrar" aria-label="Borrar ${escapar(c.nombre)}">🗑️</button>
        </td>
      </tr>`).join('');

    vacio.hidden = lista.length > 0;
    infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaActual <= 1;
    btnSiguiente.disabled = paginaActual >= totalPaginas;
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(mensaje, tipo = 'success') {
    const t = $('toast');
    t.textContent = mensaje;
    t.className = `toast ${tipo} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Modales ----------
  function abrir(modal) { modal.hidden = false; }
  function cerrar(modal) { modal.hidden = true; }

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-cerrar]')) cerrar(modal);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(cerrar);
  });

  function abrirFormulario(clasificacion) {
    codigoEditando = clasificacion ? clasificacion.codigo : null;
    $('tituloForm').textContent = clasificacion ? 'Editar clasificación' : 'Nueva clasificación';
    inputCodigo.value = clasificacion ? clasificacion.codigo : Storage.peekNextCodigo();
    inputNombre.value = clasificacion ? clasificacion.nombre : '';
    mostrarError('');
    abrir(modalForm);
    inputNombre.focus();
  }

  function mostrarError(mensaje) {
    errorNombre.textContent = mensaje;
    inputNombre.classList.toggle('invalid', Boolean(mensaje));
  }

  // Confirmación genérica: si onAceptar es null, actúa como aviso de solo lectura.
  function confirmar({ icono, titulo, texto, textoAceptar, onAceptar }) {
    $('iconoConfirm').textContent = icono;
    $('tituloConfirm').textContent = titulo;
    $('textoConfirm').textContent = texto;
    const btnAceptar = $('btnAceptarConfirm');
    const btnCancelar = $('btnCancelarConfirm');
    btnAceptar.hidden = !onAceptar;
    btnAceptar.textContent = textoAceptar || 'Aceptar';
    btnCancelar.textContent = onAceptar ? 'Cancelar' : 'Entendido';
    btnAceptar.onclick = () => {
      cerrar(modalConfirm);
      onAceptar();
    };
    abrir(modalConfirm);
  }

  // ---------- Acciones ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = limpiarNombre(inputNombre.value);

    if (!nombre) {
      mostrarError('El nombre es obligatorio.');
      return;
    }

    const lista = Storage.getClasificaciones();
    const clave = normalizar(nombre);
    const duplicada = lista.find((c) => c.codigo !== codigoEditando && normalizar(c.nombre) === clave);
    if (duplicada) {
      mostrarError(`Ya existe la clasificación "${duplicada.nombre}" (código ${duplicada.codigo}).`);
      return;
    }

    if (codigoEditando === null) {
      const nueva = { codigo: Storage.takeNextCodigo(), nombre };
      lista.push(nueva);
      Storage.saveClasificaciones(lista);
      paginaActual = Math.ceil(lista.length / POR_PAGINA); // ir a la página donde quedó
      toast(`Clasificación "${nombre}" creada.`);
    } else {
      const item = lista.find((c) => c.codigo === codigoEditando);
      item.nombre = nombre;
      Storage.saveClasificaciones(lista);
      toast('Clasificación actualizada.');
    }

    cerrar(modalForm);
    render();
  });

  inputNombre.addEventListener('input', () => mostrarError(''));

  tablaBody.addEventListener('click', (e) => {
    const btnEditar = e.target.closest('[data-editar]');
    const btnBorrar = e.target.closest('[data-borrar]');
    const lista = Storage.getClasificaciones();

    if (btnEditar) {
      const codigo = Number(btnEditar.dataset.editar);
      abrirFormulario(lista.find((c) => c.codigo === codigo));
    }

    if (btnBorrar) {
      const codigo = Number(btnBorrar.dataset.borrar);
      const item = lista.find((c) => c.codigo === codigo);
      const asociados = Storage.getMedicamentos().filter((m) => m.codigoClasificacion === codigo);

      if (asociados.length > 0) {
        confirmar({
          icono: '⚠️',
          titulo: 'No se puede eliminar',
          texto: `"${item.nombre}" tiene ${asociados.length} medicamento(s) asociado(s): ` +
                 `${asociados.map((m) => m.nombre).join(', ')}.`,
          onAceptar: null
        });
        return;
      }

      confirmar({
        icono: '🗑️',
        titulo: '¿Eliminar clasificación?',
        texto: `Se eliminará "${item.nombre}" (código ${item.codigo}). Esta acción no se puede deshacer.`,
        textoAceptar: 'Eliminar',
        onAceptar: () => {
          Storage.saveClasificaciones(Storage.getClasificaciones().filter((c) => c.codigo !== codigo));
          toast(`Clasificación "${item.nombre}" eliminada.`);
          render();
        }
      });
    }
  });

  $('btnNueva').addEventListener('click', () => abrirFormulario(null));
  btnAnterior.addEventListener('click', () => { paginaActual--; render(); });
  btnSiguiente.addEventListener('click', () => { paginaActual++; render(); });

  render();
})();
