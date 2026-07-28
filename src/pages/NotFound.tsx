import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Backdrop } from "@/components/visual/Backdrop";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <Backdrop />

      <div className="relative max-w-md text-center animate-fade-up">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-muted-foreground">
          <Compass className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>

        <p className="mt-6 text-sm font-medium text-muted-foreground">Error 404</p>

        <h1 className="mt-2 text-display-sm">This page doesn't exist</h1>

        <p className="mt-4 text-muted-foreground">
          We couldn't find anything at{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
            {location.pathname}
          </span>
          . It may have moved, or the link might be wrong.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
