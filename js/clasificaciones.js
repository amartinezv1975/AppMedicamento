// HU-01: CRUD de clasificaciones de medicamentos.
(() => {
  const POR_PAGINA = 3;
  const ERROR_GUARDAR = 'No se pudo guardar. Revisa que el navegador permita almacenar datos.';
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

  function limpiarNombre(texto) {
    return texto.replace(/\s+/g, ' ').trim();
  }

  // Normaliza para comparar duplicados: sin tildes, minúsculas, espacios simples.
  function normalizar(texto) {
    return limpiarNombre(texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function ordenadas() {
    return VetStorage.getClasificaciones().sort((a, b) => a.codigo - b.codigo);
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

  // Avisa que el registro ya no existe (p. ej. se borró en otra pestaña) y refresca la tabla.
  function registroInexistente() {
    toast('La clasificación ya no existe. Se actualizó la tabla.', 'error');
    render();
  }

  // ---------- Modales (foco atrapado y devuelto al cerrar) ----------
  let focoPrevio = null;
  const ENFOCABLES = 'button:not([hidden]):not([disabled]), input:not([readonly]):not([disabled])';

  function abrir(modal, elementoInicial) {
    focoPrevio = document.activeElement;
    modal.hidden = false;
    (elementoInicial || modal.querySelector(ENFOCABLES)).focus();
  }

  function cerrar(modal) {
    if (modal.hidden) return;
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.hidden = true;
    if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
    focoPrevio = null;
  }

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-cerrar]')) cerrar(modal);
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const items = [...modal.querySelectorAll(ENFOCABLES)];
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(cerrar);
  });

  function abrirFormulario(clasificacion) {
    codigoEditando = clasificacion ? clasificacion.codigo : null;
    $('tituloForm').textContent = clasificacion ? 'Editar clasificación' : 'Nueva clasificación';
    inputCodigo.value = clasificacion ? clasificacion.codigo : VetStorage.peekNextCodigo();
    inputNombre.value = clasificacion ? clasificacion.nombre : '';
    mostrarError('');
    abrir(modalForm, inputNombre);
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
    abrir(modalConfirm, btnCancelar);
  }

  // ---------- Acciones ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = limpiarNombre(inputNombre.value);

    if (!nombre) {
      mostrarError('El nombre es obligatorio.');
      return;
    }

    const lista = VetStorage.getClasificaciones();
    const clave = normalizar(nombre);
    const duplicada = lista.find((c) => c.codigo !== codigoEditando && normalizar(c.nombre) === clave);
    if (duplicada) {
      mostrarError(`Ya existe la clasificación "${duplicada.nombre}" (código ${duplicada.codigo}).`);
      return;
    }

    if (codigoEditando === null) {
      const nueva = { codigo: VetStorage.takeNextCodigo(), nombre };
      lista.push(nueva);
      if (!VetStorage.saveClasificaciones(lista)) {
        toast(ERROR_GUARDAR, 'error');
        return;
      }
      // Ir a la página donde quedó realmente el nuevo registro.
      const indice = ordenadas().findIndex((c) => c.codigo === nueva.codigo);
      paginaActual = Math.floor(indice / POR_PAGINA) + 1;
      toast(`Clasificación "${nombre}" creada.`);
    } else {
      const item = lista.find((c) => c.codigo === codigoEditando);
      if (!item) {
        cerrar(modalForm);
        registroInexistente();
        return;
      }
      item.nombre = nombre;
      if (!VetStorage.saveClasificaciones(lista)) {
        toast(ERROR_GUARDAR, 'error');
        return;
      }
      toast('Clasificación actualizada.');
    }

    cerrar(modalForm);
    render();
  });

  inputNombre.addEventListener('input', () => mostrarError(''));

  tablaBody.addEventListener('click', (e) => {
    const btnEditar = e.target.closest('[data-editar]');
    const btnBorrar = e.target.closest('[data-borrar]');
    if (!btnEditar && !btnBorrar) return;

    const codigo = Number((btnEditar || btnBorrar).dataset[btnEditar ? 'editar' : 'borrar']);
    const item = VetStorage.getClasificaciones().find((c) => c.codigo === codigo);
    if (!item) {
      registroInexistente();
      return;
    }

    if (btnEditar) {
      abrirFormulario(item);
      return;
    }

    const asociados = VetStorage.getMedicamentos().filter((m) => m.codigoClasificacion === codigo);
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
        const restantes = VetStorage.getClasificaciones().filter((c) => c.codigo !== codigo);
        if (!VetStorage.saveClasificaciones(restantes)) {
          toast(ERROR_GUARDAR, 'error');
          return;
        }
        toast(`Clasificación "${item.nombre}" eliminada.`);
        render();
        // El botón que abrió la confirmación desapareció con la fila.
        if (!document.contains(document.activeElement) || document.activeElement === document.body) {
          $('btnNueva').focus();
        }
      }
    });
  });

  $('btnNueva').addEventListener('click', () => abrirFormulario(null));
  btnAnterior.addEventListener('click', () => { paginaActual--; render(); });
  btnSiguiente.addEventListener('click', () => { paginaActual++; render(); });

  render();
})();
