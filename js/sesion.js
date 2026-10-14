// Protege las páginas internas: sin sesión iniciada se vuelve a la pantalla de acceso.
// Se carga en el <head>, después de storage.js, para redirigir antes de dibujar la página.
if (!g_obj_vetStorage.f_obj_obtenerSesion()) location.replace('acceso.html');
