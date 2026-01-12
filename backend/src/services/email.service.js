import { Resend } from 'resend';

// Inicializamos con la API Key (asegúrate de tenerla en tu .env)
const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarCorreoBienvenida = async (email, nombre) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fideliza+ <onboarding@resend.dev>', // O tu dominio verificado
      to: [email],
      subject: '¡Bienvenido a Fideliza+! 🎁',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">¡Hola, ${nombre}! 👋</h1>
          <p>Estamos felices de tenerte en <strong>Fideliza+</strong>.</p>
          <p>Tu registro ha sido exitoso. Ahora, cada vez que visites nuestra tienda, simplemente dicta tu RUT para acumular puntos.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #374151;">🎉 ¡Ya estás acumulando puntos!</p>
          </div>

          <p>Nos vemos pronto,</p>
          <p><em>El equipo de Fideliza+</em></p>
        </div>
      `,
    });

    if (error) {
      console.error("Error enviando correo:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Excepción servicio email:", e);
    return false;
  }
};