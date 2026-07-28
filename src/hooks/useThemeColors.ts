import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Resolves design tokens to concrete colour strings.
 *
 * Charting libraries write colours into SVG attributes, and while modern
 * browsers do resolve var() there, gradient stops are inconsistent about it.
 * Reading the computed value once per theme change is predictable and costs
 * nothing.
 */
export function useThemeColors(tokens: string[]) {
  const { theme } = useTheme();
  const [colors, setColors] = useState<Record<string, string>>({});

  const key = tokens.join(",");

  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};
      for (const token of key.split(",")) {
        const raw = styles.getPropertyValue(`--${token}`).trim();
        next[token] = raw ? `hsl(${raw})` : "currentColor";
      }
      setColors(next);
    };

    // The theme class lands on <html> in an effect, so read on the next frame
    // to be sure we're seeing the new values rather than the outgoing ones.
    const frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [theme, key]);

  return colors;
}

export default useThemeColors;
