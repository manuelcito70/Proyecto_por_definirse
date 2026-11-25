import { getUser } from '../services/auth';

const DEFAULT_CARRERA = 'Ingeniería de Sistemas';

const CARRERA_MAP = [
  { match: 'agropecuaria', corta: 'AGROPECUARIA', codigo: 'AGR' },
  { match: 'educaci', corta: 'EDUCACIÓN', codigo: 'EDU' },
  { match: 'administraci', corta: 'ADMINISTRACIÓN', codigo: 'ADM' },
  { match: 'enfermer', corta: 'ENFERMERÍA', codigo: 'ENF' },
  { match: 'comercial', corta: 'COMERCIAL', codigo: 'COM' },
  { match: 'sistemas', corta: 'SISTEMAS', codigo: 'SYS' },
  { match: 'veterinaria', corta: 'VETERINARIA', codigo: 'VET' },
  { match: 'industrial', corta: 'INDUSTRIAL', codigo: 'IND' },
  { match: 'inform', corta: 'INFORMÁTICA', codigo: 'INF' },
  { match: 'redes', corta: 'REDES Y TELEC.', codigo: 'RED' },
  { match: 'financiera', corta: 'FINANCIERA', codigo: 'FIN' },
  { match: 'contadur', corta: 'CONTADURÍA', codigo: 'CON' },
];

export function getUserCarrera(userObj) {
  const u = userObj || getUser();
  return u?.carrera || DEFAULT_CARRERA;
}

export function getCarreraCorta(carreraNombre) {
  const nombre = (carreraNombre || getUserCarrera()).toLowerCase();
  const found = CARRERA_MAP.find((c) => nombre.includes(c.match));
  if (found) return found.corta;
  return (carreraNombre || getUserCarrera()).toUpperCase();
}

export function getCarreraCodigo(carreraNombre) {
  const nombre = (carreraNombre || getUserCarrera()).toLowerCase();
  const found = CARRERA_MAP.find((c) => nombre.includes(c.match));
  if (found) return found.codigo;
  return (carreraNombre || DEFAULT_CARRERA).replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'CAR';
}
