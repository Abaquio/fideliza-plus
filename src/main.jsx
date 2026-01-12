import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.jsx"
import "./index.css"

// 🔥 INTERCEPTOR GLOBAL DE FETCH (El Truco)
// Guardamos el fetch original del navegador
const originalFetch = window.fetch;

// Sobrescribimos fetch para inyectar nuestra validación
window.fetch = async (...args) => {
  // 1. Hacemos la petición normal
  const response = await originalFetch(...args);

  // 2. Si el backend dice "401 Unauthorized" (Token vencido)
  if (response.status === 401) {
    console.warn("🔒 Sesión expirada (401) detectada globalmente.");
    
    // Disparamos el evento de logout que ya tienes configurado en App.jsx
    window.dispatchEvent(new Event("auth:logout"));
    
    // Opcional: Lanzamos error para detener la ejecución del componente actual
    // throw new Error("Sesión expirada"); 
  }

  // 3. Si no es 401, devolvemos la respuesta normal
  return response;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)