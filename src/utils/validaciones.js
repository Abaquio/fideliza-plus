// src/utils/validaciones.js

/**
 * Normaliza y formatea el RUT en tiempo real (11222333-K)
 * ✅ BLINDADO: Convierte a string antes de procesar
 */
export function formatearRutLive(rut) {
  // Aseguramos que sea string, si es null/undefined usa ""
  const valor = String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
  
  if (valor.length <= 1) return valor;

  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1);

  return `${cuerpo}-${dv}`;
}

export function validarRut(rut) {
  const limpio = String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dvEsperado =
    resto === 1 ? "K" : resto === 0 ? "0" : (11 - resto).toString();

  return dv === dvEsperado;
}

/**
 * Solo permite letras y espacios. Elimina números y símbolos.
 * ✅ BLINDADO: Evita el error "texto.replace is not a function"
 */
export function limpiarNombreLive(texto) {
  // Convertimos a String seguro antes de usar .replace
  const str = String(texto || ""); 
  return str.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
}

export function validarEmail(email) {
  const str = String(email || "").trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(str);
}

export function validarYNormalizarTelefono(fono) {
  const val = String(fono || "").replace(/[^0-9+\s]/g, "");
  return { valor: val, valido: val.length >= 8 };
}

// Helpers de compatibilidad (usando las funciones blindadas)
export function normalizarRut(rut) { return formatearRutLive(rut); }

export function validarYNormalizarRut(rut) { 
  const val = formatearRutLive(rut); 
  return { valor: val, valido: validarRut(val) }; 
}

export function validarYNormalizarNombre(nombre) {
  const val = limpiarNombreLive(nombre).trim().replace(/\s+/g, " ");
  return { valor: val, valido: val.length >= 2 };
}