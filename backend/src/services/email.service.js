import nodemailer from 'nodemailer';

// ✅ Configuración BREVO (Puerto 2525 para evitar bloqueo de Render)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // Host de Brevo
  port: 2525,                   // 🚨 PUERTO 2525: El único que funciona en Render Free
  secure: false,                // false para puerto 2525
  auth: {
    user: process.env.GMAIL_USER, // Tu usuario: a0140c001@smtp-brevo.com
    pass: process.env.GMAIL_PASS  // Tu clave SMTP: xsmtpsib-...
  },
  tls: {
    rejectUnauthorized: false   // Evita errores de certificados
  }
});

// Verificación de conexión
transporter.verify()
  .then(() => console.log('✅ Brevo SMTP: Conectado correctamente (Puerto 2525)'))
  .catch((error) => console.error('❌ Brevo Error:', error));

// El correo que verán los clientes (debe estar verificado en Brevo)
// Si no definiste EMAIL_FROM en el .env, usa una cadena vacía o un default
const EMAIL_REMITENTE = `"Fideliza+" <${process.env.EMAIL_FROM || 'no-reply@fideliza.cl'}>`;

/**
 * 1. Correo para CLIENTES
 */
export const enviarCorreoBienvenidaCliente = async (email, nombre) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_REMITENTE,
      to: email, 
      subject: '¡Bienvenido a Fideliza+! 🎁',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #4F46E5;">¡Hola, ${nombre}! 👋</h1>
          <p>Te damos la bienvenida a <strong>Fideliza+</strong>.</p>
          <p>Tu registro fue exitoso.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #374151;">🎉 ¡Gracias por unirte!</p>
          </div>
          <p>Saludos,<br>El equipo.</p>
        </div>
      `,
    });
    console.log("✅ Correo enviado ID:", info.messageId);
    return true;
  } catch (e) {
    console.error("❌ Error enviando correo:", e);
    return false;
  }
};

/**
 * 2. Correo para STAFF
 */
export const enviarCorreoBienvenidaStaff = async (email, nombre, password) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_REMITENTE,
      to: email,
      subject: 'Bienvenido al equipo - Acceso Fideliza+',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">¡Bienvenido al equipo, ${nombre}!</h2>
          <p>Tus credenciales temporales son:</p>
          <ul style="background-color: #ECFDF5; padding: 15px 30px; border-radius: 8px; border: 1px solid #A7F3D0;">
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Contraseña:</strong> ${password}</li>
          </ul>
        </div>
      `,
    });
    console.log("✅ Correo staff enviado ID:", info.messageId);
    return true;
  } catch (e) {
    console.error("❌ Error enviando correo staff:", e);
    return false;
  }
};

/**
 * ✅ NUEVO: 3. Correo de confirmación para el CLIENTE (Bordados)
 */
export const enviarCorreoConfirmacionBordado = async (email, nombre) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_REMITENTE,
      to: email,
      subject: 'Hemos recibido tu solicitud de bordado 🧵',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">¡Hola, ${nombre}! 👋</h2>
          <p>Te confirmamos que hemos recibido exitosamente tus datos para el bordado clínico.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #374151;">El equipo de Medical Season revisará tu solicitud y se pondrá en contacto contigo a la brevedad para coordinar los siguientes pasos.</p>
          </div>
          <p>¡Gracias por preferirnos!</p>
          <p>Saludos,<br><strong>Medical Season.</strong></p>
        </div>
      `,
    });
    console.log("✅ Correo confirmación bordado enviado ID:", info.messageId);
    return true;
  } catch (e) {
    console.error("❌ Error enviando correo confirmación bordado:", e);
    return false;
  }
};

/**
 * ✅ NUEVO: 4. Correo de aviso para TIENDA (Bordados - MODO PRUEBA)
 */
export const enviarCorreoNuevaSolicitudBordado = async (datos) => {
  try {
    const {
      contacto_nombre, contacto_apellido, contacto_rut, contacto_telefono, contacto_correo,
      modelo_bordado, bordado_nombre, bordado_apellido, bordado_profesion, bordado_universidad,
      especificaciones
    } = datos;

    const info = await transporter.sendMail({
      from: EMAIL_REMITENTE,
      // 👇 CORREO DE PRUEBAS APLICADO
      to: 'fidelizaplus.chile@gmail.com', 
      subject: `Nueva Solicitud de Bordado - ${contacto_nombre} ${contacto_apellido}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4F46E5;">Nueva Solicitud de Bordado 🧵</h2>
          <p>Se ha recibido un nuevo formulario desde la web (Fideliza+).</p>
          
          <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Datos de Contacto</h3>
          <ul>
            <li><strong>Nombre:</strong> ${contacto_nombre} ${contacto_apellido}</li>
            <li><strong>RUT:</strong> ${contacto_rut}</li>
            <li><strong>Teléfono:</strong> ${contacto_telefono}</li>
            <li><strong>Correo:</strong> <a href="mailto:${contacto_correo}">${contacto_correo}</a></li>
          </ul>

          <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Detalles del Bordado</h3>
          <ul>
            <li><strong>Modelo/Tipo:</strong> ${modelo_bordado}</li>
            <li><strong>Nombre a bordar:</strong> ${bordado_nombre}</li>
            <li><strong>Apellido a bordar:</strong> ${bordado_apellido}</li>
            <li><strong>Profesión/Carrera:</strong> ${bordado_profesion}</li>
            <li><strong>Universidad:</strong> ${bordado_universidad}</li>
          </ul>

          <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. Especificaciones Adicionales</h3>
          <p style="background-color: #F9FAFB; padding: 10px; border-left: 4px solid #4F46E5; white-space: pre-wrap;">
            ${especificaciones || 'Sin especificaciones adicionales.'}
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            * Si el cliente indicó tener un logo propio, asegúrate de contactarlo para que envíe el archivo.
          </p>
        </div>
      `,
    });
    console.log("✅ Correo aviso a tienda enviado ID:", info.messageId);
    return true;
  } catch (e) {
    console.error("❌ Error enviando correo aviso a tienda:", e);
    return false;
  }
};