import nodemailer from 'nodemailer';

// ✅ Configuración ROBUSTA para Gmail desde la nube (Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Servidor explícito
  port: 465,              // Puerto seguro SSL (El que no falla)
  secure: true,           // Usar SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  family: 4 // 🔧 TRUCO CLAVE: Fuerza IPv4 para evitar timeouts en Render
});

// Verificación de conexión al iniciar (Para que sepas si conectó bien)
transporter.verify().then(() => {
  console.log('✅ Nodemailer: Conectado a Gmail correctamente.');
}).catch((error) => {
  console.error('❌ Nodemailer Error:', error);
});

const EMAIL_REMITENTE = `"Fideliza+" <${process.env.GMAIL_USER}>`;

/**
 * 1. Correo para CLIENTES (Registro QR / Manual)
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
          <p>Tu registro fue exitoso. Ahora, cada vez que compres, dicta tu RUT para sumar puntos.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #374151;">🎉 ¡Ya eres parte del club!</p>
          </div>
          <p>Saludos,<br>El equipo.</p>
        </div>
      `,
    });

    console.log("✅ Correo cliente enviado ID:", info.messageId);
    return true;
  } catch (e) {
    console.error("❌ Error enviando correo cliente:", e);
    return false;
  }
};

/**
 * 2. Correo para STAFF (Cuando creas un usuario en el admin)
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
          <p>Se ha creado tu cuenta de acceso al panel de administración.</p>
          <p>Tus credenciales temporales son:</p>
          <ul style="background-color: #ECFDF5; padding: 15px 30px; border-radius: 8px; border: 1px solid #A7F3D0;">
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Contraseña:</strong> ${password}</li>
          </ul>
          <p>Por favor, ingresa y cambia tu contraseña lo antes posible.</p>
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