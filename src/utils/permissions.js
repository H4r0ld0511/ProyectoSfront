/**
 * Utilidades de autorización basadas en permisos (user.permisos viene de POST /auth/login).
 * El menú y las vistas deben decidirse por permisos, no por el nombre del rol,
 * salvo el Administrador, que ve todo.
 */
const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const getPermisos = (user) =>
  Array.isArray(user?.permisos) ? user.permisos.map((p) => String(p).trim()) : [];

export const isAdmin = (user) =>
  normalizar(user?.rol) === 'administrador' || getPermisos(user).includes('ACCESO_TOTAL');

/**
 * ¿El usuario tiene al menos uno de los permisos indicados?
 * - Administrador: siempre true.
 * - Sin permisos requeridos (lista vacía/undefined): true.
 */
export const hasAnyPermission = (user, requeridos) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!requeridos || requeridos.length === 0) return true;
  const propios = getPermisos(user);
  return requeridos.some((p) => propios.includes(p));
};

