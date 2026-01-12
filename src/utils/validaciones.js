// src/utils/validaciones.js

/**
 * Normaliza un RUT y lo formatea como "11222333-K".
 */
export function normalizarRut(rut) {
  const limpio = String(rut || "").toUpperCase().replace(/[^0-9K]/g, "");
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  return `${cuerpo}-${dv}`;
}

export function validarRut(rut) {
  const limpio = String(rut || "").toUpperCase().replace(/[^0-9K]/g, "");
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
 * Limpia el texto en tiempo real (solo letras y espacios).
 * Retorna STRING (seguro para inputs).
 */
export function limpiarNombreLive(texto) {
  const str = String(texto || ""); 
  return str.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
}

/**
 * Valida y normaliza nombre.
 * ✅ CORREGIDO: Retorna OBJETO { valor, valido } para que el modal funcione.
 */
export function validarYNormalizarNombre(nombre) {
  // 1. Limpiamos caracteres extraños y espacios dobles
  const val = limpiarNombreLive(nombre).trim().replace(/\s+/g, " ");
  // 2. Retornamos objeto con estado de validez (mínimo 2 letras)
  return { valor: val, valido: val.length >= 2 };
}

/**
 * Valida y normaliza RUT.
 * Retorna OBJETO { valor, valido }
 */
export function validarYNormalizarRut(rut) {
  const norm = normalizarRut(rut);
  return { valor: norm, valido: validarRut(norm) };
}

export function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email || "").trim());
}

export function validarYNormalizarTelefono(fono) {
  const val = String(fono || "").replace(/[^0-9+\s]/g, "");
  // Consideramos válido si tiene al menos 8 dígitos
  return { valor: val, valido: val.length >= 8 };
}

// Alias de compatibilidad (por si algún archivo busca este nombre antiguo)
export const formatearRutLive = normalizarRut;