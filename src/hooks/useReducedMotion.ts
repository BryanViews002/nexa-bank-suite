import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * Kept out of the three.js scene module on purpose: callers need to know the
 * answer *before* deciding whether to download the 3D bundle at all, and
 * importing that module to ask the question would defeat the point.
 *
 * Defaults to `false` so the first paint matches the common case, then
 * corrects on mount.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export default useReducedMotion;
