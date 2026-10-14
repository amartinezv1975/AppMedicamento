# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Proyecto

**VetDosis** es un prototipo para celular que calcula la dosis de medicamento que se le debe aplicar a un animal según su peso. Está hecho solo con HTML, CSS y JavaScript, sin frameworks, sin paso de compilación, sin gestor de paquetes y sin pruebas automáticas. Las funcionalidades se construyen por **historia de usuario (HU-xx)**, a medida que el usuario las entrega. Los textos de la interfaz, los nombres en el código y los comentarios están en español; mantenlo así.

## Ejecución

- Abre `index.html` directamente en el navegador, o usa un servidor local:
  `python -m http.server 5500` → `http://localhost:5500/index.html` (cada opción tiene su página: `clasificaciones.html`, `medicamentos.html`, `calculo-dosis.html`)
- La primera pantalla es `acceso.html`: cualquier login y contraseña no vacíos sirven para entrar. Las páginas internas redirigen allí si no hay sesión en la pestaña.
- La automatización del navegador (claude-in-chrome) no puede abrir URLs `file://`. Para verificar en Chrome, usa el servidor local.
- No hay pruebas automáticas. Las funcionalidades se verifican usando los botones reales en el navegador, con clics o con un script, en una ventana del tamaño de un celular.
- Los datos se guardan en `localStorage`. Para volver a los datos de ejemplo, borra las llaves `vet_*` y recarga:
  `['vet_clasificaciones','vet_medicamentos','vet_seq_clasificacion','vet_seq_medicamento'].forEach(k => localStorage.removeItem(k))`

## Arquitectura

- `acceso.html` + `js/acceso.js`: pantalla de ingreso. Exige login y contraseña, pero **todavía no los valida** contra ningún usuario. Guarda solo el login (nunca la contraseña) en `sessionStorage` (`vet_sesion`) y va a `index.html`.
- `js/sesion.js` protege las páginas internas: se carga en el `<head>`, justo después de `js/storage.js` (que por eso también va en el `<head>`), y redirige a `acceso.html` antes de dibujar si no hay sesión. Toda página interna nueva debe incluir esas dos etiquetas.
- Una página HTML por opción, todas con el mismo encabezado (botón ☰ `#btn-abrir-menu`, logo y título):
  - `index.html`: inicio, con tarjetas de acceso a cada opción y el total de registros (`js/inicio.js`).
  - `clasificaciones.html` y `medicamentos.html`: tabla, ventana para crear y editar (`#mdl-formulario-clasificacion`, `#mdl-formulario-medicamento`), `#mdl-confirmar` (confirmación y también aviso de solo lectura) y el aviso tipo toast `#sec-aviso`.
  - `calculo-dosis.html` (`js/calculo-dosis.js`): formulario del paciente y del medicamento, tabla de dosis calculadas, nota de referencia y botón "Blanquear pantalla". Solo usa `#mdl-confirmar` y `#sec-aviso`.
  - El `<body data-pagina="...">` indica qué opción del menú se marca como activa. Los ids llevan el sufijo de su opción (`btn-anterior-medicamentos`).
- Los scripts se cargan con etiquetas `<script>` normales, no como módulos, y el orden importa: en el `<head>` `js/storage.js` y `js/sesion.js`; al final del `<body>` `js/menu.js`, `js/interfaz.js` y luego el script de la página.
- `js/menu.js` arma el menú lateral (hamburguesa) en todas las páginas desde una sola lista, `c_arr_OPCIONES_MENU`. Para agregar una opción: súmala a esa lista, crea su `.html` copiando el encabezado de otra página y ponle su `data-pagina`. Se cierra con ✕, Escape o tocando el fondo. También agrega arriba a la derecha del encabezado el login conectado y, debajo, el botón "Cerrar sesión", que borra la sesión y vuelve a `acceso.html`.
- `js/storage.js` expone un objeto global `g_obj_vetStorage` (una IIFE; no se llama `Storage` para no ocultar la interfaz del navegador) y es el único archivo que usa `localStorage` y `sessionStorage`. Carga los datos iniciales la primera vez, solo cuando una llave no existe:
  - `vet_clasificaciones`: `[{ codigo, nombre }]`
  - `vet_medicamentos`: `[{ id, nombre, codigoClasificacion, viaAdministracion, presentacion, almacenamiento: [] }]`, con 20 medicamentos de ejemplo. La semilla referencia la clasificación por nombre y la resuelve a su código al cargar; si falta (p. ej. Antiparasitarios), la crea. Si encuentra los 4 medicamentos temporales de antes de HU-02 (sin `viaAdministracion`), los reemplaza por la semilla.
  - `vet_seq_clasificacion` y `vet_seq_medicamento`: el último código asignado. Los códigos son consecutivos, automáticos y no editables, y no se reutilizan después de borrar. El siguiente código es el mayor entre la secuencia y el código más alto existente, más 1, para que nunca choque.
  - Los catálogos fijos (vías, presentaciones, condiciones de almacenamiento) viven en `storage.js` como `{ valor, etiqueta }`: se guarda el valor y se muestra la etiqueta.
  - Las funciones `f_bol_guardar*` devuelven `false` si el navegador no permite guardar; las pantallas deben mostrar un error en ese caso, no un mensaje de éxito.
