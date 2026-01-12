import { Resend } from 'resend';

// Asegúrate de que esta variable esté en tu archivo .env
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_REMITENTE = 'Fideliza+ <onboarding@resend.dev>'; // O tu dominio verificado

/**
 * 1. Correo para CLIENTES (Registro QR / Manual)
 */
export const enviarCorreoBienvenidaCliente = async (email, nombre) => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_REMITENTE,
      to: [email],
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

    if (error) {
      console.error("Error envío correo cliente:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Excepción email cliente:", e);
    return false;
  }
};

/**
 * 2. Correo para STAFF (Cuando creas un usuario en el admin)
 */
export const enviarCorreoBienvenidaStaff = async (email, nombre, password) => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_REMITENTE,
      to: [email],
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

    if (error) {
      console.error("Error envío correo staff:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Excepción email staff:", e);
    return false;
  }
};