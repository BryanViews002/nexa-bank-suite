import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { GlobalCommandMenu } from "@/components/GlobalCommandMenu";

// Landing is the entry route and stays eager. Splitting it would only trade a
// paint for a flash. Everything behind a navigation loads on demand, which
// keeps recharts (dashboard) and the auth screens out of the first bundle.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Otp = lazy(() => import("./pages/Otp"));
const Kyc = lazy(() => import("./pages/Kyc"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminKyc = lazy(() => import("./pages/admin/AdminKyc"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
const AdminDeposits = lazy(() => import("./pages/admin/AdminDeposits"));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const onError = (query.meta as { onError?: (queryError: unknown) => void } | undefined)?.onError;
      onError?.(error);
    },
  }),
});

/** Neutral hold for routes with no meaningful skeleton of their own. */
const RouteFallback = () => <div className="min-h-screen bg-background" aria-busy="true" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="nexa-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background relative selection:bg-primary/30">
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-overlay" />
            <GlobalCommandMenu />
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/login"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <Login />
                  </Suspense>
                }
              />
              <Route
                path="/register"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <Register />
                  </Suspense>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <ResetPassword />
                  </Suspense>
                }
              />
              <Route
                path="/otp"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <Otp />
                  </Suspense>
                }
              />
              <Route
                path="/kyc"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <Kyc />
                  </Suspense>
                }
              />
              <Route
                path="/dashboard"
                element={
                  // The skeleton mirrors the real dashboard layout, so the
                  // chunk arriving mid-load doesn't shift anything.
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminAuthProvider>
                    <AdminShell />
                  </AdminAuthProvider>
                }
              >
                <Route index element={<Suspense fallback={<RouteFallback />}><AdminOverview /></Suspense>} />
                <Route path="kyc" element={<Suspense fallback={<RouteFallback />}><AdminKyc /></Suspense>} />
                <Route path="users" element={<Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense>} />
                <Route path="disputes" element={<Suspense fallback={<RouteFallback />}><AdminDisputes /></Suspense>} />
                <Route path="support" element={<Suspense fallback={<RouteFallback />}><AdminSupport /></Suspense>} />
                <Route path="audit" element={<Suspense fallback={<RouteFallback />}><AdminAudit /></Suspense>} />
                <Route path="deposits" element={<Suspense fallback={<RouteFallback />}><AdminDeposits /></Suspense>} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
              <Route
                path="*"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
