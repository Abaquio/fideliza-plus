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