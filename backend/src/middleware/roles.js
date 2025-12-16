export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "Sin permisos" });
    }
    next();
  };
}
