import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../db/supabaseAdmin.js";
import { env } from "../config/env.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    // Tabla esperada: usuario
    const { data: user, error } = await supabaseAdmin
      .from("usuario")
      .select("id, email, password, rol, nombre, sucursal_id")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!user || user.password !== password) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        sucursal_id: user.sucursal_id,
        nombre: user.nombre
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre
      }
    });
  } catch (err) {
    next(err);
  }
}

export function me(req, res) {
  res.json({ ok: true, user: req.user });
}
