import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Resolves 'system' before flipping, so the first click always lands on the
 * opposite of what the user is currently looking at.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const next = resolved === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {/* Both icons stay mounted and cross-fade — swapping the element makes
          the transition impossible and the change feel abrupt. */}
      <span className="relative h-[18px] w-[18px]">
        <Sun
          className={cn(
            "absolute inset-0 h-[18px] w-[18px] transition-all duration-300",
            resolved === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
          strokeWidth={1.85}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-[18px] w-[18px] transition-all duration-300",
            resolved === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
          strokeWidth={1.85}
        />
      </span>
    </button>
  );
}

export default ThemeToggle;
