import { supabaseAdmin } from "../db/supabaseAdmin.js";
// ✅ IMPORTAR SERVICIO DE EMAIL
import { enviarCorreoBienvenidaCliente } from "../services/email.service.js";

/**
 * Helper para obtener o crear la fuente "Medical Season"
 */
async function getFuenteMedicalSeason() {
  const NOMBRE_FUENTE = "Medical Season";

  const { data: existente } = await supabaseAdmin
    .from("fuentes_clientes")
    .select("id")
    .ilike("nombre", NOMBRE_FUENTE)
    .limit(1)
    .maybeSingle();

  if (existente?.id) return existente.id;

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

    const raw = String(rut).toUpperCase().replace(/[^0-9K]/g, "");
    if (raw.length < 2) {
      return res.status(400).json({ ok: false, message: "RUT inválido" });
    }
    const cuerpo = raw.slice(0, -1);
    const dv = raw.slice(-1);
    const rutFormat = `${cuerpo}-${dv}`;

    const fuenteId = await getFuenteMedicalSeason();

    // Verificar existencia
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
      
      // Reactivar
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
        
      // ✅ ENVIAR CORREO DE REACTIVACIÓN (Opcional, reutilizamos el de bienvenida)
      enviarCorreoBienvenidaCliente(email, nombres);

      return res.json({ ok: true, message: "¡Tu cuenta ha sido reactivada exitosamente!" });
    }

    // Configuración Puntos
    const { data: config } = await supabaseAdmin
      .from("configuracion")
      .select("puntos_bienvenida")
      .eq("singleton", true)
      .maybeSingle();

    const puntosRegalo = config?.puntos_bienvenida || 0;

    // Crear Cliente
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
      if (error.code === '23505') {
        return res.status(409).json({ ok: false, message: "El usuario ya existe." });
      }
      throw error;
    }

    // Asignar Puntos
    if (puntosRegalo > 0 && nuevoCliente) {
      await supabaseAdmin.from("puntos_movimientos").insert({
        cliente_id: nuevoCliente.id,
        tipo: 'bienvenida',
        puntos: puntosRegalo,
        creado_en: new Date()
      });
    }

    // ✅ ENVIAR CORREO DE BIENVENIDA
    // No usamos await para que la respuesta al usuario sea instantánea
    enviarCorreoBienvenidaCliente(email, nombres)
      .then(sent => {
        if(sent) console.log(`📧 Correo enviado a ${email}`);
        else console.warn(`⚠️ No se pudo enviar correo a ${email}`);
      })
      .catch(err => console.error("Error envío mail:", err));

    return res.status(201).json({ 
      ok: true, 
      message: `¡Registro exitoso! Ganaste ${puntosRegalo} puntos de bienvenida. Revisa tu correo.` 
    });

  } catch (error) {
    console.error("Error registro público:", error);
    return res.status(500).json({ 
      ok: false, 
      message: error.message || "Error interno al registrar." 
    });
  }
};