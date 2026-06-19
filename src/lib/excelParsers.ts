/**
 * Convierte un valor numérico en formato español (coma decimal, punto miles)
 * o anglosajón a number de JavaScript.
 * Ejemplos: "4.374,46" → 4374.46 | "96,78" → 96.78 | 45.2 → 45.2
 */
export function parseSpanishNumber(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return raw;
  if (raw == null) return NaN;

  const s = String(raw).trim();
  if (s === "" || s === "-") return NaN;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    // Ambos separadores: determinar cuál es el decimal por posición del último
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    if (lastComma > lastDot) {
      // Español: "4.374,46" → quitar puntos, reemplazar coma por punto
      return parseFloat(s.replace(/\./g, "").replace(",", "."));
    } else {
      // Anglosajón: "4,374.46" → quitar comas
      return parseFloat(s.replace(/,/g, ""));
    }
  }

  if (hasComma && !hasDot) {
    // Solo coma → decimal español: "96,78"
    return parseFloat(s.replace(",", "."));
  }

  return parseFloat(s);
}

/**
 * Determina si un código de partida corresponde a Obra Extra ("OE").
 */
export function isEsExtraCode(codigo: string): boolean {
  return codigo.trim().toUpperCase().startsWith("OE");
}
