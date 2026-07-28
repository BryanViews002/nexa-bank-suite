import { useEffect, useMemo, useState } from "react";
import { Eye, LockKeyhole, RefreshCw, Search, Unlock } from "lucide-react";
import { toast } from "sonner";
import { AdminEmpty, AdminFailure, AdminPageHeader, AdminPagination, AdminStatusBadge, AdminTableSkeleton } from "@/components/admin/AdminUi";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminRequest } from "@/lib/admin-api";
import { AdminKycStatus, AdminUser, Role } from "@/lib/admin-types";

const PAGE_SIZE = 12;
const formatDate = (value: string) => new Date(value).toLocaleDateString();

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | Role>("ALL");
  const [kyc, setKyc] = useState<"ALL" | AdminKycStatus>("ALL");
  const [enabled, setEnabled] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [locked, setLocked] = useState<"ALL" | "LOCKED" | "UNLOCKED">("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [unlockError, setUnlockError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await adminRequest<AdminUser[]>("/api/v1/admin/users"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => setPage(0), [search, role, kyc, enabled, locked]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.username.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        String(user.id) === term;
      return (
        matchesSearch &&
        (role === "ALL" || user.role === role) &&
        (kyc === "ALL" || user.kycStatus === kyc) &&
        (enabled === "ALL" || user.enabled === (enabled === "ENABLED")) &&
        (locked === "ALL" || user.locked === (locked === "LOCKED"))
      );
    });
  }, [enabled, kyc, locked, role, search, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const unlockUser = async (user: AdminUser) => {
    if (!user.locked || unlockingId !== null) return;
    setUnlockingId(user.id);
    setUnlockError("");
    try {
      const response = await adminRequest<{ message: string }>(`/api/v1/admin/users/${user.id}/unlock`, { method: "PUT" });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, locked: false } : item));
      setSelected((current) => current?.id === user.id ? { ...current, locked: false } : current);
      toast.success(response.message || "User unlocked.");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to unlock user.";
      setUnlockError(message);
      toast.error(message);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Search customer records and unlock accounts."
        actions={
          <button type="button" onClick={loadUsers} disabled={loading} className="btn btn-secondary btn-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(130px,auto))]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users"
            className="field pl-9" />
        </label>
        <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="field">
          <option value="ALL">All roles</option><option value="ROLE_USER">Users</option><option value="ROLE_ADMIN">Admins</option>
        </select>
        <select value={kyc} onChange={(event) => setKyc(event.target.value as typeof kyc)} className="field">
          <option value="ALL">All KYC</option><option value="NOT_SUBMITTED">Not submitted</option>
          <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
        </select>
        <select value={enabled} onChange={(event) => setEnabled(event.target.value as typeof enabled)} className="field">
          <option value="ALL">Any enabled state</option><option value="ENABLED">Enabled</option><option value="DISABLED">Disabled</option>
        </select>
        <select value={locked} onChange={(event) => setLocked(event.target.value as typeof locked)} className="field">
          <option value="ALL">Any lock state</option><option value="LOCKED">Locked</option><option value="UNLOCKED">Unlocked</option>
        </select>
      </div>

      {error ? (
        <AdminFailure message={error} onRetry={loadUsers} />
      ) : loading ? (
        <AdminTableSkeleton columns={7} />
      ) : (
        <section className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead><TableHead>Contact</TableHead><TableHead>Role</TableHead>
                  <TableHead>KYC status</TableHead><TableHead>Account status</TableHead><TableHead>Created</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username} - ID {user.id}</p>
                    </TableCell>
                    <TableCell>
                      <p>{user.email}</p><p className="text-xs text-muted-foreground">{user.phoneNumber || "No phone"}</p>
                    </TableCell>
                    <TableCell><AdminStatusBadge value={user.role} /></TableCell>
                    <TableCell><AdminStatusBadge value={user.kycStatus} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <AdminStatusBadge value={user.enabled ? "ENABLED" : "DISABLED"} />
                        {user.locked && <AdminStatusBadge value="ACCOUNT_LOCKED" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => { setUnlockError(""); setSelected(user); }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" aria-label={`View ${user.username}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.locked && (
                          <button type="button" onClick={() => unlockUser(user)} disabled={unlockingId !== null}
                            className="grid h-8 w-8 place-items-center rounded-md text-primary hover:bg-accent" aria-label={`Unlock ${user.username}`}>
                            {unlockingId === user.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!pageUsers.length && <AdminEmpty title="No matching users" description="Adjust the search or filters." />}
          <div className="px-5 pb-5">
            <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </section>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.fullName}</SheetTitle>
                <SheetDescription>@{selected.username} - User ID {selected.id}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
                  <div><p className="eyebrow">Role</p><div className="mt-2"><AdminStatusBadge value={selected.role} /></div></div>
                  <div><p className="eyebrow">KYC</p><div className="mt-2"><AdminStatusBadge value={selected.kycStatus} /></div></div>
                  <div><p className="eyebrow">Enabled</p><p className="mt-1 text-sm">{selected.enabled ? "Yes" : "No"}</p></div>
                  <div><p className="eyebrow">Locked</p><p className="mt-1 text-sm">{selected.locked ? "Yes" : "No"}</p></div>
                </div>
                <div><p className="eyebrow">Email</p><p className="mt-1 text-sm">{selected.email}</p></div>
                <div><p className="eyebrow">Phone</p><p className="mt-1 text-sm">{selected.phoneNumber || "Not provided"}</p></div>
                <div><p className="eyebrow">Address</p><p className="mt-1 text-sm leading-6">{selected.address || "Not provided"}</p></div>
                <div><p className="eyebrow">Created</p><p className="mt-1 text-sm">{new Date(selected.createdAt).toLocaleString()}</p></div>
                {unlockError && selected.locked && (
                  <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                    {unlockError}
                  </p>
                )}
                {selected.locked && (
                  <button type="button" onClick={() => unlockUser(selected)} disabled={unlockingId !== null} className="btn btn-primary w-full">
                    {unlockingId === selected.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                    {unlockingId === selected.id ? "Unlocking..." : "Unlock account"}
                  </button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
