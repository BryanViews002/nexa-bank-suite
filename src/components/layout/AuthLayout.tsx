import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { NexaLogo } from "@/components/NexaLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LazyNexaScene } from "@/components/visual/LazyNexaScene";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer?: ReactNode;
  back?: { to: string; label: string };
}

const ASSURANCES = [
  { label: "Identity", detail: "Six-digit verification", icon: ShieldCheck },
  { label: "Session", detail: "Server-held state", icon: LockKeyhole },
  { label: "Ledger", detail: "API-confirmed updates", icon: Activity },
];

export function AuthLayout({ children, title, subtitle, footer, back }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative flex w-full flex-col lg:w-[51%] xl:w-[46%]">
        <div className="auth-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
          <Link to="/" className="rounded-md" aria-label="Nexa home">
            <NexaLogo size="md" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[400px] animate-fade-up">
            {back && (
              <Link
                to={back.to}
                className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {back.label}
              </Link>
            )}

            <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-credit shadow-[0_0_0_4px_hsl(var(--credit)/0.12)]" />
              Secure access
            </div>

            <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em]">{title}</h1>
            <p className="mt-2.5 text-[15px] leading-6 text-muted-foreground">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 border-t border-border pt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>

      <aside className="dark relative hidden overflow-hidden border-l border-white/10 bg-[#07090d] text-white lg:flex lg:w-[49%] xl:w-[54%]">
        <LazyNexaScene variant="auth" className="absolute inset-0" />
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="auth-scene-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 flex w-full flex-col justify-between px-10 py-10 xl:px-16 xl:py-12">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/38">
              Nexa secure channel
            </p>
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-credit">
              <span className="h-1.5 w-1.5 rounded-full bg-credit shadow-[0_0_12px_2px_rgba(56,217,155,0.55)]" />
              Protected
            </span>
          </div>

          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#e3bb62]">
              One connected ledger
            </p>
            <h2 className="mt-4 max-w-lg text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white xl:text-[3.4rem]">
              Enter a banking system built to stay in sync.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/52">
              Balances, transfers, statements, and security checks stay connected from the first request to the final
              confirmation.
            </p>

            <div className="mt-8 grid grid-cols-3 border-y border-white/10">
              {ASSURANCES.map((item) => (
                <div key={item.label} className="border-l border-white/10 px-3 py-4 first:border-l-0">
                  <item.icon className="h-4 w-4 text-white/62" strokeWidth={1.8} aria-hidden="true" />
                  <p className="mt-3 text-[11px] font-semibold text-white/82">{item.label}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/36">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AuthError({ message, className }: { message: string; className?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 5v3.5M8 11h.01" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default AuthLayout;
