import { Suspense, lazy, useEffect, useState } from "react";
import type { NexaSceneProps } from "./NexaScene";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * three.js, @react-three/fiber and drei together weigh more than the rest of
 * the app combined. Importing the scene lazily keeps all of it out of the
 * entry chunk, so first paint never waits on decoration.
 */
const NexaScene = lazy(() => import("./NexaScene"));

/**
 * The still frame shown before — or instead of — the 3D scene.
 *
 * It occupies the same box as the canvas, so swapping one for the other can't
 * shift layout.
 */
function SceneFallback({ className }: { className?: string }) {
  return <div className={cn("nexa-scene", className)} aria-hidden="true"><div className="nexa-scene-fallback" /></div>;
}

/**
 * Drop-in replacement for `NexaScene` that defers — and under reduced motion,
 * skips — the 3D bundle.
 *
 * Two separate gates:
 *
 * 1. `prefers-reduced-motion` means the scene is never requested at all. It is
 *    pure motion, so there's nothing to degrade to and no reason to spend a
 *    megabyte finding that out.
 * 2. Otherwise the import is deferred until after mount, letting the real
 *    content paint and become interactive first.
 */
export function LazyNexaScene({ className, variant }: NexaSceneProps) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (reducedMotion || !mounted) return <SceneFallback className={className} />;

  return (
    <Suspense fallback={<SceneFallback className={className} />}>
      <NexaScene className={className} variant={variant} />
    </Suspense>
  );
}

export default LazyNexaScene;
