/**
 * Normaliza un RUT a formato 12345678-9
 */
export function normalizarRut(rut) {
  if (!rut) return null;

  const limpio = rut
    .toString()
    .toUpperCase()
    .replace(/[^0-9K]/g, "");

  if (limpio.length < 2) return null;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  return `${cuerpo}-${dv}`;
}

/**
 * Valida el dígito verificador del RUT chileno
 */
export function validarRut(rut) {
  if (!rut) return false;

  const limpio = rut
    .toString()
    .toUpperCase()
    .replace(/[^0-9K]/g, "");

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
 * Valida y normaliza un RUT
 * Lanza error si no es válido
 */
export function validarYNormalizarRut(rut) {
  const normalizado = normalizarRut(rut);
  if (!normalizado || !validarRut(normalizado)) {
    throw new Error("RUT inválido");
  }
  return normalizado;
}
