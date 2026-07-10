import { app } from "./app.js";
import { env } from "./config/env.js";

// ✅ Railway inyecta dinámicamente process.env.PORT. 
// Nos aseguramos de tomarlo, y si no existe (como en tu PC local), usamos el de tu env.js
const PORT = process.env.PORT || env.PORT || 4000;

// ✅ Agregamos "0.0.0.0" para asegurar que escuche tráfico externo en contenedores de Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Backend Fideliza+ escuchando en puerto ${PORT} (${env.NODE_ENV || 'desarrollo'})`
  );
});