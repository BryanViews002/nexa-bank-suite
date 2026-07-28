import { useState } from "react";
import { User } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useApi";
import { PageHeader } from "@/components/ui/page-header";
import { UserProfile } from "@/lib/services";

export function ProfilePanel() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ fullName: string; phone: string; address: string }>({
    fullName: "", phone: "", address: "",
  });

  const startEdit = (p: UserProfile) => {
    setForm({ fullName: p.fullName, phone: p.phone ?? "", address: p.address ?? "" });
    setEditing(true);
  };

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View and update your personal information." />

      {profile && !editing && (
        <div className="surface p-6 max-w-md space-y-4">
          {[
            { label: "Full name", value: profile.fullName },
            { label: "Username", value: `@${profile.username}` },
            { label: "Email", value: profile.email },
            { label: "Phone", value: profile.phone ?? "—" },
            { label: "Address", value: profile.address ?? "—" },
            { label: "KYC status", value: profile.kycStatus ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => startEdit(profile)}>
            Edit profile
          </button>
        </div>
      )}

      {editing && (
        <div className="surface p-6 max-w-md space-y-3">
          {(["fullName", "phone", "address"] as const).map(f => (
            <div key={f}>
              <label className="text-xs text-muted-foreground mb-1 block capitalize">{f}</label>
              <input className="input w-full" value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-primary btn-sm" disabled={update.isPending}
              onClick={() => update.mutate(form, { onSuccess: () => setEditing(false) })}>Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
