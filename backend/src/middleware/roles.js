export function requireRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        message: "Sin permisos para esta acción",
      });
    }
    next();
  };
}