- `js/interfaz.js` expone `g_obj_vetInterfaz` con lo compartido entre las páginas de mantenimiento: aviso toast, abrir/cerrar ventanas con foco atrapado, `f_mostrarConfirmacion`, limpieza/normalización de nombres y escape de HTML.
- Los scripts de cada funcionalidad (`js/clasificaciones.js`, `js/medicamentos.js`) son IIFE independientes que vuelven a dibujar la pantalla desde `g_obj_vetStorage` en cada cambio. No guardan datos en memoria, solo el estado de la interfaz, como la página actual.
- `js/calculo-dosis.js` es la excepción: no guarda nada. Los cálculos viven en memoria (`g_arr_dosisCalculadas`) y se pierden al salir o recargar; no hay historial.

## Reglas de negocio ya implementadas (HU-01 Clasificaciones)

- Tabla tipo Excel con **3 registros por página**, botones de editar y borrar en cada fila, y un botón "Nueva clasificación".
- Se rechazan los nombres repetidos después de normalizarlos: quitar espacios sobrantes, pasar a minúsculas y quitar tildes. Al editar, el propio registro no cuenta como repetido.
- No se permite borrar una clasificación si algún `medicamento.codigoClasificacion` usa su código; el aviso muestra los medicamentos asociados.

## Reglas de negocio ya implementadas (HU-02 Medicamentos)

- Misma tabla de **3 registros por página**; columnas Código · Medicamento · Acciones, con clasificación, vía, presentación y almacenamiento en letra pequeña bajo el nombre.
- Campos: nombre, clasificación (lista con las clasificaciones vigentes), vía de administración (una: oral, intramuscular, intravenosa, subcutánea), presentación (ml, gramos, pastillas) y condiciones de almacenamiento (varias: temperatura ambiente, refrigeración, cadena de frío, proteger de la humedad).
- Todos los campos son obligatorios, con al menos una condición de almacenamiento. Nombres repetidos se rechazan con la misma normalización de HU-01. "Temperatura ambiente" no se combina con "Refrigeración" ni "Cadena de frío".
- Borrar un medicamento pide confirmación y no tiene restricciones.

## Reglas de negocio ya implementadas (HU-03 Calcular dosis)

- Se ingresan nombre y peso (kg) del paciente y luego, uno por uno, los medicamentos: se elige de la lista de medicamentos registrados (todos, sin importar su presentación), con dosis recomendada (mg/kg o ml/kg) y concentración (mg/ml o %).
- Fórmula: `ml = (peso kg × dosis mg/kg) / concentración mg/ml`. Una concentración en % se convierte con 1 % = 10 mg/ml (máximo 100 %). Con dosis en ml/kg, `ml = peso × dosis` y el campo de concentración se esconde.
- El resultado siempre se muestra en ml con 2 decimales; si es menor que 0,005 se muestra "< 0,01 ml". Los datos ingresados se muestran sin redondear.
- Números con coma o punto decimal, mayores que 0; el peso no tiene tope. Un mismo medicamento no se repite en la lista.
- Con medicamentos en la lista, el nombre y el peso del paciente quedan bloqueados. Cada fila se puede quitar. Los resultados **no se suman**, porque son medicamentos distintos.
- "Blanquear pantalla" pide confirmación y borra el paciente y la lista. Siempre se muestra la nota "Resultado de referencia; verifique antes de administrar".

## Convenciones

- Todo nombre nuevo (JS, ids de HTML, clases y variables CSS, archivos) debe cumplir `estandar_nomenclatura_codigo.txt`. Después de escribir código, revísalo con el agente `revisor-nomenclatura`.
- Diseño pensado primero para celular, centrado con `max-width: 480px`. Los colores del tema son variables CSS en `:root` dentro de `css/styles.css` (paleta veterinaria en verde azulado).
- Las imágenes de veterinaria son SVG propios en `img/`. No agregues imágenes externas ni dependencias de CDN.
- No uses `alert`, `confirm` ni `prompt`; reutiliza la ventana emergente propia y el aviso toast.
- `docs/practica-claude101-code.md` es la bitácora de aprendizaje del usuario sobre Claude Code, con capturas en `docs/img/`. No es documentación de la app; edítala solo si el usuario lo pide.
