/**
 * Convierte el mensaje técnico de una alerta de crecimiento (generado por el backend)
 * en un texto amigable, ajustado a la gravedad real del caso. Ejemplo de entrada:
 *   "Medición (10 kg / 96 cm a los 36 meses, sexo M): P/T: Desnutrición Aguda Severa
 *    (Z < -3 DE) [Z=-4.38, P0.01] | P/E: ... | T/E: ... | IMC/E: ..."
 *
 * Gravedad de la desnutrición aguda (se toma el peor valor entre P/T e IMC/E):
 *   - Severa   : Z < -3 DE
 *   - Moderada : -3 DE ≤ Z < -2 DE
 *   - Leve     : -2 DE ≤ Z < -1 DE  (riesgo, cercano al rango normal)
 *   - Sin alerta: Z ≥ -1 DE
 * Si existe el valor Z se usa éste; si no, se interpreta la etiqueta de texto.
 *
 * Si el mensaje no sigue ese formato o no indica desnutrición aguda,
 * se devuelve el texto original sin cambios.
 */
const REGEX_MEDICION = /^Medici[oó]n\s*\(([^)]*)\)\s*:\s*([\s\S]*)$/i;
const REGEX_INDICADOR = /^(P\/T|IMC\/E|P\/E|T\/E)\s*:\s*(.*?)\s*(?:\(.*|\[.*)?$/i;
const REGEX_Z = /\[\s*Z\s*=\s*(-?\d+(?:[.,]\d+)?)/i;

// 0 = sin desnutrición aguda, 1 = leve/riesgo, 2 = moderada, 3 = severa
export function nivelPorZ(z) {
  if (z < -3) return 3;
  if (z < -2) return 2;
  if (z < -1) return 1;
  return 0;
}

function nivelPorEtiqueta(etiqueta) {
  if (/severa/i.test(etiqueta)) return 3;
  if (/moderada/i.test(etiqueta)) return 2;
  if (/leve|riesgo/i.test(etiqueta)) return 1;
  return 0;
}

const MENSAJES = {
  3: {
    prefijo: '¡Alerta!',
    estado: 'desnutrición aguda severa',
    accion: 'Requiere atención médica y nutricional inmediata.',
  },
  2: {
    prefijo: 'Atención:',
    estado: 'desnutrición aguda moderada',
    accion: 'Se recomienda iniciar tratamiento y seguimiento nutricional.',
  },
  1: {
    prefijo: 'Aviso:',
    estado: 'riesgo de desnutrición aguda (leve), cercano al rango normal',
    accion: 'Se recomienda reforzar la alimentación y vigilar el peso en los próximos controles.',
  },
};

export function formatAlertaMensaje(mensaje) {
  if (typeof mensaje !== 'string' || !mensaje.trim()) {
    return { resumen: '', detalle: '', texto: '', nivel: 0 };
  }

  const original = { resumen: mensaje, detalle: '', texto: mensaje, nivel: 0 };
  const match = mensaje.match(REGEX_MEDICION);
  if (!match) return original;

  const [, datos, indicadoresRaw] = match;

  // Solo P/T (peso para la talla) e IMC/E definen desnutrición aguda
  const nivel = indicadoresRaw
    .split('|')
    .map((s) => s.trim())
    .map((s) => ({ m: s.match(REGEX_INDICADOR), z: s.match(REGEX_Z) }))
    .filter(({ m }) => m && ['P/T', 'IMC/E'].includes(m[1].toUpperCase()))
    .map(({ m, z }) => (z ? nivelPorZ(parseFloat(z[1].replace(',', '.'))) : nivelPorEtiqueta(m[2])))
    .reduce((max, n) => Math.max(max, n), 0);

  if (nivel === 0) return original;

  const sexo = (datos.match(/sexo\s*([MF])/i) || [])[1];
  const sujeto = sexo && sexo.toUpperCase() === 'F' ? 'La niña' : 'El niño';
  const medicion = datos.replace(/,?\s*sexo\s*[MF]/i, '').trim();
  const { prefijo, estado, accion } = MENSAJES[nivel];

  const verbo = nivel === 1 ? 'está en' : 'presenta';
  const resumen = `${prefijo} ${sujeto} ${verbo} ${estado}.`;
  const detalle = `Última medición: ${medicion}. ${accion}`;

  return { resumen, detalle, texto: `${resumen} ${detalle}`, nivel };
}
