import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Headphones, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { AdminEmpty, AdminFailure, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminUi";
import { adminRequest } from "@/lib/admin-api";
import {
  AdminDispute,
  AdminKycDocument,
  AdminSupportTicket,
  AdminUser,
  AuditEvent,
  SpringPage,
} from "@/lib/admin-types";

interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

const initialResource = <T,>(): Resource<T> => ({ data: null, loading: true, error: "" });
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function AdminOverview() {
  const [users, setUsers] = useState<Resource<AdminUser[]>>(initialResource);
  const [kyc, setKyc] = useState<Resource<AdminKycDocument[]>>(initialResource);
  const [disputes, setDisputes] = useState<Resource<SpringPage<AdminDispute>>>(initialResource);
  const [support, setSupport] = useState<Resource<SpringPage<AdminSupportTicket>>>(initialResource);
  const [audit, setAudit] = useState<Resource<AuditEvent[]>>(initialResource);

  const loadUsers = async () => {
    setUsers((current) => ({ ...current, loading: true, error: "" }));
    try {
      setUsers({ data: await adminRequest("/api/v1/admin/users"), loading: false, error: "" });
    } catch (error) {
      setUsers({ data: null, loading: false, error: error instanceof Error ? error.message : "Failed to load users." });
    }
  };

  const loadKyc = async () => {
    setKyc((current) => ({ ...current, loading: true, error: "" }));
    try {
      setKyc({ data: await adminRequest("/api/v1/admin/kyc"), loading: false, error: "" });
    } catch (error) {
      setKyc({ data: null, loading: false, error: error instanceof Error ? error.message : "Failed to load KYC." });
    }
  };

  const loadDisputes = async () => {
    setDisputes((current) => ({ ...current, loading: true, error: "" }));
    try {
      setDisputes({
        data: await adminRequest("/api/v1/admin/disputes?status=OPEN&page=0&size=5"),
        loading: false,
        error: "",
      });
    } catch (error) {
      setDisputes({ data: null, loading: false, error: error instanceof Error ? error.message : "Failed to load disputes." });
    }
  };

  const loadSupport = async () => {
    setSupport((current) => ({ ...current, loading: true, error: "" }));
    try {
      setSupport({
        data: await adminRequest("/api/v1/admin/support/tickets?page=0&size=5"),
        loading: false,
        error: "",
      });
    } catch (error) {
      setSupport({ data: null, loading: false, error: error instanceof Error ? error.message : "Failed to load support." });
    }
  };

  const loadAudit = async () => {
    setAudit((current) => ({ ...current, loading: true, error: "" }));
    try {
      setAudit({ data: await adminRequest("/api/v1/admin/audit?limit=10"), loading: false, error: "" });
    } catch (error) {
      setAudit({ data: null, loading: false, error: error instanceof Error ? error.message : "Failed to load audit events." });
    }
  };

  useEffect(() => {
    loadUsers();
    loadKyc();
    loadDisputes();
    loadSupport();
    loadAudit();
  }, []);

  const metrics = [
    {
      label: "Pending KYC",
      value: kyc.data?.length,
      loading: kyc.loading,
      error: kyc.error,
      retry: loadKyc,
      to: "/admin/kyc",
      icon: ShieldCheck,
    },
    {
      label: "Locked users",
      value: users.data?.filter((user) => user.locked).length,
      loading: users.loading,
      error: users.error,
      retry: loadUsers,
      to: "/admin/users",
      icon: LockKeyhole,
    },
    {
      label: "Open disputes",
      value: disputes.data?.totalElements,
      loading: disputes.loading,
      error: disputes.error,
      retry: loadDisputes,
      to: "/admin/disputes",
      icon: Scale,
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Operations overview" description="Current queues and recent administrator activity." />

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <section key={metric.label} className="surface p-5">
            {metric.error ? (
              <>
                <AdminFailure message={metric.error} onRetry={metric.retry} compact />
                <Link to={metric.to} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open management page <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <metric.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-4 text-sm text-muted-foreground">{metric.label}</p>
                <p className="tabular mt-1 text-3xl font-semibold">
                  {metric.loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" /> : metric.value ?? 0}
                </p>
                <Link to={metric.to} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open queue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent support tickets</h2>
            </div>
            <Link to="/admin/support" className="text-xs font-medium text-primary">View all</Link>
          </div>
          {support.error ? (
            <div className="p-5"><AdminFailure message={support.error} onRetry={loadSupport} compact /></div>
          ) : support.loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-muted" />)}
            </div>
          ) : !support.data?.content.length ? (
            <AdminEmpty title="No support tickets" description="No recent tickets require attention." />
          ) : (
            <div className="divide-y divide-border">
              {support.data.content.map((ticket) => (
                <Link key={ticket.id} to={`/admin/support?ticket=${ticket.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ticket.subject}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{ticket.userName} - {formatDate(ticket.updatedAt)}</p>
                  </div>
                  <AdminStatusBadge value={ticket.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent audit activity</h2>
            </div>
            <Link to="/admin/audit" className="text-xs font-medium text-primary">View all</Link>
          </div>
          {audit.error ? (
            <div className="p-5"><AdminFailure message={audit.error} onRetry={loadAudit} compact /></div>
          ) : audit.loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-muted" />)}
            </div>
          ) : !audit.data?.length ? (
            <AdminEmpty title="No audit events" description="No recent administrator activity was returned." />
          ) : (
            <div className="divide-y divide-border">
              {audit.data.slice(0, 6).map((event) => (
                <div key={event.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium">{event.action.replaceAll("_", " ")}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{event.details}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
