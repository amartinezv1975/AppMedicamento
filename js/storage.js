// Persistencia en localStorage con datos semilla para el prototipo.
const Storage = (() => {
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

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
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

  seed();

  return {
    getClasificaciones: () => read(KEYS.clasificaciones, []),
    saveClasificaciones: (lista) => write(KEYS.clasificaciones, lista),
    getMedicamentos: () => read(KEYS.medicamentos, []),
    peekNextCodigo: () => read(KEYS.seqClasificacion, 0) + 1,
    takeNextCodigo() {
      const next = read(KEYS.seqClasificacion, 0) + 1;
      write(KEYS.seqClasificacion, next);
      return next;
    }
  };
})();
