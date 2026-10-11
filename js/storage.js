// Persistencia en localStorage con datos semilla para el prototipo.
// Se llama VetStorage para no ocultar la interfaz global Storage del navegador.
const VetStorage = (() => {
  const KEYS = {
    clasificaciones: 'vet_clasificaciones',
    medicamentos: 'vet_medicamentos',
    seqClasificacion: 'vet_seq_clasificacion'
  };

  const SEED_CLASIFICACIONES = [
    { codigo: 1, nombre: 'Antibióticos' },
    { codigo: 2, nombre: 'Analgésicos' },
    { codigo: 3, nombre: 'Anestésicos' },
    { codigo: 4, nombre: 'Antifúngicos' },
    { codigo: 5, nombre: 'Fármacos endocrinos' },
    { codigo: 6, nombre: 'Vacunas' }
  ];

  // Medicamentos de ejemplo para probar la regla de "no borrar con datos asociados".
  const SEED_MEDICAMENTOS = [
    { id: 1, nombre: 'Amoxicilina', codigoClasificacion: 1 },
    { id: 2, nombre: 'Enrofloxacina', codigoClasificacion: 1 },
    { id: 3, nombre: 'Meloxicam', codigoClasificacion: 2 },
    { id: 4, nombre: 'Vacuna antirrábica', codigoClasificacion: 6 }
  ];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  // Devuelve true si se guardó, false si el navegador lo impidió (cuota, modo privado…).
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
      return false;
    }
  }

  function seed() {
    if (read(KEYS.clasificaciones, null) === null) {
      write(KEYS.clasificaciones, SEED_CLASIFICACIONES);
      write(KEYS.seqClasificacion, SEED_CLASIFICACIONES.length);
    }
    if (read(KEYS.medicamentos, null) === null) {
      write(KEYS.medicamentos, SEED_MEDICAMENTOS);
    }
  }

  // El siguiente código nunca puede chocar con uno existente, aunque la
  // secuencia guardada se haya perdido o dañado.
  function calcularSiguiente() {
    const seq = Number(read(KEYS.seqClasificacion, 0)) || 0;
    const maxExistente = read(KEYS.clasificaciones, [])
      .reduce((max, c) => Math.max(max, c.codigo), 0);
    return Math.max(seq, maxExistente) + 1;
  }

  seed();

  return {
    getClasificaciones: () => read(KEYS.clasificaciones, []),
    saveClasificaciones: (lista) => write(KEYS.clasificaciones, lista),
    getMedicamentos: () => read(KEYS.medicamentos, []),
    peekNextCodigo: calcularSiguiente,
    takeNextCodigo() {
      const next = calcularSiguiente();
      write(KEYS.seqClasificacion, next);
      return next;
    }
  };
})();
