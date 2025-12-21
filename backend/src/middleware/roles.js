function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function requireRoles(...rolesPermitidos) {
  const allowed = rolesPermitidos.map(normalizeRole);

  return (req, res, next) => {
    const userRole = normalizeRole(req?.user?.rol);

    if (!req.user || !userRole || !allowed.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        message: "Sin permisos para esta acción",
      });
    }
    next();
  };
}
