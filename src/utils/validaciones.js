// src/utils/validaciones.js

/**
 * Normaliza un RUT y lo formatea como "11222333-4".
 */
export function normalizarRut(rut) {
  // Eliminar puntos, espacios y convertir a mayúsculas
  const limpio = rut.toUpperCase().replace(/[^0-9K]/g, "");
  if (limpio.length < 2) return "";

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  return `${cuerpo}-${dv}`;
}

/**
 * Valida el dígito verificador del RUT chileno
 */
export function validarRut(rut) {
  if (!rut) return false;

  const limpio = rut.toUpperCase().replace(/[^0-9K]/g, "");
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
    resto === 1 ? "K" :
    resto === 0 ? "0" :
    (11 - resto).toString();

  return dv === dvEsperado;
}

/**
 * Normaliza y valida el RUT.
 */
export function validarYNormalizarRut(rut) {
  const normalizado = normalizarRut(rut);
  if (!normalizado || !validarRut(normalizado)) {
    throw new Error("RUT inválido");
  }
  return normalizado;
}

/**
 * Elimina espacios extra en nombre (al principio, final y entre palabras)
 */
export function validarYNormalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, " ");
}

/**
 * Valida que el email tenga formato correcto
 */
export function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/**
 * Valida y normaliza el teléfono, asumiendo +56 para Chile
 */
export function validarYNormalizarTelefono(telefono) {
  // Acepta formatos como: +56912345678 o 56912345678
  const limpio = telefono.replace(/[^\d]/g, ""); // Elimina cualquier caracter no numérico
  if (limpio.startsWith("56") && limpio.length === 11) {
    return `+${limpio}`;
  }
  throw new Error("Número de teléfono inválido");
}
