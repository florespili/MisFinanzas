/**
 * Generates a SHA-256 hash for the given PIN with an internal salt.
 */
export async function hashPin(pin: string, userId: string = 'global'): Promise<string> {
  const salted = `mis-finanzas-pin-salt-${userId}-${pin}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Fallback simple deterministic hash
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash)}`;
}
