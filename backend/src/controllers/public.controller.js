import { supabaseAdmin } from "../db/supabaseAdmin.js";

/**
 * Helper para obtener o crear la fuente "Medical Season"
 */
async function getFuenteMedicalSeason() {
  const NOMBRE_FUENTE = "Medical Season";

  // 1. Buscar si existe
  const { data: existente } = await supabaseAdmin
    .from("fuentes_clientes")
    .select("id")
    .ilike("nombre", NOMBRE_FUENTE)
    .limit(1)
    .maybeSingle();

  if (existente?.id) return existente.id;

  // 2. Si no existe, crearla
  const { data: nueva, error } = await supabaseAdmin
    .from("fuentes_clientes")
    .insert({
      nombre: NOMBRE_FUENTE,
      url: "registro-publico-qr",
      tipo: "otro",
      es_interna: true,
      activo: true
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creando fuente Medical Season:", error);
    return null;
  }

  return nueva.id;
}

/**
 * POST /api/public/registro
 */
export const registrarClientePublico = async (req, res) => {
  try {
    const { rut, nombres, apellidos, email, telefono } = req.body;

    if (!rut || !nombres || !email) {
      return res.status(400).json({ ok: false, message: "Faltan datos obligatorios." });
    }

    // 1. Normalizar RUT
    const raw = String(rut).toUpperCase().replace(/[^0-9K]/g, "");
    if (raw.length < 2) {
      return res.status(400).json({ ok: false, message: "RUT inválido" });
    }
    const cuerpo = raw.slice(0, -1);
    const dv = raw.slice(-1);
    const rutFormat = `${cuerpo}-${dv}`;

    // 2. Obtener Fuente ID
    const fuenteId = await getFuenteMedicalSeason();

    // 3. Verificar existencia
    const { data: existente } = await supabaseAdmin
      .from("clientes")
      .select("id, estado")
      .or(`rut.eq.${rutFormat},email.eq.${email}`)
      .maybeSingle();

    if (existente) {
      if (existente.estado !== 'eliminado') {
        return res.status(409).json({ 
          ok: false, 
          message: "Ya estás registrado. ¡Dicta tu RUT en caja!" 
        });
      }
      
      // Reactivar si estaba eliminado
      await supabaseAdmin
        .from("clientes")
        .update({ 
          estado: 'activo', 
          nombres, 
          apellidos, 
          telefono, 
          fuente_id: fuenteId || null,
          actualizado_en: new Date() 
        })
        .eq('id', existente.id);
        
      return res.json({ ok: true, message: "¡Tu cuenta ha sido reactivada exitosamente!" });
    }

    // 4. Configuración Puntos Bienvenida
    const { data: config } = await supabaseAdmin
      .from("configuracion")
      .select("puntos_bienvenida")
      .eq("singleton", true)
      .maybeSingle();

    const puntosRegalo = config?.puntos_bienvenida || 0;

    // 5. Crear Cliente
    // 🔥 CORRECCIÓN: Quitamos 'puntos_total' porque es una columna calculada, no real.
    const { data: nuevoCliente, error } = await supabaseAdmin
      .from("clientes")
      .insert({
        rut: rutFormat,
        nombres,
        apellidos,
        email,
        telefono,
        estado: 'activo',
        fuente_id: fuenteId || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return res.status(409).json({ ok: false, message: "El usuario ya existe." });
      }
      throw error; // Lanza al catch general
    }

    // 6. Asignar Puntos
    if (puntosRegalo > 0 && nuevoCliente) {
      await supabaseAdmin.from("puntos_movimientos").insert({
        cliente_id: nuevoCliente.id,
        tipo: 'bienvenida',
        puntos: puntosRegalo,
        creado_en: new Date()
      });
    }

    return res.status(201).json({ 
      ok: true, 
      message: `¡Registro exitoso! Ganaste ${puntosRegalo} puntos de bienvenida.` 
    });

  } catch (error) {
    console.error("Error registro público:", error);
    // Devolvemos el mensaje exacto para debug si estamos en desarrollo, o uno genérico
    return res.status(500).json({ 
      ok: false, 
      message: error.message || "Error interno al registrar." 
    });
  }
};