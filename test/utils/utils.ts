/**
 * Extrahera `e-refresh-cookie` ur en sträng, eller returnera
 * `null` om ingen hittas
 * @param s `set-cookie`-string
 */
export const extractRefreshToken = (s: string): string | null => {
  // Matcha base64url enl. JavaScript-specification, inclusive
  // separator "."
  const match = /(?<=e-refresh-token=)([-_.A-z0-9]+);/g.exec(s);
  if (match !== null) {
    return match[0];
  }
  return null;
};