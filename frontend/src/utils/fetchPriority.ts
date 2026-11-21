/**
 * Attribut `fetchpriority` d'une image (docs/06, R10). L'image principale d'une page (son LCP) part en
 * priorité haute ; les autres gardent la priorité par défaut et un chargement différé.
 *
 * React 18 ne connaît pas encore la prop `fetchPriority` (React 19 la reconnaît) : il l'écrivait bien dans
 * le DOM, mais avec un avertissement à chaque rendu en développement. En minuscules, c'est un attribut HTML
 * qu'il transmet tel quel. Passer à `fetchPriority` en React 19.
 */
export const fetchPriorityAttr = (priority: boolean): Record<string, string> =>
  priority ? { fetchpriority: "high" } : {};
