# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Proyecto

**VetDosis** es un prototipo para celular que calcula la dosis de medicamento que se le debe aplicar a un animal según su peso. Está hecho solo con HTML, CSS y JavaScript, sin frameworks, sin paso de compilación, sin gestor de paquetes y sin pruebas automáticas. Las funcionalidades se construyen por **historia de usuario (HU-xx)**, a medida que el usuario las entrega. Los textos de la interfaz, los nombres en el código y los comentarios están en español; mantenlo así.

## Ejecución

- Abre `index.html` directamente en el navegador, o usa un servidor local:
  `python -m http.server 5500` → `http://localhost:5500/index.html`
- La automatización del navegador (claude-in-chrome) no puede abrir URLs `file://`. Para verificar en Chrome, usa el servidor local.
- No hay pruebas automáticas. Las funcionalidades se verifican usando los botones reales en el navegador, con clics o con un script, en una ventana del tamaño de un celular.
- Los datos se guardan en `localStorage`. Para volver a los datos de ejemplo, borra las llaves `vet_*` y recarga:
  `['vet_clasificaciones','vet_medicamentos','vet_seq_clasificacion'].forEach(k => localStorage.removeItem(k))`

## Arquitectura

- `index.html` es la estructura de una sola página: encabezado, área de contenido `main`, menú inferior fijo, dos ventanas emergentes compartidas y un aviso tipo toast. Las ventanas son `#mdl-formulario`, para crear y editar, y `#mdl-confirmar`, que sirve como confirmación y también como aviso de solo lectura. Los scripts se cargan con etiquetas `<script>` normales, no como módulos, y el orden importa: `js/storage.js` debe cargarse antes que los scripts de cada funcionalidad.
- `js/storage.js` expone un objeto global `g_obj_vetStorage` (una IIFE; no se llama `Storage` para no ocultar la interfaz del navegador) y es el único archivo que usa `localStorage`. Carga los datos iniciales la primera vez, solo cuando una llave no existe:
  - `vet_clasificaciones`: `[{ codigo, nombre }]`
  - `vet_medicamentos`: ejemplos `[{ id, nombre, codigoClasificacion }]`. Son temporales y sirven para probar la regla de "no borrar una clasificación con datos asociados" antes de que exista el módulo de Medicamentos. Reemplázalos cuando se construya ese módulo.
  - `vet_seq_clasificacion`: el último código asignado. Los códigos son consecutivos, automáticos y no editables, y no se reutilizan después de borrar. El siguiente código es el mayor entre esta secuencia y el código más alto existente, más 1, para que nunca choque.
  - Las funciones `f_bol_guardar*` devuelven `false` si el navegador no permite guardar; las pantallas deben mostrar un error en ese caso, no un mensaje de éxito.
- Los scripts de cada funcionalidad, como `js/clasificaciones.js`, son IIFE independientes que vuelven a dibujar la pantalla desde `g_obj_vetStorage` en cada cambio. No guardan datos en memoria, solo el estado de la interfaz, como la página actual.
- Las pestañas **Medicamentos** y **Calcular** del menú inferior están desactivadas y reservadas para historias futuras.

## Reglas de negocio ya implementadas (HU-01 Clasificaciones)

- Tabla tipo Excel con **3 registros por página**, botones de editar y borrar en cada fila, y un botón "Nueva clasificación".
- Se rechazan los nombres repetidos después de normalizarlos: quitar espacios sobrantes, pasar a minúsculas y quitar tildes. Al editar, el propio registro no cuenta como repetido.
- No se permite borrar una clasificación si algún `medicamento.codigoClasificacion` usa su código; el aviso muestra los medicamentos asociados.

## Convenciones

- Todo nombre nuevo (JS, ids de HTML, clases y variables CSS, archivos) debe cumplir `estandar_nomenclatura_codigo.txt`. Después de escribir código, revísalo con el agente `revisor-nomenclatura`.
- Diseño pensado primero para celular, centrado con `max-width: 480px`. Los colores del tema son variables CSS en `:root` dentro de `css/styles.css` (paleta veterinaria en verde azulado).
- Las imágenes de veterinaria son SVG propios en `img/`. No agregues imágenes externas ni dependencias de CDN.
- No uses `alert`, `confirm` ni `prompt`; reutiliza la ventana emergente propia y el aviso toast.
- `docs/practica-claude101-code.md` es la bitácora de aprendizaje del usuario sobre Claude Code, con capturas en `docs/img/`. No es documentación de la app; edítala solo si el usuario lo pide.
