import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NexaLogo } from "@/components/NexaLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiUrl, withCredentials } from "@/lib/api";
import { AdminApiError, adminRequest, clearAdminSessionState } from "@/lib/admin-api";
import { clearAuthenticationStorage } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

const HIDDEN_ON = new Set(["/dashboard", "/login", "/register", "/otp", "/reset-password", "/kyc"]);

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const hideNav = HIDDEN_ON.has(location.pathname) || location.pathname.startsWith("/admin");
  const landingChrome = location.pathname === "/";

  const checkAuth = async () => {
    try {
      const response = await fetch(apiUrl("/api/v1/accounts"), withCredentials);
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Transparent over the hero, solid once content scrolls behind it.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A fixed header plus an open menu means the page behind can still scroll.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await adminRequest<void>("/api/v1/auth/logout", { method: "POST" });
      clearAdminSessionState();
      clearAuthenticationStorage();
      setIsAuthenticated(false);
      toast({
        title: "Signed out",
        description: "Your session has ended.",
      });
      navigate("/login");
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        clearAdminSessionState();
        clearAuthenticationStorage();
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }
      toast({
        title: "Couldn't sign out",
        description: error instanceof Error ? error.message : "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  if (hideNav) return null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-200",
        landingChrome && "dark text-white",
        isScrolled
          ? landingChrome
            ? "border-b border-white/10 bg-[#07090d]/82 backdrop-blur-xl"
            : "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="rounded-md" aria-label="Nexa home">
            <NexaLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#product"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Product
            </a>
            <a
              href="#security"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </a>

            <ThemeToggle />

            <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm ml-1">
                  Open account
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
                <Link to="/dashboard" className="btn btn-primary btn-sm ml-1">
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className={cn(
            "animate-fade-in border-t md:hidden",
            landingChrome ? "border-white/10 bg-[#07090d]" : "border-border bg-background",
          )}
        >
          <nav className="mx-auto flex max-w-[1240px] flex-col gap-2 px-6 py-5">
            <a
              href="#product"
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Product
            </a>
            <a
              href="#security"
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Security
            </a>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-secondary w-full">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary w-full">
                  Open account
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-primary w-full">
                  Go to dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary w-full">
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
