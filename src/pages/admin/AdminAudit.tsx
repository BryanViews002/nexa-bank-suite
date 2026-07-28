import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCcw, Search } from "lucide-react";
import {
  AdminEmpty,
  AdminFailure,
  AdminPageHeader,
  AdminTableSkeleton,
  FieldError,
} from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminRequest } from "@/lib/admin-api";
import { AuditEvent } from "@/lib/admin-types";

interface AuditFilters {
  userId: string;
  action: string;
  startDate: string;
  endDate: string;
  limit: string;
}

const DEFAULT_FILTERS: AuditFilters = {
  userId: "",
  action: "",
  startDate: "",
  endDate: "",
  limit: "100",
};

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function AdminAudit() {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadAudit = useCallback(async (nextFilters: AuditFilters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextFilters.userId) params.set("userId", nextFilters.userId);
      if (nextFilters.action.trim()) params.set("action", nextFilters.action.trim());
      if (nextFilters.startDate) params.set("startDate", nextFilters.startDate);
      if (nextFilters.endDate) params.set("endDate", nextFilters.endDate);
      params.set("limit", nextFilters.limit);
      setEvents(await adminRequest<AuditEvent[]>(`/api/v1/admin/audit?${params}`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load audit events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit(DEFAULT_FILTERS);
  }, [loadAudit]);

  const updateFilter = (name: keyof AuditFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (filters.userId && (!/^\d+$/.test(filters.userId) || Number(filters.userId) <= 0)) {
      errors.userId = "Enter a positive numeric user ID.";
    }
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      errors.endDate = "End date must be on or after the start date.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setAppliedFilters(filters);
    loadAudit(filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setFieldErrors({});
    loadAudit(DEFAULT_FILTERS);
  };

  return (
    <div>
      <AdminPageHeader
        title="Audit log"
        description="Inspect chronological system and administrator activity."
        actions={
          <button
            type="button"
            onClick={() => loadAudit(appliedFilters)}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <form onSubmit={applyFilters} className="mb-5 grid gap-3 lg:grid-cols-[150px_minmax(180px,1fr)_160px_160px_120px_auto] lg:items-start">
        <div>
          <label htmlFor="audit-user-id" className="field-label">User ID</label>
          <input
            id="audit-user-id"
            inputMode="numeric"
            value={filters.userId}
            onChange={(event) => updateFilter("userId", event.target.value)}
            aria-invalid={Boolean(fieldErrors.userId)}
            placeholder="Any user"
            className="field"
          />
          <FieldError message={fieldErrors.userId} />
        </div>
        <div>
          <label htmlFor="audit-action" className="field-label">Action</label>
          <input
            id="audit-action"
            value={filters.action}
            onChange={(event) => updateFilter("action", event.target.value)}
            placeholder="e.g. DISPUTE_RESOLVED"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="audit-start-date" className="field-label">Start date</label>
          <input
            id="audit-start-date"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter("startDate", event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="audit-end-date" className="field-label">End date</label>
          <input
            id="audit-end-date"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter("endDate", event.target.value)}
            aria-invalid={Boolean(fieldErrors.endDate)}
            className="field"
          />
          <FieldError message={fieldErrors.endDate} />
        </div>
        <div>
          <label htmlFor="audit-limit" className="field-label">Limit</label>
          <select
            id="audit-limit"
            value={filters.limit}
            onChange={(event) => updateFilter("limit", event.target.value)}
            className="field"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
        </div>
        <div className="flex gap-2 lg:mt-[30px]">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            <Search className="h-4 w-4" />
            Apply
          </button>
          <button type="button" onClick={resetFilters} disabled={loading} className="btn btn-secondary btn-sm">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </form>

      {error ? (
        <AdminFailure message={error} onRetry={() => loadAudit(appliedFilters)} />
      ) : loading ? (
        <AdminTableSkeleton columns={5} rows={10} />
      ) : !events.length ? (
        <section className="surface">
          <AdminEmpty title="No audit events" description="No activity matches the selected filters." />
        </section>
      ) : (
        <section className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Timestamp</TableHead>
                  <TableHead className="w-28">User</TableHead>
                  <TableHead className="w-56">Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-40">IP address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((auditEvent) => (
                  <TableRow key={auditEvent.id} className="align-top">
                    <TableCell className="tabular whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(auditEvent.timestamp)}
                    </TableCell>
                    <TableCell className="tabular">
                      {auditEvent.userId == null ? "System" : `ID ${auditEvent.userId}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {auditEvent.action.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <pre className="max-w-2xl whitespace-pre-wrap break-words font-mono text-xs leading-5 text-muted-foreground">
                        {auditEvent.details}
                      </pre>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {auditEvent.ipAddress || "Not recorded"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
