import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Cookie,
  Fingerprint,
  Landmark,
  ListFilter,
  LockKeyhole,
  Radar,
  Receipt,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { NexaLogo } from "@/components/NexaLogo";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { LazyNexaScene } from "@/components/visual/LazyNexaScene";

const CAPABILITIES = [
  {
    icon: Send,
    number: "01",
    title: "Transfer by username",
    body: "Find another Nexa user, confirm the recipient, and move funds without copying account numbers.",
    label: "Instant workflow",
  },
  {
    icon: Wallet,
    number: "02",
    title: "Accounts on demand",
    body: "Open checking and savings accounts from one place, then use them immediately across the suite.",
    label: "Unified accounts",
  },
  {
    icon: ListFilter,
    number: "03",
    title: "A ledger you can interrogate",
    body: "Search, filter, sort, and export the exact transaction view you need for review or reporting.",
    label: "Audit ready",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Balance history with context",
    body: "Turn transaction history into a readable balance timeline without hiding the activity behind the chart.",
    label: "Live insight",
  },
];

const TRUST_FLOW = [
  { icon: Fingerprint, label: "Identity", detail: "Six-digit verification" },
  { icon: Cookie, label: "Session", detail: "HTTP-only cookie" },
  { icon: Server, label: "Authority", detail: "Server-side validation" },
  { icon: ShieldCheck, label: "Settlement", detail: "Confirmed ledger update" },
];

const HERO_SIGNALS = [
  { label: "Transfer rail", value: "ONLINE", tone: "text-credit" },
  { label: "Ledger sync", value: "18 MS", tone: "text-white" },
  { label: "Session", value: "PROTECTED", tone: "text-[#e6bd64]" },
];

