/**
 * Middleware para autorización basada en roles (RBAC).
 * Valida que req.user exista y posea uno de los roles permitidos.
 * En caso contrario responde con 403 Forbidden.
 * 
 * @param  {...string} allowedRoles - Nombres de roles permitidos (ej. 'superadmin', 'director')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const userRole = req.user.rol;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        mensaje: `Acceso denegado: se requiere uno de los roles [${allowedRoles.join(', ')}]. Tu rol actual es '${userRole || 'sin rol'}'.`
      });
    }

    next();
  };
};

module.exports = { requireRole };