const Landing = () => {
  return (
    <div className="relative overflow-hidden">
      <section className="dark relative min-h-[calc(100svh-2.5rem)] overflow-hidden border-b border-white/10 bg-[#07090d] text-white">
        <LazyNexaScene className="absolute inset-0" />
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-[1240px] flex-col px-6 pt-28 lg:px-8 lg:pt-32">
          <div className="flex flex-1 items-center pb-10 pt-4 sm:pb-14 lg:pb-20">
            <div className="max-w-[680px] animate-fade-up">
              <div className="inline-flex items-center gap-2 border-l-2 border-primary pl-3 text-xs font-medium text-white/62">
                <Radar className="h-3.5 w-3.5 text-credit" aria-hidden="true" />
                <span>Digital banking, engineered in real time</span>
              </div>

              <h1 className="mt-6 text-[3.5rem] font-semibold leading-[0.92] tracking-[-0.055em] sm:text-[5rem] lg:text-[6.5rem]">
                Nexa
                <span className="mt-2 block text-white/45">Money in motion.</span>
              </h1>

              <p className="mt-7 max-w-[570px] text-base leading-7 text-white/64 sm:text-lg sm:leading-8">
                A complete banking suite for opening accounts, moving funds, and understanding every balance change
                from one precise interface.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn btn-primary btn-lg group">
                  Open an account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="btn btn-lg border border-white/15 bg-white/[0.055] text-white shadow-none backdrop-blur-md hover:border-white/25 hover:bg-white/10"
                >
                  Enter the suite
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {["No minimum balance", "Two-factor sign-in", "Free internal transfers"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/52 sm:text-[13px]">
                    <Check className="h-3.5 w-3.5 text-credit" strokeWidth={2.5} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3">
            {HERO_SIGNALS.map((signal, index) => (
              <div
                key={signal.label}
                className="flex items-center justify-between gap-6 border-white/10 py-4 sm:block sm:border-l sm:px-6 sm:first:border-l-0 lg:flex lg:px-8"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/38">
                  {signal.label}
                </span>
                <span className={`tabular text-xs font-semibold tracking-[0.08em] ${signal.tone}`}>
                  {signal.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-[8%] top-[24%] z-10 hidden w-44 border-l border-white/15 pl-4 xl:block">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">Network object</p>
          <p className="mt-2 text-sm font-medium text-white/78">Encrypted transaction rail</p>
          <p className="mt-1 text-xs leading-5 text-white/38">Interactive WebGL scene. Move your pointer to inspect.</p>
        </div>
      </section>

      <section id="product" className="scroll-mt-16 border-b border-border bg-background">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                The command center
              </p>
              <h2 className="mt-4 max-w-xl text-[2.5rem] font-semibold leading-[1.04] sm:text-[3.35rem]">
                Your financial position, visible at a glance.
              </h2>
            </div>
            <p className="max-w-xl text-[15px] leading-7 text-muted-foreground lg:justify-self-end">
              Nexa turns account balances, transaction history, and money movement into one focused workspace. Every
              view is designed for fast scanning and confident action.
            </p>
          </div>

          <div className="mt-14">
            <ProductPreview />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">Interactive product preview. Figures are illustrative.</p>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Build your workspace
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/35">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">Built for the whole flow</p>
              <h2 className="mt-4 text-[2.35rem] font-semibold leading-[1.06]">
                Move from intent to settlement without changing context.
              </h2>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                The interface stays calm while the workflow stays complete: choose, verify, execute, and review.
              </p>
            </div>

            <div className="border-t border-border">
              {CAPABILITIES.map((item) => (
                <article
                  key={item.number}
                  className="group grid gap-5 border-b border-border py-7 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-start sm:gap-7 sm:py-9"
                >
                  <span className="tabular text-xs font-semibold text-muted-foreground">{item.number}</span>
                  <div className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-[border-color,color,transform] group-hover:-translate-y-0.5 group-hover:border-primary/45 group-hover:text-primary">
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {item.label}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="security"
        className="dark relative scroll-mt-16 overflow-hidden border-b border-white/10 bg-[#0a0b0e] text-white"
      >
        <div className="security-lines pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
            <div>
              <p className="eyebrow text-white/42">Trust architecture</p>
              <h2 className="mt-4 text-[2.5rem] font-semibold leading-[1.05] text-white sm:text-[3.35rem]">
                The server is the authority.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-white/55">
                The interface never invents a balance, grants itself access, or settles a transaction. It renders what
                the backend has already verified.
              </p>

              <div className="mt-8 flex items-center gap-3 text-sm text-white/65">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-credit/25 bg-credit/10 text-credit">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                </span>
                Session-based authentication with MFA support
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-5 hidden h-[calc(100%-2.5rem)] w-px bg-white/10 sm:block lg:left-1/2 lg:top-8 lg:h-px lg:w-[calc(100%-4rem)] lg:-translate-x-1/2" />
              <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST_FLOW.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4 py-3 sm:block lg:text-center">
                    <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-[#111318] text-white/72 sm:mb-5 lg:mx-auto">
                      <step.icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                        {index + 1}
                      </span>
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/42">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
                {[
                  { icon: Zap, label: "Immediate UI refresh" },
                  { icon: Landmark, label: "Ownership enforced by API" },
                  { icon: Receipt, label: "Traceable transaction history" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-[#0d0f13] px-4 py-4">
                    <item.icon className="h-4 w-4 shrink-0 text-[#e2bb65]" strokeWidth={1.9} aria-hidden="true" />
                    <span className="text-xs text-white/58">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mt-3 max-w-2xl text-[2.35rem] font-semibold leading-[1.06] sm:text-[3rem]">
              Open the account. See the system move.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn btn-primary btn-lg group">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-card/35">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-10 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <NexaLogo size="md" />
            <p className="mt-3 max-w-sm text-xs leading-5 text-muted-foreground">
              A demonstration banking application with real account, transaction, and authentication workflows.
            </p>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <Link to="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link to="/register" className="text-muted-foreground transition-colors hover:text-foreground">
              Open account
            </Link>
            <span className="text-muted-foreground">© {new Date().getFullYear()} Nexa</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
